package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
	"github.com/satori/go.uuid"
	"strconv"
	"time"
)

type TradeFinanceChaincode struct {
}

func (cc *TradeFinanceChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
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

func (cc *TradeFinanceChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	Logger.Debug("Invoke")

	function, args := stub.GetFunctionAndParameters()
	if function == "registerInvoice" {
		// Supplier (or Buyer?) adds an invoice to Trade-Finance CC ledger
		return cc.registerInvoice(stub, args)
	} else if function == "acceptInvoice" {
		return cc.acceptInvoice(stub, args)
	} else if function == "rejectInvoice" {
		return cc.rejectInvoice(stub, args)
	} else if function == "placeInvoice" {
		// Invoice owner places an invoice on the dashboard
		return cc.placeInvoice(stub, args)
	} else if function == "removeInvoice" {
		// Invoice owner removes the invoice from the dashboard
		return cc.removeInvoice(stub, args)
	} else if function == "placeBid" {
		// Factor places a bid for the invoice
		return cc.placeBid(stub, args)
	} else if function == "updateBid" {
		// Factor edits the bid
		return cc.updateBid(stub, args)
	} else if function == "cancelBid" {
		// Factor cancels the bid
		return cc.cancelBid(stub, args)
	} else if function == "acceptBid" {
		// Invoice owner accepts the bid; ownership of the invoice is transferred to Factor; Buyer is notified about changes
		return cc.acceptBid(stub, args)
	} else if function == "listBids" {
		// List all bids (for testing purposes
		return cc.listBids(stub, args)
	} else if function == "listBidsForInvoice" {
		// List all bids for the invoice
		return cc.listBidsForInvoice(stub, args)
	} else if function == "listInvoices" {
		// List all invoices
		return cc.listInvoices(stub, args)
	} else if function == "getEventPayload" {
		return cc.getEventPayload(stub, args)
	}
	// (optional) add other query functions

	fnList := "{placeInvoice, removeInvoice, placeBid, updateBid, cancelBid, acceptBid, " +
		"listBids, listBidsForInvoice, listInvoices}"
	message := fmt.Sprintf("invalid invoke function name: expected one of %s, got %s", fnList, function)
	Logger.Debug(message)

	return pb.Response{Status: 400, Message: message}
}

//0				1		2			3			4
//ContractID    Debtor	Beneficiary	TotalDue	DueDate
func (cc *TradeFinanceChaincode) registerInvoice(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// args: invoice fields
	// check role == Supplier
	// validate args, including owner/buyer coincidence with caller
	// fill invoice from args
	// save invoice
	Notifier(stub, NoticeRuningType)

	//checking role
	if err, result := checkAccessForUnit([][]string{Supplier}, stub); err != nil || !result {
		message := fmt.Sprintf("this organizational unit is not allowed to register an invoice")
		Logger.Error(message)
		return shim.Error(message)
	}

	//checking invoice exist
	invoice := Invoice{}
	if err := invoice.FillFromArguments(stub, args); err != nil {
		message := fmt.Sprintf("cannot fill an invoice from arguments: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	if ExistsIn(stub, &invoice, invoiceIndex) {
		compositeKey, _ := invoice.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("invoice with the key %s already exists", compositeKey))
	}

	//setting automatic values
	creator, err := GetMSPID(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's MSPID: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("Creator: " + creator)

	invoice.Value.Owner = creator
	invoice.Value.State = stateInvoiceIssued
	invoice.Value.Timestamp = time.Now().UTC().Unix()
	invoice.Value.UpdatedDate = invoice.Value.Timestamp

	//updating state un ledger
	if bytes, err := json.Marshal(invoice); err == nil {
		Logger.Debug("Invoice: " + string(bytes))
	}

	if err := UpdateOrInsertIn(stub, &invoice, invoiceIndex, []string{""}, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//emitting Event
	events := Events{}

	eventValue := EventValue{}
	eventValue.EntityType = invoiceIndex
	eventValue.EntityID = invoice.Key.ID
	eventValue.Other = invoice.Value
	eventValue.Action = eventRegisterInvoice

	events.Values = append(events.Values, eventValue)

	if err := events.emitEvent(stub); err != nil {
		message := fmt.Sprintf("Cannot emite event: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

//0		1	2	3	4	5	6
//ID    0	0	0	0	0	0
func (cc *TradeFinanceChaincode) placeInvoice(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// args: invoice id
	// check specified invoice existence
	// check if caller is invoice owner
	// check invoice due date
	// check invoice trade status
	// update invoice trade status
	// save invoice
	Notifier(stub, NoticeRuningType)

	//checking role
	if err, result := checkAccessForUnit([][]string{Supplier, Factor}, stub); err != nil || !result {
		message := fmt.Sprintf("this organizational unit is not allowed to place an invoice")
		Logger.Error(message)
		return shim.Error(message)
	}

	//checking invoice exist
	invoice := Invoice{}
	if err := invoice.FillFromCompositeKeyParts(args[:invoiceKeyFieldsNumber]); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	if !ExistsIn(stub, &invoice, invoiceIndex) {
		compositeKey, _ := invoice.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("invoice with the key %s doesn't exist", compositeKey))
	}

	//loading current state from ledger
	if err := LoadFrom(stub, &invoice, invoiceIndex); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//additional checking
	creator, err := GetMSPID(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's MSPID: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("Creator: " + creator)

	if invoice.Value.Owner != creator {
		message := fmt.Sprintf("only invoice owner can place an invoice")
		Logger.Error(message)
		return shim.Error(message)
	}

	allowedStates := map[int]bool{
		stateInvoiceSigned:  true,
		stateInvoiceRemoved: true,
	}

	if !allowedStates[invoice.Value.State] {
		message := fmt.Sprintf("cannot place invoice with current state")
		Logger.Error(message)
		return shim.Error(message)
	}

	//setting automatic values
	invoice.Value.State = stateInvoiceForSale
	invoice.Value.UpdatedDate = time.Now().UTC().Unix()

	if bytes, err := json.Marshal(invoice); err == nil {
		Logger.Debug("Invoice: " + string(bytes))
	}

	//updating state in ledger
	if err := UpdateOrInsertIn(stub, &invoice, invoiceIndex, []string{""}, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//emitting Event
	events := Events{}

	eventValue := EventValue{}
	eventValue.EntityType = invoiceIndex
	eventValue.EntityID = invoice.Key.ID
	eventValue.Other = invoice.Value
	eventValue.Action = eventPlaceInvoice

	events.Values = append(events.Values, eventValue)

	if err := events.emitEvent(stub); err != nil {
		message := fmt.Sprintf("Cannot emite event: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

//0		1	2	3	4	5	6
//ID    0	0	0	0	0	0
func (cc *TradeFinanceChaincode) removeInvoice(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// args: invoice id
	// check specified invoice existence
	// check if caller is invoice owner
	// check invoice trade status
	// update invoice trade status
	// save invoice
	Notifier(stub, NoticeRuningType)

	//checking role
	if err, result := checkAccessForUnit([][]string{Supplier, Factor}, stub); err != nil || !result {
		message := fmt.Sprintf("this organizational unit is not allowed to remove an invoice")
		Logger.Error(message)
		return shim.Error(message)
	}

	//checking invoice exist
	invoice := Invoice{}
	if err := invoice.FillFromCompositeKeyParts(args[:invoiceKeyFieldsNumber]); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	if !ExistsIn(stub, &invoice, invoiceIndex) {
		compositeKey, _ := invoice.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("invoice with the key %s doesn't exist", compositeKey))
	}

	//loading current state from ledger
	if err := LoadFrom(stub, &invoice, invoiceIndex); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//additional checking
	creator, err := GetMSPID(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's MSPID: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("Creator: " + creator)

	if invoice.Value.Owner != creator {
		message := fmt.Sprintf("only invoice owner can remove an invoice")
		Logger.Error(message)
		return shim.Error(message)
	}

	//setting automatic values
	invoice.Value.State = stateInvoiceRemoved
	invoice.Value.UpdatedDate = time.Now().UTC().Unix()

	if bytes, err := json.Marshal(invoice); err == nil {
		Logger.Debug("Invoice: " + string(bytes))
	}

	//updating state in ledger
	if err := UpdateOrInsertIn(stub, &invoice, invoiceIndex, []string{""}, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//emitting Event
	events := Events{}

	eventValue := EventValue{}
	eventValue.EntityType = invoiceIndex
	eventValue.EntityID = invoice.Key.ID
	eventValue.Other = invoice.Value
	eventValue.Action = eventRemoveInvoice

	events.Values = append(events.Values, eventValue)

	if err := events.emitEvent(stub); err != nil {
		message := fmt.Sprintf("Cannot emite event: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

//0		1	2	3	4	5	6
//ID    0	0	0	0	0	0
func (cc *TradeFinanceChaincode) acceptInvoice(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// args: invoice id
	// check specified invoice existence
	// check if caller is invoice owner
	// check invoice trade status
	// update invoice trade status
	// save invoice
	Notifier(stub, NoticeRuningType)

	//checking role
	if err, result := checkAccessForUnit([][]string{Buyer}, stub); err != nil || !result {
		message := fmt.Sprintf("this organizational unit is not allowed to accept an invoice")
		Logger.Error(message)
		return shim.Error(message)
	}

	//checking invoice exist
	invoice := Invoice{}
	invoiceID := args[0]
	if err := invoice.FillFromCompositeKeyParts([]string{invoiceID}); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	if !ExistsIn(stub, &invoice, invoiceIndex) {
		compositeKey, _ := invoice.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("invoice with the key %s doesn't exist", compositeKey))
	}

	//loading current state from ledger
	if err := LoadFrom(stub, &invoice, invoiceIndex); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//additional checking
	creator, err := GetMSPID(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's MSPID: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("Creator: " + creator)

	if invoice.Value.Debtor != creator {
		message := fmt.Sprintf("only invoice debtor can accept an invoice")
		Logger.Error(message)
		return shim.Error(message)
	}

	if invoice.Value.State != stateInvoiceIssued {
		message := fmt.Sprintf("cannot accept invoice with current state")
		Logger.Error(message)
		return shim.Error(message)
	}

	//setting automatic values
	invoice.Value.State = stateInvoiceSigned
	invoice.Value.UpdatedDate = time.Now().UTC().Unix()

	if bytes, err := json.Marshal(invoice); err == nil {
		Logger.Debug("Invoice: " + string(bytes))
	}

	//updating state in ledger
	if err := UpdateOrInsertIn(stub, &invoice, invoiceIndex, []string{""}, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//emitting Event
	events := Events{}

	eventValue := EventValue{}
	eventValue.EntityType = invoiceIndex
	eventValue.EntityID = invoice.Key.ID
	eventValue.Other = invoice.Value
	eventValue.Action = eventAcceptInvoice

	events.Values = append(events.Values, eventValue)

	if err := events.emitEvent(stub); err != nil {
		message := fmt.Sprintf("Cannot emite event: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

//0		1	2	3	4	5	6
//ID    0	0	0	0	0	0
func (cc *TradeFinanceChaincode) rejectInvoice(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// args: invoice id
	// check specified invoice existence
	// check if caller is invoice owner
	// check invoice trade status
	// update invoice trade status
	// save invoice
	Notifier(stub, NoticeRuningType)

	//checking role
	if err, result := checkAccessForUnit([][]string{Buyer}, stub); err != nil || !result {
		message := fmt.Sprintf("this organizational unit is not allowed to register an invoice")
		Logger.Error(message)
		return shim.Error(message)
	}

	//checking invoice exist
	invoice := Invoice{}
	if err := invoice.FillFromCompositeKeyParts(args[:invoiceKeyFieldsNumber]); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	if !ExistsIn(stub, &invoice, invoiceIndex) {
		compositeKey, _ := invoice.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("invoice with the key %s doesn't exist", compositeKey))
	}

	//loading current state from ledger
	if err := LoadFrom(stub, &invoice, invoiceIndex); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//additional checking
	creator, err := GetMSPID(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's MSPID: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("Creator: " + creator)

	if invoice.Value.Owner != creator {
		message := fmt.Sprintf("only invoice debtor can reject an invoice")
		Logger.Error(message)
		return shim.Error(message)
	}

	if invoice.Value.State != stateInvoiceIssued {
		message := fmt.Sprintf("cannot reject invoice with current state")
		Logger.Error(message)
		return shim.Error(message)
	}

	//setting automatic values
	invoice.Value.State = stateInvoiceRejected
	invoice.Value.UpdatedDate = time.Now().UTC().Unix()

	if bytes, err := json.Marshal(invoice); err == nil {
		Logger.Debug("Invoice: " + string(bytes))
	}

	//updating state in ledger
	if err := UpdateOrInsertIn(stub, &invoice, invoiceIndex, []string{""}, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//emitting Event
	events := Events{}

	eventValue := EventValue{}
	eventValue.EntityType = invoiceIndex
	eventValue.EntityID = invoice.Key.ID
	eventValue.Other = invoice.Value
	eventValue.Action = eventRejectInvoice

	events.Values = append(events.Values, eventValue)

	if err := events.emitEvent(stub); err != nil {
		message := fmt.Sprintf("Cannot emite event: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

// TODO: decide whether we need to have a possibility to query all bids after acceptance or not
// related changes: state machine for bids

//0		1		2			3
//0		Rate	FactorID	InvoiceID
func (cc *TradeFinanceChaincode) placeBid(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// check if caller is Factor
	// check specified invoice existence
	// check caller != owner
	// check invoice trade status
	// compose a bid from args
	// save bid
	Notifier(stub, NoticeRuningType)

	//checking role
	if err, result := checkAccessForUnit([][]string{Factor}, stub); err != nil || !result {
		message := fmt.Sprintf("this organizational unit is not allowed to place a bid")
		Logger.Error(message)
		return shim.Error(message)
	}

	//filling from arguments
	bid := Bid{}
	if err := bid.FillFromArguments(stub, args); err != nil {
		message := fmt.Sprintf("cannot fill a bid from arguments: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	//generating new bid ID and making Key
	bidID := uuid.Must(uuid.NewV4()).String()
	if err := bid.FillFromCompositeKeyParts([]string{bidID}); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	if ExistsIn(stub, &bid, bidIndex) {
		compositeKey, _ := bid.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("bid with the key %s already exist", compositeKey))
	}

	//setting automatic values
	creator, err := GetMSPID(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's MSPID: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("Creator: " + creator)

	bid.Value.FactorID = creator
	bid.Value.State = stateBidIssued
	bid.Value.Timestamp = time.Now().UTC().Unix()
	bid.Value.UpdatedDate = bid.Value.Timestamp

	//updating state in ledger
	if bytes, err := json.Marshal(bid); err == nil {
		Logger.Debug("Bid: " + string(bytes))
	}

	if err := UpdateOrInsertIn(stub, &bid, bidIndex, []string{""}, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//emitting Event
	events := Events{}

	eventValue := EventValue{}
	eventValue.EntityType = bidIndex
	eventValue.EntityID = bid.Key.ID
	eventValue.Other = bid.Value
	eventValue.Action = eventPlaceBid

	events.Values = append(events.Values, eventValue)

	if err := events.emitEvent(stub); err != nil {
		message := fmt.Sprintf("Cannot emite event: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

//0		1		2			3
//ID	Rate	FactorID	InvoiceID
func (cc *TradeFinanceChaincode) updateBid(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// check specified bid existence
	// check if caller is bid creator
	// edit bid
	// save bid
	Notifier(stub, NoticeRuningType)

	//checking role
	if err, result := checkAccessForUnit([][]string{Factor}, stub); err != nil || !result {
		message := fmt.Sprintf("this organizational unit is not allowed to place a bid")
		Logger.Error(message)
		return shim.Error(message)
	}

	//checking bid exist
	bid := Bid{}

	if err := bid.FillFromCompositeKeyParts(args[:bidKeyFieldsNumber]); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	if err := bid.FillFromArguments(stub, args); err != nil {
		message := fmt.Sprintf("cannot fill a bid from arguments: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	if !ExistsIn(stub, &bid, bidIndex) {
		compositeKey, _ := bid.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("bid with the key %s doesn't exist", compositeKey))
	}

	//loading current state from ledger
	bidToUpdate := Bid{}
	bidToUpdate.Key = bid.Key
	if err := LoadFrom(stub, &bidToUpdate, bidIndex); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//additional checking
	creator, err := GetMSPID(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's MSPID: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("Creator: " + creator)

	if bidToUpdate.Value.FactorID != creator {
		message := fmt.Sprintf("each factor can edit only his bid")
		Logger.Error(message)
		return shim.Error(message)
	}

	//setting new values
	bidToUpdate.Value.Rate = bid.Value.Rate
	bidToUpdate.Value.InvoiceID = bid.Value.InvoiceID
	bidToUpdate.Value.UpdatedDate = time.Now().UTC().Unix()

	//updating state in ledger
	if bytes, err := json.Marshal(bidToUpdate); err == nil {
		Logger.Debug("Bid: " + string(bytes))
	}

	if err := UpdateOrInsertIn(stub, &bidToUpdate, bidIndex, []string{""}, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//emitting Event
	events := Events{}

	eventValue := EventValue{}
	eventValue.EntityType = bidIndex
	eventValue.EntityID = bidToUpdate.Key.ID
	eventValue.Other = bidToUpdate.Value
	eventValue.Action = eventUpdateBid

	events.Values = append(events.Values, eventValue)

	if err := events.emitEvent(stub); err != nil {
		message := fmt.Sprintf("Cannot emite event: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

//0			1	2	3
//BidID		0	0	0
func (cc *TradeFinanceChaincode) cancelBid(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// check specified bid existence
	// check if caller is bid creator
	// delete bid
	Notifier(stub, NoticeRuningType)

	//checking role
	if err, result := checkAccessForUnit([][]string{Supplier}, stub); err != nil || !result {
		message := fmt.Sprintf("this organizational unit is not allowed to place a bid")
		Logger.Error(message)
		return shim.Error(message)
	}

	//checking bid exist
	bid := Bid{}
	if err := bid.FillFromCompositeKeyParts(args[:bidKeyFieldsNumber]); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	if !ExistsIn(stub, &bid, bidIndex) {
		compositeKey, _ := bid.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("bid with the key %s doesn't exist", compositeKey))
	}

	//loading current state from ledger
	bidToUpdate := Bid{}
	bidToUpdate.Key = bid.Key
	if err := LoadFrom(stub, &bidToUpdate, bidIndex); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//additional checking
	if bidToUpdate.Value.State != stateBidIssued {
		message := fmt.Sprintf("unable cancel bid with current state")
		Logger.Error(message)
		return shim.Error(message)
	}

	//setting new values
	bidToUpdate.Value.State = stateBidCanceled
	bidToUpdate.Value.UpdatedDate = time.Now().UTC().Unix()

	//updating state in ledger
	if bytes, err := json.Marshal(bidToUpdate); err == nil {
		Logger.Debug("Bid: " + string(bytes))
	}

	if err := UpdateOrInsertIn(stub, &bidToUpdate, bidIndex, []string{""}, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//emitting Event
	events := Events{}

	eventValue := EventValue{}
	eventValue.EntityType = bidIndex
	eventValue.EntityID = bidToUpdate.Key.ID
	eventValue.Other = bidToUpdate.Value
	eventValue.Action = eventCancelBid

	events.Values = append(events.Values, eventValue)

	if err := events.emitEvent(stub); err != nil {
		message := fmt.Sprintf("Cannot emite event: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

//0			1	2	3
//BidID		0	0	0
func (cc *TradeFinanceChaincode) acceptBid(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// check specified bid existence
	// check specified invoice existence
	// check if caller is invoice owner
	// check invoice trade status
	// check invoice due date
	// update invoice owner and trade status
	// save invoice
	// delete all bids for the invoice
	Notifier(stub, NoticeRuningType)

	//checking role
	if err, result := checkAccessForUnit([][]string{Supplier}, stub); err != nil || !result {
		message := fmt.Sprintf("this organizational unit is not allowed to place a bid")
		Logger.Error(message)
		return shim.Error(message)
	}

	//checking bid exist
	bid := Bid{}
	if err := bid.FillFromCompositeKeyParts(args[:bidKeyFieldsNumber]); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	if !ExistsIn(stub, &bid, bidIndex) {
		compositeKey, _ := bid.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("bid with the key %s doesn't exist", compositeKey))
	}

	//loading current state from ledger
	bidToUpdate := Bid{}
	bidToUpdate.Key = bid.Key
	if err := LoadFrom(stub, &bidToUpdate, bidIndex); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//additional checking
	if bidToUpdate.Value.State != stateBidIssued {
		message := fmt.Sprintf("unable cancel bid with current state")
		Logger.Error(message)
		return shim.Error(message)
	}

	//setting new values
	bidToUpdate.Value.State = stateBidAccepted
	bidToUpdate.Value.UpdatedDate = time.Now().UTC().Unix()

	//changing invoice state
	invoice := Invoice{}
	if err := invoice.FillFromCompositeKeyParts([]string{bidToUpdate.Value.InvoiceID}); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	if err := LoadFrom(stub, &invoice, invoiceIndex); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	invoice.Value.State = stateInvoiceSold
	invoice.Value.Owner = bidToUpdate.Value.FactorID
	invoice.Value.Beneficiary = bidToUpdate.Value.FactorID
	invoice.Value.UpdatedDate = time.Now().UTC().Unix()

	if bytes, err := json.Marshal(invoice); err == nil {
		Logger.Debug("Invoice: " + string(bytes))
	}

	if err := UpdateOrInsertIn(stub, &invoice, invoiceIndex, []string{""}, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//updating state in ledger
	if bytes, err := json.Marshal(bidToUpdate); err == nil {
		Logger.Debug("Bid: " + string(bytes))
	}

	if err := UpdateOrInsertIn(stub, &bidToUpdate, bidIndex, []string{""}, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	//emitting Event
	events := Events{}

	//event1 = invoiceSold
	eventValue := EventValue{}
	eventValue.EntityType = invoiceIndex
	eventValue.EntityID = invoice.Key.ID
	eventValue.Other = invoice.Value
	eventValue.Action = eventInvoiceSold
	events.Values = append(events.Values, eventValue)

	//event2 = acceptBid
	eventValue.EntityType = bidIndex
	eventValue.EntityID = bidToUpdate.Key.ID
	eventValue.Other = bidToUpdate.Value
	eventValue.Action = eventAcceptBid
	events.Values = append(events.Values, eventValue)

	if err := events.emitEvent(stub); err != nil {
		message := fmt.Sprintf("Cannot emite event: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

//0		1	2	3
//0		0	0	0
func (cc *TradeFinanceChaincode) listBids(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	Notifier(stub, NoticeRuningType)

	bids := []Bid{}
	bidsBytes, err := Query(stub, bidIndex, []string{}, CreateBid, EmptyFilter)
	if err != nil {
		message := fmt.Sprintf("unable to perform method: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	if err := json.Unmarshal(bidsBytes, &bids); err != nil {
		message := fmt.Sprintf("unable to unmarshal query result: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	resultBytes, err := joinByBidsAndInvoices(stub, bids)
	if err != nil {
		message := fmt.Sprintf("cannot join by bid and invoice: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	Logger.Debug("Result: " + string(resultBytes))

	Notifier(stub, NoticeSuccessType)
	return shim.Success(resultBytes)
}

//0
//InvoiceID
func (cc *TradeFinanceChaincode) listBidsForInvoice(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	Notifier(stub, NoticeRuningType)

	// checking invoice exist
	invoice := Invoice{}
	if err := invoice.FillFromCompositeKeyParts([]string{args[0]}); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	if !ExistsIn(stub, &invoice, "") {
		compositeKey, _ := invoice.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("invoice with the key %s doesn't exist", compositeKey))
	}

	filterByInvoice := func(data LedgerData) bool {
		bid, ok := data.(*Bid)
		if ok && bid.Value.InvoiceID == invoice.Key.ID {
			return true
		}

		return false
	}

	bids := []Bid{}
	bidsBytes, err := Query(stub, bidIndex, []string{}, CreateBid, filterByInvoice)
	if err != nil {
		message := fmt.Sprintf("unable to perform method: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	if err := json.Unmarshal(bidsBytes, &bids); err != nil {
		message := fmt.Sprintf("unable to unmarshal query result: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	resultBytes, err := joinByBidsAndInvoices(stub, bids)
	if err != nil {
		message := fmt.Sprintf("cannot join by bid and invoice: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	Logger.Debug("Result: " + string(resultBytes))

	Notifier(stub, NoticeSuccessType)
	return shim.Success(resultBytes)
}

//0		1	2	3	4	5	6
//0    0	0	0	0	0	0
func (cc *TradeFinanceChaincode) listInvoices(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	Notifier(stub, NoticeRuningType)

	invoices := []Invoice{}
	invoicesBytes, err := Query(stub, invoiceIndex, []string{}, CreateInvoice, EmptyFilter)
	if err != nil {
		message := fmt.Sprintf("unable to perform method: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	if err := json.Unmarshal(invoicesBytes, &invoices); err != nil {
		message := fmt.Sprintf("unable to unmarshal query result: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	resultBytes, err := json.Marshal(invoices)

	Logger.Debug("Result: " + string(resultBytes))

	Notifier(stub, NoticeSuccessType)
	return shim.Success(resultBytes)
}

func joinByBidsAndInvoices(stub shim.ChaincodeStubInterface, bids []Bid) ([]byte, error) {
	invoices := []Invoice{}
	invoicesBytes, err := Query(stub, invoiceIndex, []string{}, CreateInvoice, EmptyFilter)
	if err != nil {
		message := fmt.Sprintf("unable to perform method: %s", err.Error())
		Logger.Error(message)
		return nil, errors.New(message)
	}
	if err := json.Unmarshal(invoicesBytes, &invoices); err != nil {
		message := fmt.Sprintf("unable to unmarshal query result: %s", err.Error())
		Logger.Error(message)
		return nil, errors.New(message)
	}

	invoiceMap := make(map[InvoiceKey]InvoiceValue)
	for _, invoice := range invoices {
		invoiceMap[invoice.Key] = invoice.Value
	}

	result := []BidAdditional{}
	for _, bid := range bids {
		entry := BidAdditional{
			Key: bid.Key,
			Value: BidValueAdditional{
				Rate:        bid.Value.Rate,
				FactorID:    bid.Value.FactorID,
				InvoiceID:   bid.Value.InvoiceID,
				State:       bid.Value.State,
				Timestamp:   bid.Value.Timestamp,
				UpdatedDate: bid.Value.UpdatedDate,
			},
		}

		if invoiceValue, ok := invoiceMap[InvoiceKey{ID: entry.Value.InvoiceID}]; ok {
			entry.Value.Amount = invoiceValue.TotalDue
			entry.Value.Debtor = invoiceValue.Debtor
			entry.Value.Beneficiary = invoiceValue.Beneficiary
			entry.Value.PaymentDate = invoiceValue.PaymentDate
		}

		result = append(result, entry)
	}

	resultBytes, err := json.Marshal(result)
	return resultBytes, nil
}

func (cc *TradeFinanceChaincode) getEventPayload(stub shim.ChaincodeStubInterface, args []string) pb.Response {
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

func (events *Events) emitEvent(stub shim.ChaincodeStubInterface) error {

	for index, eventValues := range events.Values {
		eventAction := eventValues.Action
		eventID := uuid.Must(uuid.NewV4()).String()

		event := Event{}
		if err := event.FillFromCompositeKeyParts([]string{eventID}); err != nil {
			message := fmt.Sprintf(err.Error())
			return errors.New(message)
		}

		creator, err := GetMSPID(stub)
		if err != nil {
			message := fmt.Sprintf("cannot obtain creator's MSPID: %s", err.Error())
			Logger.Error(message)
			return errors.New(message)
		}

		config := Config{}
		if err := LoadFrom(stub, &config, configIndex); err != nil {
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
		eventName := eventIndex + "." + config.Value.ChaincodeName + "." + strconv.Itoa(eventAction) + "." + eventID
		events.Keys[index] = EventKey{ID: eventName}

		if err := UpdateOrInsertIn(stub, &event, eventIndex, []string{""}, ""); err != nil {
			message := fmt.Sprintf("persistence error: %s", err.Error())
			Logger.Error(message)
			return errors.New(message)
		}

		Logger.Info(fmt.Sprintf("Event set: %s without errors", string(bytes)))
		Logger.Debug(fmt.Sprintf("Success: Event set: %s", string(bytes)))
	}

	generalKey, err := json.Marshal(events.Keys)
	if err != nil {
		message := fmt.Sprintf("Error marshaling: %s", err.Error())
		return errors.New(message)
	}

	if err := stub.SetEvent(string(generalKey), nil); err != nil {
		message := fmt.Sprintf("Error setting event: %s", err.Error())
		return errors.New(message)
	}
	Logger.Debug(fmt.Sprintf("generalEventName: %s", string(generalKey)))

	return nil
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
	err := shim.Start(new(TradeFinanceChaincode))
	if err != nil {
		Logger.Error(err.Error())
	}
}
