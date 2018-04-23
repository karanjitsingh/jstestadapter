import { TestRunStatistics } from '../TestRunStatistics';
import { ISerializable } from '../../Utils/ISerializable';
import { CSharpException } from '../../Exceptions/CSharpException';

export interface TestRunCompleteEventArgs {
    TestRunStatistics: TestRunStatistics;
    IsCanceled: boolean;
    IsAborted: boolean;
    Error: CSharpException;
    AttachmentSets: Array<any>;
    ElapsedTimeInRunningTests: string;
    Metrics: { [id: string]: ISerializable };
}