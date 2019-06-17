package main

import (
	"crypto/ecdsa"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"github.com/hyperledger/fabric-amcl/amcl/FP256BN"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/core/chaincode/shim/ext/statebased"
	pb "github.com/hyperledger/fabric/protos/peer"
	"strconv"
)

type SupplyChainChaincode struct {
}

func (cc *SupplyChainChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
	Logger.Debug("Init")

	_, args := stub.GetFunctionAndParameters()

	message := fmt.Sprintf("Received args: %s", []string(args))
	Logger.Debug(message)

	config := Config{}
	if err := config.FillFromArguments(stub, args); err != nil {
		message := fmt.Sprintf("cannot fill a config from arguments: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	compositeKey, err := config.ToCompositeKey(stub)
	if err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	value, err := config.ToLedgerValue()
	if err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Logger.Debug("PutState")
	if err = stub.PutState(compositeKey, value); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	return shim.Success(nil)
}

func (cc *SupplyChainChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	Logger.Debug("Invoke")

	function, args := stub.GetFunctionAndParameters()
	if function == "placeOrder" {
		// Buyer places order
		return cc.placeOrder(stub, args)
	} else if function == "updateOrder" {
		return cc.updateOrder(stub, args)
	} else if function == "cancelOrder" {
		return cc.cancelOrder(stub, args)
	} else if function == "acceptOrder" {
		// Supplier accepts order, a new contract is stored in a Buyer-Supplier collection
		return cc.acceptOrder(stub, args)
	} else if function == "requestShipment" {
		return cc.requestShipment(stub, args)
	} else if function == "confirmShipment" {
		return cc.confirmShipment(stub, args)
	} else if function == "confirmDelivery" {
		return cc.confirmDelivery(stub, args)
	} else if function == "uploadDocument" {
		return cc.uploadDocument(stub, args)
	} else if function == "generateProof" {
		// Supplier generates a proof for an Auditor
		return cc.generateProof(stub, args)
	} else if function == "verifyProof" {
		return cc.verifyProof(stub, args)
	} else if function == "updateProof" {
		return cc.updateProof(stub, args)
	} else if function == "listOrders" {
		// List all orders
		return cc.listOrders(stub, args)
	} else if function == "listContracts" {
		// List contracts for the party from every collection
		return cc.listContracts(stub, args)
	} else if function == "listProofs" {
		return cc.listProofs(stub, args)
	} else if function == "listProofsByOwner" {
		return cc.listProofsByOwner(stub, args)
	} else if function == "listProofsByShipment" {
		return cc.listProofsByShipment(stub, args)
	} else if function == "listReports" {
		return cc.listReports(stub, args)
	} else if function == "listReportsByShipment" {
		return cc.listReportsByShipment(stub, args)
	} else if function == "listShipments" {
		return cc.listShipments(stub, args)
	} else if function == "getDocument" {
		return cc.getDocument(stub, args)
	} else if function == "getEventPayload" {
		return cc.getEventPayload(stub, args)
	}
	// (optional) add other query functions

	fnList := "{placeOrder, updateOrder, cancelOrder, acceptOrder, " +
		"requestShipment, confirmShipment, uploadDocument, " +
		"generateProof, verifyProof, submitReport, " +
		"acceptInvoice, rejectInvoice, listProofsByOwner, updateProof, " +
		"listOrders, listContracts, listProofs, listReports, listShipments, getEventPayload, getDocument}"
	message := fmt.Sprintf("invalid invoke function name: expected one of %s, got %s", fnList, function)
	Logger.Debug(message)

	return pb.Response{Status: 400, Message: message}
}

//0				1			2			3		4			5		6
//OrderID		ProductName	Quantity	Price	Destination	DueDate	PaymentDate
func (cc *SupplyChainChaincode) placeOrder(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// args: <order fields>
	// check role == Buyer
	// validate order fields
	// compose order
	// save order into the ledger
	Notifier(stub, NoticeRuningType)

	//checking role
	if err, result := checkAccessForUnit([][]string{Buyer}, stub); err != nil || !result {
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

	if ExistsIn(stub, &order, orderIndex) {
		compositeKey, _ := order.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("order with the key %s already exist", compositeKey))
	}

	//setting automatic values
	creator, err := GetCreatorOrganizationalUnit(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's OrganizationalUnit from the certificate: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("OrganizationalUnit: " + creator)

	order.Value.State = stateOrderNew
	order.Value.UpdatedDate = order.Value.Timestamp
	order.Value.BuyerID = creator

	//setting optional values
	destination := args[4]
	order.Value.Destination = destination

	//updating state in ledger
	if bytes, err := json.Marshal(order); err == nil {
		Logger.Debug("Order: " + string(bytes))
	}

	if err := UpdateOrInsertIn(stub, &order, orderIndex, []string{""}, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//emitting Event
	events := Events{}

	eventValue := EventValue{}
	eventValue.EntityType = orderIndex
	eventValue.EntityID = order.Key.ID
	eventValue.Other = order.Value
	eventValue.Action = eventPlaceOrder

	events.Values = append(events.Values, eventValue)

	if err := events.EmitEvent(stub, order.Key.ID); err != nil {
		message := fmt.Sprintf("Cannot emite event: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

//0		1			2			3		4			5		6
//ID	ProductName	Quantity	Price	Destination	DueDate	PaymentDate
func (cc *SupplyChainChaincode) updateOrder(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	Notifier(stub, NoticeRuningType)

	//checking role
	if err, result := checkAccessForUnit([][]string{Buyer}, stub); err != nil || !result {
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

	if !ExistsIn(stub, &order, orderIndex) {
		compositeKey, _ := order.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("order with the key %s doesn't exist", compositeKey))
	}

	//loading current state from ledger
	orderToUpdate := Order{}
	orderToUpdate.Key = order.Key
	if err := LoadFrom(stub, &orderToUpdate, orderIndex); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//additional checking
	creator, err := GetCreatorOrganizationalUnit(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's OrganizationalUnit from the certificate: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("OrganizationalUnit: " + creator)

	if orderToUpdate.Value.BuyerID != creator {
		message := fmt.Sprintf("each buyer can edit only his order")
		Logger.Error(message)
		return shim.Error(message)
	}
	//getting transaction Timestamp
	timestamp, err := stub.GetTxTimestamp()
	if err != nil {
		message := fmt.Sprintf("unable to get transaction timestamp: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	//setting new values
	orderToUpdate.Value.ProductName = order.Value.ProductName
	orderToUpdate.Value.Quantity = order.Value.Quantity
	orderToUpdate.Value.Price = order.Value.Price
	orderToUpdate.Value.DueDate = order.Value.DueDate
	orderToUpdate.Value.PaymentDate = order.Value.PaymentDate
	orderToUpdate.Value.UpdatedDate = timestamp.Seconds

	//setting optional values
	destination := args[4]
	orderToUpdate.Value.Destination = destination

	//updating state in ledger
	if bytes, err := json.Marshal(orderToUpdate); err == nil {
		Logger.Debug("Order: " + string(bytes))
	}

	if err := UpdateOrInsertIn(stub, &orderToUpdate, orderIndex, []string{""}, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//emitting Event
	events := Events{}

	eventValue := EventValue{}
	eventValue.EntityType = orderIndex
	eventValue.EntityID = orderToUpdate.Key.ID
	eventValue.Other = orderToUpdate.Value
	eventValue.Action = eventUpdateOrder

	events.Values = append(events.Values, eventValue)

	if err := events.EmitEvent(stub, orderToUpdate.Key.ID); err != nil {
		message := fmt.Sprintf("Cannot emite event: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

//0		1	2	3	4	5	6
//ID	0	0	0	0	0	0
func (cc *SupplyChainChaincode) cancelOrder(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	Notifier(stub, NoticeRuningType)

	//checking role
	if err, result := checkAccessForUnit([][]string{Buyer}, stub); err != nil || !result {
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

	if !ExistsIn(stub, &order, orderIndex) {
		compositeKey, _ := order.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("order with the key %s doesn't exist", compositeKey))
	}

	//loading current state from ledger
	orderToUpdate := Order{}
	orderToUpdate.Key = order.Key
	if err := LoadFrom(stub, &orderToUpdate, orderIndex); err != nil {
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

	creator, err := GetCreatorOrganizationalUnit(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's OrganizationalUnit from the certificate: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("OrganizationalUnit: " + creator)

	if orderToUpdate.Value.BuyerID != creator {
		message := fmt.Sprintf("each buyer can cancel only his order")
		Logger.Error(message)
		return shim.Error(message)
	}
	//getting transaction Timestamp
	timestamp, err := stub.GetTxTimestamp()
	if err != nil {
		message := fmt.Sprintf("unable to get transaction timestamp: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	//setting new values
	orderToUpdate.Value.State = stateOrderCanceled
	orderToUpdate.Value.UpdatedDate = timestamp.Seconds

	//updating state in ledger
	if bytes, err := json.Marshal(orderToUpdate); err == nil {
		Logger.Debug("Order: " + string(bytes))
	}

	if err := UpdateOrInsertIn(stub, &orderToUpdate, orderIndex, []string{""}, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//emitting Event
	events := Events{}

	eventValue := EventValue{}
	eventValue.EntityType = orderIndex
	eventValue.EntityID = orderToUpdate.Key.ID
	eventValue.Other = orderToUpdate.Value
	eventValue.Action = eventCancelOrder

	events.Values = append(events.Values, eventValue)

	if err := events.EmitEvent(stub, orderToUpdate.Key.ID); err != nil {
		message := fmt.Sprintf("Cannot emite event: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

//0		1	2	3	4	5	6
//ID	0	0	0	0	0	0
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
	if err, result := checkAccessForUnit([][]string{Supplier}, stub); err != nil || !result {
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

	if !ExistsIn(stub, &order, orderIndex) {
		compositeKey, _ := order.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("order with the key %s doesn't exist", compositeKey))
	}

	//loading current state from ledger
	orderToUpdate := Order{}
	orderToUpdate.Key = order.Key
	if err := LoadFrom(stub, &orderToUpdate, orderIndex); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//additional checking
	if orderToUpdate.Value.State != stateOrderNew {
		message := fmt.Sprintf("unable accept order with current state")
		Logger.Error(message)
		return shim.Error(message)
	}

	creator, err := GetCreatorOrganizationalUnit(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's OrganizationalUnit from the certificate: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("OrganizationalUnit: " + creator)

	//getting transaction Timestamp
	timestamp, err := stub.GetTxTimestamp()
	if err != nil {
		message := fmt.Sprintf("unable to get transaction timestamp: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	//setting new values
	orderToUpdate.Value.State = stateOrderAccepted
	orderToUpdate.Value.UpdatedDate = timestamp.Seconds

	//creating contract
	contract := Contract{}
	if err := contract.FillFromCompositeKeyParts([]string{orderToUpdate.Key.ID}); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	if ExistsIn(stub, &contract, contractIndex) {
		compositeKey, _ := contract.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("contract with the key %s already exist", compositeKey))
	}

	//setting contract fields
	contract.Value.ProductName = orderToUpdate.Value.ProductName
	contract.Value.ConsignorName = creator
	contract.Value.ConsigneeName = orderToUpdate.Value.BuyerID
	contract.Value.TotalDue = orderToUpdate.Value.Amount
	contract.Value.Price = orderToUpdate.Value.Price
	contract.Value.Quantity = orderToUpdate.Value.Quantity
	contract.Value.Destination = orderToUpdate.Value.Destination
	contract.Value.DueDate = orderToUpdate.Value.DueDate
	contract.Value.PaymentDate = orderToUpdate.Value.PaymentDate
	contract.Value.State = stateContractSigned
	contract.Value.Timestamp = timestamp.Seconds
	contract.Value.UpdatedDate = contract.Value.Timestamp

	if bytes, err := json.Marshal(contract); err == nil {
		Logger.Debug("Contract: " + string(bytes))
	}

	//saving contract to ledger
	if err := UpdateOrInsertIn(stub, &contract, contractIndex, []string{""}, ""); err != nil {
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
	invoicePaymentDate := fmt.Sprintf("%d", contract.Value.PaymentDate)

	argsByte := [][]byte{[]byte(fcnName), []byte(invoiceID), []byte(invoiceDebtor), []byte(invoiceBeneficiary), []byte(invoiceTotalDue), []byte(invoicePaymentDate), []byte("0")}

	response := stub.InvokeChaincode(chaincodeName, argsByte, channelName)
	if response.Status >= 400 {
		message := fmt.Sprintf("Unable to invoke \"%s\": %s", chaincodeName, response.Message)
		return pb.Response{Status: 400, Message: message}
	}

	//updating order's state in ledger
	if bytes, err := json.Marshal(orderToUpdate); err == nil {
		Logger.Debug("Order: " + string(bytes))
	}

	if err := UpdateOrInsertIn(stub, &orderToUpdate, orderIndex, []string{""}, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//emitting Event
	events := Events{}

	//event = acceptOrder
	eventValue := EventValue{}
	eventValue.EntityType = orderIndex
	eventValue.EntityID = orderToUpdate.Key.ID
	eventValue.Other = orderToUpdate.Value
	eventValue.Action = eventAcceptOrder
	events.Values = append(events.Values, eventValue)

	if err := events.EmitEvent(stub, orderToUpdate.Key.ID); err != nil {
		message := fmt.Sprintf("Cannot emite event: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

//0				1			2			3		4			5			6				7				8
//ShipmentID	ContractID	ShipFrom	ShipTo	Transport	Description	DocumentHash	DocumentType	DocumentMeta
func (cc *SupplyChainChaincode) requestShipment(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	Notifier(stub, NoticeRuningType)

	//checking role
	if err, result := checkAccessForUnit([][]string{Supplier}, stub); err != nil || !result {
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

	if ExistsIn(stub, &shipment, shipmentIndex) {
		compositeKey, _ := shipment.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("shipment with the key %s already exist", compositeKey))
	}

	// getting contract for checking permissions
	contract := Contract{}
	if err := contract.FillFromCompositeKeyParts([]string{shipment.Value.ContractID}); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	if !ExistsIn(stub, &contract, contractIndex) {
		compositeKey, _ := contract.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("contract with the key %s doesnt exist", compositeKey))
	}

	if err := LoadFrom(stub, &contract, contractIndex); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	creator, err := GetCreatorOrganizationalUnit(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's OrganizationalUnit from the certificate: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("OrganizationalUnit: " + creator)

	if contract.Value.ConsignorName != creator {
		message := fmt.Sprintf("each supplier can request shipment only for their contract")
		Logger.Error(message)
		return shim.Error(message)
	}

	//setting automatic values
	shipment.Value.State = stateShipmentRequested
	shipment.Value.Description = args[5]
	shipment.Value.Consignor = contract.Value.ConsignorName
	shipment.Value.DeliveryDate = contract.Value.DueDate
	shipment.Value.UpdatedDate = shipment.Value.Timestamp

	//updating state in ledger
	if bytes, err := json.Marshal(shipment); err == nil {
		Logger.Debug("Shipment: " + string(bytes))
	}

	if err := UpdateOrInsertIn(stub, &shipment, shipmentIndex, []string{""}, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//updating contract state
	contract.Value.State = stateContractProcessed
	contract.Value.UpdatedDate = shipment.Value.Timestamp

	if bytes, err := json.Marshal(contract); err == nil {
		Logger.Debug("Contract: " + string(bytes))
	}

	//saving contract to ledger
	if err := UpdateOrInsertIn(stub, &contract, contractIndex, []string{""}, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	// uploading document
	document := Document{}
	documentHash := args[6]
	documentType := args[7]
	documentMeta := args[8]
	if documentHash != "" && documentType != "" {
		documentID, err := GenUUIDfromExist(stub, documentIndex, shipment.Key.ID, CreateDocument)
		if err != nil {
			message := fmt.Sprintf("cannot generate new uuid from existing: %s", err.Error())
			Logger.Error(message)
			return pb.Response{Status: 500, Message: message}
		}
		documentFields := []string{documentID, strconv.Itoa(TypeShipment), shipment.Key.ID, documentHash, documentMeta, documentType, shipment.Value.ContractID}
		err, document = processingUploadDocument(stub, documentFields, contract)
		if err != nil {
			message := fmt.Sprintf("Error during processing upload document: %s", err.Error())
			Logger.Error(message)
			return shim.Error(message)
		}
	}

	if bytes, err := json.Marshal(document); err == nil {
		Logger.Debug("Document: " + string(bytes))
	}

	//emitting Event
	events := Events{}

	//event1 = requestShipment
	eventValue := EventValue{}
	eventValue.EntityType = shipmentIndex
	eventValue.EntityID = shipment.Key.ID
	eventValue.Other = shipment.Value
	eventValue.Action = eventRequestShipment
	events.Values = append(events.Values, eventValue)

	if documentHash != "" && documentType != "" {
		//event2 = uploadDocument
		eventValue.EntityType = documentIndex
		eventValue.EntityID = document.Key.ID
		eventValue.Other = document.Value
		eventValue.Action = eventUploadDocument
		events.Values = append(events.Values, eventValue)
	}

	if err := events.EmitEvent(stub, shipment.Key.ID); err != nil {
		message := fmt.Sprintf("Cannot emite event: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

//0		1	2	3	4	5 			6				7				8
//ID	0	0	0	0	Description DocumentHash	DocumentType	DocumentMeta
func (cc *SupplyChainChaincode) confirmShipment(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	Notifier(stub, NoticeRuningType)

	//checking role
	if err, result := checkAccessForUnit([][]string{TransportAgency}, stub); err != nil || !result {
		message := fmt.Sprintf("this organizational unit is not allowed to place a bid")
		Logger.Error(message)
		return shim.Error(message)
	}

	shipmentID := args[0]

	Logger.Debug(fmt.Sprintf("ShipmentID: %s", shipmentID))

	//checking shipment exist
	shipment := Shipment{}
	if err := shipment.FillFromCompositeKeyParts([]string{shipmentID}); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	if !ExistsIn(stub, &shipment, shipmentIndex) {
		compositeKey, _ := shipment.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("shipment with the key %s doesn't exist", compositeKey))
	}

	//loading current state from ledger
	shipmentToUpdate := Shipment{}
	shipmentToUpdate.Key = shipment.Key
	if err := LoadFrom(stub, &shipmentToUpdate, shipmentIndex); err != nil {
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

	//getting transaction Timestamp
	timestamp, err := stub.GetTxTimestamp()
	if err != nil {
		message := fmt.Sprintf("unable to get transaction timestamp: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	//setting new values
	shipmentToUpdate.Value.State = stateShipmentConfirmed
	shipmentToUpdate.Value.UpdatedDate = timestamp.Seconds

	if shippmentDesription := args[5]; shippmentDesription != "" {
		shipmentToUpdate.Value.Description = shipmentToUpdate.Value.Description + " " + shippmentDesription
	}

	//updating state in ledger
	if bytes, err := json.Marshal(shipmentToUpdate); err == nil {
		Logger.Debug("Shipment: " + string(bytes))
	}

	if err := UpdateOrInsertIn(stub, &shipmentToUpdate, shipmentIndex, []string{""}, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	// uploading document
	document := Document{}
	documentHash := args[6]
	documentType := args[7]
	documentMeta := args[8]
	if documentHash != "" && documentType != "" {
		documentID, err := GenUUIDfromExist(stub, documentIndex, shipmentToUpdate.Key.ID, CreateDocument)
		if err != nil {
			message := fmt.Sprintf("cannot generate new uuid from existing: %s", err.Error())
			Logger.Error(message)
			return pb.Response{Status: 500, Message: message}
		}
		documentFields := []string{documentID, strconv.Itoa(TypeShipment), shipmentToUpdate.Key.ID, documentHash, documentMeta, documentType, shipmentToUpdate.Value.ContractID}
		err, document = processingUploadDocument(stub, documentFields, Contract{})
		if err != nil {
			message := fmt.Sprintf("Error during processing upload document: %s", err.Error())
			Logger.Error(message)
			return shim.Error(message)
		}
	}

	//emitting Event
	events := Events{}

	//event1 = confirmShipment
	eventValue := EventValue{}
	eventValue.EntityType = shipmentIndex
	eventValue.EntityID = shipmentToUpdate.Key.ID
	eventValue.Other = shipmentToUpdate.Value
	eventValue.Action = eventConfirmShipment
	events.Values = append(events.Values, eventValue)

	if documentHash != "" && documentType != "" {
		//event2 = uploadDocument
		eventValue.EntityType = documentIndex
		eventValue.EntityID = document.Key.ID
		eventValue.Other = document.Value
		eventValue.Action = eventUploadDocument
		events.Values = append(events.Values, eventValue)
	}

	if err := events.EmitEvent(stub, shipmentToUpdate.Key.ID); err != nil {
		message := fmt.Sprintf("Cannot emite event: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

//0		1	2	3	4	5			6				7				8
//ID	0	0	0	0	Description	DocumentHash	DocumentType	DocumentMeta
func (cc *SupplyChainChaincode) confirmDelivery(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	Notifier(stub, NoticeRuningType)

	//checking role
	if err, result := checkAccessForUnit([][]string{Buyer}, stub); err != nil || !result {
		message := fmt.Sprintf("this organizational unit is not allowed to place a bid")
		Logger.Error(message)
		return shim.Error(message)
	}

	shipmentID := args[0]

	Logger.Debug(fmt.Sprintf("ShipmentID: %s", shipmentID))

	//checking shipment exist
	shipment := Shipment{}
	if err := shipment.FillFromCompositeKeyParts([]string{shipmentID}); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	if !ExistsIn(stub, &shipment, shipmentIndex) {
		compositeKey, _ := shipment.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("shipment with the key %s doesn't exist", compositeKey))
	}

	//loading current state from ledger
	shipmentToUpdate := Shipment{}
	shipmentToUpdate.Key = shipment.Key
	if err := LoadFrom(stub, &shipmentToUpdate, shipmentIndex); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	// getting contract for checking permissions
	contract := Contract{}
	if err := contract.FillFromCompositeKeyParts([]string{shipmentToUpdate.Value.ContractID}); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	if !ExistsIn(stub, &contract, contractIndex) {
		compositeKey, _ := contract.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("contract with the key %s doesnt exist", compositeKey))
	}

	if err := LoadFrom(stub, &contract, contractIndex); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	creator, err := GetCreatorOrganizationalUnit(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's OrganizationalUnit from the certificate: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("OrganizationalUnit: " + creator)

	if contract.Value.ConsigneeName != creator {
		message := fmt.Sprintf("each buyer can confirm delivery only for their contract")
		Logger.Error(message)
		return shim.Error(message)
	}

	//additional checking
	if shipmentToUpdate.Value.State != stateShipmentConfirmed {
		message := fmt.Sprintf("unable confirm delivery with current state of shipment")
		Logger.Error(message)
		return shim.Error(message)
	}
	//checking proofs on valid
	proofs, err := findProofsByShipment(stub, shipmentToUpdate.Key.ID)
	if err != nil {
		message := fmt.Sprintf("cannot find proofs by shipment: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	if proofs == nil {
		message := fmt.Sprintf("cannot confirm delivery. Shipment doesn't have proofs.")
		Logger.Error(message)
		return shim.Error(message)
	}

	for _, proof := range proofs {
		if proof.Value.State != stateProofValidated {
			message := fmt.Sprintf("cannot confirm delivery with current state: %s of proof: %s", strconv.Itoa(proof.Value.State), proof.Key.ID)
			Logger.Error(message)
			return shim.Error(message)
		}
	}

	//getting transaction Timestamp
	timestamp, err := stub.GetTxTimestamp()
	if err != nil {
		message := fmt.Sprintf("unable to get transaction timestamp: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	//setting new values
	shipmentToUpdate.Value.State = stateShipmentDelivered
	shipmentToUpdate.Value.UpdatedDate = timestamp.Seconds

	if shippmentDesription := args[5]; shippmentDesription != "" {
		shipmentToUpdate.Value.Description = shipmentToUpdate.Value.Description + " " + shippmentDesription
	}

	//updating state in ledger
	if bytes, err := json.Marshal(shipmentToUpdate); err == nil {
		Logger.Debug("Shipment: " + string(bytes))
	}

	if err := UpdateOrInsertIn(stub, &shipmentToUpdate, shipmentIndex, []string{""}, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//updating contract state
	contract.Value.State = stateContractCompleted
	contract.Value.UpdatedDate = timestamp.Seconds

	if bytes, err := json.Marshal(contract); err == nil {
		Logger.Debug("Contract: " + string(bytes))
	}

	//saving contract to ledger
	if err := UpdateOrInsertIn(stub, &contract, contractIndex, []string{creator, shipmentToUpdate.Value.Consignor}, statebased.RoleTypePeer); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	// uploading document
	documentHash := args[6]
	documentType := args[7]
	documentMeta := args[8]
	document := Document{}
	if documentHash != "" && documentType != "" {
		documentID, err := GenUUIDfromExist(stub, documentIndex, shipmentToUpdate.Key.ID, CreateDocument)
		if err != nil {
			message := fmt.Sprintf("cannot generate new uuid from existing: %s", err.Error())
			Logger.Error(message)
			return pb.Response{Status: 500, Message: message}
		}
		documentFields := []string{documentID, strconv.Itoa(TypeShipment), shipmentToUpdate.Key.ID, documentHash, documentMeta, documentType, shipmentToUpdate.Value.ContractID}
		err, document = processingUploadDocument(stub, documentFields, contract)
		if err != nil {
			message := fmt.Sprintf("Error during processing upload document: %s", err.Error())
			Logger.Error(message)
			return shim.Error(message)
		}
	}

	// invoking trade-finance chaincode for updating invoice state
	fcnName := "acceptInvoice"
	chaincodeName := "trade-finance-chaincode"
	channelName := "common"
	invoiceID := shipmentToUpdate.Value.ContractID

	argsByte := [][]byte{[]byte(fcnName), []byte(invoiceID), []byte("0"), []byte("0"), []byte("0"), []byte("0"), []byte("0"), []byte("0")}

	for _, oneArg := range args {
		argsByte = append(argsByte, []byte(oneArg))
	}

	response := stub.InvokeChaincode(chaincodeName, argsByte, channelName)
	if response.Status >= 400 {
		message := fmt.Sprintf("Unable to invoke \"%s\": %s", chaincodeName, response.Message)
		return pb.Response{Status: 400, Message: message}
	}

	//emitting Event
	events := Events{}

	//event1 = confirmDelivery
	eventValue := EventValue{}
	eventValue.EntityType = shipmentIndex
	eventValue.EntityID = shipmentToUpdate.Key.ID
	eventValue.Other = shipmentToUpdate.Value
	eventValue.Action = eventConfirmDelivery
	events.Values = append(events.Values, eventValue)

	//event2 = contractCompleted
	eventValue.EntityType = contractIndex
	eventValue.EntityID = contract.Key.ID
	eventValue.Other = contract.Value
	eventValue.Action = eventCotractCompleted
	events.Values = append(events.Values, eventValue)

	if documentHash != "" && documentType != "" {
		//event3 = uploadDocument
		eventValue.EntityType = documentIndex
		eventValue.EntityID = document.Key.ID
		eventValue.Other = document.Value
		eventValue.Action = eventUploadDocument
		events.Values = append(events.Values, eventValue)
	}

	if err := events.EmitEvent(stub, shipmentToUpdate.Key.ID); err != nil {
		message := fmt.Sprintf("Cannot emite event: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

//0					1			2			3				4				5				6
//DocumentID		EntityType	EntityID	DocumentHash 	DocumentMeta	DocumentType	ContractID
func (cc *SupplyChainChaincode) uploadDocument(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	Notifier(stub, NoticeRuningType)

	//checking role
	if err, result := checkAccessForUnit([][]string{Supplier, Buyer, Auditor}, stub); err != nil || !result {
		message := fmt.Sprintf("this organizational unit is not allowed to upload a document")
		Logger.Error(message)
		return shim.Error(message)
	}

	err, document := processingUploadDocument(stub, args, Contract{})
	if err != nil {
		message := fmt.Sprintf("Error during processing upload document: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	//emitting Event
	events := Events{}

	//event = uploadDocument
	eventValue := EventValue{}
	eventValue.EntityType = documentIndex
	eventValue.EntityID = document.Key.ID
	eventValue.Other = document.Value
	eventValue.Action = eventUploadDocument
	events.Values = append(events.Values, eventValue)

	if err := events.EmitEvent(stub, document.Key.ID); err != nil {
		message := fmt.Sprintf("Cannot emite event: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

//0					1			2			3				4				5				6
//DocumentID		EntityType	EntityID	DocumentHash 	DocumentMeta	DocumentType	ContractID
func processingUploadDocument(stub shim.ChaincodeStubInterface, args []string, contract Contract) (error, Document) {

	//checking document exist
	document := Document{}
	if err := document.FillFromArguments(stub, args); err != nil {
		message := fmt.Sprintf("cannot fill an document from arguments: %s", err.Error())
		Logger.Error(message)
		return errors.New(message), Document{}
	}

	if ExistsIn(stub, &document, documentIndex) {
		compositeKey, _ := document.ToCompositeKey(stub)
		message := fmt.Sprintf("document with the key %s already exists", compositeKey)
		Logger.Error(message)
		return errors.New(message), Document{}
	}

	//TODO: uncomment after testing
	//additional checking
	//findedDocuments, err := findDocumentByHash(stub, document.Value.DocumentHash)
	//if err != nil {
	//	message := fmt.Sprintf("persistence error: %s", err.Error())
	//	Logger.Error(message)
	//	return errors.New(message), Document{}
	//}
	//if len(findedDocuments) != 0 {
	//	message := fmt.Sprintf("document with hash %s already exists", document.Value.DocumentHash)
	//	Logger.Error(message)
	//	return errors.New(message), Document{}
	//}

	//getting transaction Timestamp
	timestamp, err := stub.GetTxTimestamp()
	if err != nil {
		message := fmt.Sprintf("unable to get transaction timestamp: %s", err.Error())
		Logger.Error(message)
		return errors.New(message), Document{}
	}

	//setting optional values
	document.Value.DocumentMeta = args[4]

	//setting automatic values
	document.Value.Timestamp = timestamp.Seconds
	document.Value.UpdatedDate = document.Value.Timestamp

	//updating state in ledger
	if bytes, err := json.Marshal(document); err == nil {
		Logger.Debug("Document: " + string(bytes))
	}

	if err := UpdateOrInsertIn(stub, &document, documentIndex, []string{""}, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return errors.New(message), Document{}
	}

	//appending document ID in contract
	if contract.Key.ID == "" {
		contract.Key.ID = document.Value.ContractID
		if !ExistsIn(stub, &contract, contractIndex) {
			compositeKey, _ := contract.ToCompositeKey(stub)
			message := fmt.Sprintf("contract with the key %s doesn't exist", compositeKey)
			Logger.Error(message)
			return errors.New(message), Document{}
		}
		if err := LoadFrom(stub, &contract, contractIndex); err != nil {
			message := fmt.Sprintf("persistence error: %s", err.Error())
			Logger.Error(message)
			return errors.New(message), Document{}
		}
	}
	contract.Value.Documents = append(contract.Value.Documents, document.Key.ID)
	contract.Value.UpdatedDate = timestamp.Seconds
	if err := UpdateOrInsertIn(stub, &contract, contractIndex, []string{""}, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return errors.New(message), Document{}
	}

	return nil, document
}

//0			1				2		3
//ProofID	ArrayAttributes	Owner	ShipmentID
func (cc *SupplyChainChaincode) generateProof(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	Notifier(stub, NoticeRuningType)

	//checking role
	if err, result := checkAccessForUnit([][]string{Supplier}, stub); err != nil || !result {
		message := fmt.Sprintf("this organizational unit is not allowed to upload a document")
		Logger.Error(message)
		return shim.Error(message)
	}

	// checking proof exist
	proof := Proof{}
	if err := proof.FillFromArguments(stub, args); err != nil {
		message := fmt.Sprintf("cannot fill a proof from arguments: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	if ExistsIn(stub, &proof, proofIndex) {
		compositeKey, _ := proof.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("proof with the key %s already exists", compositeKey))
	}

	//additional checking
	shipment := Shipment{}
	shipmentID := args[3]
	if err := shipment.FillFromCompositeKeyParts([]string{shipmentID}); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	if !ExistsIn(stub, &shipment, shipmentIndex) {
		compositeKey, _ := shipment.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("shipment with the key %s doesnt exist", compositeKey))
	}

	if err := LoadFrom(stub, &shipment, shipmentIndex); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	creator, err := GetCreatorOrganizationalUnit(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's OrganizationalUnit from the certificate: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("OrganizationalUnit: " + creator)

	if shipment.Value.Consignor != creator {
		message := fmt.Sprintf("each supplier can generate proof only for their shipment")
		Logger.Error(message)
		return shim.Error(message)
	}

	//getting transaction Timestamp
	timestamp, err := stub.GetTxTimestamp()
	if err != nil {
		message := fmt.Sprintf("unable to get transaction timestamp: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	// setting automatic values
	proof.Value.State = stateProofGenerated
	proof.Value.ConsignorName = creator
	proof.Value.ShipmentID = shipmentID
	proof.Value.Timestamp = timestamp.Seconds
	proof.Value.UpdatedDate = proof.Value.Timestamp

	// parsing input json and generate Idemix crypto
	if err := proof.GenerateIdemixCrypto(args[1]); err != nil {
		message := fmt.Sprintf("Idemix Crypto error: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	// updating state in ledger
	if err := UpdateOrInsertIn(stub, &proof, proofIndex, []string{""}, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//emitting Event
	events := Events{}

	//event = generateProof
	eventValue := EventValue{}
	eventValue.EntityType = proofIndex
	eventValue.EntityID = proof.Key.ID
	eventValue.Other = proof.Value
	eventValue.Action = eventGenerateProof
	events.Values = append(events.Values, eventValue)

	if err := events.EmitEvent(stub, proof.Key.ID); err != nil {
		message := fmt.Sprintf("Cannot emite event: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

//0			1				2				3					4				5
//ProofID	ReportState		Description		DocumentHash 		DocumentType	DocumentMeta
func (cc *SupplyChainChaincode) verifyProof(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	Notifier(stub, NoticeRuningType)

	//checking role
	if err, result := checkAccessForUnit([][]string{Auditor}, stub); err != nil || !result {
		message := fmt.Sprintf("this organizational unit is not allowed to upload a document")
		Logger.Error(message)
		return shim.Error(message)
	}

	// checking proof exist
	proof := Proof{}
	if err := proof.FillFromCompositeKeyParts([]string{args[0]}); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	if !ExistsIn(stub, &proof, proofIndex) {
		compositeKey, _ := proof.ToCompositeKey(stub)
		message := fmt.Sprintf("proof with the key %s doesn't exist", compositeKey)
		Logger.Error(message)
		return shim.Error(message)
	}

	if err := LoadFrom(stub, &proof, proofIndex); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	//checking owner
	creator, err := GetCreatorOrganizationalUnit(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's OrganizationalUnit from the certificate: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("OrganizationalUnit: " + creator)

	if proof.Value.Owner != creator {
		message := fmt.Sprintf("You're not owner of this proof")
		Logger.Error(message)
		return shim.Error(message)
	}

	if proof.Value.State != stateProofGenerated && proof.Value.State != stateProofUpdated {
		message := fmt.Sprintf("invalid state of proof")
		Logger.Error(message)
		return shim.Error(message)
	}
	attributeValuesBytes := make([]*FP256BN.BIG, len(proof.Value.DataForVerification.AttributeValuesHash))

	for i := range proof.Value.DataForVerification.AttributeValuesHash {
		fmt.Println(FP256BN.FromBytes(proof.Value.DataForVerification.AttributeValuesHash[i]))
		attributeValuesBytes[i] = FP256BN.FromBytes(proof.Value.DataForVerification.AttributeValuesHash[i])
	}
	err = proof.Value.SnapShot.Ver(proof.Value.DataForVerification.Disclosure,
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

	//getting transaction Timestamp
	timestamp, err := stub.GetTxTimestamp()
	if err != nil {
		message := fmt.Sprintf("unable to get transaction timestamp: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	// making report
	reportState, err := strconv.Atoi(args[1])
	if err != nil {
		message := fmt.Sprintf("report State is invalid: %s (must be int", args[1])
		Logger.Error(message)
		return shim.Error(message)
	}
	if !Contains(reportStateLegal, reportState) {
		message := fmt.Sprintf("report State is invalid: %d (must be from 0 to %d)", reportState, len(reportStateLegal))
		Logger.Error(message)
		return shim.Error(message)
	}

	events := Events{}
	eventValue := EventValue{}

	reports := []Report{}

	if proof.Value.State == stateProofGenerated {
		// making new report
		report := Report{}
		reportID, err := GenUUIDfromExist(stub, reportIndex, proof.Key.ID, CreateReport)
		if err := report.FillFromCompositeKeyParts([]string{reportID}); err != nil {
			message := fmt.Sprintf("persistence error: %s", err.Error())
			Logger.Error(message)
			return shim.Error(message)
		}
		if err != nil {
			message := fmt.Sprintf("cannot increment uuid: %s", err.Error())
			Logger.Error(message)
			return shim.Error(message)
		}
		report.Value.Owner = proof.Value.Owner
		report.Value.ShipmentID = proof.Value.ShipmentID
		report.Value.State = reportState
		report.Value.Description = args[2]
		report.Value.ProofID = proof.Key.ID
		report.Value.ConsignorName = proof.Value.ConsignorName
		report.Value.Timestamp = timestamp.Seconds
		report.Value.UpdatedDate = report.Value.Timestamp

		//updating state in ledger
		if err := UpdateOrInsertIn(stub, &report, reportIndex, []string{""}, ""); err != nil {
			message := fmt.Sprintf("persistence error: %s", err.Error())
			Logger.Error(message)
			return pb.Response{Status: 500, Message: message}
		}

		//event = submitReport
		eventValue.EntityType = reportIndex
		eventValue.EntityID = report.Key.ID
		eventValue.Other = report.Value
		eventValue.Action = eventSubmitReport
		events.Values = append(events.Values, eventValue)

	} else {
		// update exist report
		reports, err = findReportByProofID(stub, proof.Key.ID)
		if err != nil {
			message := fmt.Sprintf("cannot find existing report: %s", err.Error())
			Logger.Error(message)
			return shim.Error(message)
		}
		for _, report := range reports {
			report.Value.State = reportState
			report.Value.Description = args[2]
			report.Value.UpdatedDate = timestamp.Seconds

			//event = updateReport
			eventValue.EntityType = reportIndex
			eventValue.EntityID = report.Key.ID
			eventValue.Other = report.Value
			eventValue.Action = eventUpdateReport
			events.Values = append(events.Values, eventValue)

			//updating state in ledger
			if err := UpdateOrInsertIn(stub, &report, reportIndex, []string{""}, ""); err != nil {
				message := fmt.Sprintf("persistence error: %s", err.Error())
				Logger.Error(message)
				return pb.Response{Status: 500, Message: message}
			}
			Logger.Debug("Processed report")
			fmt.Println(report)
		}
	}

	stateProofMap := map[int]int{
		stateReportAccepted: stateProofValidated,
		stateReportDeclined: stateProofDeclined,
	}

	proof.Value.State = stateProofMap[reportState]
	proof.Value.UpdatedDate = timestamp.Seconds

	// updating state in ledger
	if err := UpdateOrInsertIn(stub, &proof, proofIndex, []string{""}, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	// uploading document
	documentHash := args[3]
	documentType := args[4]
	documentMeta := args[5]
	document := Document{}
	if documentHash != "" && documentType != "" {
		// find contractID
		err, contractID := findContractIDByEntity(stub, TypeShipment, proof.Value.ShipmentID)
		if err != nil {
			message := fmt.Sprintf("persistence error: %s", err.Error())
			Logger.Error(message)
			return shim.Error(message)
		}

		for _, report := range reports {
			documentID, err := GenUUIDfromExist(stub, documentIndex, proof.Key.ID, CreateDocument)
			if err != nil {
				message := fmt.Sprintf("cannot generate new uuid from existing: %s", err.Error())
				Logger.Error(message)
				return pb.Response{Status: 500, Message: message}
			}
			documentFields := []string{documentID, strconv.Itoa(TypeReport), report.Key.ID, documentHash, documentMeta, documentType, contractID}
			err, document = processingUploadDocument(stub, documentFields, Contract{})
			if err != nil {
				message := fmt.Sprintf("Error during processing upload document: %s", err.Error())
				Logger.Error(message)
				return shim.Error(message)
			}
		}
	}

	//emitting Event

	//event = verifyProof
	eventValue.EntityType = proofIndex
	eventValue.EntityID = proof.Key.ID
	eventValue.Other = proof.Value
	eventValue.Action = eventVerifyProof
	events.Values = append(events.Values, eventValue)

	if documentHash != "" && documentType != "" {
		//event = uploadDocument
		eventValue.EntityType = documentIndex
		eventValue.EntityID = document.Key.ID
		eventValue.Other = document.Value
		eventValue.Action = eventUploadDocument
		events.Values = append(events.Values, eventValue)
	}

	if err := events.EmitEvent(stub, proof.Key.ID); err != nil {
		message := fmt.Sprintf("Cannot emite event: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

//0			1				2		3
//ProofID	ArrayAttributes	Owner	ShipmentID
func (cc *SupplyChainChaincode) updateProof(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	Notifier(stub, NoticeRuningType)

	//checking role
	if err, result := checkAccessForUnit([][]string{Supplier}, stub); err != nil || !result {
		message := fmt.Sprintf("this organizational unit is not allowed to upload a document")
		Logger.Error(message)
		return shim.Error(message)
	}

	// checking proof exist
	proof := Proof{}
	if err := proof.FillFromCompositeKeyParts([]string{args[0]}); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	if !ExistsIn(stub, &proof, proofIndex) {
		compositeKey, _ := proof.ToCompositeKey(stub)
		message := fmt.Sprintf("proof with the key %s doesn't exist", compositeKey)
		Logger.Error(message)
		return shim.Error(message)
	}

	if err := LoadFrom(stub, &proof, proofIndex); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	creator, err := GetCreatorOrganizationalUnit(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's OrganizationalUnit from the certificate: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("OrganizationalUnit: " + creator)

	if creator != proof.Value.ConsignorName {
		message := fmt.Sprintf("each supplier can update only his own proof", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	//getting transaction Timestamp
	timestamp, err := stub.GetTxTimestamp()
	if err != nil {
		message := fmt.Sprintf("unable to get transaction timestamp: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	// setting automatic values
	proof.Value.State = stateProofUpdated
	proof.Value.UpdatedDate = timestamp.Seconds

	// parsing input json and generate Idemix crypto
	if err := proof.GenerateIdemixCrypto(args[1]); err != nil {
		message := fmt.Sprintf("Idemix Crypto error: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	// updating state in ledger
	if err := UpdateOrInsertIn(stub, &proof, proofIndex, []string{""}, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//emitting Event
	events := Events{}

	//event = updateProof
	eventValue := EventValue{}
	eventValue.EntityType = proofIndex
	eventValue.EntityID = proof.Key.ID
	eventValue.Other = proof.Value
	eventValue.Action = eventUpdateProof
	events.Values = append(events.Values, eventValue)

	if err := events.EmitEvent(stub, proof.Key.ID); err != nil {
		message := fmt.Sprintf("Cannot emite event: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

func (cc *SupplyChainChaincode) listOrders(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// list all of the orders in common channel
	// (optional) filter entries by status
	Notifier(stub, NoticeRuningType)
	orders := []Order{}
	ordersBytes, err := Query(stub, orderIndex, []string{}, CreateOrder, EmptyFilter)
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
	if err, result := checkAccessForUnit([][]string{Buyer, Supplier}, stub); err != nil || !result {
		message := fmt.Sprintf("this organizational unit is not allowed to place a bid")
		Logger.Error(message)
		return shim.Error(message)
	}

	contracts := []Contract{}
	contractsBytes, err := Query(stub, contractIndex, []string{}, CreateContract, EmptyFilter)
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

	resultBytes, err := joinByContractsAndDocuments(stub, contracts)
	if err != nil {
		message := fmt.Sprintf("cannot join by contract and document: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	Logger.Debug("Result: " + string(resultBytes))

	Notifier(stub, NoticeSuccessType)
	return shim.Success(resultBytes)
}

func (cc *SupplyChainChaincode) listProofs(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// check role == Auditor
	// list all proofs for Auditor's name/id/etc
	//checking role
	Notifier(stub, NoticeRuningType)

	//checking role
	if err, result := checkAccessForUnit([][]string{Auditor, Buyer, Supplier, TransportAgency}, stub); err != nil || !result {
		message := fmt.Sprintf("this organizational unit is not allowed to place a bid")
		Logger.Error(message)
		return shim.Error(message)
	}

	proofs := []Proof{}
	proofsBytes, err := Query(stub, proofIndex, []string{}, CreateProof, EmptyFilter)
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

func (cc *SupplyChainChaincode) listProofsByOwner(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// check role == Auditor
	// list all proofs for Auditor's name
	Notifier(stub, NoticeRuningType)

	//checking role
	if err, result := checkAccessForUnit([][]string{Auditor}, stub); err != nil || !result {
		message := fmt.Sprintf("this organizational unit is not allowed to get proofs by owner")
		Logger.Error(message)
		return shim.Error(message)
	}

	//get owner
	owner, err := GetCreatorOrganizationalUnit(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's OrganizationalUnit from the certificate: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("OrganizationalUnit: " + owner)

	filterByOwner := func(data LedgerData) bool {
		entity, ok := data.(*Proof)
		if ok && entity.Value.Owner == owner {
			return true
		}

		return false
	}

	proofs := []Proof{}
	proofsBytes, err := Query(stub, proofIndex, []string{}, CreateProof, filterByOwner)
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

//0
//ShipmentID
func (cc *SupplyChainChaincode) listProofsByShipment(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	Notifier(stub, NoticeRuningType)

	//checking role
	if err, result := checkAccessForUnit([][]string{Auditor, Supplier, Buyer, TransportAgency}, stub); err != nil || !result {
		message := fmt.Sprintf("this organizational unit is not allowed to get proofs by owner")
		Logger.Error(message)
		return shim.Error(message)
	}

	shipmentID := args[0]
	shipment := Shipment{}
	if err := shipment.FillFromCompositeKeyParts([]string{shipmentID}); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	if !ExistsIn(stub, &shipment, shipmentIndex) {
		compositeKey, _ := shipment.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("shipment with the key %s doesnt exist", compositeKey))
	}

	filterByShipment := func(data LedgerData) bool {
		entity, ok := data.(*Proof)
		if ok && entity.Value.ShipmentID == shipmentID {
			return true
		}

		return false
	}

	proofs := []Proof{}
	proofsBytes, err := Query(stub, proofIndex, []string{}, CreateProof, filterByShipment)
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

	reports := []Report{}
	reportsBytes, err := Query(stub, reportIndex, []string{}, CreateReport, EmptyFilter)
	if err != nil {
		message := fmt.Sprintf("unable to perform method: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	if err := json.Unmarshal(reportsBytes, &reports); err != nil {
		message := fmt.Sprintf("unable to unmarshal query result: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	resultBytes, err := joinByReportsAndDocuments(stub, reports)
	if err != nil {
		message := fmt.Sprintf("cannot join by report and contract: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	Logger.Debug("Result: " + string(resultBytes))

	Notifier(stub, NoticeSuccessType)
	return shim.Success(resultBytes)
}

//0
//ShipmentID
func (cc *SupplyChainChaincode) listReportsByShipment(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	Notifier(stub, NoticeRuningType)

	shipmentID := args[0]
	shipment := Shipment{}
	if err := shipment.FillFromCompositeKeyParts([]string{shipmentID}); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	if !ExistsIn(stub, &shipment, shipmentIndex) {
		compositeKey, _ := shipment.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("shipment with the key %s doesnt exist", compositeKey))
	}

	filterByShipment := func(data LedgerData) bool {
		entity, ok := data.(*Report)
		if ok && entity.Value.ShipmentID == shipmentID {
			return true
		}

		return false
	}

	reports := []Report{}
	reportsBytes, err := Query(stub, reportIndex, []string{}, CreateReport, filterByShipment)
	if err != nil {
		message := fmt.Sprintf("unable to perform method: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	if err := json.Unmarshal(reportsBytes, &reports); err != nil {
		message := fmt.Sprintf("unable to unmarshal query result: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	resultBytes, err := joinByReportsAndDocuments(stub, reports)
	if err != nil {
		message := fmt.Sprintf("cannot join by report and contract: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	Logger.Debug("Result: " + string(resultBytes))

	Notifier(stub, NoticeSuccessType)
	return shim.Success(resultBytes)
}

func (cc *SupplyChainChaincode) listShipments(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	Notifier(stub, NoticeRuningType)

	shipments := []Shipment{}
	shipmentsBytes, err := Query(stub, shipmentIndex, []string{}, CreateShipment, EmptyFilter)
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

	for _, shipment := range shipments {
		shipmentHistory, err := getHistoryByEntity(stub, shipmentIndex, shipment.Key.ID, CreateShipment)
		if err != nil {
			message := fmt.Sprintf("cannot get history for entity %s with ID: %s . Error: %s", shipmentIndex, shipment.Key.ID, err.Error())
			Logger.Error(message)
			return shim.Error(message)
		}
		fmt.Println("######### Debug history ########")
		fmt.Println(shipmentHistory)
	}

	resultBytes, err := joinByShipmentsAndContractsAndDocumentsAndEvents(stub, shipments)
	if err != nil {
		message := fmt.Sprintf("cannot join by shipment and contract: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	Logger.Debug("Result: " + string(resultBytes))

	Notifier(stub, NoticeSuccessType)
	return shim.Success(resultBytes)
}

//0
//eventID
func (cc *SupplyChainChaincode) getEventPayload(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	Notifier(stub, NoticeRuningType)

	event := Event{}
	if err := event.FillFromCompositeKeyParts(args[:eventKeyFieldsNumber]); err != nil {
		message := fmt.Sprintf(err.Error())
		return pb.Response{Status: 404, Message: message}
	}

	if !ExistsIn(stub, &event, eventIndex) {
		compositeKey, _ := event.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("event with the key %s doesn't exist", compositeKey))
	}

	if err := LoadFrom(stub, &event, eventIndex); err != nil {
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

//0
//documentID
func (cc *SupplyChainChaincode) getDocument(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	Notifier(stub, NoticeRuningType)

	document := Document{}
	if err := document.FillFromCompositeKeyParts(args[:documentKeyFieldsNumber]); err != nil {
		message := fmt.Sprintf(err.Error())
		return pb.Response{Status: 404, Message: message}
	}

	if !ExistsIn(stub, &document, documentIndex) {
		compositeKey, _ := document.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("document with the key %s doesn't exist", compositeKey))
	}

	if err := LoadFrom(stub, &document, documentIndex); err != nil {
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

func findDocumentByHash(stub shim.ChaincodeStubInterface, documentHash string) ([]Document, error) {

	filterByDocumentHash := func(data LedgerData) bool {
		entity, ok := data.(*Document)
		if ok && entity.Value.DocumentHash == documentHash {
			return true
		}

		return false
	}

	documents := []Document{}
	documentsBytes, err := Query(stub, documentIndex, []string{}, CreateDocument, filterByDocumentHash)
	if err != nil {
		message := fmt.Sprintf("unable to perform method: %s", err.Error())
		Logger.Error(message)
		return documents, errors.New(message)
	}

	if err := json.Unmarshal(documentsBytes, &documents); err != nil {
		message := fmt.Sprintf("unable to unmarshal documents query result: %s", err.Error())
		Logger.Error(message)
		return documents, errors.New(message)
	}

	return documents, nil
}

func findReportByProofID(stub shim.ChaincodeStubInterface, proofID string) ([]Report, error) {

	filterByProofID := func(data LedgerData) bool {
		entity, ok := data.(*Report)
		if ok && entity.Value.ProofID == proofID {
			return true
		}
		return false
	}

	reports := []Report{}
	reportsBytes, err := Query(stub, reportIndex, []string{}, CreateReport, filterByProofID)
	if err != nil {
		message := fmt.Sprintf("unable to perform method: %s", err.Error())
		Logger.Error(message)
		return reports, errors.New(message)
	}

	if err := json.Unmarshal(reportsBytes, &reports); err != nil {
		message := fmt.Sprintf("unable to unmarshal reports query result: %s", err.Error())
		Logger.Error(message)
		return reports, errors.New(message)
	}

	return reports, nil
}

func findEventByActionAndEntity(stub shim.ChaincodeStubInterface, action string, entityID string) ([]Event, error) {

	filterByActionAndEntityID := func(data LedgerData) bool {
		entity, ok := data.(*Event)
		if ok && entity.Value.Action == action && entity.Value.EntityID == entityID {
			return true
		}
		return false
	}

	events := []Event{}
	eventsBytes, err := Query(stub, eventIndex, []string{}, CreateEvent, filterByActionAndEntityID)
	if err != nil {
		message := fmt.Sprintf("unable to perform method: %s", err.Error())
		Logger.Error(message)
		return events, errors.New(message)
	}

	if err := json.Unmarshal(eventsBytes, &events); err != nil {
		message := fmt.Sprintf("unable to unmarshal events query result: %s", err.Error())
		Logger.Error(message)
		return events, errors.New(message)
	}

	return events, nil
}

func findProofsByShipment(stub shim.ChaincodeStubInterface, shipmentID string) ([]Proof, error) {

	filterByShipmentID := func(data LedgerData) bool {
		entity, ok := data.(*Proof)
		if ok && entity.Value.ShipmentID == shipmentID {
			return true
		}
		return false
	}

	proofs := []Proof{}
	proofsBytes, err := Query(stub, proofIndex, []string{}, CreateProof, filterByShipmentID)
	if err != nil {
		message := fmt.Sprintf("unable to perform method: %s", err.Error())
		Logger.Error(message)
		return proofs, errors.New(message)
	}

	if err := json.Unmarshal(proofsBytes, &proofs); err != nil {
		message := fmt.Sprintf("unable to unmarshal proofs query result: %s", err.Error())
		Logger.Error(message)
		return proofs, errors.New(message)
	}

	return proofs, nil
}

func findReportsByShipment(stub shim.ChaincodeStubInterface, shipmentID string) ([]Report, error) {

	filterByShipmentID := func(data LedgerData) bool {
		entity, ok := data.(*Report)
		if ok && entity.Value.ShipmentID == shipmentID {
			return true
		}
		return false
	}

	reports := []Report{}
	reportsBytes, err := Query(stub, reportIndex, []string{}, CreateReport, filterByShipmentID)
	if err != nil {
		message := fmt.Sprintf("unable to perform method: %s", err.Error())
		Logger.Error(message)
		return reports, errors.New(message)
	}

	if err := json.Unmarshal(reportsBytes, &reports); err != nil {
		message := fmt.Sprintf("unable to unmarshal reports query result: %s", err.Error())
		Logger.Error(message)
		return reports, errors.New(message)
	}

	return reports, nil
}

func findContractIDByEntity(stub shim.ChaincodeStubInterface, entityType int, entityID string) (error, string) {

	contactID := ""

	switch entityType {
	case TypeContract:
		contactID = entityID

	case TypeShipment:
		entity := Shipment{}
		id := entityID
		if err := entity.FillFromCompositeKeyParts([]string{id}); err != nil {
			message := fmt.Sprintf("persistence error: %s", err.Error())
			Logger.Error(message)
			return errors.New(message), contactID
		}

		if !ExistsIn(stub, &entity, shipmentIndex) {
			compositeKey, _ := entity.ToCompositeKey(stub)
			message := fmt.Sprintf("shipment with the key %s doesnt exist", compositeKey)
			Logger.Error(message)
			return nil, contactID
		}

		if err := LoadFrom(stub, &entity, shipmentIndex); err != nil {
			message := fmt.Sprintf("persistence error: %s", err.Error())
			Logger.Error(message)
			return errors.New(message), contactID
		}
		contactID = entity.Value.ContractID
	case TypeReport:
		// firstly getting report by entityID
		entityOne := Report{}
		idOne := entityID
		if err := entityOne.FillFromCompositeKeyParts([]string{idOne}); err != nil {
			message := fmt.Sprintf("persistence error: %s", err.Error())
			Logger.Error(message)
			return errors.New(message), contactID
		}

		if !ExistsIn(stub, &entityOne, reportIndex) {
			compositeKey, _ := entityOne.ToCompositeKey(stub)
			message := fmt.Sprintf("report with the key %s doesnt exist", compositeKey)
			Logger.Error(message)
			return nil, contactID
		}

		if err := LoadFrom(stub, &entityOne, reportIndex); err != nil {
			message := fmt.Sprintf("persistence error: %s", err.Error())
			Logger.Error(message)
			return errors.New(message), contactID
		}
		// secondly getting shipment by shipmentID from report
		entityTwo := Shipment{}
		idTwo := entityOne.Value.ShipmentID
		if err := entityTwo.FillFromCompositeKeyParts([]string{idTwo}); err != nil {
			message := fmt.Sprintf("persistence error: %s", err.Error())
			Logger.Error(message)
			return errors.New(message), contactID
		}

		if !ExistsIn(stub, &entityTwo, shipmentIndex) {
			compositeKey, _ := entityTwo.ToCompositeKey(stub)
			message := fmt.Sprintf("shipment with the key %s doesnt exist", compositeKey)
			Logger.Error(message)
			return errors.New(message), contactID
		}

		if err := LoadFrom(stub, &entityTwo, shipmentIndex); err != nil {
			message := fmt.Sprintf("persistence error: %s", err.Error())
			Logger.Error(message)
			return errors.New(message), contactID
		}
		contactID = entityTwo.Value.ContractID
	}

	return nil, contactID
}

func joinByShipmentsAndContractsAndDocumentsAndEvents(stub shim.ChaincodeStubInterface, shipments []Shipment) ([]byte, error) {

	//making map of contracts
	contracts := []Contract{}
	contractsBytes, err := Query(stub, contractIndex, []string{}, CreateContract, EmptyFilter)
	if err != nil {
		message := fmt.Sprintf("unable to perform method: %s", err.Error())
		Logger.Error(message)
		return nil, errors.New(message)
	}
	if err := json.Unmarshal(contractsBytes, &contracts); err != nil {
		message := fmt.Sprintf("unable to unmarshal query result: %s", err.Error())
		Logger.Error(message)
		return nil, errors.New(message)
	}

	contractMap := make(map[ContractKey]ContractValue)
	for _, contract := range contracts {
		contractMap[contract.Key] = contract.Value
	}

	//making map of documents
	documents := []Document{}
	documentsBytes, err := Query(stub, documentIndex, []string{}, CreateDocument, EmptyFilter)
	if err != nil {
		message := fmt.Sprintf("unable to perform method: %s", err.Error())
		Logger.Error(message)
		return nil, errors.New(message)
	}
	if err := json.Unmarshal(documentsBytes, &documents); err != nil {
		message := fmt.Sprintf("unable to unmarshal query result: %s", err.Error())
		Logger.Error(message)
		return nil, errors.New(message)
	}

	documentMap := make(map[DocumentKey]DocumentValue)
	for _, document := range documents {
		documentMap[document.Key] = document.Value
	}

	result := []ShipmentAdditional{}
	for _, shipment := range shipments {
		entry := ShipmentAdditional{
			Key: shipment.Key,
			Value: ShipmentValueAdditional{
				Contract:     ContractAdditional{Key: ContractKey{ID: shipment.Value.ContractID}},
				Consignor:    shipment.Value.Consignor,
				ShipFrom:     shipment.Value.ShipFrom,
				ShipTo:       shipment.Value.ShipTo,
				Transport:    shipment.Value.Transport,
				Description:  shipment.Value.Description,
				Timestamp:    shipment.Value.Timestamp,
				DeliveryDate: shipment.Value.DeliveryDate,
				UpdatedDate:  shipment.Value.UpdatedDate,
				State:        shipment.Value.State,
			},
		}
		// find contract
		if contractValue, ok := contractMap[ContractKey{ID: entry.Value.Contract.Key.ID}]; ok {
			// fill contact fields
			entry.Value.Contract.Value.ProductName = contractValue.ProductName
			entry.Value.Contract.Value.ConsignorName = contractValue.ConsignorName
			entry.Value.Contract.Value.ConsigneeName = contractValue.ConsigneeName
			entry.Value.Contract.Value.TotalDue = contractValue.TotalDue
			entry.Value.Contract.Value.Quantity = contractValue.Quantity
			entry.Value.Contract.Value.Destination = contractValue.Destination
			entry.Value.Contract.Value.DueDate = contractValue.DueDate
			entry.Value.Contract.Value.PaymentDate = contractValue.PaymentDate
			entry.Value.Contract.Value.State = contractValue.State
			entry.Value.Contract.Value.Timestamp = contractValue.Timestamp
			entry.Value.Contract.Value.UpdatedDate = contractValue.UpdatedDate
			// find document
			for _, documentID := range contractValue.Documents {
				if documentValue, ok := documentMap[DocumentKey{ID: documentID}]; ok {
					// fill document item for result structure
					entry.Value.Contract.Value.Documents = append(entry.Value.Contract.Value.Documents, Document{Key: DocumentKey{ID: documentID}, Value: documentValue})
				}
			}
		}
		//collecting events for timeline

		//find ShipmentRequested
		events, err := findEventByActionAndEntity(stub, eventRequestShipment, entry.Key.ID)
		if err != nil {
			message := fmt.Sprintf("cannot find eventRequestShipment: %s", err.Error())
			Logger.Error(message)
			return nil, errors.New(message)
		}
		for _, event := range events {
			entry.Value.Timeline.ShipmentRequested = append(entry.Value.Timeline.ShipmentRequested, event)
		}

		//find ShipmentConfirmed
		events, err = findEventByActionAndEntity(stub, eventConfirmShipment, entry.Key.ID)
		if err != nil {
			message := fmt.Sprintf("cannot find eventConfirmShipment: %s", err.Error())
			Logger.Error(message)
			return nil, errors.New(message)
		}
		for _, event := range events {
			entry.Value.Timeline.ShipmentConfirmed = append(entry.Value.Timeline.ShipmentConfirmed, event)
		}

		//find ShipmentDelivered
		events, err = findEventByActionAndEntity(stub, eventConfirmDelivery, entry.Key.ID)
		if err != nil {
			message := fmt.Sprintf("cannot find eventConfirmDelivery: %s", err.Error())
			Logger.Error(message)
			return nil, errors.New(message)
		}
		for _, event := range events {
			entry.Value.Timeline.ShipmentDelivered = append(entry.Value.Timeline.ShipmentDelivered, event)
		}

		//find DocumentsUploaded
		for _, document := range entry.Value.Contract.Value.Documents {

			events, err = findEventByActionAndEntity(stub, eventUploadDocument, document.Key.ID)
			if err != nil {
				message := fmt.Sprintf("cannot find eventUploadDocument: %s", err.Error())
				Logger.Error(message)
				return nil, errors.New(message)
			}
			for _, event := range events {
				entry.Value.Timeline.DocumentsUploaded = append(entry.Value.Timeline.DocumentsUploaded, event)
			}
		}

		//find ReportsSubmited
		reports, err := findReportsByShipment(stub, entry.Key.ID)
		if err != nil {
			message := fmt.Sprintf("cannot find reports by shipment: %s", err.Error())
			Logger.Error(message)
			return nil, errors.New(message)
		}

		for _, report := range reports {
			events, err = findEventByActionAndEntity(stub, eventSubmitReport, report.Key.ID)
			if err != nil {
				message := fmt.Sprintf("cannot find ReportsSubmited: %s", err.Error())
				Logger.Error(message)
				return nil, errors.New(message)
			}
			for _, event := range events {
				entry.Value.Timeline.ReportsSubmited = append(entry.Value.Timeline.ReportsSubmited, event)
			}
		}

		//find ProofsGenerated
		proofs, err := findProofsByShipment(stub, entry.Key.ID)
		if err != nil {
			message := fmt.Sprintf("cannot find proofs by shipment: %s", err.Error())
			Logger.Error(message)
			return nil, errors.New(message)
		}

		for _, proof := range proofs {
			events, err = findEventByActionAndEntity(stub, eventGenerateProof, proof.Key.ID)
			if err != nil {
				message := fmt.Sprintf("cannot find ProofsGenerated: %s", err.Error())
				Logger.Error(message)
				return nil, errors.New(message)
			}
			for _, event := range events {
				entry.Value.Timeline.ProofsGenerated = append(entry.Value.Timeline.ProofsGenerated, event)
			}
		}

		//find ProofsValidated
		for _, proof := range proofs {
			events, err = findEventByActionAndEntity(stub, eventVerifyProof, proof.Key.ID)
			if err != nil {
				message := fmt.Sprintf("cannot find ProofsValidated: %s", err.Error())
				Logger.Error(message)
				return nil, errors.New(message)
			}
			for _, event := range events {
				entry.Value.Timeline.ProofsValidated = append(entry.Value.Timeline.ProofsValidated, event)
			}
		}

		result = append(result, entry)
	}

	resultBytes, err := json.Marshal(result)
	return resultBytes, nil
}

func joinByContractsAndDocuments(stub shim.ChaincodeStubInterface, arrayContracts []Contract) ([]byte, error) {

	//making map of documents
	documents := []Document{}
	documentsBytes, err := Query(stub, documentIndex, []string{}, CreateDocument, EmptyFilter)
	if err != nil {
		message := fmt.Sprintf("unable to perform method: %s", err.Error())
		Logger.Error(message)
		return nil, errors.New(message)
	}
	if err := json.Unmarshal(documentsBytes, &documents); err != nil {
		message := fmt.Sprintf("unable to unmarshal query result: %s", err.Error())
		Logger.Error(message)
		return nil, errors.New(message)
	}

	documentMap := make(map[DocumentKey]DocumentValue)
	for _, document := range documents {
		documentMap[document.Key] = document.Value
	}

	result := []ContractAdditional{}
	for _, contract := range arrayContracts {
		entry := ContractAdditional{
			Key: contract.Key,
			Value: ContractValueAdditional{
				ProductName:   contract.Value.ProductName,
				ConsignorName: contract.Value.ConsignorName,
				ConsigneeName: contract.Value.ConsigneeName,
				TotalDue:      contract.Value.TotalDue,
				Quantity:      contract.Value.Quantity,
				Destination:   contract.Value.Destination,
				DueDate:       contract.Value.DueDate,
				PaymentDate:   contract.Value.PaymentDate,
				State:         contract.Value.State,
				Timestamp:     contract.Value.Timestamp,
				UpdatedDate:   contract.Value.UpdatedDate,
			},
		}

		// find document
		for _, documentID := range contract.Value.Documents {
			if documentValue, ok := documentMap[DocumentKey{ID: documentID}]; ok {
				// fill document item for result structure
				entry.Value.Documents = append(entry.Value.Documents, Document{Key: DocumentKey{ID: documentID}, Value: documentValue})
			}
		}

		result = append(result, entry)
	}

	resultBytes, err := json.Marshal(result)
	return resultBytes, nil
}

func joinByReportsAndDocuments(stub shim.ChaincodeStubInterface, reports []Report) ([]byte, error) {

	//making shipment map
	shipments := []Shipment{}
	shipmentsBytes, err := Query(stub, shipmentIndex, []string{}, CreateShipment, EmptyFilter)
	if err != nil {
		message := fmt.Sprintf("unable to perform method: %s", err.Error())
		Logger.Error(message)
		return nil, errors.New(message)
	}
	if err := json.Unmarshal(shipmentsBytes, &shipments); err != nil {
		message := fmt.Sprintf("unable to unmarshal query result: %s", err.Error())
		Logger.Error(message)
		return nil, errors.New(message)
	}

	shipmentsMap := make(map[ShipmentKey]ShipmentValue)
	for _, shipment := range shipments {
		shipmentsMap[shipment.Key] = shipment.Value
	}

	//making contract map
	contracts := []Contract{}
	contractsBytes, err := Query(stub, contractIndex, []string{}, CreateContract, EmptyFilter)
	if err != nil {
		message := fmt.Sprintf("unable to perform method: %s", err.Error())
		Logger.Error(message)
		return nil, errors.New(message)
	}
	if err := json.Unmarshal(contractsBytes, &contracts); err != nil {
		message := fmt.Sprintf("unable to unmarshal query result: %s", err.Error())
		Logger.Error(message)
		return nil, errors.New(message)
	}

	contractMap := make(map[ContractKey]ContractValue)
	for _, contract := range contracts {
		contractMap[contract.Key] = contract.Value
	}

	//making document map
	documents := []Document{}
	documentsBytes, err := Query(stub, documentIndex, []string{}, CreateDocument, EmptyFilter)
	if err != nil {
		message := fmt.Sprintf("unable to perform method: %s", err.Error())
		Logger.Error(message)
		return nil, errors.New(message)
	}
	if err := json.Unmarshal(documentsBytes, &documents); err != nil {
		message := fmt.Sprintf("unable to unmarshal query result: %s", err.Error())
		Logger.Error(message)
		return nil, errors.New(message)
	}

	documentMap := make(map[DocumentKey]DocumentValue)
	for _, document := range documents {
		documentMap[document.Key] = document.Value
	}

	//building result report
	result := []ReportAdditional{}
	for _, report := range reports {
		entry := ReportAdditional{
			Key: report.Key,
			Value: ReportValueAdditional{
				Owner:         report.Value.Owner,
				Description:   report.Value.Description,
				ProofID:       report.Value.ProofID,
				ConsignorName: report.Value.ConsignorName,
				State:         report.Value.State,
				Timestamp:     report.Value.Timestamp,
				UpdatedDate:   report.Value.UpdatedDate,
				ShipmentID:    report.Value.ShipmentID,
			},
		}

		// find shipment
		if shipmentValue, ok := shipmentsMap[ShipmentKey{ID: entry.Value.ShipmentID}]; ok {
			//find contract
			if contractValue, ok := contractMap[ContractKey{ID: shipmentValue.ContractID}]; ok {
				// find document
				for _, documentID := range contractValue.Documents {
					if documentValue, ok := documentMap[DocumentKey{ID: documentID}]; ok {
						// fill document item for result structure
						entry.Value.Documents = append(entry.Value.Documents, Document{Key: DocumentKey{ID: documentID}, Value: documentValue})
					}
				}

			}
		}

		result = append(result, entry)
	}

	resultBytes, err := json.Marshal(result)
	return resultBytes, nil
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

func checkAccessForUnit(allowedUnits [][]string, stub shim.ChaincodeStubInterface) (error, bool) {

	orgUnit, err := GetCreatorOrganizationalUnit(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's OrganizationalUnit from the certificate: %s", err.Error())
		Logger.Error(message)
		return errors.New(message), false
	}
	Logger.Debug("OrganizationalUnit: " + orgUnit)

	result := false

	for _, value := range allowedUnits {
		for _, role := range value {
			if role == orgUnit {
				result = true
			}
		}
	}

	return nil, result
}

func main() {
	err := shim.Start(new(SupplyChainChaincode))
	if err != nil {
		Logger.Error(err.Error())
	}
}
