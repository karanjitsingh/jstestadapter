import { TestCaseEventArgs, TestSuiteEventArgs, TestSessionEventArgs } from './TestFrameworkEventArgs';
import { IEvent } from '../Common';

export interface ITestFrameworkEvents {
    onTestCaseStart: IEvent<TestCaseEventArgs>;
    onTestCaseEnd: IEvent<TestCaseEventArgs>;
    onTestSuiteStart: IEvent<TestSuiteEventArgs>;
    onTestSuiteEnd: IEvent<TestSuiteEventArgs>;
    onTestSessionStart: IEvent<TestSessionEventArgs>;
    onTestSessionEnd: IEvent<TestSessionEventArgs>;
}