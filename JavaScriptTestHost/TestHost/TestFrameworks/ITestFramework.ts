import { Event, IEventArgs } from '../../Events/Event';
import { IEnvironment } from '../../Environment/IEnvironment';
import { TestCaseEventArgs, TestSuiteEventArgs, TestSessionEventArgs } from './TestFrameworkEventArgs';

export interface ITestFramework {
    onTestCaseStart: Event<TestCaseEventArgs>;
    onTestCaseEnd: Event<TestCaseEventArgs>;
    onTestSuiteStart: Event<TestSuiteEventArgs>;
    onTestSuiteEnd: Event<TestSuiteEventArgs>;
    onTestSessionStart: Event<TestSessionEventArgs>;
    onTestSessionEnd: Event<TestSessionEventArgs>;
    readonly executorUri: string;

    startExecution(source: string): void;
    startDiscovery(source: string): void;
}