import Event, { IEventArgs } from "../../Events/Event";
import IEnvironment from "../../Environment/IEnvironment";

export interface TestFrameWorkEventArgs extends IEventArgs {

}

export default interface ITestFramework {
    onTestCaseStart: Event<TestFrameWorkEventArgs>;
    onTestCaseEnd: Event<TestFrameWorkEventArgs>;
    onTestSuiteStart: Event<TestFrameWorkEventArgs>;
    onTestSuiteEnd: Event<TestFrameWorkEventArgs>;
    onTestSessionStart: Event<TestFrameWorkEventArgs>;
    onTestSessionEnd: Event<TestFrameWorkEventArgs>;
    
    StartExecution(source: string): void;
    StartDiscovery(source: string): void;
}