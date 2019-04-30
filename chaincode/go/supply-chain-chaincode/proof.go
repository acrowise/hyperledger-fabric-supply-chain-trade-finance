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
	ProofIndex = "Proof"
)

const (
	proofKeyFieldsNumber      = 1
	proofBasicArgumentsNumber = 2
)

//proof state constants (from 0 to 2)
const (
	stateProofUnknown = iota
	stateProofGenerated
	stateProofValidated
)

var proofStateLegal = map[int][]int{
	stateProofUnknown:   {},
	stateProofGenerated: {},
	stateProofValidated: {},
}

var proofStateMachine = map[int][]int{
	stateProofUnknown:   {stateProofUnknown},
	stateProofGenerated: {stateProofGenerated, stateProofValidated},
	stateProofValidated: {stateProofValidated},
}

type ProofKey struct {
	ID string `json:"id"`
}

type ProofValue struct {
	SnapShot  string `json:"snapShot"`
	State     int    `json:"state"`
	Timestamp int64  `json:"timestamp"`
}

type Proof struct {
	Key   ProofKey   `json:"key"`
	Value ProofValue `json:"value"`
}

func CreateProof() LedgerData {
	return new(Proof)
}

//argument order
//0		1			2
//ID	SnapShot	State
func (entity *Proof) FillFromArguments(stub shim.ChaincodeStubInterface, args []string) error {
	if len(args) < proofBasicArgumentsNumber {
		return errors.New(fmt.Sprintf("arguments array must contain at least %d items", proofBasicArgumentsNumber))
	}

	//checking state
	state, err := strconv.Atoi(args[2])
	if err != nil {
		return errors.New(fmt.Sprintf("proof state is invalid: %s (must be int)", args[8]))
	}
	if !Contains(proofStateLegal, state) {
		return errors.New(fmt.Sprintf("proof state is invalid: %d (must be from 0 to %d)", state, len(proofStateLegal)))
	}
	entity.Value.State = state

	return nil
}

func (entity *Proof) FillFromCompositeKeyParts(compositeKeyParts []string) error {
	if len(compositeKeyParts) < proofKeyFieldsNumber {
		return errors.New(fmt.Sprintf("composite key parts array must contain at least %d items", proofKeyFieldsNumber))
	}

	if id, err := uuid.FromString(compositeKeyParts[0]); err != nil {
		return errors.New(fmt.Sprintf("unable to parse an ID from \"%s\"", compositeKeyParts[0]))
	} else if id.Version() != uuid.V4 {
		return errors.New("wrong ID format; expected UUID version 4")
	}

	entity.Key.ID = compositeKeyParts[0]

	return nil
}

func (entity *Proof) FillFromLedgerValue(ledgerValue []byte) error {
	if err := json.Unmarshal(ledgerValue, &entity.Value); err != nil {
		return err
	} else {
		return nil
	}
}

func (entity *Proof) ToCompositeKey(stub shim.ChaincodeStubInterface) (string, error) {
	compositeKeyParts := []string{
		entity.Key.ID,
	}

	return stub.CreateCompositeKey(ProofIndex, compositeKeyParts)
}

func (entity *Proof) ToLedgerValue() ([]byte, error) {
	return json.Marshal(entity.Value)
}
