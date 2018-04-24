import { TestCase } from './Common/TestCase';
import { TestOutcome } from './Common/TestOutcome';

export interface TestResult  {
    TestCase: TestCase;
    // Attachments have not been defined for javascript scenario
    Attachments: Array<any>;
    Outcome: TestOutcome;
    ErrorMessage: string;
    ErrorStackTrace: string;
    DisplayName: string;
    Messages: Array<TestResultMessage>;
    ComputerName: string;
    Duration: string;
    StartTime: Date;
    EndTime: Date;
}

export interface TestResultMessage {
    Category: string;
    Text: string;
}