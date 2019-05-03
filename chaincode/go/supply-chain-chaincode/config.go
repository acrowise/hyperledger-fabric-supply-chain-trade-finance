package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/hyperledger/fabric/core/chaincode/shim"
)

var Logger = shim.NewLogger("SupplyChainChaincode")

// Namespaces constants
const (
	ConfigIndex = "ConfigSC"
)

// OrganizationalUnit constants
const (
	Buyer           = "buyer"
	Supplier        = "supplier"
	Auditor         = "auditor"
	Factor          = "factor"
	TransportAgency = "transport_agency"
)

// Type entity with documents
const (
	TypeUnknown = iota
	TypeShipment
	TypeAgencyReport
)

// Type of documents
const (
	DocTypeUnknown = iota
	DocTypeJPG
	DocTypePNG
	DocTypeXLS
	DocTypePDF
	DocTypeCSV
)

// Numerical constants
const (
	configKeyFieldsNumber      = 0
	configBasicArgumentsNumber = 1
)

type Config struct {
	Key   ConfigKey   `json:"key"`
	Value ConfigValue `json:"value"`
}

type ConfigKey struct {
}

type ConfigValue struct {
	Collections []Collection `json:"collections"`
}

type Collection struct {
	Name   string `json:"name"`
	Policy string `json:"policy"`
}

func CreateConfig() LedgerData {
	return new(Config)
}

func (data *Config) FillFromArguments(stub shim.ChaincodeStubInterface, args []string) error {
	if len(args) < configBasicArgumentsNumber+configKeyFieldsNumber {
		return errors.New(fmt.Sprintf("arguments array must contain at least %d items", configBasicArgumentsNumber+configKeyFieldsNumber))
	}

	// parsing collections from arguments
	if len(args[0]) == 0 {
		return errors.New(fmt.Sprintf("arg[0] must be not empty"))
	}

	collections := []Collection{}

	if err := json.Unmarshal([]byte(args[0]), &collections); err != nil {
		return errors.New(fmt.Sprintf("cannot unmarshaling collections : %s", err.Error()))
	}

	data.Value.Collections = collections

	return nil
}

func (data *Config) FillFromCompositeKeyParts(compositeKeyParts []string) error {
	return nil
}

func (data *Config) FillFromLedgerValue(ledgerBytes []byte) error {
	if err := json.Unmarshal(ledgerBytes, &data.Value); err != nil {
		return err
	} else {
		return nil
	}
}

func (data *Config) ToCompositeKey(stub shim.ChaincodeStubInterface) (string, error) {
	compositeKeyParts := []string{""}

	return stub.CreateCompositeKey(ConfigIndex, compositeKeyParts)
}

func (data *Config) ToLedgerValue() ([]byte, error) {
	return json.Marshal(data.Value)
}

func (data *Config) ExistsIn(stub shim.ChaincodeStubInterface, collection string) bool {
	compositeKey, err := data.ToCompositeKey(stub)
	if err != nil {
		return false
	}

	if data, err := stub.GetState(compositeKey); err != nil || data == nil {
		return false
	}

	return true
}
