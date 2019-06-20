package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/satori/go.uuid"
	"strconv"
)

const (
	bidIndex = "Bid"
)

const (
	bidKeyFieldsNumber      = 1
	bidBasicArgumentsNumber = 3
)

//bid state constants (from 0 to 4)
const (
	stateBidUnknown = iota
	stateBidIssued
	stateBidAccepted
	stateBidCanceled
	stateBidRemoved
)

var bidStateLegal = map[int][]int{
	stateBidUnknown:  {},
	stateBidIssued:   {},
	stateBidAccepted: {},
	stateBidCanceled: {},
	stateBidRemoved:  {},
}

var bidStateMachine = map[int][]int{
	stateBidUnknown:  {stateBidUnknown},
	stateBidIssued:   {stateBidAccepted, stateBidRemoved, stateBidRemoved},
	stateBidAccepted: {stateBidAccepted},
	stateBidCanceled: {stateBidIssued},
	stateBidRemoved:  {stateBidRemoved},
}

type BidKey struct {
	ID string `json:"id"`
}

type BidValue struct {
	Rate        float32 `json:"rate"`
	FactorID    string  `json:"factorID"`
	InvoiceID   string  `json:"invoiceID"`
	State       int     `json:"state"`
	Timestamp   int64   `json:"timestamp"`
	UpdatedDate int64   `json:"updatedDate"`
}

type BidValueAdditional struct {
	Rate        float32 `json:"rate"`
	FactorID    string  `json:"factorID"`
	InvoiceID   string  `json:"invoiceID"`
	State       int     `json:"state"`
	Timestamp   int64   `json:"timestamp"`
	Amount      float32 `json:"amount"`
	Debtor      string  `json:"debtor"`
	Beneficiary string  `json:"beneficiary"`
	Guarantor   string  `json:"guarantor"`
	PaymentDate int64   `json:"paymentDate"`
	UpdatedDate int64   `json:"updatedDate"`
}

type Bid struct {
	Key   BidKey   `json:"key"`
	Value BidValue `json:"value"`
}

type BidAdditional struct {
	Key   BidKey             `json:"key"`
	Value BidValueAdditional `json:"value"`
}

func CreateBid() LedgerData {
	return new(Bid)
}

//argument order
//0		1		2			3
//ID	Rate	FactorID	InvoiceID
func (entity *Bid) FillFromArguments(stub shim.ChaincodeStubInterface, args []string) error {
	if len(args) < bidBasicArgumentsNumber {
		return errors.New(fmt.Sprintf("arguments array must contain at least %d items", bidBasicArgumentsNumber))
	}

	if err := entity.FillFromCompositeKeyParts(args[:bidKeyFieldsNumber]); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return errors.New(message)
	}

	// checking rate
	rate, err := strconv.ParseFloat(args[1], 32)
	if err != nil {
		return errors.New(fmt.Sprintf("unable to parse the rate: %s", err.Error()))
	}
	if rate < 0 {
		return errors.New("rate must be larger than zero")
	}
	entity.Value.Rate = float32(rate)

	// checking invoice
	invoice := Invoice{}
	if err := invoice.FillFromCompositeKeyParts([]string{args[3]}); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return errors.New(message)
	}

	if !ExistsIn(stub, &invoice, "") {
		compositeKey, _ := invoice.ToCompositeKey(stub)
		return errors.New(fmt.Sprintf("invoice with the key %s doesn't exist", compositeKey))
	}

	if err := LoadFrom(stub, &invoice, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return errors.New(message)
	}

	if invoice.Value.State != stateInvoiceForSale {
		message := fmt.Sprintf("invalid state of invoice")
		Logger.Error(message)
		return errors.New(message)
	}
	entity.Value.InvoiceID = invoice.Key.ID

	return nil
}

func (entity *Bid) FillFromCompositeKeyParts(compositeKeyParts []string) error {
	if len(compositeKeyParts) < bidKeyFieldsNumber {
		return errors.New(fmt.Sprintf("composite key parts array must contain at least %d items", bidKeyFieldsNumber))
	}

	if id, err := uuid.FromString(compositeKeyParts[0]); err != nil {
		return errors.New(fmt.Sprintf("unable to parse an ID from \"%s\"", compositeKeyParts[0]))
	} else if id.Version() != uuid.V4 {
		return errors.New("wrong ID format; expected UUID version 4")
	}

	entity.Key.ID = compositeKeyParts[0]

	return nil
}

func (entity *Bid) FillFromLedgerValue(ledgerValue []byte) error {
	if err := json.Unmarshal(ledgerValue, &entity.Value); err != nil {
		return err
	} else {
		return nil
	}
}

func (entity *Bid) ToCompositeKey(stub shim.ChaincodeStubInterface) (string, error) {
	compositeKeyParts := []string{
		entity.Key.ID,
	}

	return stub.CreateCompositeKey(bidIndex, compositeKeyParts)
}

func (entity *Bid) ToLedgerValue() ([]byte, error) {
	return json.Marshal(entity.Value)
}
