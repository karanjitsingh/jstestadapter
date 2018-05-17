import { TestSpecEventArgs, TestSuiteEventArgs, TestSessionEventArgs, TestErrorMessageEventArgs } from '.';
import { IEvent } from '../Common';

export interface ITestFrameworkEvents {
    onTestCaseStart: IEvent<TestSpecEventArgs>;
    onTestCaseEnd: IEvent<TestSpecEventArgs>;
    onTestSuiteStart: IEvent<TestSuiteEventArgs>;
    onTestSuiteEnd: IEvent<TestSuiteEventArgs>;
    onTestSessionStart: IEvent<TestSessionEventArgs>;
    onTestSessionEnd: IEvent<TestSessionEventArgs>;
    onErrorMessage: IEvent<TestErrorMessageEventArgs>;
}