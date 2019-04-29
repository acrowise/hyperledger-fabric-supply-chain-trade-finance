package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/hyperledger/fabric/core/chaincode/shim"
)

var Logger = shim.NewLogger("TradeFinanceChaincode")

// Namespaces constants
const (
	ConfigIndex = "ConfigTF"
)

// OrganizationalUnit constants
const (
	Buyer    = "buyer"
	Supplier = "supplier"
	Auditor  = "auditor"
	Factor   = "factor"
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
	Collections []string `json:"collections"`
}

func CreateConfig() LedgerData {
	return new(Config)
}

func (data *Config) FillFromArguments(stub shim.ChaincodeStubInterface, args []string) error {
	if len(args) < configBasicArgumentsNumber+configKeyFieldsNumber {
		return errors.New(fmt.Sprintf("arguments array must contain at least %d items", configBasicArgumentsNumber+configKeyFieldsNumber))
	}

	data.Value.Collections = []string{args[0]}

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
