import { TestCase, TestOutcome, IEventArgs } from '../Common';
import { FailedExpectation } from '.';

interface BaseTestEventArgs extends IEventArgs {
    Source: string;
    StartTime: Date;
    InProgress: boolean;
    EndTime: Date;
}

export interface TestSpecEventArgs extends BaseTestEventArgs {
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