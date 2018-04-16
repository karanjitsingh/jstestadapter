import { TestRunChangedEventArgs } from "./TestRunChangedEventArgs";
import { TestRunCompleteEventArgs } from "../EventArgs/TestRunCompleteEventArgs";

export interface TestRunCompletePayload
{
    TestRunCompleteArgs: TestRunCompleteEventArgs;
    LastRunTests: TestRunChangedEventArgs;
    RunAttachments: Array<any>;
    ExecutorUris: Array<string>;
}