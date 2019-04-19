package main

import (
	"errors"
	"fmt"
	"encoding/json"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"strconv"
	"github.com/satori/go.uuid"
)

const (
	invoiceIndex = "Invoice"
)

const (
	invoiceKeyFieldsNumber      = 1
	invoiceBasicArgumentsNumber = 3
)

// Invoice state constants (from 0 to 4)
const (
	stateUnknown    = iota
	stateOrdinary
	stateForSale
	stateBidOffered
	stateSold
	stateRemoved
)

var invocieStateLegal = map[int][]int{
	stateUnknown:    {},
	stateOrdinary:   {},
	stateForSale:    {},
	stateBidOffered: {},
	stateSold:       {},
	stateRemoved:    {},
}

var invoiceStateMachine = map[int][]int{
	stateUnknown:    {stateUnknown},
	stateOrdinary:   {stateForSale},
	stateForSale:    {stateBidOffered},
	stateBidOffered: {stateSold},
	stateSold:       {stateForSale},
	stateRemoved:    {stateRemoved},
}

type InvoiceKey struct {
	ID string `json:"id"`
}

type InvocieValue struct {
	Debtor      string  `json:"consignor"`
	Beneficiary string  `json:"consignee"`
	TotalDue    float32 `json:"totalDue"`
	DueDate     int64   `json:"dueDate"`
	State       int     `json:"state"`
}

type Invoice struct {
	Key   InvoiceKey   `json:"key"`
	Value InvocieValue `json:"value"`
}

//func CreateInvoice() LedgerData {
//	//return new(Invoice)
//}

//argument order
//0		1		2			3			4			5
//ID	Debtor	Beneficiary	TotalDue	DueDate		State
func (entity *Invoice) FillFromArguments(args []string) error {
	if len(args) < invoiceBasicArgumentsNumber {
		return errors.New(fmt.Sprintf("arguments array must contain at least %d items", invoiceBasicArgumentsNumber))
	}
	// checking totalDue
	totalDue, err := strconv.ParseFloat(args[3], 32)
	if err != nil {
		return errors.New(fmt.Sprintf("unable to parse the totalDue: %s", err.Error()))
	}
	if totalDue < 0 {
		return errors.New("totalDue must be larger than zero")
	}
	entity.Value.TotalDue = float32(totalDue)

	//checking dueDate
	dueDate, err := strconv.ParseInt(args[4], 10, 64)
	if err != nil {
		return errors.New(fmt.Sprintf("unable to parse the dueDate: %s", err.Error()))
	}

	if dueDate < 0 {
		return errors.New("dueDate must be larger than zero")
	}
	entity.Value.DueDate = int64(dueDate)

	//checking state
	state, err := strconv.Atoi(args[5])
	if err != nil {
		return errors.New(fmt.Sprintf("invoice state is invalid: %s (must be int", args[5]))
	}
	if !Contains(invocieStateLegal, state) {
		return errors.New(fmt.Sprintf("invoice state is invalid: %d (must be from 0 to %d)", state, len(invocieStateLegal)))
	}

	return nil
}

func (entity *Invoice) FillFromCompositeKeyParts(compositeKeyParts []string) error {
	if len(compositeKeyParts) < invoiceKeyFieldsNumber {
		return errors.New(fmt.Sprintf("composite key parts array must contain at least %d items", invoiceKeyFieldsNumber))
	}

	if id, err := uuid.FromString(compositeKeyParts[0]); err != nil {
		return errors.New(fmt.Sprintf("unable to parse an ID from \"%s\"", compositeKeyParts[0]))
	} else if id.Version() != uuid.V4 {
		return errors.New("wrong ID format; expected UUID version 4")
	}

	entity.Key.ID = compositeKeyParts[0]

	return nil
}

func (entity *Invoice) FillFromLedgerValue(ledgerValue []byte) error {
	if err := json.Unmarshal(ledgerValue, &entity.Value); err != nil {
		return err
	} else {
		return nil
	}
}

func (entity *Invoice) ToCompositeKey(stub shim.ChaincodeStubInterface) (string, error) {
	compositeKeyParts := []string{
		entity.Key.ID,
	}

	return stub.CreateCompositeKey(invoiceIndex, compositeKeyParts)
}

func (entity *Invoice) ToLedgerValue() ([]byte, error) {
	return json.Marshal(entity.Value)
}
