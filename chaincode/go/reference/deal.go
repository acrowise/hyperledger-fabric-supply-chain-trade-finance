package main

import (
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/satori/go.uuid"
)

const (
	dealIndex = "Deal"
)

const (
	dealKeyFieldsNumber      = 1
	dealBasicArgumentsNumber = 3
)

type DealKey struct {
	ID string `json:"id"`
}

type DealValue struct {
	//Borrower  string  `json:"borrower"`
	//Lender    string  `json:"lender"`
	Amount    float32 `json:"amount"`
	Rate      float32 `json:"rate"`
	Timestamp int64   `json:"timestamp"`
}

type Deal struct {
	Key   DealKey   `json:"key"`
	Value DealValue `json:"value"`
}

func CreateDeal() LedgerData {
	return new(Deal)
}

// Not implemented
func (deal *Deal) FillFromArguments(args []string) error {
	return nil
}

func (deal *Deal) FillFromCompositeKeyParts(compositeKeyParts []string) error {
	if len(compositeKeyParts) < dealKeyFieldsNumber {
		return errors.New(fmt.Sprintf("composite key parts array must contain at least %d items", dealKeyFieldsNumber))
	}

	if id, err := uuid.FromString(compositeKeyParts[0]); err != nil {
		return errors.New(fmt.Sprintf("unable to parse an ID from \"%s\"", compositeKeyParts[0]))
	} else if id.Version() != uuid.V4 {
		return errors.New("wrong ID format; expected UUID version 4")
	}

	deal.Key.ID = compositeKeyParts[0]

	return nil
}

func (deal *Deal) FillFromLedgerValue(ledgerValue []byte) error {
	if err := json.Unmarshal(ledgerValue, &deal.Value); err != nil {
		return err
	} else {
		return nil
	}
}

func (deal *Deal) ToCompositeKey(stub shim.ChaincodeStubInterface) (string, error) {
	compositeKeyParts := []string {
		deal.Key.ID,
	}

	return stub.CreateCompositeKey(dealIndex, compositeKeyParts)
}

func (deal *Deal) ToLedgerValue() ([]byte, error) {
	return json.Marshal(deal.Value)
}
