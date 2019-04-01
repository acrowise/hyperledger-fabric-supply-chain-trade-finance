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
	bidIndex = "Bid"
)

const (
	bidKeyFieldsNumber = 1
	bidBasicArgumentsNumber = 3
)

const (
	typeLend = iota
	typeBorrow
)

const (
	statusActive = iota
	statusInactive
	statusCancelled
)

type BidKey struct {
	ID string `json:"id"`
}

type BidValue struct {
	Creator   string  `json:"creator"`
	Type      int     `json:"type"`
	Amount    float32 `json:"amount"`
	Rate      float32 `json:"rate"`
	Timestamp int64   `json:"timestamp"`
	Status    int     `json:"status"`
}

type Bid struct {
	Key   BidKey   `json:"key"`
	Value BidValue `json:"value"`
}

func CreateBid() LedgerData {
	return new(Bid)
}

func (bid *Bid) FillFromArguments(args []string) error {
	if len(args) < bidBasicArgumentsNumber {
		return errors.New(fmt.Sprintf("arguments array must contain at least %d items", bidBasicArgumentsNumber))
	}

	bidType, err := strconv.Atoi(args[0])
	if err != nil {
		return errors.New(fmt.Sprintf("unable to parse bid type: %s", err.Error()))
	}
	if bidType != typeLend && bidType != typeBorrow {
		return errors.New(fmt.Sprintf("unsupported type of a bid: %d", bidType))
	}
	bid.Value.Type = bidType

	amount, err := strconv.ParseFloat(args[1], 32)
	if err != nil {
		return errors.New(fmt.Sprintf("unable to parse the amount: %s", err.Error()))
	}
	if amount < 0 {
		return errors.New("amount must be larger than zero")
	}
	bid.Value.Amount = float32(amount)

	rate, err := strconv.ParseFloat(args[2], 32)
	if err != nil {
		return errors.New(fmt.Sprintf("unable to parse the rate: %s", err.Error()))
	}
	if rate < 0 {
		return errors.New("rate must be larger than zero")
	}
	bid.Value.Rate = float32(rate)

	return nil
}

func (bid *Bid) FillFromCompositeKeyParts(compositeKeyParts []string) error {
	if len(compositeKeyParts) < bidKeyFieldsNumber {
		return errors.New(fmt.Sprintf("composite key parts array must contain at least %d items", bidKeyFieldsNumber))
	}

	if id, err := uuid.FromString(compositeKeyParts[0]); err != nil {
		return errors.New(fmt.Sprintf("unable to parse an ID from \"%s\"", compositeKeyParts[0]))
	} else if id.Version() != uuid.V4 {
		return errors.New("wrong ID format; expected UUID version 4")
	}

	bid.Key.ID = compositeKeyParts[0]

	return nil
}

func (bid *Bid) FillFromLedgerValue(ledgerValue []byte) error {
	if err := json.Unmarshal(ledgerValue, &bid.Value); err != nil {
		return err
	} else {
		return nil
	}
}

func (bid *Bid) ToCompositeKey(stub shim.ChaincodeStubInterface) (string, error) {
	compositeKeyParts := []string {
		bid.Key.ID,
	}

	return stub.CreateCompositeKey(bidIndex, compositeKeyParts)
}

func (bid *Bid) ToLedgerValue() ([]byte, error) {
	return json.Marshal(bid.Value)
}
