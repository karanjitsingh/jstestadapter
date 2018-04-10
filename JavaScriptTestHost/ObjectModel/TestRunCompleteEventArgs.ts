import { TestRunStatistics } from "./TestRunStatistics";

export interface TestRunCompleteEventArgs
{
    TestRunStatistics: TestRunStatistics;
    IsCanceled: boolean;
    IsAborted: boolean;
    Error: object;              // TODO SERIALIZED EXCEPTION
    AttachmentSets: Array<any>;
    ElapsedTimeInRunningTests: string;
    Metrics: { [id: string]: object };
}