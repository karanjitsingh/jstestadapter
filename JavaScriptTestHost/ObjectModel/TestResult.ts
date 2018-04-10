import TestCase from "./TestCase";
import { TestOutcome } from "./TestOutcome";

export default interface TestResult {
	TestCase: TestCase;
	Attachments;    // TODO missing
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