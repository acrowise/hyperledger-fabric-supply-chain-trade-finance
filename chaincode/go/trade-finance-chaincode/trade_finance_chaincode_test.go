package main

import (
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"testing"
	"fmt"
)

func getInitializedStub() *shim.MockStub {
	cc := new(TradeFinanceChaincode)
	stub := shim.NewMockStub("TradeFinanceChaincode", cc)
	stub.MockInit("1", [][]byte{[]byte("init"), []byte("b-f-Deals,b-g-Deals,c-f-Deals,c-g-Deals")})

	return stub
}

func toByteArray(arr []string) [][]byte {
	var res [][]byte
	for _, entry := range arr {
		res = append(res, []byte(entry))
	}

	return res
}

func TestInit(t *testing.T) {
	fmt.Println("###### Testinit is running. #####")
	stub := getInitializedStub()
	fmt.Println(stub)
	fmt.Println("###### Testinit is ending. #####")
}

func TestRegisterInvoice(t *testing.T) {
	fcnName := "registerInvoice"
	fmt.Printf("###### Test: %s is running. #####", fcnName)
	stub := getInitializedStub()

	var args []string;
	args = []string{
		fcnName,
		"1b671a64-40d5-491e-99b0-da01ff1f3341",
		"a",
		"b",
		"123.65",
		"1555668443",
		"0",
		"0",
		"",
	}

	response := stub.MockInvoke("1", toByteArray(args[:len(args)-1]))
	if response.Status != 200 {
		msg := fmt.Sprintf("Invoke %s is failed!", fcnName)
		t.Error(msg)
	}

	fmt.Printf("Result: %s", response.String())

	fmt.Printf("###### Test: %s is ending. #####", fcnName)
}