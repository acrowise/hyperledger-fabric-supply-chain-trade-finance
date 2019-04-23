package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"strings"
	"encoding/pem"
	"crypto/x509"
)

var ledgerDataLogger = shim.NewLogger("LedgerData")

const (
	NoticeRuningType  = iota
	NoticeSuccessType
)

type LedgerData interface {
	FillFromArguments(stub shim.ChaincodeStubInterface, args []string) error

	FillFromCompositeKeyParts(compositeKeyParts []string) error

	FillFromLedgerValue(ledgerValue []byte) error

	ToCompositeKey(stub shim.ChaincodeStubInterface) (string, error)

	ToLedgerValue() ([]byte, error)
}

func ExistsIn(stub shim.ChaincodeStubInterface, data LedgerData, collection string) bool {
	compositeKey, err := data.ToCompositeKey(stub)
	if err != nil {
		return false
	}

	if collection != "" {
		Logger.Debug("GetPrivateData")
		if data, err := stub.GetPrivateData(collection, compositeKey); err != nil || data == nil {
			return false
		}
	} else {
		Logger.Debug("GetState")
		if data, err := stub.GetState(compositeKey); err != nil || data == nil {
			return false
		}
	}

	return true
}

func LoadFrom(stub shim.ChaincodeStubInterface, data LedgerData, collection string) error {
	var bytes []byte
	compositeKey, err := data.ToCompositeKey(stub)
	if err != nil {
		return err
	}

	if collection != "" {
		Logger.Debug("GetPrivateData")
		bytes, err = stub.GetPrivateData(collection, compositeKey)
	} else {
		Logger.Debug("GetState")
		bytes, err = stub.GetState(compositeKey)
	}

	if err != nil {
		return err
	}

	return data.FillFromLedgerValue(bytes)
}

func UpdateOrInsertIn(stub shim.ChaincodeStubInterface, data LedgerData, collection string) error {
	compositeKey, err := data.ToCompositeKey(stub)
	if err != nil {
		return err
	}

	value, err := data.ToLedgerValue()
	if err != nil {
		return err
	}

	if collection != "" {
		Logger.Debug("PutPrivateData")

		if err = stub.PutPrivateData(collection, compositeKey, value); err != nil {
			return err
		}
	} else {
		Logger.Debug("PutState")
		if err = stub.PutState(compositeKey, value); err != nil {
			return err
		}
	}

	return nil
}

type FactoryMethod func() LedgerData

type FilterFunction func(data LedgerData) bool

func EmptyFilter(data LedgerData) bool {
	return true
}

func Query(stub shim.ChaincodeStubInterface, index string, partialKey []string,
	createEntry FactoryMethod, filterEntry FilterFunction, collections []string) ([]byte, error) {

	ledgerDataLogger.Info(fmt.Sprintf("Query(%s) is running", index))
	ledgerDataLogger.Debug("Query " + index)

	entries := []LedgerData{}
	if len(collections) != 0 && collections[0] != "" {
		for _, collection := range collections {
			it, err := stub.GetPrivateDataByPartialCompositeKey(collection, index, partialKey)
			if err != nil {
				message := fmt.Sprintf("unable to get state by partial composite key %s: %s", index, err.Error())
				ledgerDataLogger.Error(message)
				return nil, errors.New(message)
			}

			iteratorEntries, err := queryImpl(it, createEntry, stub, filterEntry)
			if err != nil {
				ledgerDataLogger.Error(err.Error())
				return nil, err
			}

			entries = append(entries, iteratorEntries...)

			it.Close()
		}
	} else {
		it, err := stub.GetStateByPartialCompositeKey(index, partialKey)
		if err != nil {
			message := fmt.Sprintf("unable to get state by partial composite key %s: %s", index, err.Error())
			ledgerDataLogger.Error(message)
			return nil, errors.New(message)
		}
		defer it.Close()

		entries, err = queryImpl(it, createEntry, stub, filterEntry)
		if err != nil {
			ledgerDataLogger.Error(err.Error())
			return nil, err
		}
	}

	result, err := json.Marshal(entries)
	if err != nil {
		return nil, err
	}
	ledgerDataLogger.Debug("Result: " + string(result))

	ledgerDataLogger.Info(fmt.Sprintf("Query(%s) exited without errors", index))
	ledgerDataLogger.Debug("Success: Query " + index)
	return result, nil
}

func queryImpl(it shim.StateQueryIteratorInterface, createEntry FactoryMethod, stub shim.ChaincodeStubInterface,
	filterEntry FilterFunction) ([]LedgerData, error) {

	entries := []LedgerData{}

	for it.HasNext() {
		response, err := it.Next()
		if err != nil {
			message := fmt.Sprintf("unable to get an element next to a query iterator: %s", err.Error())
			return nil, errors.New(message)
		}

		ledgerDataLogger.Debug(fmt.Sprintf("Response: {%s, %s}", response.Key, string(response.Value)))

		entry := createEntry()

		if err := entry.FillFromLedgerValue(response.Value); err != nil {
			message := fmt.Sprintf("cannot fill entry value from response value: %s", err.Error())
			return nil, errors.New(message)
		}

		_, compositeKeyParts, err := stub.SplitCompositeKey(response.Key)
		if err != nil {
			message := fmt.Sprintf("cannot split response key into composite key parts slice: %s", err.Error())
			return nil, errors.New(message)
		}

		if err := entry.FillFromCompositeKeyParts(compositeKeyParts); err != nil {
			message := fmt.Sprintf("cannot fill entry key from composite key parts: %s", err.Error())
			return nil, errors.New(message)
		}

		if bytes, err := json.Marshal(entry); err == nil {
			ledgerDataLogger.Debug("Entry: " + string(bytes))
		}

		if filterEntry(entry) {
			entries = append(entries, entry)
		}
	}

	return entries, nil
}

func getOrganization(certificate []byte) (string, error) {
	data := certificate[strings.Index(string(certificate), "-----") : strings.LastIndex(string(certificate), "-----")+5]
	block, _ := pem.Decode([]byte(data))
	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return "", err
	}
	organization := cert.Issuer.Organization[0]
	return strings.Split(organization, ".")[0], nil
}

func getOrganizationlUnit(certificate []byte) (string, error) {
	data := certificate[strings.Index(string(certificate), "-----") : strings.LastIndex(string(certificate), "-----")+5]
	block, _ := pem.Decode([]byte(data))
	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return "", err
	}
	organizationalUnit := cert.Issuer.OrganizationalUnit[0]
	return strings.Split(organizationalUnit, ".")[0], nil
}

func GetCreatorOrganization(stub shim.ChaincodeStubInterface) (string, error) {
	certificate, err := stub.GetCreator()
	if err != nil {
		return "", err
	}
	return getOrganization(certificate)
}

func GetCreatorOrganizationalUnit(stub shim.ChaincodeStubInterface) (string, error) {
	certificate, err := stub.GetCreator()
	if err != nil {
		return "", err
	}
	return getOrganizationlUnit(certificate)
}

func Contains(m map[int][]int, key int) bool {
	_, ok := m[key]
	if !ok {
		return false
	}

	return true
}

func CheckStateValidity(statesAutomaton map[int][]int, oldState, newState int) bool {
	possibleStates, ok := statesAutomaton[oldState]
	if ok {
		for _, state := range possibleStates {
			if state == newState {
				return true
			}
		}
	}

	return false
}

func Notifier(stub shim.ChaincodeStubInterface, typeNotice int) {

	fnc, _ := stub.GetFunctionAndParameters()

	switch typeNotice {
	case NoticeRuningType:
		Logger.Info(fmt.Sprintf("TradeFinanceChaincode.%s is running", fnc))
		Logger.Debug(fmt.Sprintf("TradeFinanceChaincode.%s", fnc))
	case NoticeSuccessType:
		Logger.Info(fmt.Sprintf("TradeFinanceChaincode.%s exited without errors", fnc))
		Logger.Debug(fmt.Sprintf("Success: TradeFinanceChaincode.%s", fnc))
	default:
		Logger.Debug("Unknown typeNotice: %d", typeNotice)
	}
}
