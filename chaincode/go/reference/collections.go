package main

import (
	"encoding/json"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"errors"
	"fmt"
)

const (
	collectionsIndex = "Collections"
)

const (
	collectionsKeyFieldsNumber = 1
)

type Collections struct {
	OrganizationName     string   `json:"organizationName"`
	AvailableCollections []string `json:"availableCollections"`
}

// Not implemented
func (col *Collections) FillFromArguments(args []string) error {
	return nil
}

func (col *Collections) FillFromCompositeKeyParts(compositeKeyParts []string) error {
	if len(compositeKeyParts) < collectionsKeyFieldsNumber {
		return errors.New(
			fmt.Sprintf("composite key parts array must contain at least %d items", collectionsKeyFieldsNumber))
	}

	col.OrganizationName = compositeKeyParts[0]

	return nil
}

func (col *Collections) FillFromLedgerValue(ledgerValue []byte) error {
	if err := json.Unmarshal(ledgerValue, &col.AvailableCollections); err != nil {
		return err
	} else {
		return nil
	}
}

func (col *Collections) ToCompositeKey(stub shim.ChaincodeStubInterface) (string, error) {
	compositeKeyParts := []string {
		col.OrganizationName,
	}

	return stub.CreateCompositeKey(collectionsIndex, compositeKeyParts)
}

func (col *Collections) ToLedgerValue() ([]byte, error) {
	return json.Marshal(col.AvailableCollections)
}
