import { TestCase, TestOutcome, IEventArgs } from '../Common';
import { FailedExpectation } from '.';
import { AttachmentSet } from '..';

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
    public InProgress: boolean;
    public EndTime: Date;

    constructor(sources: Array<string>, sessionId: string) {
        this.Sources = sources;
        this.SessionId = sessionId;
        this.StartTime =  new Date();
        this.InProgress = true;
    }

}

export interface TestErrorMessageEventArgs {
    Message: string;
}

export interface TestRunAttachmentEventArgs {
    AttachmentCollection: Array<AttachmentSet>;
}