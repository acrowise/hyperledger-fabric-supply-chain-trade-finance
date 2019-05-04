package main

import (
	"crypto/ecdsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"github.com/hyperledger/fabric-amcl/amcl/FP256BN"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/idemix"
	pb "github.com/hyperledger/fabric/protos/peer"
	"github.com/satori/go.uuid"
	"strconv"
	"time"
)

var logger = shim.NewLogger("SupplyChainChaincode")

type SupplyChainChaincode struct {
}

func (cc *SupplyChainChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
	logger.Debug("Init")

	_, args := stub.GetFunctionAndParameters()

	message := fmt.Sprintf("Received args: %s", []string(args))
	logger.Debug(message)

	config := Config{}
	if err := config.FillFromArguments(stub, args); err != nil {
		message := fmt.Sprintf("cannot fill a config from arguments: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	if err := UpdateOrInsertIn(stub, &config, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	return shim.Success(nil)
}

func (cc *SupplyChainChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	logger.Debug("Invoke")

	function, args := stub.GetFunctionAndParameters()
	if function == "placeOrder" {
		// Buyer places order
		return cc.placeOrder(stub, args)
	} else if function == "editOrder" {
		return cc.editOrder(stub, args)
	} else if function == "cancelOrder" {
		return cc.cancelOrder(stub, args)
	} else if function == "acceptOrder" {
		// Supplier accepts order, a new contract is stored in a Buyer-Supplier collection
		return cc.acceptOrder(stub, args)
	} else if function == "requestShipment" {
		return cc.requestShipment(stub, args)
	} else if function == "confirmShipment" {
		return cc.confirmShipment(stub, args)
	} else if function == "uploadDocument" {
		return cc.uploadDocument(stub, args)
	} else if function == "generateProof" {
		// Supplier generates a proof for an Auditor
		return cc.generateProof(stub, args)
	} else if function == "verifyProof" {
		return cc.verifyProof(stub, args)
	} else if function == "submitReport" {
		return cc.submitReport(stub, args)
	} else if function == "acceptInvoice" {
		return cc.acceptInvoice(stub, args)
	} else if function == "rejectInvoice" {
		return cc.rejectInvoice(stub, args)
	} else if function == "listOrders" {
		// List all orders
		return cc.listOrders(stub, args)
	} else if function == "listContracts" {
		// List contracts for the party from every collection
		return cc.listContracts(stub, args)
	} else if function == "listProofs" {
		return cc.listProofs(stub, args)
	} else if function == "listReports" {
		// List all acceptance details for the contract
		return cc.listReports(stub, args)
	} else if function == "listShipments" {
		return cc.listShipments(stub, args)
	} else if function == "getDocument" {
		return cc.getDocument(stub, args)
	} else if function == "getEventPayload" {
		return cc.getEventPayload(stub, args)
	}
	// (optional) add other query functions

	fnList := "{placeOrder, editOrder, cancelOrder, acceptOrder, " +
		"requestShipment, confirmShipment, uploadDocument, " +
		"generateProof, verifyProof, submitReport, " +
		"acceptInvoice, rejectInvoice, " +
		"listOrders, listContracts, listProofs, listReports, listShipments, getEventPayload, getDocument}"
	message := fmt.Sprintf("invalid invoke function name: expected one of %s, got %s", fnList, function)
	logger.Debug(message)

	return pb.Response{Status: 400, Message: message}
}

//0		1			2			3		4			5		6			7
//0		ProductName	Quantity	Price	Destination	DueDate	PaymentDate	BuyerID
func (cc *SupplyChainChaincode) placeOrder(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// args: <order fields>
	// check role == Buyer
	// validate order fields
	// compose order
	// save order into the ledger
	Notifier(stub, NoticeRuningType)

	//checking role
	allowedUnits := map[string]bool{
		Buyer: true,
	}

	orgUnit, err := GetCreatorOrganizationalUnit(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's OrganizationalUnit from the certificate: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("OrganizationalUnit: " + orgUnit)

	if !allowedUnits[orgUnit] {
		message := fmt.Sprintf("this organizational unit is not allowed to place an order")
		Logger.Error(message)
		return shim.Error(message)
	}
	//filling from arguments
	order := Order{}
	if err := order.FillFromArguments(stub, args); err != nil {
		message := fmt.Sprintf("cannot fill an order from arguments: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	//generating new order ID and making Key
	orderID := uuid.Must(uuid.NewV4()).String()
	if err := order.FillFromCompositeKeyParts([]string{orderID}); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	if ExistsIn(stub, &order, "") {
		compositeKey, _ := order.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("order with the key %s already exist", compositeKey))
	}

	//additional checking
	creator, err := GetCreatorOrganization(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's name from the certificate: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("Creator: " + creator)

	if order.Value.BuyerID != creator {
		message := fmt.Sprintf("each buyer can place order only from itself")
		Logger.Error(message)
		return shim.Error(message)
	}

	//setting automatic values
	order.Value.State = stateOrderNew
	order.Value.Timestamp = time.Now().UTC().Unix()

	//setting optional values
	destination := args[4]
	order.Value.Destination = destination

	//updating state in ledger
	if bytes, err := json.Marshal(order); err == nil {
		Logger.Debug("Order: " + string(bytes))
	}

	if err := UpdateOrInsertIn(stub, &order, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//emitting Event
	event := Event{}
	event.Value.EntityType = orderIndex
	event.Value.EntityID = order.Key.ID
	err = event.emitState(stub)
	if err != nil {
		message := fmt.Sprintf("Cannot emite event: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

//0		1			2			3		4			5		6			7
//ID	ProductName	Quantity	Price	Destination	DueDate	PaymentDate	0
func (cc *SupplyChainChaincode) editOrder(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	Notifier(stub, NoticeRuningType)

	//checking role
	allowedUnits := map[string]bool{
		Buyer: true,
	}

	orgUnit, err := GetCreatorOrganizationalUnit(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's OrganizationalUnit from the certificate: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("OrganizationalUnit: " + orgUnit)

	if !allowedUnits[orgUnit] {
		message := fmt.Sprintf("this organizational unit is not allowed to edit an order")
		Logger.Error(message)
		return shim.Error(message)
	}

	//checking order exist
	order := Order{}

	if err := order.FillFromCompositeKeyParts(args[:orderKeyFieldsNumber]); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	if err := order.FillFromArguments(stub, args); err != nil {
		message := fmt.Sprintf("cannot fill an order from arguments: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	if !ExistsIn(stub, &order, "") {
		compositeKey, _ := order.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("order with the key %s doesn't exist", compositeKey))
	}

	//loading current state from ledger
	orderToUpdate := Order{}
	orderToUpdate.Key = order.Key
	if err := LoadFrom(stub, &orderToUpdate, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//additional checking
	creator, err := GetCreatorOrganization(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's name from the certificate: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("Creator: " + creator)

	if orderToUpdate.Value.BuyerID != creator {
		message := fmt.Sprintf("each buyer can edit only his order")
		Logger.Error(message)
		return shim.Error(message)
	}

	//setting new values
	orderToUpdate.Value.ProductName = order.Value.ProductName
	orderToUpdate.Value.Quantity = order.Value.Quantity
	orderToUpdate.Value.Price = order.Value.Price
	orderToUpdate.Value.DueDate = order.Value.DueDate
	orderToUpdate.Value.PaymentDate = order.Value.PaymentDate

	//setting optional values
	destination := args[4]
	orderToUpdate.Value.Destination = destination

	//updating state in ledger
	if bytes, err := json.Marshal(orderToUpdate); err == nil {
		Logger.Debug("Order: " + string(bytes))
	}

	if err := UpdateOrInsertIn(stub, &orderToUpdate, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//emitting Event
	event := Event{}
	event.Value.EntityType = orderIndex
	event.Value.EntityID = orderToUpdate.Key.ID
	err = event.emitState(stub)
	if err != nil {
		message := fmt.Sprintf("Cannot emite event: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

//0		1	2	3	4	5	6	7
//ID	0	0	0	0	0	0	0
func (cc *SupplyChainChaincode) cancelOrder(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	Notifier(stub, NoticeRuningType)

	//checking role
	allowedUnits := map[string]bool{
		Buyer: true,
	}

	orgUnit, err := GetCreatorOrganizationalUnit(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's OrganizationalUnit from the certificate: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("OrganizationalUnit: " + orgUnit)

	if !allowedUnits[orgUnit] {
		message := fmt.Sprintf("this organizational unit is not allowed to cancel an order")
		Logger.Error(message)
		return shim.Error(message)
	}

	//checking order exist
	order := Order{}
	if err := order.FillFromCompositeKeyParts(args[:orderKeyFieldsNumber]); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	if !ExistsIn(stub, &order, "") {
		compositeKey, _ := order.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("order with the key %s doesn't exist", compositeKey))
	}

	//loading current state from ledger
	orderToUpdate := Order{}
	orderToUpdate.Key = order.Key
	if err := LoadFrom(stub, &orderToUpdate, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//additional checking
	if orderToUpdate.Value.State != stateOrderNew {
		message := fmt.Sprintf("unable cancel order with current state")
		Logger.Error(message)
		return shim.Error(message)
	}

	creator, err := GetCreatorOrganization(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's name from the certificate: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("Creator: " + creator)

	if orderToUpdate.Value.BuyerID != creator {
		message := fmt.Sprintf("each buyer can cancel only his order")
		Logger.Error(message)
		return shim.Error(message)
	}

	//setting new values
	orderToUpdate.Value.State = stateOrderCanceled

	//updating state in ledger
	if bytes, err := json.Marshal(orderToUpdate); err == nil {
		Logger.Debug("Order: " + string(bytes))
	}

	if err := UpdateOrInsertIn(stub, &orderToUpdate, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//emitting Event
	event := Event{}
	event.Value.EntityType = orderIndex
	event.Value.EntityID = orderToUpdate.Key.ID
	err = event.emitState(stub)
	if err != nil {
		message := fmt.Sprintf("Cannot emite event: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

//0		1	2	3	4	5	6	7
//ID	0	0	0	0	0	0	0
func (cc *SupplyChainChaincode) acceptOrder(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// args: order id
	// check role == Supplier
	// check order existence
	// check order status (should not be taken by another Supplier)
	// compose contract
	// update order status
	// save order to common ledger
	// save contract to Buyer-Supplier collection
	Notifier(stub, NoticeRuningType)

	//checking role
	allowedUnits := map[string]bool{
		Supplier: true,
	}

	orgUnit, err := GetCreatorOrganizationalUnit(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's OrganizationalUnit from the certificate: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("OrganizationalUnit: " + orgUnit)

	if !allowedUnits[orgUnit] {
		message := fmt.Sprintf("this organizational unit is not allowed to cancel an order")
		Logger.Error(message)
		return shim.Error(message)
	}

	//checking order exist
	order := Order{}
	if err := order.FillFromCompositeKeyParts(args[:orderKeyFieldsNumber]); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	if !ExistsIn(stub, &order, "") {
		compositeKey, _ := order.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("order with the key %s doesn't exist", compositeKey))
	}

	//loading current state from ledger
	orderToUpdate := Order{}
	orderToUpdate.Key = order.Key
	if err := LoadFrom(stub, &orderToUpdate, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//additional checking
	if orderToUpdate.Value.State != stateOrderNew {
		message := fmt.Sprintf("unable cancel order with current state")
		Logger.Error(message)
		return shim.Error(message)
	}

	creator, err := GetCreatorOrganization(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's name from the certificate: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("Creator: " + creator)

	//setting new values
	orderToUpdate.Value.State = stateOrderAccepted

	//creating contract
	contract := Contract{}
	if err := contract.FillFromCompositeKeyParts([]string{orderToUpdate.Key.ID}); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	if ExistsIn(stub, &contract, "") {
		compositeKey, _ := contract.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("contract with the key %s already exist", compositeKey))
	}

	//setting contract fields
	contract.Value.ConsignorName = creator
	contract.Value.ConsigneeName = orderToUpdate.Value.BuyerID
	contract.Value.TotalDue = orderToUpdate.Value.Price
	contract.Value.Quantity = orderToUpdate.Value.Quantity
	contract.Value.Destination = orderToUpdate.Value.Destination
	contract.Value.DueDate = orderToUpdate.Value.DueDate
	contract.Value.PaymentDate = orderToUpdate.Value.PaymentDate
	contract.Value.State = stateContractSigned
	contract.Value.Timestamp = time.Now().UTC().Unix()

	if bytes, err := json.Marshal(contract); err == nil {
		Logger.Debug("Contract: " + string(bytes))
	}

	//saving contract to ledger
	if err := UpdateOrInsertIn(stub, &contract, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//invoking another chaincode for registering invoice
	fcnName := "registerInvoice"
	chaincodeName := "trade-finance-chaincode"
	channelName := "common"
	invoiceID := contract.Key.ID
	invoiceDebtor := contract.Value.ConsigneeName
	invoiceBeneficiary := contract.Value.ConsignorName
	invoiceTotalDue := fmt.Sprintf("%f", contract.Value.TotalDue)
	invoiceDueDate := fmt.Sprintf("%d", contract.Value.DueDate)

	argsByte := [][]byte{[]byte(fcnName), []byte(invoiceID), []byte(invoiceDebtor), []byte(invoiceBeneficiary), []byte(invoiceTotalDue), []byte(invoiceDueDate), []byte("0"), []byte(creator)}

	for _, oneArg := range args {
		argsByte = append(argsByte, []byte(oneArg))
	}

	response := stub.InvokeChaincode(chaincodeName, argsByte, channelName)
	if response.Status >= 400 {
		message := fmt.Sprintf("Unable to invoke \"%s\": %s", chaincodeName, response.Message)
		return pb.Response{Status: 400, Message: message}
	}

	//updating order's state in ledger
	if bytes, err := json.Marshal(orderToUpdate); err == nil {
		Logger.Debug("Order: " + string(bytes))
	}

	if err := UpdateOrInsertIn(stub, &orderToUpdate, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//emitting Event
	event := Event{}
	event.Value.EntityType = orderIndex
	event.Value.EntityID = orderToUpdate.Key.ID
	err = event.emitState(stub)
	if err != nil {
		message := fmt.Sprintf("Cannot emite event: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

//0		1			2			3		4			5
//ID	ContractID	ShipFrom	ShipTo	Transport	Description
func (cc *SupplyChainChaincode) requestShipment(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	Notifier(stub, NoticeRuningType)

	//checking role
	allowedUnits := map[string]bool{
		Supplier: true,
	}

	orgUnit, err := GetCreatorOrganizationalUnit(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's OrganizationalUnit from the certificate: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("OrganizationalUnit: " + orgUnit)

	if !allowedUnits[orgUnit] {
		message := fmt.Sprintf("this organizational unit is not allowed to request a shipment")
		Logger.Error(message)
		return shim.Error(message)
	}

	//filling from arguments
	shipment := Shipment{}
	if err := shipment.FillFromArguments(stub, args); err != nil {
		message := fmt.Sprintf("cannot fill a shipment from arguments: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	//generating new shipment ID and making Key
	shipmentID := uuid.Must(uuid.NewV4()).String()
	if err := shipment.FillFromCompositeKeyParts([]string{shipmentID}); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	if ExistsIn(stub, &shipment, "") {
		compositeKey, _ := shipment.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("shipment with the key %s already exist", compositeKey))
	}

	//setting automatic values
	shipment.Value.State = stateShipmentRequested
	shipment.Value.Description = args[5]
	shipment.Value.Timestamp = time.Now().UTC().Unix()

	//updating state in ledger
	if bytes, err := json.Marshal(shipment); err == nil {
		Logger.Debug("Shipment: " + string(bytes))
	}

	if err := UpdateOrInsertIn(stub, &shipment, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//emitting Event
	event := Event{}
	event.Value.EntityType = shipmentIndex
	event.Value.EntityID = shipment.Key.ID
	err = event.emitState(stub)
	if err != nil {
		message := fmt.Sprintf("Cannot emite event: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

//0		1	2	3	4	5
//ID	0	0	0	0	0
func (cc *SupplyChainChaincode) confirmShipment(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	Notifier(stub, NoticeRuningType)

	//checking role
	allowedUnits := map[string]bool{
		Buyer: true,
	}

	orgUnit, err := GetCreatorOrganizationalUnit(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's OrganizationalUnit from the certificate: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("OrganizationalUnit: " + orgUnit)

	if !allowedUnits[orgUnit] {
		message := fmt.Sprintf("this organizational unit is not allowed to place a bid")
		Logger.Error(message)
		return shim.Error(message)
	}

	//checking shipment exist
	shipment := Shipment{}
	if err := shipment.FillFromCompositeKeyParts(args[:shipmentKeyFieldsNumber]); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	if !ExistsIn(stub, &shipment, "") {
		compositeKey, _ := shipment.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("shipment with the key %s doesn't exist", compositeKey))
	}

	//loading current state from ledger
	shipmentToUpdate := Shipment{}
	shipmentToUpdate.Key = shipment.Key
	if err := LoadFrom(stub, &shipmentToUpdate, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//additional checking
	if shipmentToUpdate.Value.State != stateShipmentRequested {
		message := fmt.Sprintf("unable confirm shipment with current state")
		Logger.Error(message)
		return shim.Error(message)
	}

	//setting new values
	shipmentToUpdate.Value.State = stateShipmentConfirmed

	//updating state in ledger
	if bytes, err := json.Marshal(shipmentToUpdate); err == nil {
		Logger.Debug("Shipment: " + string(bytes))
	}

	if err := UpdateOrInsertIn(stub, &shipmentToUpdate, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//emitting Event
	event := Event{}
	event.Value.EntityType = shipmentIndex
	event.Value.EntityID = shipment.Key.ID
	err = event.emitState(stub)
	if err != nil {
		message := fmt.Sprintf("Cannot emite event: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

func (cc *SupplyChainChaincode) uploadDocument(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	Notifier(stub, NoticeRuningType)

	//checking role
	allowedUnits := map[string]bool{
		Supplier: true,
		Buyer:    true,
		Auditor:  true,
	}

	orgUnit, err := GetCreatorOrganizationalUnit(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's OrganizationalUnit from the certificate: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("OrganizationalUnit: " + orgUnit)

	if !allowedUnits[orgUnit] {
		message := fmt.Sprintf("this organizational unit is not allowed to upload a document")
		Logger.Error(message)
		return shim.Error(message)
	}

	//checking document exist
	document := Document{}
	if err := document.FillFromArguments(stub, args); err != nil {
		message := fmt.Sprintf("cannot fill an document from arguments: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	//generating new document ID and making Key
	documentID := uuid.Must(uuid.NewV4()).String()
	if err := document.FillFromCompositeKeyParts([]string{documentID}); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	if ExistsIn(stub, &document, "") {
		compositeKey, _ := document.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("document with the key %s already exists", compositeKey))
	}

	//additional checking
	documentHash := args[3]
	checkingResult, err := existsDocumentByHash(stub, documentHash)
	if err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}
	if checkingResult {
		message := fmt.Sprintf("document with hash %s already exists", documentHash)
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//setting additional values
	document.Value.EntityID = args[2]
	document.Value.DocumentHash = documentHash
	document.Value.DocumentDescription = args[4]
	document.Value.Timestamp = time.Now().UTC().Unix()

	//updating state in ledger
	if bytes, err := json.Marshal(document); err == nil {
		Logger.Debug("Document: " + string(bytes))
	}

	if err := UpdateOrInsertIn(stub, &document, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	switch document.Value.EntityType {
	case TypeShipment:
		entityType := Shipment{}
		entityType.Key.ID = document.Value.EntityID
		if !ExistsIn(stub, &entityType, "") {
			compositeKey, _ := entityType.ToCompositeKey(stub)
			return shim.Error(fmt.Sprintf("shipment with the key %s doesn't exist", compositeKey))
		}
		if err := LoadFrom(stub, &entityType, ""); err != nil {
			message := fmt.Sprintf("persistence error: %s", err.Error())
			Logger.Error(message)
			return shim.Error(message)
		}
		entityType.Value.Documents = append(entityType.Value.Documents, document.Key.ID)
		if err := UpdateOrInsertIn(stub, &entityType, ""); err != nil {
			message := fmt.Sprintf("persistence error: %s", err.Error())
			Logger.Error(message)
			return pb.Response{Status: 500, Message: message}
		}
	case TypeAgencyReport:
		entityType := AgencyReport{}
		entityType.Key.ID = document.Value.EntityID
		if !ExistsIn(stub, &entityType, "") {
			compositeKey, _ := entityType.ToCompositeKey(stub)
			return shim.Error(fmt.Sprintf("agencyReport with the key %s doesn't exist", compositeKey))
		}
		if err := LoadFrom(stub, &entityType, ""); err != nil {
			message := fmt.Sprintf("persistence error: %s", err.Error())
			Logger.Error(message)
			return shim.Error(message)
		}
		entityType.Value.Documents = append(entityType.Value.Documents, document.Key.ID)
		if err := UpdateOrInsertIn(stub, &entityType, ""); err != nil {
			message := fmt.Sprintf("persistence error: %s", err.Error())
			Logger.Error(message)
			return pb.Response{Status: 500, Message: message}
		}
	default:
		break
	}

	//emitting Event
	event := Event{}
	event.Value.EntityType = documentIndex
	event.Value.EntityID = document.Key.ID
	err = event.emitState(stub)
	if err != nil {
		message := fmt.Sprintf("Cannot emite event: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

//0		1			2
//ID	SnapShot	State
func (cc *SupplyChainChaincode) generateProof(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// args: auditor name/id/etc, contract id, fields included in proof (true/false for each of the contract's fields)
	// check role == Supplier
	// check proof existence (to avoid multiple generations)
	// check contract existence
	// generate proof
	// save proof to Buyer-Supplier collection

	Notifier(stub, NoticeRuningType)

	// checking proof exist
	proof := Proof{}
	if err := proof.FillFromArguments(stub, args); err != nil {
		message := fmt.Sprintf("cannot fill a proof from arguments: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	if ExistsIn(stub, &proof, "") {
		compositeKey, _ := proof.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("proof with the key %s already exists", compositeKey))
	}

	// setting automatic values
	proof.Key.ID = uuid.Must(uuid.NewV4()).String()
	proof.Value.State = stateProofGenerated
	proof.Value.Timestamp = time.Now().UTC().Unix()

	// idemix
	rng, err := idemix.GetRand()
	AttributeNames := []string{"Attr1", "Attr2", "Attr3", "Attr4", "Attr5"}
	attrs := make([]*FP256BN.BIG, len(AttributeNames))
	for i := range AttributeNames {
		h := sha256.New()
		h.Write([]byte("hello world " + strconv.Itoa(i)))
		attrs[i] = FP256BN.FromBytes(h.Sum(nil))
	}

	// create a new key pair
	key, err := idemix.NewIssuerKey(AttributeNames, rng)
	if err != nil {
		message := fmt.Sprintf("Issuer key generation should have succeeded but gave error \"%s\"", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	// check that the key is valid
	err = key.GetIpk().Check()
	if err != nil {
		message := fmt.Sprintf("Issuer public key should be valid")
		Logger.Error(message)
		return shim.Error(message)
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
		return shim.Error(message)
	}

	// signing selective disclosure
	Nym, RandNym := idemix.MakeNym(sk, key.Ipk, rng)
	disclosure := []byte{0, 1, 1, 1, 0}
	msg := []byte{1, 2, 3, 4, 5}
	rhindex := 4
	sig, err := idemix.NewSignature(cred, sk, Nym, RandNym, key.Ipk, disclosure, msg, rhindex, cri, rng)
	if err != nil {
		message := fmt.Sprintf("Idemix NewSignature return error: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	attrs[0] = FP256BN.NewBIGint(1111)
	attrs[4] = FP256BN.NewBIGint(1111)
	attributeValuesBytes := make([][]byte, len(attrs))
	for i := 0; i < len(attrs); i++ {
		row := make([]byte, FP256BN.MODBYTES)
		attributeValue := attrs[i]
		attributeValue.ToBytes(row)
		attributeValuesBytes[i] = row
	}

	proof.Value.SnapShot = sig
	proof.Value.DataForVerification.Disclosure = disclosure
	proof.Value.DataForVerification.Ipk = key.Ipk
	proof.Value.DataForVerification.Msg = msg
	proof.Value.DataForVerification.AttributeValues = attributeValuesBytes
	proof.Value.DataForVerification.RhIndex = rhindex
	proof.Value.DataForVerification.RevPk = encode(&revocationKey.PublicKey)
	proof.Value.DataForVerification.Epoch = epoch

	// updating state in ledger
	if err := UpdateOrInsertIn(stub, &proof, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//emitting Event
	event := Event{}
	event.Value.EntityType = proofIndex
	event.Value.EntityID = proof.Key.ID
	err = event.emitState(stub)
	if err != nil {
		message := fmt.Sprintf("Cannot emite event: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

//0		1			2
//ID	SnapShot	State
func (cc *SupplyChainChaincode) verifyProof(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	Notifier(stub, NoticeRuningType)

	// checking proof exist
	proof := Proof{}
	if err := proof.FillFromCompositeKeyParts([]string{args[0]}); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	if !ExistsIn(stub, &proof, "") {
		compositeKey, _ := proof.ToCompositeKey(stub)
		message := fmt.Sprintf("proof with the key %s doesn't exist", compositeKey)
		Logger.Error(message)
		return shim.Error(message)
	}

	if err := LoadFrom(stub, &proof, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	if proof.Value.State != stateProofGenerated {
		message := fmt.Sprintf("invalid state of proof")
		Logger.Error(message)
		return shim.Error(message)
	}
	attributeValuesBytes := make([]*FP256BN.BIG, len(proof.Value.DataForVerification.AttributeValues))

	for i := range proof.Value.DataForVerification.AttributeValues {
		fmt.Println(FP256BN.FromBytes(proof.Value.DataForVerification.AttributeValues[i]))
		attributeValuesBytes[i] = FP256BN.FromBytes(proof.Value.DataForVerification.AttributeValues[i])
	}
	err := proof.Value.SnapShot.Ver(proof.Value.DataForVerification.Disclosure,
		proof.Value.DataForVerification.Ipk,
		proof.Value.DataForVerification.Msg,
		attributeValuesBytes,
		proof.Value.DataForVerification.RhIndex,
		decode(proof.Value.DataForVerification.RevPk),
		proof.Value.DataForVerification.Epoch)

	if err != nil {
		message := fmt.Sprintf("Signature verification was failed. Error: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	proof.Value.State = stateProofValidated

	// updating state in ledger
	if bytes, err := json.Marshal(proof); err == nil {
		Logger.Debug("proof: " + string(bytes))
	}

	if err := UpdateOrInsertIn(stub, &proof, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//emitting Event
	event := Event{}
	event.Value.EntityType = proofIndex
	event.Value.EntityID = proof.Key.ID
	err = event.emitState(stub)
	if err != nil {
		message := fmt.Sprintf("Cannot emite event: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

//0		1
//ID	Description
func (cc *SupplyChainChaincode) submitReport(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	Notifier(stub, NoticeRuningType)

	//checking role
	allowedUnits := map[string]bool{
		Auditor: true,
	}

	orgUnit, err := GetCreatorOrganizationalUnit(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's OrganizationalUnit from the certificate: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("OrganizationalUnit: " + orgUnit)

	if !allowedUnits[orgUnit] {
		message := fmt.Sprintf("this organizational unit is not allowed to submit a report")
		Logger.Error(message)
		return shim.Error(message)
	}

	//filling from arguments
	agencyReport := AgencyReport{}
	if err := agencyReport.FillFromArguments(stub, args); err != nil {
		message := fmt.Sprintf("cannot fill a report from arguments: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	//generating new report ID and making Key
	reportID := uuid.Must(uuid.NewV4()).String()
	if err := agencyReport.FillFromCompositeKeyParts([]string{reportID}); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	if ExistsIn(stub, &agencyReport, "") {
		compositeKey, _ := agencyReport.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("report with the key %s already exist", compositeKey))
	}

	//setting automatic values
	agencyReport.Value.State = stateAgencyReportAccepted
	agencyReport.Value.Description = args[1]
	agencyReport.Value.Timestamp = time.Now().UTC().Unix()

	//updating state in ledger
	if bytes, err := json.Marshal(agencyReport); err == nil {
		Logger.Debug("Shipment: " + string(bytes))
	}

	if err := UpdateOrInsertIn(stub, &agencyReport, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//emitting Event
	event := Event{}
	event.Value.EntityType = agencyReportIndex
	event.Value.EntityID = agencyReport.Key.ID
	err = event.emitState(stub)
	if err != nil {
		message := fmt.Sprintf("Cannot emite event: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

//0		1	2	3	4	5	6
//ID    0	0	0	0	0	0
func (cc *SupplyChainChaincode) acceptInvoice(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// args: contract id, (optional) description, docs
	// check role == Buyer
	// check contract existence
	// check contract status (to avoid logical conflict, e.g. accept contract rejected previously)
	// add docs to Shipment (with description optionally)
	// set contract status to "waiting for payment" (or some other final one)
	// generate Invoice from contract field
	// save Shipment, Contract to collection
	// save Invoice to Trade Finance chaincode ledger
	Notifier(stub, NoticeRuningType)

	//checking role
	allowedUnits := map[string]bool{
		Buyer: true,
	}

	orgUnit, err := GetCreatorOrganizationalUnit(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's OrganizationalUnit from the certificate: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("OrganizationalUnit: " + orgUnit)

	if !allowedUnits[orgUnit] {
		message := fmt.Sprintf("this organizational unit is not allowed to accept an invoice")
		Logger.Error(message)
		return shim.Error(message)
	}

	fcnName := "acceptInvoice"
	chaincodeName := "trade-finance-chaincode"
	channelName := "common"
	argsByte := [][]byte{[]byte(fcnName), []byte(args[0]), []byte(args[1]), []byte(args[2]), []byte(args[3]), []byte(args[4]), []byte(args[5]), []byte(args[6])}

	for _, oneArg := range args {
		argsByte = append(argsByte, []byte(oneArg))
	}

	response := stub.InvokeChaincode(chaincodeName, argsByte, channelName)
	if response.Status >= 400 {
		message := fmt.Sprintf("Unable to invoke \"%s\": %s", chaincodeName, response.Message)
		return pb.Response{Status: 400, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

//0		1	2	3	4	5	6
//ID    0	0	0	0	0	0
func (cc *SupplyChainChaincode) rejectInvoice(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// args: contract id, docs, (optional) description
	// check role == Buyer
	// check contract existence
	// check contract status (to avoid logical conflict, e.g. reject contract accepted previously)
	// add docs to Shipment (with description optionally)
	// set contract status to "rejected" (or some other final one)
	// save Shipment, Contract to collection
	Notifier(stub, NoticeRuningType)

	//checking role
	allowedUnits := map[string]bool{
		Buyer: true,
	}

	orgUnit, err := GetCreatorOrganizationalUnit(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's OrganizationalUnit from the certificate: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("OrganizationalUnit: " + orgUnit)

	if !allowedUnits[orgUnit] {
		message := fmt.Sprintf("this organizational unit is not allowed to reject an invoice")
		Logger.Error(message)
		return shim.Error(message)
	}

	fcnName := "rejectInvoice"
	chaincodeName := "trade-finance-chaincode"
	channelName := "common"
	argsByte := [][]byte{[]byte(fcnName), []byte(args[0]), []byte(args[1]), []byte(args[2]), []byte(args[3]), []byte(args[4]), []byte(args[5]), []byte(args[6])}

	for _, oneArg := range args {
		argsByte = append(argsByte, []byte(oneArg))
	}

	response := stub.InvokeChaincode(chaincodeName, argsByte, channelName)
	if response.Status >= 400 {
		message := fmt.Sprintf("Unable to invoke \"%s\": %s", chaincodeName, response.Message)
		return pb.Response{Status: 400, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

func (cc *SupplyChainChaincode) listOrders(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// list all of the orders in common channel
	// (optional) filter entries by status
	Notifier(stub, NoticeRuningType)
	orders := []Order{}
	ordersBytes, err := Query(stub, orderIndex, []string{}, CreateOrder, EmptyFilter, []string{})
	if err != nil {
		message := fmt.Sprintf("unable to perform method: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	if err := json.Unmarshal(ordersBytes, &orders); err != nil {
		message := fmt.Sprintf("unable to unmarshal query result: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	resultBytes, err := json.Marshal(orders)

	Logger.Debug("Result: " + string(resultBytes))

	Notifier(stub, NoticeSuccessType)
	return shim.Success(resultBytes)
}

func (cc *SupplyChainChaincode) listContracts(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// check role == Buyer or Supplier
	// list all of the contracts for the caller from all collections
	Notifier(stub, NoticeRuningType)

	//checking role
	allowedUnits := map[string]bool{
		Buyer:    true,
		Supplier: true,
	}

	orgUnit, err := GetCreatorOrganizationalUnit(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's OrganizationalUnit from the certificate: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("OrganizationalUnit: " + orgUnit)

	if !allowedUnits[orgUnit] {
		message := fmt.Sprintf("this organizational unit is not allowed to place a bid")
		Logger.Error(message)
		return shim.Error(message)
	}

	contracts := []Contract{}
	contractsBytes, err := Query(stub, contractIndex, []string{}, CreateContract, EmptyFilter, []string{})
	if err != nil {
		message := fmt.Sprintf("unable to perform method: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	if err := json.Unmarshal(contractsBytes, &contracts); err != nil {
		message := fmt.Sprintf("unable to unmarshal query result: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	resultBytes, err := json.Marshal(contracts)

	Logger.Debug("Result: " + string(resultBytes))

	Notifier(stub, NoticeSuccessType)
	return shim.Success(resultBytes)
}

func (cc *SupplyChainChaincode) listProofs(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// check role == Auditor
	// list all proofs for Auditor's name/id/etc
	//checking role
	Notifier(stub, NoticeRuningType)

	allowedUnits := map[string]bool{
		Auditor: true,
	}

	orgUnit, err := GetCreatorOrganizationalUnit(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's OrganizationalUnit from the certificate: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("OrganizationalUnit: " + orgUnit)

	if !allowedUnits[orgUnit] {
		message := fmt.Sprintf("this organizational unit is not allowed to place a bid")
		Logger.Error(message)
		return shim.Error(message)
	}

	proofs := []Proof{}
	proofsBytes, err := Query(stub, proofIndex, []string{}, CreateProof, EmptyFilter, []string{})
	if err != nil {
		message := fmt.Sprintf("unable to perform method: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	if err := json.Unmarshal(proofsBytes, &proofs); err != nil {
		message := fmt.Sprintf("unable to unmarshal query result: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	resultBytes, err := json.Marshal(proofs)

	Logger.Debug("Result: " + string(resultBytes))

	Notifier(stub, NoticeSuccessType)
	return shim.Success(resultBytes)
}

func (cc *SupplyChainChaincode) listReports(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// args: contract id
	// list all Auditors' reports related to the contract
	Notifier(stub, NoticeRuningType)

	agencyReports := []AgencyReport{}
	agencyReportsBytes, err := Query(stub, agencyReportIndex, []string{}, CreateAgencyReport, EmptyFilter, []string{})
	if err != nil {
		message := fmt.Sprintf("unable to perform method: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	if err := json.Unmarshal(agencyReportsBytes, &agencyReports); err != nil {
		message := fmt.Sprintf("unable to unmarshal query result: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	resultBytes, err := json.Marshal(agencyReports)

	Logger.Debug("Result: " + string(resultBytes))

	Notifier(stub, NoticeSuccessType)
	return shim.Success(resultBytes)
}

func (cc *SupplyChainChaincode) listShipments(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	Notifier(stub, NoticeRuningType)

	shipments := []Shipment{}
	shipmentsBytes, err := Query(stub, shipmentIndex, []string{}, CreateShipment, EmptyFilter, []string{})
	if err != nil {
		message := fmt.Sprintf("unable to perform method: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	if err := json.Unmarshal(shipmentsBytes, &shipments); err != nil {
		message := fmt.Sprintf("unable to unmarshal query result: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	resultBytes, err := json.Marshal(shipments)

	Logger.Debug("Result: " + string(resultBytes))

	Notifier(stub, NoticeSuccessType)
	return shim.Success(resultBytes)
}

func (cc *SupplyChainChaincode) getEventPayload(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	Notifier(stub, NoticeRuningType)

	event := Event{}
	if err := event.FillFromCompositeKeyParts(args[:eventKeyFieldsNumber]); err != nil {
		message := fmt.Sprintf(err.Error())
		return pb.Response{Status: 404, Message: message}
	}

	if !ExistsIn(stub, &event, "") {
		compositeKey, _ := event.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("event with the key %s doesn't exist", compositeKey))
	}

	if err := LoadFrom(stub, &event, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	result, err := json.Marshal(event)
	if err != nil {
		return shim.Error(err.Error())
	}

	Logger.Debug("Result: " + string(result))

	Notifier(stub, NoticeSuccessType)
	return shim.Success(result)
}

func (cc *SupplyChainChaincode) getDocument(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	Notifier(stub, NoticeRuningType)

	document := Document{}
	if err := document.FillFromCompositeKeyParts(args[:documentKeyFieldsNumber]); err != nil {
		message := fmt.Sprintf(err.Error())
		return pb.Response{Status: 404, Message: message}
	}

	if !ExistsIn(stub, &document, "") {
		compositeKey, _ := document.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("document with the key %s doesn't exist", compositeKey))
	}

	if err := LoadFrom(stub, &document, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	result, err := json.Marshal(document)
	if err != nil {
		return shim.Error(err.Error())
	}

	Logger.Debug("Result: " + string(result))

	Notifier(stub, NoticeSuccessType)
	return shim.Success(result)
}

func existsDocumentByHash(stub shim.ChaincodeStubInterface, documentHash string) (bool, error) {

	filterByDocumentHash := func(data LedgerData) bool {
		entity, ok := data.(*Document)
		if ok && entity.Value.DocumentHash == documentHash {
			return true
		}

		return false
	}

	documents := []Document{}
	documentsBytes, err := Query(stub, documentIndex, []string{}, CreateDocument, filterByDocumentHash, []string{})
	if err != nil {
		message := fmt.Sprintf("unable to perform method: %s", err.Error())
		Logger.Error(message)
		return false, errors.New(message)
	}

	if err := json.Unmarshal(documentsBytes, &documents); err != nil {
		message := fmt.Sprintf("unable to unmarshal documents query result: %s", err.Error())
		Logger.Error(message)
		return false, errors.New(message)
	}

	if len(documents) != 0 {
		return true, nil
	}

	return false, nil
}

func (event *Event) emitState(stub shim.ChaincodeStubInterface) error {
	eventAction, _ := stub.GetFunctionAndParameters()
	eventID := uuid.Must(uuid.NewV4()).String()

	if err := event.FillFromCompositeKeyParts([]string{eventID}); err != nil {
		message := fmt.Sprintf(err.Error())
		return errors.New(message)
	}

	creator, err := GetCreatorOrganization(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's name from the certificate: %s", err.Error())
		Logger.Error(message)
		return errors.New(message)
	}

	config := Config{}
	if err := LoadFrom(stub, &config, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())

		return errors.New(message)
	}

	event.Value.Creator = creator
	event.Value.Timestamp = time.Now().UTC().Unix()

	bytes, err := json.Marshal(event)
	if err != nil {
		message := fmt.Sprintf("Error marshaling: %s", err.Error())
		return errors.New(message)
	}
	eventName := eventIndex + "." + config.Value.ChaincodeName + "." + eventAction + "." + eventID
	if err = stub.SetEvent(eventName, bytes); err != nil {
		message := fmt.Sprintf("Error setting event: %s", err.Error())
		return errors.New(message)
	}
	Logger.Debug(fmt.Sprintf("EventName: %s", eventName))

	if err := UpdateOrInsertIn(stub, event, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return errors.New(message)
	}

	Logger.Debug("PutState")
	if err = stub.PutState(eventIndex+"."+eventAction+"."+eventID, bytes); err != nil {
		return err
	}

	Logger.Info(fmt.Sprintf("Event set: %s without errors", string(bytes)))
	Logger.Debug(fmt.Sprintf("Success: Event set: %s", string(bytes)))

	return nil
}

func encode(publicKey *ecdsa.PublicKey) string {
	x509EncodedPub, _ := x509.MarshalPKIXPublicKey(publicKey)
	pemEncodedPub := pem.EncodeToMemory(&pem.Block{Type: "PUBLIC KEY", Bytes: x509EncodedPub})

	return string(pemEncodedPub)
}

func decode(pemEncodedPub string) *ecdsa.PublicKey {
	blockPub, _ := pem.Decode([]byte(pemEncodedPub))
	x509EncodedPub := blockPub.Bytes
	genericPublicKey, _ := x509.ParsePKIXPublicKey(x509EncodedPub)
	publicKey := genericPublicKey.(*ecdsa.PublicKey)

	return publicKey
}

func main() {
	err := shim.Start(new(SupplyChainChaincode))
	if err != nil {
		logger.Error(err.Error())
	}
}
