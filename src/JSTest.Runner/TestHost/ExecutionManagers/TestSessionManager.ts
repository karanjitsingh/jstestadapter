import { IEnvironment } from '../../Environment/IEnvironment';
import { TestSessionEventArgs } from '../../ObjectModel/TestFramework';
import { IEvent, IEventArgs } from '../../ObjectModel/Common';

interface TestSession {
    Source: string;
    TestSessionEventArgs: TestSessionEventArgs;
    Job: () => void;
    ErrorCallback: (err: Error) => void;
    Complete: boolean;
}

export class TestSessionManager {
    private testSessionBucket: Map<string, TestSession>;
    private testSessionIterator: IterableIterator<TestSession>;
    private sessionCompleteCount: number;
    private sessionCount: number;
    public onAllSessionsComplete: IEvent<IEventArgs>;
    
    constructor(environment: IEnvironment) {
        this.sessionCount = 0;
        this.sessionCompleteCount = 0;
        this.onAllSessionsComplete = environment.createEvent();
        this.testSessionBucket = new Map();
        this.testSessionIterator = this.testSessionBucket.values();
    }

    public setSessionComplete(args: TestSessionEventArgs) {
        const testSession = this.testSessionBucket.get(args.Source);
        testSession.TestSessionEventArgs = args;
        if (!testSession.Complete) {
            this.sessionCompleteCount++;

            const nextSession = this.testSessionIterator.next();

            if (!nextSession.done) {
                this.runSessionInDomain(nextSession.value);
            }
        }
        testSession.Complete = true;

        this.testSessionBucket.set(args.Source, testSession);

        // Check for all session completion
        if (this.sessionCount === this.sessionCompleteCount) {
            this.onAllSessionsComplete.raise(this, {});
        }
    }

    public addSession(source: string, job: () => void, errorCallback: (err: Error) => void) {
        const testSession = <TestSession> {
            Source: source,
            TestSessionEventArgs: null,
            Job: job,
            ErrorCallback: errorCallback,
            Complete: false
        };

        this.testSessionBucket.set(source, testSession);
        this.sessionCount++;

        if (this.sessionCount === 1) {
            this.runSessionInDomain(this.testSessionIterator.next().value);
        }
    }

    public updateSessionEventArgs(args: TestSessionEventArgs) {
        const testSession = this.testSessionBucket.get(args.Source);
        testSession.TestSessionEventArgs = args;
        this.testSessionBucket.set(args.Source, testSession);
    }

    public getSessionEventArgs(source: string): TestSessionEventArgs {
        return this.testSessionBucket.get(source).TestSessionEventArgs;
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