
package main

import (
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
	"github.com/satori/go.uuid"
	"strings"
	"time"
	"errors"
	"sort"
	"strconv"
)

var logger = shim.NewLogger("MarketChaincode")

// MarketChaincode example simple Chaincode implementation
type MarketChaincode struct {
}

type dealQueryResultValue struct {
	Borrower  string  `json:"borrower"`
	Lender    string  `json:"lender"`
	Amount    float32 `json:"amount"`
	Rate      float32 `json:"rate"`
	Timestamp int64   `json:"timestamp"`
}

type dealQueryResult struct {
	Key   DealKey              `json:"key"`
	Value dealQueryResultValue `json:"value"`
}

func (t *MarketChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
	logger.Debug("Init")

	_, args := stub.GetFunctionAndParameters()

	if err := InitCollections(stub, args); err != nil {
		message := fmt.Sprintf("cannot init collections: %s", err.Error())
		logger.Error(message)
		return shim.Error(message)
	}

	return shim.Success(nil)
}

func (t *MarketChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	logger.Debug("Invoke")

	function, args := stub.GetFunctionAndParameters()
	if function == "placeBid" {
		// place a bid on the market
		return t.placeBid(stub, args)
	} else if function == "editBid" {
		return t.editBid(stub, args)
	} else if function == "cancelBid" {
		return t.cancelBid(stub, args)
	} else if function == "makeDeal" {
		return t.makeDeal(stub, args)
	} else if function == "queryBids" {
		return t.queryBids(stub, args)
	} else if function == "queryBidsForCreator" {
		return t.queryBidsForCreator(stub, args)
	} else if function == "queryDeals" {
		return t.queryDeals(stub, args)
	} else if function == "queryDealsByPeriod" {
	 	return t.queryDealsByPeriod(stub, args)
	} else if function == "queryDealsForCreatorByPeriod" {
		return t.queryDealsForCreatorByPeriod(stub, args)
	}

	return pb.Response{Status:403, Message:"Invalid invoke function name."}
}

func (t *MarketChaincode) placeBid(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("MarketChaincode.placeBid is running")
	logger.Debug("MarketChaincode.placeBid")

	if len(args) < bidBasicArgumentsNumber {
		message := fmt.Sprintf("insufficient number of arguments: expected %d, got %d",
			bidBasicArgumentsNumber, len(args))
		logger.Error(message)
		return shim.Error(message)
	}

	bid := Bid{}
	if err := bid.FillFromArguments(args); err != nil {
		message := fmt.Sprintf("cannot fill a bid from arguments: %s", err.Error())
		logger.Error(message)
		return shim.Error(message)
	}

	creator, err := GetCreatorOrganization(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's name from the certificate: %s", err.Error())
		logger.Error(message)
		return shim.Error(message)
	}

	logger.Debug("Creator: " + creator)

	bid.Key.ID = uuid.Must(uuid.NewV4()).String()

	bid.Value.Creator = creator
	bid.Value.Status = statusActive
	bid.Value.Timestamp = time.Now().UTC().Unix()

	if bytes, err := json.Marshal(bid); err == nil {
		logger.Debug("Bid: " + string(bytes))
	}

	if err := UpdateOrInsertIn(stub, &bid); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	logger.Info("MarketChaincode.placeBid exited without errors")
	logger.Debug("Success: MarketChaincode.placeBid")
	return shim.Success(nil)
}

func (t *MarketChaincode) editBid(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("MarketChaincode.editBid is running")
	logger.Debug("MarketChaincode.editBid")

	if len(args) < bidBasicArgumentsNumber + bidKeyFieldsNumber {
		message := fmt.Sprintf("insufficient number of arguments: expected %d, got %d",
			bidBasicArgumentsNumber + bidKeyFieldsNumber, len(args))
		logger.Error(message)
		return shim.Error(message)
	}

	var bid, bidToUpdate Bid
	if err := bid.FillFromCompositeKeyParts(args[:1]); err != nil {
        message := fmt.Sprintf("cannot fill a bid from arguments: %s", err.Error())
        logger.Error(message)
        return shim.Error(message)
    }

    bidToUpdate.Key.ID = bid.Key.ID
	if err := bid.FillFromArguments(args[1:]); err != nil {
		message := fmt.Sprintf("cannot fill a bid from arguments: %s", err.Error())
		logger.Error(message)
		return shim.Error(message)
	}

	logger.Debug("Bid to edit: " + bid.Key.ID)

	if !ExistsIn(stub, &bidToUpdate) {
		message := fmt.Sprintf("bid with ID %s not found", bid.Key.ID)
		logger.Error(message)
		return pb.Response{Status: 404, Message: message}
	}

	if err := LoadFrom(stub, &bidToUpdate); err != nil {
		message := fmt.Sprintf("cannot load existing bid: %s", err.Error())
		logger.Error(message)
		return pb.Response{Status: 404, Message: message}
	}

	creator, err := GetCreatorOrganization(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's name from the certificate: %s", err.Error())
		logger.Error(message)
		return shim.Error(message)
	}

	if bidToUpdate.Value.Creator != creator {
		message := "unable to edit a bid owned by not the creator"
		logger.Error(message)
		return pb.Response{Status: 403, Message: message}
	}

	if bidToUpdate.Value.Status != statusActive {
		message := fmt.Sprintf("unable to edit the bid: bid status is not Active")
		logger.Error(message)
		return shim.Error(message)
	}

	bidToUpdate.Value.Amount = bid.Value.Amount
	bidToUpdate.Value.Rate = bid.Value.Rate

    if bytes, err := json.Marshal(bidToUpdate); err == nil {
        logger.Debug("Bid: " + string(bytes))
    }

	if err := UpdateOrInsertIn(stub, &bidToUpdate); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	logger.Info("MarketChaincode.editBid exited without errors")
	logger.Debug("Success: MarketChaincode.editBid")
	return shim.Success(nil)
}

func (t *MarketChaincode) cancelBid(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("MarketChaincode.cancelBid is running")
	logger.Debug("MarketChaincode.cancelBid")

	if len(args) < bidKeyFieldsNumber {
		message := fmt.Sprintf("insufficient number of arguments: expected %d, got %d",
			bidKeyFieldsNumber, len(args))
		logger.Error(message)
		return shim.Error(message)
	}

	bid := Bid{}
	if err := bid.FillFromCompositeKeyParts(args[:1]); err != nil {
		message := fmt.Sprintf("cannot fill a bid from arguments: %s", err.Error())
		logger.Error(message)
		return shim.Error(message)
	}

	logger.Debug("Bid to cancel: " + bid.Key.ID)

	if !ExistsIn(stub, &bid) {
		message := fmt.Sprintf("bid with ID %s not found", bid.Key.ID)
		logger.Error(message)
		return pb.Response{Status: 404, Message: message}
	}

	if err := LoadFrom(stub, &bid); err != nil {
		message := fmt.Sprintf("cannot load existing bid: %s", err.Error())
		logger.Error(message)
		return pb.Response{Status: 404, Message: message}
	}

	creator, err := GetCreatorOrganization(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's name from the certificate: %s", err.Error())
		logger.Error(message)
		return shim.Error(message)
	}

	if bid.Value.Creator != creator {
		message := fmt.Sprintf(
			"no privileges to cancel specified bid from the side of organization %s", creator)
		logger.Error(message)
		return pb.Response{Status: 403, Message: message}
	}

	if bid.Value.Status != statusActive {
		message := fmt.Sprintf("unable to cancel the bid: bid status is not Active")
		logger.Error(message)
		return shim.Error(message)
	}

	bid.Value.Status = statusCancelled

	if bytes, err := json.Marshal(bid); err == nil {
		logger.Debug("Bid: " + string(bytes))
	}

	if err := UpdateOrInsertIn(stub, &bid); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	logger.Info("MarketChaincode.cancelBid exited without errors")
	logger.Debug("Success: MarketChaincode.cancelBid")
	return shim.Success(nil)
}

func (t *MarketChaincode) makeDeal(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("MarketChaincode.makeDeal is running")
	logger.Debug("MarketChaincode.makeDeal")

	if len(args) < bidKeyFieldsNumber {
		message := fmt.Sprintf("insufficient number of arguments: expected %d, got %d",
			bidKeyFieldsNumber, len(args))
		logger.Error(message)
		return shim.Error(message)
	}

	bid := Bid{}
	if err := bid.FillFromCompositeKeyParts(args[:1]); err != nil {
		message := fmt.Sprintf("cannot fill a bid from arguments: %s", err.Error())
		logger.Error(message)
		return shim.Error(message)
	}

	logger.Debug("Bid to accept: " + bid.Key.ID)

	if !ExistsIn(stub, &bid) {
		message := fmt.Sprintf("bid with ID %s not found", bid.Key.ID)
		logger.Error(message)
		return pb.Response{Status: 404, Message: message}
	}

	if err := LoadFrom(stub, &bid); err != nil {
		message := fmt.Sprintf("cannot load existing bid: %s", err.Error())
		logger.Error(message)
		return pb.Response{Status: 404, Message: message}
	}

	creator, err := GetCreatorOrganization(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's name from the certificate: %s", err.Error())
		logger.Error(message)
		return shim.Error(message)
	}

	if bid.Value.Creator == creator {
		message := "unable to make a deal on a bid owned by the creator"
		logger.Error(message)
		return pb.Response{Status: 403, Message: message}
	}

	if bid.Value.Status != statusActive {
		message := fmt.Sprintf("unable to accept the bid: bid status is not Active")
		logger.Error(message)
		return shim.Error(message)
	}

	bid.Value.Status = statusInactive

	var lender, borrower, participant string
	if bid.Value.Type == typeLend {
		lender, borrower = bid.Value.Creator, creator
		participant = lender
	} else { // typeBorrow
		lender, borrower = creator, bid.Value.Creator
		participant = borrower
	}

	deal := Deal {
		Key: DealKey {
			ID: uuid.Must(uuid.NewV4()).String(),
		},
		Value: DealValue {
			Amount: bid.Value.Amount,
			Rate: bid.Value.Rate,
			Timestamp: time.Now().UTC().Unix(),
		},
	}

	dealPrivateDetails := DealPrivateDetails {
		Key: deal.Key,
		Value: DealPrivateDetailsValue {
			Borrower: borrower,
			Lender: lender,
		},
	}

	if bytes, err := json.Marshal(deal); err == nil {
		logger.Debug("Deal: " + string(bytes))
	}

	if bytes, err := json.Marshal(dealPrivateDetails); err == nil {
		logger.Debug("DealPrivateDetails: " + string(bytes))
	}

	if err := UpdateOrInsertIn(stub, &bid); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	if err := UpdateOrInsertIn(stub, &deal); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	collectionName, err := getAppropriateCollectionName(stub, creator, participant)
	if err != nil {
		message := fmt.Sprintf("collection error: %s", err.Error())
		logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	if err := UpdateOrInsertInCollection(stub, &dealPrivateDetails, collectionName); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	logger.Info("MarketChaincode.makeDeal exited without errors")
	logger.Debug("Success: MarketChaincode.makeDeal")
	return shim.Success(nil)
}

func (t *MarketChaincode) queryBids(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("MarketChaincode.queryBids is running")
	logger.Debug("MarketChaincode.queryBids")

	result, err := Query(stub, bidIndex, []string{}, CreateBid, EmptyFilter)
	if err != nil {
		message := fmt.Sprintf("unable to perform query: %s", err.Error())
		logger.Error(message)
		return shim.Error(message)
	}

	logger.Debug("Result: " + string(result))

	logger.Info("MarketChaincode.queryBids exited without errors")
	logger.Debug("Success: MarketChaincode.queryBids")
	return shim.Success(result)
}

func (t *MarketChaincode) queryBidsForCreator(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("MarketChaincode.queryBidsForCreator is running")
	logger.Debug("MarketChaincode.queryBidsForCreator")

	creator, err := GetCreatorOrganization(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's name from the certificate: %s", err.Error())
		logger.Error(message)
		return shim.Error(message)
	}

	logger.Debug("Creator: " + creator)

	filterByCreator := func(data LedgerData) bool {
		bid, ok := data.(*Bid)
		if ok && bid.Value.Creator == creator {
			return true
		}

		return false
	}

	result, err := Query(stub, bidIndex, []string{}, CreateBid, filterByCreator)
	if err != nil {
		message := fmt.Sprintf("unable to perform query: %s", err.Error())
		logger.Error(message)
		return shim.Error(message)
	}

	logger.Debug("Result: " + string(result))

	logger.Info("MarketChaincode.queryBidsForCreator exited without errors")
	logger.Debug("Success: MarketChaincode.queryBidsForCreator")
	return shim.Success(result)
}

func (t *MarketChaincode) queryDeals(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("MarketChaincode.queryDeals is running")
	logger.Debug("MarketChaincode.queryDeals")

	dealsBytes, err := Query(stub, dealIndex, []string{}, CreateDeal, EmptyFilter)
	if err != nil {
		message := fmt.Sprintf("unable to perform query: %s", err.Error())
		logger.Error(message)
		return shim.Error(message)
	}

	logger.Debug("Deals: " + string(dealsBytes))

	creator, err := GetCreatorOrganization(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's name from the certificate: %s", err.Error())
		logger.Error(message)
		return shim.Error(message)
	}

	collectionsNames, err := getCollectionsNames(stub, creator)
	if err != nil {
		message := fmt.Sprintf("collection error: %s", err.Error())
		logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	dealsPrivateDetailsBytes, err := QueryPrivate(
		stub, dealPrivateDetailsIndex, []string{}, CreateDealPrivateDetails, EmptyFilter, collectionsNames)
	if err != nil {
		message := fmt.Sprintf("unable to perform query: %s", err.Error())
		logger.Error(message)
		return shim.Error(message)
	}

	logger.Debug("Deals details: " + string(dealsPrivateDetailsBytes))

	deals := []Deal{}
	if err := json.Unmarshal(dealsBytes, &deals); err != nil {
		message := fmt.Sprintf("unable to unmarshal deals query result: %s", err.Error())
		logger.Error(message)
		return shim.Error(message)
	}

	dealsPrivateDetails := []DealPrivateDetails{}
	if err := json.Unmarshal(dealsPrivateDetailsBytes, &dealsPrivateDetails); err != nil {
		message := fmt.Sprintf("unable to unmarshal deals query result: %s", err.Error())
		logger.Error(message)
		return shim.Error(message)
	}

	privateDetailsMap := make(map[DealKey]DealPrivateDetailsValue)
	for _, details := range dealsPrivateDetails {
		privateDetailsMap[details.Key] = details.Value
	}

	result := []dealQueryResult{}
	for _, deal := range deals {
		entry := dealQueryResult {
			Key: deal.Key,
			Value: dealQueryResultValue {
				Amount: deal.Value.Amount,
				Rate: deal.Value.Rate,
				Timestamp: deal.Value.Timestamp,
			},
		}

		if details, ok := privateDetailsMap[entry.Key]; ok {
			entry.Value.Borrower = details.Borrower
			entry.Value.Lender = details.Lender
		}

		result = append(result, entry)
	}

	resultBytes, err := json.Marshal(result)

	logger.Debug("Result: " + string(resultBytes))

	logger.Info("MarketChaincode.queryDeals exited without errors")
	logger.Debug("Success: MarketChaincode.queryDeals")
	return shim.Success(resultBytes)
}

func (t *MarketChaincode) queryDealsByPeriod(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("MarketChaincode.queryDealsByPeriod is running")
	logger.Debug("MarketChaincode.queryDealsByPeriod")

	if len(args) < timePeriodArgumentsNumber {
		message := fmt.Sprintf("insufficient number of arguments: expected %d, got %d",
			timePeriodArgumentsNumber, len(args))
		logger.Error(message)
		return shim.Error(message)
	}

	period := TimePeriod{}
	if err := period.FillFromArguments(args); err != nil {
		message := fmt.Sprintf("cannot fill a time period from arguments: %s", err.Error())
		logger.Error(message)
		return shim.Error(message)
	}

	logger.Debug("TimePeriodFrom: " + strconv.FormatInt(period.From,10))
	logger.Debug("TimePeriodTo: " + strconv.FormatInt(period.To,10))

	filterByPeriod := func(data LedgerData) bool {
		deal, ok := data.(*Deal)
		if ok && deal.Value.Timestamp >= period.From && deal.Value.Timestamp <= period.To {
			return true
		}
		return false
	}

	dealsBytes, err := Query(stub, dealIndex, []string{}, CreateDeal, filterByPeriod)
	if err != nil {
		message := fmt.Sprintf("unable to perform query: %s", err.Error())
		logger.Error(message)
		return shim.Error(message)
	}

	logger.Debug("Deals: " + string(dealsBytes))

	creator, err := GetCreatorOrganization(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's name from the certificate: %s", err.Error())
		logger.Error(message)
		return shim.Error(message)
	}

	collectionsNames, err := getCollectionsNames(stub, creator)
	if err != nil {
		message := fmt.Sprintf("collection error: %s", err.Error())
		logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	dealsPrivateDetailsBytes, err := QueryPrivate(
		stub, dealPrivateDetailsIndex, []string{}, CreateDealPrivateDetails, EmptyFilter, collectionsNames)
	if err != nil {
		message := fmt.Sprintf("unable to perform query: %s", err.Error())
		logger.Error(message)
		return shim.Error(message)
	}

	logger.Debug("Deals details: " + string(dealsPrivateDetailsBytes))

	deals := []Deal{}
	if err := json.Unmarshal(dealsBytes, &deals); err != nil {
		message := fmt.Sprintf("unable to unmarshal deals query result: %s", err.Error())
		logger.Error(message)
		return shim.Error(message)
	}

	dealsPrivateDetails := []DealPrivateDetails{}
	if err := json.Unmarshal(dealsPrivateDetailsBytes, &dealsPrivateDetails); err != nil {
		message := fmt.Sprintf("unable to unmarshal deals query result: %s", err.Error())
		logger.Error(message)
		return shim.Error(message)
	}

	privateDetailsMap := make(map[DealKey]DealPrivateDetailsValue)
	for _, details := range dealsPrivateDetails {
		privateDetailsMap[details.Key] = details.Value
	}

	result := []dealQueryResult{}
	for _, deal := range deals {
		entry := dealQueryResult {
			Key: deal.Key,
			Value: dealQueryResultValue {
				Amount: deal.Value.Amount,
				Rate: deal.Value.Rate,
				Timestamp: deal.Value.Timestamp,
			},
		}

		if details, ok := privateDetailsMap[entry.Key]; ok {
			entry.Value.Borrower = details.Borrower
			entry.Value.Lender = details.Lender
		}

		result = append(result, entry)
	}

	resultBytes, err := json.Marshal(result)

	logger.Debug("Result: " + string(resultBytes))

	logger.Info("MarketChaincode.queryDeals exited without errors")
	logger.Debug("Success: MarketChaincode.queryDeals")
	return shim.Success(resultBytes)
}

func (t *MarketChaincode) queryDealsForCreatorByPeriod(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("MarketChaincode.queryDealsForCreatorByPeriod is running")
	logger.Debug("MarketChaincode.queryDealsForCreatorByPeriod")

	if len(args) < timePeriodArgumentsNumber {
		message := fmt.Sprintf("insufficient number of arguments: expected %d, got %d",
			timePeriodArgumentsNumber, len(args))
		logger.Error(message)
		return shim.Error(message)
	}

	period := TimePeriod{}
	if err := period.FillFromArguments(args); err != nil {
		message := fmt.Sprintf("cannot fill a time period from arguments: %s", err.Error())
		logger.Error(message)
		return shim.Error(message)
	}

	logger.Debug("TimePeriodFrom: " + strconv.FormatInt(period.From,10))
	logger.Debug("TimePeriodTo: " + strconv.FormatInt(period.To,10))

	creator, err := GetCreatorOrganization(stub)
	if err != nil {
		message := fmt.Sprintf("cannot obtain creator's name from the certificate: %s", err.Error())
		logger.Error(message)
		return shim.Error(message)
	}

	logger.Debug("Creator: " + creator)

	collectionsNames, err := getCollectionsNames(stub, creator)
	if err != nil {
		message := fmt.Sprintf("collection error: %s", err.Error())
		logger.Error(message)
		return pb.Response{Status: 500, Message: message}
	}

	dealsPrivateDetailsBytes, err := QueryPrivate(
		stub, dealPrivateDetailsIndex, []string{}, CreateDealPrivateDetails, EmptyFilter, collectionsNames)
	if err != nil {
		message := fmt.Sprintf("unable to perform query: %s", err.Error())
		logger.Error(message)
		return shim.Error(message)
	}

	logger.Debug("Deals details: " + string(dealsPrivateDetailsBytes))

	dealsPrivateDetails := []DealPrivateDetails{}
	if err := json.Unmarshal(dealsPrivateDetailsBytes, &dealsPrivateDetails); err != nil {
		message := fmt.Sprintf("unable to unmarshal deals query result: %s", err.Error())
		logger.Error(message)
		return shim.Error(message)
	}

	result := []dealQueryResult{}
	for _, details := range dealsPrivateDetails {
		deal := Deal{Key: details.Key}
		if err := LoadFrom(stub, &deal); err != nil {
			message := fmt.Sprintf("cannot load existing deal: %s", err.Error())
			logger.Error(message)
			return pb.Response{Status: 404, Message: message}
		}


		if period.From <= deal.Value.Timestamp && period.To >= deal.Value.Timestamp {
			entry := dealQueryResult {
				Key: details.Key,
				Value: dealQueryResultValue {
					Borrower:  details.Value.Borrower,
					Lender:    details.Value.Lender,
					Amount:    deal.Value.Amount,
					Rate:      deal.Value.Rate,
					Timestamp: deal.Value.Timestamp,
				},
			}
			result = append(result, entry)
		}

	}

	resultBytes, err := json.Marshal(result)

	logger.Debug("Result: " + string(resultBytes))

	logger.Info("MarketChaincode.queryDeals exited without errors")
	logger.Debug("Success: MarketChaincode.queryDeals")
	return shim.Success(resultBytes)
}

func getCollectionsNames(stub shim.ChaincodeStubInterface, creator string) ([]string, error) {
	collections := Collections{OrganizationName: creator}
	if err := LoadFrom(stub, &collections); err != nil {
		return nil, err
	}

	return collections.AvailableCollections, nil
}

func getAppropriateCollectionName(stub shim.ChaincodeStubInterface, creator, participant string) (string, error) {
	collections := Collections{OrganizationName: creator}
	if err := LoadFrom(stub, &collections); err != nil {
		return "", err
	}

	var collectionNamePart string
	if strings.Compare(creator, participant) < 0 {
		collectionNamePart = fmt.Sprintf("%s-%s", creator, participant)
	} else {
		collectionNamePart = fmt.Sprintf("%s-%s", participant, creator)
	}

	for _, collectionName := range collections.AvailableCollections {
		if strings.Contains(collectionName, collectionNamePart) {
			return collectionName, nil
		}
	}

	return "", errors.New("appropriate collection wasn't found")
}

func getOrganization(certificate []byte) (string, error) {
	data := certificate[strings.Index(string(certificate), "-----") : strings.LastIndex(string(certificate), "-----")+5]
	block, _ := pem.Decode([]byte(data))
	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return "", err
	}
	organization := cert.Issuer.Organization[0]
	return strings.Split(organization, ".")[0], nil
}

func GetCreatorOrganization(stub shim.ChaincodeStubInterface) (string, error) {
	certificate, err := stub.GetCreator()
	if err != nil {
		return "", err
	}
	return getOrganization(certificate)
}

func InitCollections(stub shim.ChaincodeStubInterface, args []string) (error) {
	// 0
	// arrayInJSON
	type Organization struct{
		Name    string `json:"name"`
	}
	allOrganizations := []Organization{}

	// ==== Input sanitation ====
	logger.Debug("Start init Collections")
	if len(args[0]) == 0 {
		return errors.New("1st argument must be a non-empty string")
	}

	arrayInJSON := string(args[0])

	arrayInJSON = strings.Replace(arrayInJSON, "\\", "", -1)

	logger.Debug("Received JSON: " + arrayInJSON)

	if err := json.Unmarshal([]byte(arrayInJSON), &allOrganizations); err != nil {
		message := fmt.Sprintf("Failed to convert JSON to slice of struct: %s", err.Error())
		logger.Error(message)
		return errors.New(message)
	}

	var orgNames = []string{}

	for _, org := range allOrganizations {
		orgNames = append(orgNames, org.Name)
	}

	fmt.Println(allOrganizations)
	sort.Sort(sort.StringSlice(orgNames))

	//Search of All Organizations
	for indexOrg, org := range orgNames {
		logger.Debug("Organization name: " + string(org))
		collections := Collections{}
		collections.OrganizationName = string(org)

		//The search of elements above
		elementsLeft := orgNames[:indexOrg]
		for _, orgLeft := range elementsLeft {
			collectionName := string(orgLeft + "-" + org + "-" + "Deals")
			collections.AvailableCollections = append(collections.AvailableCollections, collectionName)
		}

		//The search of elements bellow
		elementsRight := orgNames[indexOrg + 1:]
		for _, orgRight := range elementsRight {
			collectionName := string(org + "-" + orgRight + "-" + "Deals")
			collections.AvailableCollections = append(collections.AvailableCollections, collectionName)
		}

		if bytes, err := json.Marshal(collections.AvailableCollections); err == nil {
			logger.Debug("Collections: " + string(bytes))
		}

		//Put available collections for the organization in the ledger
		if err := UpdateOrInsertIn(stub, &collections); err != nil {
			message := fmt.Sprintf("persistence error: %s", err.Error())
			logger.Error(message)
			return err
		}
	}
	logger.Debug("End init Collections")
	return nil
}

func main() {
	err := shim.Start(new(MarketChaincode))
	if err != nil {
		logger.Error(err.Error())
	}
}
