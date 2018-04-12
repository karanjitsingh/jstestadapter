import TestCase from "./TestCase";
import { TestOutcome } from "./TestOutcome";

export default class TestResult  {
	TestCase: TestCase;
	Attachments: Array<any>;    // TODO missing
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

export interface TestResultMessage
{
    Category: string;
    Text: string;
}

