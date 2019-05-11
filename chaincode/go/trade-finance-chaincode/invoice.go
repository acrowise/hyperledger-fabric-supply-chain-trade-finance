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
	invoiceIndex = "Invoice"
)

const (
	invoiceKeyFieldsNumber      = 1
	invoiceBasicArgumentsNumber = 4
)

// Invoice state constants (from 0 to 5)
const (
	stateInvoiceUnknown = iota
	stateInvoiceIssued
	stateInvoiceSigned
	stateInvoiceForSale
	stateInvoiceSold
	stateInvoiceRemoved
	stateInvoiceRejected
)

var invoiceStateLegal = map[int][]int{
	stateInvoiceUnknown: {},
	stateInvoiceIssued:  {},
	stateInvoiceSigned:  {},
	stateInvoiceForSale: {},
	stateInvoiceSold:    {},
	stateInvoiceRemoved: {},
}

var invoiceStateMachine = map[int][]int{
	stateInvoiceUnknown: {stateInvoiceUnknown},
	stateInvoiceIssued:  {stateInvoiceSigned, stateInvoiceRemoved},
	stateInvoiceSigned:  {stateInvoiceForSale},
	stateInvoiceForSale: {stateInvoiceSold, stateInvoiceForSale},
	stateInvoiceSold:    {stateInvoiceForSale},
	stateInvoiceRemoved: {stateInvoiceRemoved},
}

type InvoiceKey struct {
	ID string `json:"id"`
}

type InvoiceValue struct {
	Debtor      string  `json:"debtor"`
	Beneficiary string  `json:"beneficiary"`
	TotalDue    float32 `json:"totalDue"`
	DueDate     int64   `json:"dueDate"`
	State       int     `json:"state"`
	Owner       string  `json:"owner"`
	Timestamp   int64   `json:"timestamp"`
}

type Invoice struct {
	Key   InvoiceKey   `json:"key"`
	Value InvoiceValue `json:"value"`
}

func CreateInvoice() LedgerData {
	return new(Invoice)
}

//argument order
//0		1		2			3			4
//ID	Debtor	Beneficiary	TotalDue	DueDate
func (entity *Invoice) FillFromArguments(stub shim.ChaincodeStubInterface, args []string) error {
	if len(args) < invoiceBasicArgumentsNumber {
		return errors.New(fmt.Sprintf("arguments array must contain at least %d items", invoiceBasicArgumentsNumber))
	}

	if err := entity.FillFromCompositeKeyParts(args[:invoiceKeyFieldsNumber]); err != nil {
		return err
	}

	//TODO: checking debtor by CA
	debtor := args[1]
	if debtor == "" {
		message := fmt.Sprintf("debtor must be not empty")
		return errors.New(message)
	}
	entity.Value.Debtor = debtor

	//TODO: checking beneficiary by CA
	beneficiary := args[2]
	if beneficiary == "" {
		message := fmt.Sprintf("beneficiary must be not empty")
		return errors.New(message)
	}
	entity.Value.Beneficiary = beneficiary

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
