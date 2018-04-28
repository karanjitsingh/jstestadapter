import { TestCase, TestOutcome } from './Common';
import { AttachmentSet } from '.';

export interface TestResult  {
    TestCase: TestCase;
    Attachments: Array<AttachmentSet>;
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