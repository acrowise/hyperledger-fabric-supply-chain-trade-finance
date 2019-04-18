package main

import (
	"fmt"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
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

func (cc *TradeFinanceChaincode) registerInvoice(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// args: invoice fields
	// check role == Buyer or Supplier
	// validate args, including owner/buyer coincidence with caller
	// fill invoice from args
	// save invoice
	return shim.Success(nil)
}

func (cc *TradeFinanceChaincode) placeInvoice(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// args: invoice id
	// check specified invoice existence
	// check if caller is invoice owner
	// check invoice due date
	// check invoice trade status
	// update invoice trade status
	// save invoice
	return shim.Success(nil)
}

func (cc *TradeFinanceChaincode) removeInvoice(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// args: invoice id
	// check specified invoice existence
	// check if caller is invoice owner
	// check invoice trade status
	// update invoice trade status
	// save invoice
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
	return shim.Success(nil)
}

func (cc *TradeFinanceChaincode) editBid(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// check specified bid existence
	// check if caller is bid creator
	// edit bid
	// save bid
	return shim.Success(nil)
}

func (cc *TradeFinanceChaincode) cancelBid(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// check specified bid existence
	// check if caller is bid creator
	// delete bid
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
	return shim.Success(nil)
}

func (cc *TradeFinanceChaincode) listBids(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	return shim.Success(nil)
}

func (cc *TradeFinanceChaincode) listBidsForInvoice(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	return shim.Success(nil)
}

func (cc *TradeFinanceChaincode) listInvoices(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	return shim.Success(nil)
}

func main() {
	err := shim.Start(new(TradeFinanceChaincode))
	if err != nil {
		Logger.Error(err.Error())
	}
}