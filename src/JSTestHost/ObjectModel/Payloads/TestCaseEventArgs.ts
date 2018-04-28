import { TestCase, TestOutcome } from '../Common';

interface TestCaseEventArgs {
    TestCaseId: string;
    TestCaseName: string;
    IsChildTestCase: boolean;
    TestElement: TestCase;
}

// tslint:disable-next-line
export interface TestCaseStartEventArgs extends TestCaseEventArgs {

}

export interface TestCaseEndEventArgs extends TestCaseEventArgs {
    TestOutcome: TestOutcome;
}