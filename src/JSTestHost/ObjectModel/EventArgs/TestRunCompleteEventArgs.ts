import { TestRunStatistics, AttachmentSet } from '../';
import { ISerializable } from '../../Utils/ISerializable';
import { CSharpException } from '../../Exceptions';

export interface TestRunCompleteEventArgs {
    TestRunStatistics: TestRunStatistics;
    IsCanceled: boolean;
    IsAborted: boolean;
    Error: CSharpException;
    AttachmentSets: Array<AttachmentSet>;
    ElapsedTimeInRunningTests: string;
    Metrics: { [id: string]: ISerializable };
}