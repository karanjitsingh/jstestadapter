import { TestCase, TestOutcome, IEventArgs } from '../Common';
import { FailedExpectation } from '.';
import { Md5 } from '../../Utils/Hashing/MD5';

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

    constructor(sources: Array<string>) {
        this.Sources = sources;
        this.SessionId = TestSessionEventArgs.GENERATE_SESSION_ID(this.Sources);
        this.StartTime =  new Date();
    }

    public static GENERATE_SESSION_ID(sources: Array<string>): string {
        const hash = new Md5();
        sources.forEach(source => {
            hash.appendStr(source);
        });
        return hash.getGuid();
    }
}