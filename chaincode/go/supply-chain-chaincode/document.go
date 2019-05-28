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
	documentIndex = "Document"
)

const (
	documentKeyFieldsNumber      = 1
	documentBasicArgumentsNumber = 5
)

type DocumentKey struct {
	ID string `json:"id"`
}

type DocumentValue struct {
	EntityType          int    `json:"entityType"`
	EntityID            string `json:"entityID"`
	DocumentHash        string `json:"documentHash"`
	DocumentDescription string `json:"documentDescription"`
	DocumentType        int    `json:"documentType"`
	Timestamp           int64  `json:"timestamp"`
}

type Document struct {
	Key   DocumentKey   `json:"key"`
	Value DocumentValue `json:"value"`
}

func CreateDocument() LedgerData {
	return new(Document)
}

//argument order
//0		1			2			3				4					5
//ID	EntityType	EntityID	DocumentHash 	DocumentDescription	DocumentType
func (entity *Document) FillFromArguments(stub shim.ChaincodeStubInterface, args []string) error {
	if len(args) < documentBasicArgumentsNumber {
		return errors.New(fmt.Sprintf("arguments array must contain at least %d items", documentBasicArgumentsNumber))
	}

	//checking entityType
	allowedEntityTypes := map[int]bool{
		TypeContract:     true,
		TypeAgencyReport: true,
		TypeShipment:     true,
	}
	entityType, err := strconv.Atoi(args[1])
	if err != nil {
		return errors.New(fmt.Sprintf("entityType is invalid: %s (must be int)", args[1]))
	}
	if !allowedEntityTypes[entityType] {
		return errors.New(fmt.Sprintf("unacceptable type of entity"))
	}
	entity.Value.EntityType = entityType

	//checking documentType
	allowedDocumentTypes := map[int]bool{
		DocTypeJPG: true,
		DocTypePNG: true,
		DocTypeXLS: true,
		DocTypePDF: true,
		DocTypeCSV: true,
	}
	documentType, err := strconv.Atoi(args[5])
	if err != nil {
		return errors.New(fmt.Sprintf("documentType is invalid: %s (must be int)", args[5]))
	}
	if !allowedDocumentTypes[documentType] {
		return errors.New(fmt.Sprintf("unacceptable type of document"))
	}
	entity.Value.DocumentType = documentType

	return nil
}

func (entity *Document) FillFromCompositeKeyParts(compositeKeyParts []string) error {
	if len(compositeKeyParts) < documentKeyFieldsNumber {
		return errors.New(fmt.Sprintf("composite key parts array must contain at least %d items", documentKeyFieldsNumber))
	}

	if id, err := uuid.FromString(compositeKeyParts[0]); err != nil {
		return errors.New(fmt.Sprintf("unable to parse an ID from \"%s\"", compositeKeyParts[0]))
	} else if id.Version() != uuid.V4 {
		return errors.New("wrong ID format; expected UUID version 4")
	}

	entity.Key.ID = compositeKeyParts[0]

	return nil
}

func (entity *Document) FillFromLedgerValue(ledgerValue []byte) error {
	if err := json.Unmarshal(ledgerValue, &entity.Value); err != nil {
		return err
	} else {
		return nil
	}
}

func (entity *Document) ToCompositeKey(stub shim.ChaincodeStubInterface) (string, error) {
	compositeKeyParts := []string{
		entity.Key.ID,
	}

	return stub.CreateCompositeKey(documentIndex, compositeKeyParts)
}

func (entity *Document) ToLedgerValue() ([]byte, error) {
	return json.Marshal(entity.Value)
}
