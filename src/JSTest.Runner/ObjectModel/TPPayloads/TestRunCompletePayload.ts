import { TestRunChangedEventArgs } from './TestRunChangedEventArgs';
import { AttachmentSet } from '../';
import { TestRunCompleteEventArgs } from '../EventArgs/TestRunCompleteEventArgs';

export interface TestRunCompletePayload {
    TestRunCompleteArgs: TestRunCompleteEventArgs;
    LastRunTests: TestRunChangedEventArgs;
    RunAttachments: Array<AttachmentSet>;
    ExecutorUris: Array<string>;
}