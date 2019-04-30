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
	orderIndex = "Order"
)

const (
	orderKeyFieldsNumber      = 1
	orderBasicArgumentsNumber = 8
)

//order state constants (from 0 to 3)
const (
	stateOrderUnknown = iota
	stateOrderNew
	stateOrderAccepted
	stateOrderCanceled
)

var orderStateLegal = map[int][]int{
	stateOrderUnknown:  {},
	stateOrderNew:      {},
	stateOrderAccepted: {},
	stateOrderCanceled: {},
}

var orderStateMachine = map[int][]int{
	stateOrderUnknown:  {stateOrderUnknown},
	stateOrderNew:      {stateOrderAccepted, stateOrderCanceled},
	stateOrderAccepted: {stateOrderAccepted},
	stateOrderCanceled: {stateOrderCanceled},
}

type OrderKey struct {
	ID string `json:"id"`
}

type OrderValue struct {
	ProductName string  `json:"productName"`
	Quantity    int     `json:"quantity"`
	Price       float32 `json:"price"`
	Destination string  `json:"destination"`
	DueDate     int64   `json:"dueDate"`
	PaymentDate int64   `json:"paymentDate"`
	BuyerID     string  `json:"buyerID"`
	State       int     `json:"state"`
	Timestamp   int64   `json:"timestamp"`
}

type Order struct {
	Key   OrderKey   `json:"key"`
	Value OrderValue `json:"value"`
}

func CreateOrder() LedgerData {
	return new(Order)
}

//argument order
//0		1			2			3		4			5		6			7		8
//ID	ProductName	Quantity	Price	Destination	DueDate	PaymentDate	BuyerID	State
func (entity *Order) FillFromArguments(stub shim.ChaincodeStubInterface, args []string) error {
	if len(args) < orderBasicArgumentsNumber {
		return errors.New(fmt.Sprintf("arguments array must contain at least %d items", orderBasicArgumentsNumber))
	}
	//checking productName
	productName := args[0]
	if len(productName) == 0 {
		return errors.New(fmt.Sprintf("productName must be not empty"))
	}

	//checking quantity
	quantity, err := strconv.Atoi(args[2])
	if err != nil {
		return errors.New(fmt.Sprintf("quantity is invalid: %s (must be int)", args[2]))
	}
	entity.Value.Quantity = quantity

	// checking price
	price, err := strconv.ParseFloat(args[3], 32)
	if err != nil {
		return errors.New(fmt.Sprintf("unable to parse the price: %s", err.Error()))
	}
	if price < 0 {
		return errors.New("price must be larger than zero")
	}
	entity.Value.Price = float32(price)

	//checking dueDate
	dueDate, err := strconv.ParseInt(args[5], 10, 64)
	if err != nil {
		return errors.New(fmt.Sprintf("unable to parse the dueDate: %s", err.Error()))
	}

	if dueDate < 0 {
		return errors.New("dueDate must be larger than zero")
	}
	entity.Value.DueDate = int64(dueDate)

	//checking paymentDate
	paymentDate, err := strconv.ParseInt(args[6], 10, 64)
	if err != nil {
		return errors.New(fmt.Sprintf("unable to parse the paymentDate: %s", err.Error()))
	}

	if paymentDate < 0 {
		return errors.New("paymentDate must be larger than zero")
	}
	entity.Value.PaymentDate = int64(paymentDate)

	//checking state
	state, err := strconv.Atoi(args[8])
	if err != nil {
		return errors.New(fmt.Sprintf("order state is invalid: %s (must be int)", args[8]))
	}
	if !Contains(orderStateLegal, state) {
		return errors.New(fmt.Sprintf("order state is invalid: %d (must be from 0 to %d)", state, len(orderStateLegal)))
	}
	entity.Value.State = state

	return nil
}

func (entity *Order) FillFromCompositeKeyParts(compositeKeyParts []string) error {
	if len(compositeKeyParts) < orderKeyFieldsNumber {
		return errors.New(fmt.Sprintf("composite key parts array must contain at least %d items", orderKeyFieldsNumber))
	}

	if id, err := uuid.FromString(compositeKeyParts[0]); err != nil {
		return errors.New(fmt.Sprintf("unable to parse an ID from \"%s\"", compositeKeyParts[0]))
	} else if id.Version() != uuid.V4 {
		return errors.New("wrong ID format; expected UUID version 4")
	}

	entity.Key.ID = compositeKeyParts[0]

	return nil
}

func (entity *Order) FillFromLedgerValue(ledgerValue []byte) error {
	if err := json.Unmarshal(ledgerValue, &entity.Value); err != nil {
		return err
	} else {
		return nil
	}
}

func (entity *Order) ToCompositeKey(stub shim.ChaincodeStubInterface) (string, error) {
	compositeKeyParts := []string{
		entity.Key.ID,
	}

	return stub.CreateCompositeKey(orderIndex, compositeKeyParts)
}

func (entity *Order) ToLedgerValue() ([]byte, error) {
	return json.Marshal(entity.Value)
}
