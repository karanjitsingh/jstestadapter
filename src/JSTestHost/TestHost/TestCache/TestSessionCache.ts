import { IEnvironment } from '../../Environment/IEnvironment';
import { TestSessionEventArgs } from '../../ObjectModel/TestFramework';
import { IEvent } from 'ObjectModel/Common';

export interface TestSessionsCompleteEventArgs {
    TestSessionList: Array<TestSessionEventArgs>;
}

export class TestSessionCache {
    private testSessionBucket: Map<string, TestSessionEventArgs>;
    private sessionCompleteCount: number;
    private sessionCount: number;
    public onSessionsComplete: IEvent<TestSessionsCompleteEventArgs>;
    
    constructor(environment: IEnvironment, sessionCount: number) {
        this.sessionCount = 0;
        this.sessionCompleteCount = 0;
    }

    public sessionComplete(args: TestSessionEventArgs) {

    }

    public sessionCompleteWithErrors(source: string, err: Error) {
        
    }

    private checkAllSessionsComplete() {
        if (this.sessionCount === this.sessionCompleteCount) {
            this.onSessionsComplete.raise(this, <TestSessionsCompleteEventArgs> {
                TestSessionList: this.testSessionBucket.values().toArray();
            })
        }
    }
}