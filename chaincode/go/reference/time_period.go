package main

import (
	"errors"
	"strconv"
	"fmt"
	"time"
)

const (
	timePeriodArgumentsNumber = 2
)

type TimePeriod struct {
	From int64 `json:"timestamp"`
	To   int64 `json:"timestamp"`
}

func (t *TimePeriod) FillFromArguments(args []string) error {
	//0     1
	//From  To
	if len(args) < timePeriodArgumentsNumber {
		return errors.New(fmt.Sprintf("arguments array must contain at least %d items", timePeriodArgumentsNumber))
	}

	timePeriodFrom, err := strconv.ParseInt(args[0],10, 64)
	if err != nil {
		return errors.New(fmt.Sprintf("unable to parse the timePeriodFrom: %s", err.Error()))
	}

	if timePeriodFrom < 0 {
		return errors.New("timePeriodFrom must be larger than zero")
	}

	timePeriodTo, err := strconv.ParseInt(args[1],10, 64)
	if err != nil {
		return errors.New(fmt.Sprintf("unable to parse the timePeriodTo: %s", err.Error()))
	}
	//Detecting "Now" for timePeriodTo
	if timePeriodTo == 0 {
		timePeriodTo = time.Now().UTC().Unix()
	}

	if timePeriodTo < timePeriodFrom {
		return errors.New("timePeriodTo must be larger than timePeriodFrom")
	}

	t.From = int64(timePeriodFrom)
	t.To = int64(timePeriodTo)

	return nil
}
