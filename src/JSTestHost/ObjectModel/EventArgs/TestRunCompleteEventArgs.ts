import { TestRunStatistics } from '../TestRunStatistics';
import { ISerializable } from '../ISerializable';

export interface TestRunCompleteEventArgs {
    TestRunStatistics: TestRunStatistics;
    IsCanceled: boolean;
    IsAborted: boolean;
    Error: ISerializable;
    AttachmentSets: Array<any>;
    ElapsedTimeInRunningTests: string;
    Metrics: { [id: string]: ISerializable };
}