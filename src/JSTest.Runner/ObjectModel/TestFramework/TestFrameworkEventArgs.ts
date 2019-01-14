import { FailedExpectation } from '.';
import { AttachmentSet } from '../AttachmentSet';
import { IEventArgs, TestCase, TestOutcome } from '../Common';

interface BaseTestEventArgs extends IEventArgs {
    StartTime: Date;
    InProgress: boolean;
    EndTime: Date;
}

export interface TestSpecEventArgs extends BaseTestEventArgs {
    TestCase: TestCase;
    FailedExpectations: Array<FailedExpectation>;
    Outcome: TestOutcome;
    Source: string;    
}

export interface TestSuiteEventArgs extends BaseTestEventArgs {
    Name: string;
    Source: string;    
}

export class TestSessionEventArgs implements BaseTestEventArgs {
    // tslint:disable:variable-name
    public readonly SessionId: string;
    public readonly Sources: Array<string>;
    public readonly StartTime: Date;
    public readonly RunAttachments: Array<AttachmentSet>;
    public InProgress: boolean;
    public EndTime: Date;

    constructor(sources: Array<string>, sessionId: string, runAttachments: Array<AttachmentSet>) {
        this.Sources = sources;
        this.SessionId = sessionId;
        this.StartTime =  new Date();
        this.InProgress = true;
        this.RunAttachments = runAttachments;
    }

}

export interface TestErrorMessageEventArgs {
    Message: string;
}