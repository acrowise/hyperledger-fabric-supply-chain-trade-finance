package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/satori/go.uuid"
)

const (
	shipmentIndex = "Shipment"
)

const (
	shipmentKeyFieldsNumber      = 1
	shipmentBasicArgumentsNumber = 5
)

//shipment state constants (from 0 to 4)
const (
	stateShipmentUnknown = iota
	stateShipmentRequested
	stateShipmentConfirmed
	stateShipmentApproved
	stateShipmentDelivered
)

var shipmentStateLegal = map[int][]int{
	stateShipmentUnknown:   {},
	stateShipmentRequested: {},
	stateShipmentConfirmed: {},
	stateShipmentApproved:  {},
	stateShipmentDelivered: {},
}

var shipmentStateMachine = map[int][]int{
	stateShipmentUnknown:   {stateShipmentUnknown},
	stateShipmentRequested: {stateShipmentRequested},
	stateShipmentConfirmed: {stateShipmentConfirmed},
	stateShipmentApproved:  {stateShipmentApproved},
	stateShipmentDelivered: {stateShipmentDelivered},
}

type ShipmentKey struct {
	ID string `json:"id"`
}

type ShipmentValue struct {
	ContractID  string   `json:"contractID"`
	ShipFrom    string   `json:"shipFrom"`
	ShipTo      string   `json:"shipTo"`
	Transport   string   `json:"transport"`
	Description string   `json:"description"`
	State       int      `json:"state"`
	Documents   []string `json:"documents"`
	Timestamp   int64    `json:"timestamp"`
}

type Shipment struct {
	Key   ShipmentKey   `json:"key"`
	Value ShipmentValue `json:"value"`
}

func CreateShipment() LedgerData {
	return new(Shipment)
}

//argument order
//0		1			2			3		4			5
//ID	ContractID	ShipFrom	ShipTo	Transport	Description
func (entity *Shipment) FillFromArguments(stub shim.ChaincodeStubInterface, args []string) error {
	if len(args) < shipmentBasicArgumentsNumber {
		return errors.New(fmt.Sprintf("arguments array must contain at least %d items", shipmentBasicArgumentsNumber))
	}

	//checking contract
	contract := Contract{}
	if err := contract.FillFromCompositeKeyParts([]string{args[1]}); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return errors.New(message)
	}

	if !ExistsIn(stub, &contract, contractIndex) {
		compositeKey, _ := contract.ToCompositeKey(stub)
		return errors.New(fmt.Sprintf("contract with the key %s doesn't exist", compositeKey))
	}

	entity.Value.ContractID = contract.Key.ID

	//TODO: checking shipFrom by CA
	shipFrom := args[2]
	if shipFrom == "" {
		message := fmt.Sprintf("shipFrom must be not empty")
		return errors.New(message)
	}
	entity.Value.ShipFrom = shipFrom

	//TODO: checking shipTo by CA
	shipTo := args[3]
	if shipTo == "" {
		message := fmt.Sprintf("shipTo must be not empty")
		return errors.New(message)
	}
	entity.Value.ShipTo = shipTo

	transport := args[4]
	if transport == "" {
		message := fmt.Sprintf("transport must be not empty")
		return errors.New(message)
	}
	entity.Value.Transport = transport

	return nil
}

func (entity *Shipment) FillFromCompositeKeyParts(compositeKeyParts []string) error {
	if len(compositeKeyParts) < shipmentKeyFieldsNumber {
		return errors.New(fmt.Sprintf("composite key parts array must contain at least %d items", shipmentKeyFieldsNumber))
	}

	if id, err := uuid.FromString(compositeKeyParts[0]); err != nil {
		return errors.New(fmt.Sprintf("unable to parse an ID from \"%s\"", compositeKeyParts[0]))
	} else if id.Version() != uuid.V4 {
		return errors.New("wrong ID format; expected UUID version 4")
	}

	entity.Key.ID = compositeKeyParts[0]

	return nil
}

func (entity *Shipment) FillFromLedgerValue(ledgerValue []byte) error {
	if err := json.Unmarshal(ledgerValue, &entity.Value); err != nil {
		return err
	} else {
		return nil
	}
}

func (entity *Shipment) ToCompositeKey(stub shim.ChaincodeStubInterface) (string, error) {
	compositeKeyParts := []string{
		entity.Key.ID,
	}

	return stub.CreateCompositeKey(shipmentIndex, compositeKeyParts)
}

func (entity *Shipment) ToLedgerValue() ([]byte, error) {
	return json.Marshal(entity.Value)
}
