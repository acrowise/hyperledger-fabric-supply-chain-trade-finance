package main

import (
	"fmt"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

var logger = shim.NewLogger("SupplyChainChaincode")

type SupplyChainChaincode struct {
}

func (cc *SupplyChainChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
	logger.Debug("Init")

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
	}
	// (optional) add other query functions

	fnList := "{placeOrder, editOrder, cancelOrder, acceptOrder, " +
		"requestShipment, confirmShipment, uploadDocument, " +
		"generateProof, verifyProof, submitReport, " +
		"acceptInvoice, rejectInvoice, " +
		"listOrders, listContracts, listProofs, listReports}"
	message := fmt.Sprintf("invalid invoke function name: expected one of %s, got %s", fnList, function)
	logger.Debug(message)

	return pb.Response{Status: 400, Message: message}
}

func (cc *SupplyChainChaincode) placeOrder(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// args: <order fields>
	// check role == Buyer
	// validate order fields
	// compose order
	// save order into the ledger
	return shim.Success(nil)
}

func (cc *SupplyChainChaincode) editOrder(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	return shim.Success(nil)
}

func (cc *SupplyChainChaincode) cancelOrder(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	return shim.Success(nil)
}

func (cc *SupplyChainChaincode) acceptOrder(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// args: order id
	// check role == Supplier
	// check order existence
	// check order status (should not be taken by another Supplier)
	// compose contract
	// update order status
	// save order to common ledger
	// save contract to Buyer-Supplier collection
	return shim.Success(nil)
}

func (cc *SupplyChainChaincode) requestShipment(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	return shim.Success(nil)
}

func (cc *SupplyChainChaincode) confirmShipment(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	return shim.Success(nil)
}

func (cc *SupplyChainChaincode) uploadDocument(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	return shim.Success(nil)
}

func (cc *SupplyChainChaincode) generateProof(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// args: auditor name/id/etc, contract id, fields included in proof (true/false for each of the contract's fields)
	// check role == Supplier
	// check proof existence (to avoid multiple generations)
	// check contract existence
	// generate proof
	// save proof to Buyer-Supplier collection
	return shim.Success(nil)
}

func (cc *SupplyChainChaincode) verifyProof(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	return shim.Success(nil)
}

func (cc *SupplyChainChaincode) submitReport(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	return shim.Success(nil)
}

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
	return shim.Success(nil)
}

func (cc *SupplyChainChaincode) rejectInvoice(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// args: contract id, docs, (optional) description
	// check role == Buyer
	// check contract existence
	// check contract status (to avoid logical conflict, e.g. reject contract accepted previously)
	// add docs to Shipment (with description optionally)
	// set contract status to "rejected" (or some other final one)
	// save Shipment, Contract to collection
	return shim.Success(nil)
}

func (cc *SupplyChainChaincode) listOrders(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// list all of the orders in common channel
	// (optional) filter entries by status
	return shim.Success(nil)
}

func (cc *SupplyChainChaincode) listContracts(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// check role == Buyer or Supplier
	// list all of the contracts for the caller from all collections
	return shim.Success(nil)
}

func (cc *SupplyChainChaincode) listProofs(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// check role == Auditor
	// list all proofs for Auditor's name/id/etc
	return shim.Success(nil)
}

func (cc *SupplyChainChaincode) listReports(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// args: contract id
	// list all Auditors' reports related to the contract
	return shim.Success(nil)
}

func main() {
	err := shim.Start(new(SupplyChainChaincode))
	if err != nil {
		logger.Error(err.Error())
	}
}