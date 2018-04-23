import { TestCase, TestOutcome, IEventArgs } from '../Common';
import { FailedExpectation } from './FailedExpectation';

interface BaseTestEventArgs extends IEventArgs {
    // test case will have extra source
    Source: string;
    StartTime: Date;
    InProgress: boolean;
    EndTime: Date;
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