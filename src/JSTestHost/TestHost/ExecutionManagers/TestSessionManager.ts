import { IEnvironment } from '../../Environment/IEnvironment';
import { TestSessionEventArgs } from '../../ObjectModel/TestFramework';
import { IEvent, IEventArgs } from '../../ObjectModel/Common';

interface TestSession {
    Source: string;
    TestSessionEventArgs: TestSessionEventArgs;
    Job: () => void;
    ErrorCallback: (err: Error) => void;
}

export class TestSessionManager {
    private testSessionBucket: Map<string, TestSessionEventArgs>;
    private sessionCompleteCount: number;
    private sessionCount: number;
    public onSessionsComplete: IEvent<IEventArgs>;
    
    constructor(environment: IEnvironment) {
        this.sessionCount = 0;
        this.sessionCompleteCount = 0;
        this.onSessionsComplete = environment.createEvent();
        this.testSessionBucket = new Map();
    }

    public setSessionComplete(args: TestSessionEventArgs) {
        this.sessionCompleteCount++;
        this.testSessionBucket.set(args.Source, args);

        // Check for all session completion
        if (this.sessionCount === this.sessionCompleteCount) {
            this.onSessionsComplete.raise(this, {});
        }
    }

    public addSession(source: string, job: () => void, errorCallback: (err: Error) => void) {
        const testSession = <TestSession> {
            Source: source,
            TestSessionEventArgs: null,
            Job: job,
            ErrorCallback: errorCallback
        };

        this.testSessionBucket.set(source, null);
        this.sessionCount++;
        this.runSessionInDomain(testSession);
    }

    public updateSessionEventArgs(args: TestSessionEventArgs) {
        this.testSessionBucket.set(args.Source, args);
    }

    public getSessionEventArgs(source: string): TestSessionEventArgs {
        return this.testSessionBucket.get(source);
    }

    private runSessionInDomain(testSession: TestSession) {
        // tslint:disable-next-line:no-require-imports
        const domain = require('domain');

        const executionDomain = domain.create();
        try {
            executionDomain.on('error', (err: Error) => {
                // this.sessionComplete(source, null, err);
                testSession.ErrorCallback(err);
            });
            executionDomain.run(() => {
                // this.codecoverage.startCoverage(executeJob);
                testSession.Job();
            });
        } catch (err) {
            console.error('domain did not catch the error. hmmmm');
            // this.sessionComplete(source, null, err);
            testSession.ErrorCallback(err);
            // TODO log message
        }
    }
}