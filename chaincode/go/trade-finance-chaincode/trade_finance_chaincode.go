package main

import (
	"fmt"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
	"encoding/json"
)

type TradeFinanceChaincode struct {
}

func (cc *TradeFinanceChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
	Logger.Debug("Init")

	_, args := stub.GetFunctionAndParameters()

	config := Config{}
	config.FillFromArguments(stub, args)

	if err := UpdateOrInsertIn(stub, &config, ""); err != nil {
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
	} else if function == "placeInvoice" {
		// Invoice owner places an invoice on the dashboard
		return cc.placeInvoice(stub, args)
	} else if function == "removeInvoice" {
		// Invoice owner removes the invoice from the dashboard
		return cc.removeInvoice(stub, args)
	} else if function == "placeBid" {
		// Factor places a bid for the invoice
		return cc.placeBid(stub, args)
	} else if function == "editBid" {
		// Factor edits the bid
		return cc.editBid(stub, args)
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
	}
	// (optional) add other query functions

	fnList := "{placeInvoice, removeInvoice, placeBid, editBid, cancelBid, acceptBid, " +
		"listBids, listBidsForInvoice, listInvoices}"
	message := fmt.Sprintf("invalid invoke function name: expected one of %s, got %s", fnList, function)
	Logger.Debug(message)

	return pb.Response{Status: 400, Message: message}
}

//0		1		2			3			4			5	6
//ID    Debtor	Beneficiary	TotalDue	DueDate		0	0
func (cc *TradeFinanceChaincode) registerInvoice(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// args: invoice fields
	// check role == Buyer or Supplier
	// validate args, including owner/buyer coincidence with caller
	// fill invoice from args
	// save invoice
	Notifier(stub, NoticeRuningType)

	allowedUnits := map[string] bool{
		Supplier: true,
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
		message := fmt.Sprintf("this unit is not allowed to register an invoice")
		Logger.Error(message)
		return shim.Error(message)
	}

	invoice := Invoice{}
	if err := invoice.FillFromArguments(stub, args); err != nil {
		message := fmt.Sprintf("cannot fill a invoice from arguments: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}

	if ExistsIn(stub, &invoice,  "") {
		compositeKey, _ := invoice.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("invoice with the key %s already exists", compositeKey))
	}

	invoice.Value.Owner = invoice.Value.Beneficiary
	invoice.Value.State = stateOrdinary

	if bytes, err := json.Marshal(invoice); err == nil {
		Logger.Debug("Invoice: " + string(bytes))
	}

	if err := UpdateOrInsertIn(stub, &invoice, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
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

	allowedUnits := map[string] bool{
		Supplier: true,
		Factor: true,
	}

	orgUnit, err := GetCreatorOrganizationalUnit(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's OrganizationalUnit from the certificate: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("OrganizationalUnit: " + orgUnit)

	if !allowedUnits[orgUnit] {
		message := fmt.Sprintf("this unit is not allowed to register an invoice")
		Logger.Error(message)
		return shim.Error(message)
	}

	invoice := Invoice{}
	if err := invoice.FillFromCompositeKeyParts(args[:invoiceKeyFieldsNumber]); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	if !ExistsIn(stub, &invoice,  "") {
		compositeKey, _ := invoice.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("invoice with the key %s doesn't exist", compositeKey))
	}

	if err := LoadFrom(stub, &invoice, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	creator, err := GetCreatorOrganization(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's name from the certificate: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("Creator: " + creator)

	if invoice.Value.Beneficiary != creator {
		message := fmt.Sprintf("only invoice owner can place an invoice")
		Logger.Error(message)
		return shim.Error(message)
	}

	if !CheckStateValidity(invoiceStateMachine, invoice.Value.State, stateForSale) {
		return shim.Error(fmt.Sprintf("invoice state cannot be updated from %d to %d",
			invoice.Value.State, stateForSale))
	}
	invoice.Value.State = stateForSale

	if bytes, err := json.Marshal(invoice); err == nil {
		Logger.Debug("Invoice: " + string(bytes))
	}

	if err := UpdateOrInsertIn(stub, &invoice, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

func (cc *TradeFinanceChaincode) removeInvoice(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// args: invoice id
	// check specified invoice existence
	// check if caller is invoice owner
	// check invoice trade status
	// update invoice trade status
	// save invoice
	Notifier(stub, NoticeRuningType)

	invoice := Invoice{}
	if err := invoice.FillFromCompositeKeyParts(args[:invoiceKeyFieldsNumber]); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	if !ExistsIn(stub, &invoice,  "") {
		compositeKey, _ := invoice.ToCompositeKey(stub)
		return shim.Error(fmt.Sprintf("invoice with the key %s doesn't exist", compositeKey))
	}

	if err := LoadFrom(stub, &invoice, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	creator, err := GetCreatorOrganization(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's name from the certificate: %s", err.Error())
		Logger.Error(message)
		return shim.Error(message)
	}
	Logger.Debug("Creator: " + creator)

	if invoice.Value.Beneficiary != creator {
		message := fmt.Sprintf("only invoice owner can remove an invoice")
		Logger.Error(message)
		return shim.Error(message)
	}

	if !CheckStateValidity(invoiceStateMachine, invoice.Value.State, stateRemoved) {
		return shim.Error(fmt.Sprintf("invoice state cannot be updated from %d to %d",
			invoice.Value.State, stateRemoved))
	}
	invoice.Value.State = stateRemoved

	if bytes, err := json.Marshal(invoice); err == nil {
		Logger.Debug("Invoice: " + string(bytes))
	}

	if err := UpdateOrInsertIn(stub, &invoice, ""); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

// TODO: decide whether we need to have a possibility to query all bids after acceptance or not
// related changes: state machine for bids

func (cc *TradeFinanceChaincode) placeBid(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// check if caller is Factor
	// check specified invoice existence
	// check caller != owner
	// check invoice trade status
	// compose a bid from args
	// save bid
	Notifier(stub, NoticeRuningType)
	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

func (cc *TradeFinanceChaincode) editBid(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// check specified bid existence
	// check if caller is bid creator
	// edit bid
	// save bid
	Notifier(stub, NoticeRuningType)
	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

func (cc *TradeFinanceChaincode) cancelBid(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// check specified bid existence
	// check if caller is bid creator
	// delete bid
	Notifier(stub, NoticeRuningType)
	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

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
	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

func (cc *TradeFinanceChaincode) listBids(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	Notifier(stub, NoticeRuningType)
	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

func (cc *TradeFinanceChaincode) listBidsForInvoice(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	Notifier(stub, NoticeRuningType)
	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

func (cc *TradeFinanceChaincode) listInvoices(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	Notifier(stub, NoticeRuningType)
	Notifier(stub, NoticeSuccessType)
	return shim.Success(nil)
}

func main() {
	err := shim.Start(new(TradeFinanceChaincode))
	if err != nil {
		Logger.Error(err.Error())
	}
}