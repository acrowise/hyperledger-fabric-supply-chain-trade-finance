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
	AgencyReportIndex = "AgencyReport"
)

const (
	agencyReportKeyFieldsNumber      = 1
	agencyReportBasicArgumentsNumber = 7
)

//shipment state constants (from 0 to 4)
const (
	stateAgencyReportUnknown = iota
	stateAgencyReportAccepted
	stateAgencyReportDeclined
)

var agencyReportStateLegal = map[int][]int{
	stateAgencyReportUnknown:  {},
	stateAgencyReportAccepted: {},
	stateAgencyReportDeclined: {},
}

var agencyReportStateMachine = map[int][]int{
	stateAgencyReportUnknown:  {stateAgencyReportUnknown},
	stateAgencyReportAccepted: {stateAgencyReportAccepted},
	stateAgencyReportDeclined: {stateAgencyReportDeclined},
}

type AgencyReportKey struct {
	ID string `json:"id"`
}

type AgencyReportValue struct {
	Description string   `json:"description"`
	State       int      `json:"state"`
	Documents   []string `json:"documents"`
	Timestamp   int64    `json:"timestamp"`
}

type AgencyReport struct {
	Key   AgencyReportKey   `json:"key"`
	Value AgencyReportValue `json:"value"`
}

func CreateAgencyReport() LedgerData {
	return new(AgencyReport)
}

//argument order
//0		1			2		3
//ID	Description	State	Documents
func (entity *AgencyReport) FillFromArguments(stub shim.ChaincodeStubInterface, args []string) error {
	if len(args) < agencyReportBasicArgumentsNumber {
		return errors.New(fmt.Sprintf("arguments array must contain at least %d items", agencyReportBasicArgumentsNumber))
	}

	//checking state
	state, err := strconv.Atoi(args[6])
	if err != nil {
		return errors.New(fmt.Sprintf("shipment state is invalid: %s (must be int)", args[8]))
	}
	if !Contains(agencyReportStateLegal, state) {
		return errors.New(fmt.Sprintf("shipment state is invalid: %d (must be from 0 to %d)", state, len(agencyReportStateLegal)))
	}
	entity.Value.State = state

	return nil
}

func (entity *AgencyReport) FillFromCompositeKeyParts(compositeKeyParts []string) error {
	if len(compositeKeyParts) < agencyReportKeyFieldsNumber {
		return errors.New(fmt.Sprintf("composite key parts array must contain at least %d items", agencyReportKeyFieldsNumber))
	}

	if id, err := uuid.FromString(compositeKeyParts[0]); err != nil {
		return errors.New(fmt.Sprintf("unable to parse an ID from \"%s\"", compositeKeyParts[0]))
	} else if id.Version() != uuid.V4 {
		return errors.New("wrong ID format; expected UUID version 4")
	}

	entity.Key.ID = compositeKeyParts[0]

	return nil
}

func (entity *AgencyReport) FillFromLedgerValue(ledgerValue []byte) error {
	if err := json.Unmarshal(ledgerValue, &entity.Value); err != nil {
		return err
	} else {
		return nil
	}
}

func (entity *AgencyReport) ToCompositeKey(stub shim.ChaincodeStubInterface) (string, error) {
	compositeKeyParts := []string{
		entity.Key.ID,
	}

	return stub.CreateCompositeKey(AgencyReportIndex, compositeKeyParts)
}

func (entity *AgencyReport) ToLedgerValue() ([]byte, error) {
	return json.Marshal(entity.Value)
}
