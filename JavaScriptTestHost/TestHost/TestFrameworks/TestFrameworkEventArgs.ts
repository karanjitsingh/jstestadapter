import { Event, IEventArgs } from '../../Events/Event';
import { TestCase } from '../../ObjectModel/TestCase';
import { TestOutcome } from '../../ObjectModel/TestOutcome';

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
    Outcome: TestOutcome;
}

export interface TestSuiteEventArgs extends BaseTestEventArgs {
    Name: string;
}

export interface TestSessionEventArgs extends BaseTestEventArgs {
    SessionId: string;
}