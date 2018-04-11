import Event, { IEventArgs } from "../../Events/Event";
import IEnvironment from "../../Environment/IEnvironment";
import { TestCaseEventArgs, TestSuiteEventArgs, TestSessionEventArgs } from "./TestFrameworkEventArgs";

export default interface ITestFramework {
    onTestCaseStart: Event<TestCaseEventArgs>;
    onTestCaseEnd: Event<TestCaseEventArgs>;
    onTestSuiteStart: Event<TestSuiteEventArgs>;
    onTestSuiteEnd: Event<TestSuiteEventArgs>;
    onTestSessionStart: Event<TestSessionEventArgs>;
    onTestSessionEnd: Event<TestSessionEventArgs>;
    readonly ExecutorUri: string;

    StartExecution(source: string): Promise<void>;
    StartDiscovery(source: string): Promise<void>;
}