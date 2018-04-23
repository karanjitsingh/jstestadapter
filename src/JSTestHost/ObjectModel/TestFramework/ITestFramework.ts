import { Event } from '../../Events/Event';
import { TestCaseEventArgs, TestSuiteEventArgs, TestSessionEventArgs } from './TestFrameworkEventArgs';
import { EnvironmentType } from '../Common/EnvironmentType';

export interface ITestFramework {
    onTestCaseStart: Event<TestCaseEventArgs>;
    onTestCaseEnd: Event<TestCaseEventArgs>;
    onTestSuiteStart: Event<TestSuiteEventArgs>;
    onTestSuiteEnd: Event<TestSuiteEventArgs>;
    onTestSessionStart: Event<TestSessionEventArgs>;
    onTestSessionEnd: Event<TestSessionEventArgs>;
    readonly executorUri: string;
    readonly environmentType: EnvironmentType;

    startExecution(source: string): void;
    startDiscovery(source: string): void;
}