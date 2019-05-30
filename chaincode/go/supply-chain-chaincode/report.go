package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/satori/go.uuid"
)

const (
	reportIndex = "Report"
)

const (
	reportKeyFieldsNumber      = 1
	reportBasicArgumentsNumber = 7
)

//shipment state constants (from 0 to 4)
const (
	stateReportUnknown = iota
	stateReportAccepted
	stateReportDeclined
)

var reportStateLegal = map[int][]int{
	stateReportUnknown:  {},
	stateReportAccepted: {},
	stateReportDeclined: {},
}

var reportStateMachine = map[int][]int{
	stateReportUnknown:  {stateReportUnknown},
	stateReportAccepted: {stateReportAccepted},
	stateReportDeclined: {stateReportDeclined},
}

type ReportKey struct {
	ID string `json:"id"`
}

type ReportValue struct {
	Description string `json:"description"`
	ContractID  string `json:"contractID"`
	State       int    `json:"state"`
	Timestamp   int64  `json:"timestamp"`
	UpdatedDate int64  `json:"updatedDate"`
}

type ReportValueAdditional struct {
	Description string   `json:"description"`
	ContractID  string   `json:"contractID"`
	State       int      `json:"state"`
	Timestamp   int64    `json:"timestamp"`
	Documents   []string `json:"documents"`
	UpdatedDate int64    `json:"updatedDate"`
}

type Report struct {
	Key   ReportKey   `json:"key"`
	Value ReportValue `json:"value"`
}

type ReportAdditional struct {
	Key   ReportKey             `json:"key"`
	Value ReportValueAdditional `json:"value"`
}

func CreateReport() LedgerData {
	return new(Report)
}

//argument order
//0		1			2
//ID	Description	State
func (entity *Report) FillFromArguments(stub shim.ChaincodeStubInterface, args []string) error {
	if len(args) < reportBasicArgumentsNumber {
		return errors.New(fmt.Sprintf("arguments array must contain at least %d items", reportBasicArgumentsNumber))
	}
	return nil
}

func (entity *Report) FillFromCompositeKeyParts(compositeKeyParts []string) error {
	if len(compositeKeyParts) < reportKeyFieldsNumber {
		return errors.New(fmt.Sprintf("composite key parts array must contain at least %d items", reportKeyFieldsNumber))
	}

	if id, err := uuid.FromString(compositeKeyParts[0]); err != nil {
		return errors.New(fmt.Sprintf("unable to parse an ID from \"%s\"", compositeKeyParts[0]))
	} else if id.Version() != uuid.V4 {
		return errors.New("wrong ID format; expected UUID version 4")
	}

	entity.Key.ID = compositeKeyParts[0]

	return nil
}

func (entity *Report) FillFromLedgerValue(ledgerValue []byte) error {
	if err := json.Unmarshal(ledgerValue, &entity.Value); err != nil {
		return err
	} else {
		return nil
	}
}

func (entity *Report) ToCompositeKey(stub shim.ChaincodeStubInterface) (string, error) {
	compositeKeyParts := []string{
		entity.Key.ID,
	}

	return stub.CreateCompositeKey(reportIndex, compositeKeyParts)
}

func (entity *Report) ToLedgerValue() ([]byte, error) {
	return json.Marshal(entity.Value)
}
