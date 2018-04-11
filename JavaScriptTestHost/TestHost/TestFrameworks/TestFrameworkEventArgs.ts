import Event, { IEventArgs } from "Events/Event";
import TestCase from "../../ObjectModel/TestCase";

interface BaseTestEventArgs extends IEventArgs {
    // test case will have extra source
    Source: string;
    StartTime: Date;
    InProgress: boolean;
    EndTime: Date;
}

export interface FailedExpectation {
    Message: string;
    StackTrace: string;
}

export interface TestCaseEventArgs extends BaseTestEventArgs {
    TestCase: TestCase;
    FailedExpectations: Array<FailedExpectation>;
    Passed: boolean;
}

export interface TestSuiteEventArgs extends BaseTestEventArgs {
    Name: string;
}

export interface TestSessionEventArgs extends BaseTestEventArgs {

}