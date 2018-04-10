import TestCase from "./TestCase";
import TestResult from "./TestResult";
import { TestRunStatistics } from "./TestRunStatistics";

export interface TestRunChangedEventArgs
{
	NewTestResults: Array<TestResult>;
	TestRunStatistics: TestRunStatistics;
	ActiveTests: Array<TestCase>;
}