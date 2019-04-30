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
	} else if function == "acceptOrder" {
		// Supplier accepts order, a new contract is stored in a Buyer-Supplier collection
		return cc.acceptOrder(stub, args)
	} else if function == "generateProof" {
		// Supplier generates a proof for an Auditor
		return cc.generateProof(stub, args)
	} else if function == "acceptContract" {
		// Buyer or Auditor accepts the contract, acceptance details are stored in the Buyer-Supplier collection
		return cc.acceptContract(stub, args)
	} else if function == "rejectContract" {
		// Buyer or Auditor rejects the contract, acceptance details are stored in the Buyer-Supplier collection
		return cc.rejectContract(stub, args)
	} else if function == "listOrders" {
		// List all orders
		return cc.listOrders(stub, args)
	} else if function == "listContracts" {
		// List contracts for the party from every collection
		return cc.listContracts(stub, args)
	} else if function == "getProofForContract" {
		// Returns a proof for the Auditor for the specified contract
		return cc.getProofForContract(stub, args)
	} else if function == "listAcceptances" {
		// List all acceptance details for the contract
		return cc.listAcceptances(stub, args)
	}
	// (optional) add other query functions

	fnList := "{placeOrder, acceptOrder, generateProof, acceptContract, listOrders, listContracts, getProofForContract, listAcceptances}"
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

func (cc *SupplyChainChaincode) generateProof(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// args: auditor name/id/etc, contract id, fields included in proof (true/false for each of the contract's fields)
	// check role == Supplier
	// check proof existence (to avoid multiple generations)
	// check contract existence
	// generate proof
	// save proof to Buyer-Supplier collection
	return shim.Success(nil)
}

func (cc *SupplyChainChaincode) acceptContract(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// args: contract id, (optional) Auditor's or Buyer's docs
	// check role == Auditor or Buyer
	// if Buyer:
	//   set contract status to "waiting for payment"
	//   update contract (with acceptance details as well)
	// if Auditor:
	//   compose an acceptance details struct (docs, accepted/rejected, reason...)
	//   store info in the Buyer-Supplier collection
	return shim.Success(nil)
}

func (cc *SupplyChainChaincode) rejectContract(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// args: contract id, (optional) Auditor's or Buyer's docs
	// check role == Auditor or Buyer
	// if Buyer:
	//   set contract status to "rejected"
	//   update contract (with acceptance details as well)
	// if Auditor:
	//   compose an acceptance details struct (docs, accepted/rejected, reason...)
	//   store info in the Buyer-Supplier collection
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

func (cc *SupplyChainChaincode) getProofForContract(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// args: contract id
	// check role == Auditor
	// check proof for contract id and Auditor's name/id/etc existence
	// validate proof
	// return proof
	return shim.Success(nil)
}

func (cc *SupplyChainChaincode) listAcceptances(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// args: contract id
	// list all acceptance details structs bound to the contract
	return shim.Success(nil)
}

func main() {
	err := shim.Start(new(SupplyChainChaincode))
	if err != nil {
		logger.Error(err.Error())
	}
}
