import Event, { IEventArgs } from "../../Events/Event";
import IEnvironment from "../../Environment/IEnvironment";

export interface TestFrameWorkEventArgs extends IEventArgs {

}

export default interface ITestFramework {
    onTestCaseStart: Event<TestFrameWorkEventArgs>;
    onTestCaseEnd: Event<TestFrameWorkEventArgs>;
    onTestSessionStart: Event<TestFrameWorkEventArgs>;
    onTestSessionEnd: Event<TestFrameWorkEventArgs>;
    onFileStart: Event<TestFrameWorkEventArgs>;
    onFileEnd: Event<TestFrameWorkEventArgs>;
    
    StartExecution(sources: Array<string>): void;
    StartDiscovery(sources: Array<string>): void;
}