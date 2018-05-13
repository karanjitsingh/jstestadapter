import { TestCase } from '../Common';
import { TestResult } from '..';

export interface TestCaseStartEventArgs {
    TestCase: TestCase;
}

export interface TestCaseEndEventArgs {
    TestResult: TestResult;
}

export interface TestCaseFoundEventArgs {
    TestCase: TestCase;
}