import { IEnvironment } from '../../Environment/IEnvironment';
import { TestSessionEventArgs } from '../../ObjectModel/TestFramework';
import { IEvent, IEventArgs } from '../../ObjectModel/Common';
import { SessionHash } from '../../Utils/Hashing/SessionHash';

interface TestSession {
    Sources: Array<string>;
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
    
    public static instance: TestSessionManager;
    
    protected constructor(environment: IEnvironment) {
        this.sessionCount = 0;
        this.sessionCompleteCount = 0;
        this.onAllSessionsComplete = environment.createEvent();
        this.testSessionBucket = new Map();
        this.testSessionIterator = this.testSessionBucket.values();
    }

    public static INITIALIZE(environment: IEnvironment) {
        if (!TestSessionManager.instance) {
            TestSessionManager.instance = new TestSessionManager(environment);
        }
    }

    public setSessionComplete(args: TestSessionEventArgs) {
        const testSession = this.testSessionBucket.get(args.SessionId);
        testSession.TestSessionEventArgs = args;

        this.continueNextSession(testSession);
    }

    public addSession(sources: Array<string>, job: () => void, errorCallback: (err: Error) => void) {
        const testSession = <TestSession> {
            Sources: sources,
            TestSessionEventArgs: null,
            Job: job,
            ErrorCallback: errorCallback,
            Complete: false
        };

        this.testSessionBucket.set(SessionHash(sources), testSession);
        this.sessionCount++;

        // TODO should warn if same session id generate
    }

    public executeSessionJobs() {
        this.runSessionInDomain(this.testSessionIterator.next().value);        
    }

    public updateSessionEventArgs(args: TestSessionEventArgs) {
        const testSession = this.testSessionBucket.get(args.SessionId);
        testSession.TestSessionEventArgs = args;
        this.testSessionBucket.set(args.SessionId, testSession);
    }

    public getSessionEventArgs(sources: Array<string>): TestSessionEventArgs {
        const sessionId = SessionHash(sources);
        return this.testSessionBucket.get(sessionId).TestSessionEventArgs;
    }

    private sessionError(testSession: TestSession, err: Error) {
        if (testSession.TestSessionEventArgs != null) {
            testSession.TestSessionEventArgs.InProgress = false;
            testSession.TestSessionEventArgs.EndTime = new Date();
        }

        testSession.ErrorCallback(err);

        this.continueNextSession(testSession);
    }

    private runSessionInDomain(testSession: TestSession) {
        // tslint:disable-next-line:no-require-imports
        const domain = require('domain');

        const executionDomain = domain.create();
        try {
            executionDomain.on('error', (err: Error) => {
                // this.sessionComplete(source, null, err);
                this.sessionError(testSession, err);
            });
            executionDomain.run(() => {
                // this.codecoverage.startCoverage(executeJob);
                testSession.Job();
            });
        } catch (err) {
            // this.sessionComplete(source, null, err);
            this.sessionError(testSession, err);
            // TODO log message
        }
    }
    
    private continueNextSession(testSession: TestSession) {
        if (!testSession.Complete) {
            this.sessionCompleteCount++;

            const nextSession = this.testSessionIterator.next();

            if (!nextSession.done) {
                this.runSessionInDomain(nextSession.value);
            }
        }
        testSession.Complete = true;
        
        // Check for all session completion
        if (this.sessionCount === this.sessionCompleteCount) {
            this.onAllSessionsComplete.raise(this, {});
        }
    }
}