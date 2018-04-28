import { TestCase } from '../Common';
import { TestResult, TestRunStatistics } from '../';

export interface TestRunChangedEventArgs {
    NewTestResults: Array<TestResult>;
    TestRunStatistics: TestRunStatistics;
    ActiveTests: Array<TestCase>;
}