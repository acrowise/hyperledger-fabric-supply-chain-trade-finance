package main

import (
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/satori/go.uuid"
)

const (
	dealPrivateDetailsIndex = "DealPrivateDetails"
)

type DealPrivateDetailsValue struct {
	Borrower string `json:"borrower"`
	Lender   string `json:"lender"`
}

type DealPrivateDetails struct {
	Key   DealKey                 `json:"key"`
	Value DealPrivateDetailsValue `json:"value"`
}

func CreateDealPrivateDetails() LedgerData {
	return new(DealPrivateDetails)
}

// Not implemented
func (details *DealPrivateDetails) FillFromArguments(args []string) error {
	return nil
}

func (details *DealPrivateDetails) FillFromCompositeKeyParts(compositeKeyParts []string) error {
	if len(compositeKeyParts) < dealKeyFieldsNumber {
		return errors.New(fmt.Sprintf("composite key parts array must contain at least %d items", dealKeyFieldsNumber))
	}

	if id, err := uuid.FromString(compositeKeyParts[0]); err != nil {
		return errors.New(fmt.Sprintf("unable to parse an ID from \"%s\"", compositeKeyParts[0]))
	} else if id.Version() != uuid.V4 {
		return errors.New("wrong ID format; expected UUID version 4")
	}

	details.Key.ID = compositeKeyParts[0]

	return nil
}

func (details *DealPrivateDetails) FillFromLedgerValue(ledgerValue []byte) error {
	if err := json.Unmarshal(ledgerValue, &details.Value); err != nil {
		return err
	} else {
		return nil
	}
}

func (details *DealPrivateDetails) ToCompositeKey(stub shim.ChaincodeStubInterface) (string, error) {
	compositeKeyParts := []string {
		details.Key.ID,
	}

	return stub.CreateCompositeKey(dealPrivateDetailsIndex, compositeKeyParts)
}

func (details *DealPrivateDetails) ToLedgerValue() ([]byte, error) {
	return json.Marshal(details.Value)
}
