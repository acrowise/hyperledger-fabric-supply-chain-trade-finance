package main

import (
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/hyperledger/fabric-amcl/amcl/FP256BN"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/idemix"
	"github.com/satori/go.uuid"
	"math/rand"
)

const (
	proofIndex = "Proof"
)

const (
	proofKeyFieldsNumber      = 1
	proofBasicArgumentsNumber = 3
)

//proof state constants (from 0 to 2)
const (
	stateProofUnknown = iota
	stateProofGenerated
	stateProofValidated
	stateProofUpdated
)

var proofStateLegal = map[int][]int{
	stateProofUnknown:   {},
	stateProofGenerated: {},
	stateProofValidated: {},
	stateProofUpdated:   {},
}

var proofStateMachine = map[int][]int{
	stateProofUnknown:   {stateProofUnknown},
	stateProofGenerated: {stateProofGenerated, stateProofValidated},
	stateProofValidated: {stateProofValidated},
	stateProofUpdated:   {stateProofUpdated},
}

type ProofKey struct {
	ID string `json:"id"`
}

type ProofValue struct {
	SnapShot            *idemix.Signature        `json:"snapShot"`
	DataForVerification ProofDataForVerification `json:"dataForVerification"`
	State               int                      `json:"state"`
	ConsignorName       string                   `json:"consignorName"`
	Owner               string                   `json:"owner"`
	Timestamp           int64                    `json:"timestamp"`
	ShipmentID          string                   `json:"shipmentID"`
	UpdatedDate         int64                    `json:"updatedDate"`
}

type ProofDataForVerification struct {
	Disclosure          []byte                  `json:"disclosure"`
	Ipk                 *idemix.IssuerPublicKey `json:"ipk"`
	Msg                 []byte                  `json:"msg"`
	AttributeValuesHash [][]byte                `json:"attributeValuesHash"`
	AttributeValues     []string                `json:"attributeValues"`
	RhIndex             int                     `json:"rhIndex"`
	RevPk               string                  `json:"revPk"`
	Epoch               int                     `json:"epoch"`
}

type Proof struct {
	Key   ProofKey   `json:"key"`
	Value ProofValue `json:"value"`
}

type AttributeData struct {
	AttributeName       string `json:"attributeName"`
	AttributeValue      string `json:"attributeValue"`
	AttributeDisclosure byte   `json:"attributeDisclosure"`
}

func CreateProof() LedgerData {
	return new(Proof)
}

//argument order
//0		1				2		3
//ID	ArrayAttributes	Owner	ContractID
func (entity *Proof) FillFromArguments(stub shim.ChaincodeStubInterface, args []string) error {
	if len(args) < proofBasicArgumentsNumber {
		return errors.New(fmt.Sprintf("arguments array must contain at least %d items", proofBasicArgumentsNumber))
	}

	//checking owner
	owner := args[2]
	if owner == "" {
		return errors.New(fmt.Sprintf("proof Owner is invalid: %s (must be string)", args[2]))
	}
	entity.Value.Owner = owner

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

	return stub.CreateCompositeKey(proofIndex, compositeKeyParts)
}

func (entity *Proof) ToLedgerValue() ([]byte, error) {
	return json.Marshal(entity.Value)
}

func (entity *Proof) GenerateIdemixCrypto(jsonData string) error {
	// making arrays of attributes names and values
	rng, err := idemix.GetRand()

	var attributesArray []AttributeData
	err = json.Unmarshal([]byte(jsonData), &attributesArray)
	if err != nil {
		message := fmt.Sprintf("Input json is invalid. Error \"%s\"", err.Error())
		Logger.Error(message)
		return errors.New(message)
	}

	AttributeNames := make([]string, len(attributesArray))
	attrs := make([]*FP256BN.BIG, len(AttributeNames))
	disclosure := make([]byte, len(attributesArray))
	msg := make([]byte, len(attributesArray))
	attributeValues := make([]string, len(attributesArray))
	var rhindex int

	for i := range attributesArray {
		h := sha256.New()
		// make hash from value of attribute
		h.Write([]byte(attributesArray[i].AttributeValue))
		attrs[i] = FP256BN.FromBytes(h.Sum(nil))
		AttributeNames[i] = attributesArray[i].AttributeName
		disclosure[i] = attributesArray[i].AttributeDisclosure
		msg[i] = byte(i)
		if attributesArray[i].AttributeDisclosure == 0 {
			rhindex = i
			// fill hidden field random value
			attrs[i] = FP256BN.NewBIGint(rand.Intn(10000))
		} else {
			attributeValues[i] = attributesArray[i].AttributeValue
		}
	}

	// check Disclosure[rhIndex] == 0
	if attributesArray[rhindex].AttributeDisclosure != 0 {
		message := fmt.Sprintf("Idemix requires the revocation handle to remain undisclosed (i.e., Disclosure[rhIndex] == 0). But we have \"%d\"", attributesArray[rhindex].AttributeDisclosure)
		Logger.Error(message)
		return errors.New(message)
	}

	// create a new key pair
	key, err := idemix.NewIssuerKey(AttributeNames, rng)
	if err != nil {
		message := fmt.Sprintf("Issuer key generation should have succeeded but gave error \"%s\"", err.Error())
		Logger.Error(message)
		return errors.New(message)
	}

	// check that the key is valid
	err = key.GetIpk().Check()
	if err != nil {
		message := fmt.Sprintf("Issuer public key should be valid")
		Logger.Error(message)
		return errors.New(message)
	}

	// issuance
	sk := idemix.RandModOrder(rng)
	ni := idemix.RandModOrder(rng)
	m := idemix.NewCredRequest(sk, idemix.BigToBytes(ni), key.Ipk, rng)

	cred, err := idemix.NewCredential(key, m, attrs, rng)

	// generate a revocation key pair
	revocationKey, err := idemix.GenerateLongTermRevocationKey()

	// create CRI that contains no revocation mechanism
	epoch := 0
	cri, err := idemix.CreateCRI(revocationKey, []*FP256BN.BIG{}, epoch, idemix.ALG_NO_REVOCATION, rng)
	if err != nil {
		message := fmt.Sprintf("Create CRI return error: %s", err.Error())
		Logger.Error(message)
		return errors.New(message)
	}

	// signing selective disclosure
	Nym, RandNym := idemix.MakeNym(sk, key.Ipk, rng)
	sig, err := idemix.NewSignature(cred, sk, Nym, RandNym, key.Ipk, disclosure, msg, rhindex, cri, rng)
	if err != nil {
		message := fmt.Sprintf("Idemix NewSignature return error: %s", err.Error())
		Logger.Error(message)
		return errors.New(message)
	}

	attributeValuesBytes := make([][]byte, len(attrs))
	for i := 0; i < len(attrs); i++ {
		row := make([]byte, FP256BN.MODBYTES)
		attributeValue := attrs[i]
		attributeValue.ToBytes(row)
		attributeValuesBytes[i] = row
	}

	entity.Value.SnapShot = sig
	entity.Value.DataForVerification.Disclosure = disclosure
	entity.Value.DataForVerification.Ipk = key.Ipk
	entity.Value.DataForVerification.Msg = msg
	entity.Value.DataForVerification.AttributeValuesHash = attributeValuesBytes
	entity.Value.DataForVerification.AttributeValues = attributeValues
	entity.Value.DataForVerification.RhIndex = rhindex
	entity.Value.DataForVerification.RevPk = encode(&revocationKey.PublicKey)
	entity.Value.DataForVerification.Epoch = epoch

	return nil
}
