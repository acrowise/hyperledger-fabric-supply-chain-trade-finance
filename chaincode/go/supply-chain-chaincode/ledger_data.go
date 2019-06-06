package main

import (
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"github.com/hyperledger/fabric/core/chaincode/lib/cid"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/core/chaincode/shim/ext/statebased"
	"strings"
)

var ledgerDataLogger = shim.NewLogger("LedgerData")

const (
	NoticeUnknown = iota
	NoticeRuningType
	NoticeSuccessType
)

type LedgerData interface {
	FillFromArguments(stub shim.ChaincodeStubInterface, args []string) error

	FillFromCompositeKeyParts(compositeKeyParts []string) error

	FillFromLedgerValue(ledgerValue []byte) error

	ToCompositeKey(stub shim.ChaincodeStubInterface) (string, error)

	ToLedgerValue() ([]byte, error)
}

func ExistsIn(stub shim.ChaincodeStubInterface, data LedgerData, index string) bool {

	existResult := false
	compositeKey, err := data.ToCompositeKey(stub)
	if err != nil {
		return false
	}
	collections, err := GetCollectionName(stub, index, []string{""})
	if err != nil {
		return false
	}

	if len(collections) != 0 && collections[0] != "" {
		for _, collectionName := range collections {
			var data []byte
			Logger.Debug(fmt.Sprintf("GetPrivateData. collectionName: %s", collectionName))
			if data, err = stub.GetPrivateData(collectionName, compositeKey); err != nil {
				return existResult
			}
			if data != nil {
				existResult = true
			}
		}
	} else {
		Logger.Debug("GetState")
		var data []byte
		if data, err = stub.GetState(compositeKey); err != nil {
			return existResult
		}
		if data != nil {
			existResult = true
		}
	}

	return existResult
}

func LoadFrom(stub shim.ChaincodeStubInterface, data LedgerData, index string) error {
	var bytes []byte
	compositeKey, err := data.ToCompositeKey(stub)
	if err != nil {
		return err
	}

	collections, err := GetCollectionName(stub, index, []string{""})
	if err != nil {
		message := fmt.Sprintf("cannot get collection name from config: %s", err.Error())
		return errors.New(message)
	}

	if len(collections) != 0 && collections[0] != "" {
		for _, collectionName := range collections {
			Logger.Debug(fmt.Sprintf("GetPrivateData. collectionName: %s", collectionName))
			if bytes, err = stub.GetPrivateData(collectionName, compositeKey); err != nil {
				return err
			}
			if bytes != nil {
				break
			}
		}
	} else {
		Logger.Debug("GetState")
		bytes, err = stub.GetState(compositeKey)
	}

	if err != nil {
		return err
	}

	return data.FillFromLedgerValue(bytes)
}

func UpdateOrInsertIn(stub shim.ChaincodeStubInterface, data LedgerData, index string, participiants []string, endorserRoleType statebased.RoleType) error {
	compositeKey, err := data.ToCompositeKey(stub)
	if err != nil {
		return err
	}

	value, err := data.ToLedgerValue()
	if err != nil {
		return err
	}

	collections, err := GetCollectionName(stub, index, participiants)
	if err != nil {
		message := fmt.Sprintf("cannot get collection name from config: %s", err.Error())
		return errors.New(message)
	}

	if len(collections) != 0 && collections[0] != "" {
		for _, collectionName := range collections {
			Logger.Debug(fmt.Sprintf("PutPrivateData. collectionName: %s", collectionName))
			if err = stub.PutPrivateData(collectionName, compositeKey, value); err != nil {
				return err
			}
			if len(participiants) != 1 && participiants[0] == "" {
				// set new endorsement policy. Start
				ep, err := statebased.NewStateEP(nil)
				if err != nil {
					return err
				}

				err = ep.AddOrgs(endorserRoleType, participiants[1:]...)
				if err != nil {
					return err
				}
				// set the endorsement policy
				epBytes, err := ep.Policy()
				if err != nil {
					return err
				}

				err = stub.SetPrivateDataValidationParameter(collectionName, compositeKey, epBytes)
				if err != nil {
					return err
				}
				//set new endorsement policy. End
			}
		}
	} else {
		Logger.Debug("PutState")
		if err = stub.PutState(compositeKey, value); err != nil {
			return err
		}
		if len(participiants) != 1 && participiants[0] == "" {
			// set new endorsement policy. Start
			ep, err := statebased.NewStateEP(nil)
			if err != nil {
				return err
			}

			err = ep.AddOrgs(endorserRoleType, participiants[1:]...)
			if err != nil {
				return err
			}
			// set the endorsement policy
			epBytes, err := ep.Policy()
			if err != nil {
				return err
			}

			err = stub.SetStateValidationParameter(compositeKey, epBytes)
			if err != nil {
				return err
			}
			//set new endorsement policy. End
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
	createEntry FactoryMethod, filterEntry FilterFunction) ([]byte, error) {

	ledgerDataLogger.Info(fmt.Sprintf("Query(%s) is running", index))
	ledgerDataLogger.Debug("Query " + index)

	collections, err := GetCollectionName(stub, index, []string{""})
	if err != nil {
		message := fmt.Sprintf("cannot get collection name from config: %s", err.Error())
		return nil, errors.New(message)
	}

	entries := []LedgerData{}
	if len(collections) != 0 && collections[0] != "" {
		for _, collectionName := range collections {
			Logger.Debug(fmt.Sprintf("GetPrivateDataByPartialCompositeKey. collectionName: %s", collectionName))

			it, err := stub.GetPrivateDataByPartialCompositeKey(collectionName, index, partialKey)
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

func getHistoryByEntity(stub shim.ChaincodeStubInterface, index string, entityID string,
	createEntry FactoryMethod) ([]interface{}, error) {

	entries := []interface{}{}

	entity := createEntry()

	if err := entity.FillFromCompositeKeyParts([]string{entityID}); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return nil, errors.New(message)
	}

	if !ExistsIn(stub, entity, index) {
		compositeKey, _ := entity.ToCompositeKey(stub)
		message := fmt.Sprintf("entity with the key %s doesnt exist", compositeKey)
		Logger.Error(message)
		return nil, errors.New(message)
	}

	compositeKey, err := entity.ToCompositeKey(stub)
	if err != nil {
		message := fmt.Sprintf("cannot create composite key :%s", err.Error())
		Logger.Error(message)
		return nil, errors.New(message)
	}

	it, err := stub.GetHistoryForKey(compositeKey)
	if err != nil {
		message := fmt.Sprintf("unable to get history for key %s: %s", compositeKey, err.Error())
		Logger.Error(message)
		return nil, errors.New(message)
	}

	for it.HasNext() {
		response, err := it.Next()
		if err != nil {
			message := fmt.Sprintf("unable to get an element next to a history iterator: %s", err.Error())
			return nil, errors.New(message)
		}

		ledgerDataLogger.Debug(fmt.Sprintf("Response: {%s, %s}", response.Timestamp.Seconds, string(response.Value)))

		entry := struct {
			TxID      string      `json:"txid"`
			Timestamp int64       `json:"timestamp"`
			Value     interface{} `json:"value"`
		}{
			TxID:      response.TxId,
			Timestamp: response.Timestamp.Seconds,
			Value:     response.Value,
		}

		entries = append(entries, entry)
	}

	defer it.Close()

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

func GetMSPID(stub shim.ChaincodeStubInterface) (string, error) {
	// Get the client ID object
	mspid := ""
	id, err := cid.New(stub)
	if err != nil {
		message := fmt.Sprintf("Failure getting client ID object: %s", err.Error())
		return mspid, errors.New(message)
	}
	mspid, err = id.GetMSPID()
	if err != nil {
		message := fmt.Sprintf("Failure getting MSPID from client ID object: %s", err.Error())
		return mspid, errors.New(message)
	}
	return mspid, nil
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
		Logger.Info(fmt.Sprintf("%s.%s is running", chaincodeName, fnc))
		Logger.Debug(fmt.Sprintf("%s.%s", chaincodeName, fnc))
	case NoticeSuccessType:
		Logger.Info(fmt.Sprintf("%s.%s exited without errors", chaincodeName, fnc))
		Logger.Debug(fmt.Sprintf("Success: %s.%s", chaincodeName, fnc))
	default:
		Logger.Debug("Unknown typeNotice: %d", typeNotice)
	}
}

func GetCollectionName(stub shim.ChaincodeStubInterface, index string, participiants []string) ([]string, error) {
	var collectionName []string

	if len(participiants) == 1 && participiants[0] == "" {
		creator, err := GetMSPID(stub)
		if err != nil {
			message := fmt.Sprintf("cannot obtain creator's MSPID: %s", err.Error())
			Logger.Error(message)
			return collectionName, errors.New(message)
		}
		participiants = []string{creator}
	}

	config := Config{}
	var bytes []byte
	compositeKey, err := config.ToCompositeKey(stub)
	if err != nil {
		return collectionName, err
	}

	bytes, err = stub.GetState(compositeKey)
	if err != nil {
		return collectionName, err
	}

	if err = config.FillFromLedgerValue(bytes); err != nil {
		return collectionName, err
	}

	collections := config.Value.Collections

	for _, col := range collections {
		count := 0
		if strings.Contains(col.Name, index) {
			for _, participiant := range participiants {
				if strings.Contains(col.Policy, participiant) {
					count++
				}
			}
		}
		if len(participiants) == count {
			collectionName = append(collectionName, col.Name)
		}
	}

	Logger.Debug(fmt.Sprintf("Got collection name: %s", collectionName))

	return collectionName, nil
}
