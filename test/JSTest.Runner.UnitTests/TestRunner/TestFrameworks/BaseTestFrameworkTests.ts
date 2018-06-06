import { BaseTestFramework } from '../../../../src/JSTest.Runner/TestRunner/TestFrameworks/BaseTestFramework';
import { EnvironmentType } from '../../../../src/JSTest.Runner/ObjectModel/Common';
import { ITestFrameworkEvents, TestSessionEventArgs, TestSuiteEventArgs } from '../../../../src/JSTest.Runner/ObjectModel/TestFramework';
import { Environment } from '../../../../src/JSTest.Runner/Environment/Node/Environment';
import { SessionHash } from '../../../../src/JSTest.Runner/Utils/Hashing/SessionHash';
import * as Assert from 'assert';

class TestableBaseTestFramework extends BaseTestFramework {
    public readonly canHandleMultipleSources: boolean = true;
    public readonly environmentType: EnvironmentType;
    public readonly supportsJsonOptions: boolean = true;

    protected sources: Array<string>;

    constructor(testFrameworkEvents: ITestFrameworkEvents, envrionmentType: EnvironmentType, sources: Array<string>) {
        super(testFrameworkEvents);
        this.environmentType = envrionmentType;
        this.sources = sources;
    }

    public startExecutionWithSources(sources: Array<string>, options: JSON) {
        return;
    }

    public startDiscovery(sources: Array<string>) {
        return;
    }

    public initialize() {
        return;
    }

    public skipSpec(specObject: any) {
        return;
    }

    public eventHandlers: any = {
        sessionStarted: this.handleSessionStarted.bind(this),
        sessionDone: this.handleSessionDone.bind(this),
        suiteStarted: this.handleSuiteStarted.bind(this),
        suiteDone: this.handleSuiteDone.bind(this),
        specStarted: this.handleSpecStarted.bind(this),
        specDone: this.handleSpecDone.bind(this),
        specResult: this.handleSpecDone.bind(this),
        errorMessage: this.handleErrorMessage.bind(this)
    };
}

describe('BaseTestFramework suite', () => {
    let testFrameworkEvents: ITestFrameworkEvents;
    let baseTestFramework: TestableBaseTestFramework;
    const env = new Environment();
    const sources = ['file 1', 'file 2'];

    beforeEach(() => {
        testFrameworkEvents = <ITestFrameworkEvents> {
            onTestCaseEnd: env.createEvent(),
            onTestCaseStart: env.createEvent(),
            onTestSuiteStart: env.createEvent(),
            onTestSuiteEnd: env.createEvent(),
            onTestSessionStart: env.createEvent(),
            onTestSessionEnd: env.createEvent(),
            onErrorMessage: env.createEvent()
        };

        baseTestFramework = new TestableBaseTestFramework(testFrameworkEvents, env.environmentType, sources);
    });

    it('handleSessionStarted/Done will raise onTestSessionStart/End', (done) => {
        let sessionEventArgs: TestSessionEventArgs;
        
        testFrameworkEvents.onTestSessionStart.subscribe((sender: object, args: TestSessionEventArgs) => {
            Assert.deepEqual(args.Sources, sources);
            Assert.deepEqual(args.SessionId, SessionHash(sources));
            Assert.equal(args.StartTime instanceof Date, true);
            Assert.equal(args.InProgress, true);
            sessionEventArgs = args;
        });

        testFrameworkEvents.onTestSessionEnd.subscribe((sender: object, args: TestSessionEventArgs) => {
            Assert.deepEqual(sessionEventArgs, args);
            Assert.equal(args.InProgress, false);
            Assert.equal(args.EndTime instanceof Date, true);
            done();
        });

        baseTestFramework.eventHandlers.sessionStarted();
        baseTestFramework.eventHandlers.sessionDone();
    });

    it('handleSuiteStarted/Done will raise onTestSuiteStart/End', (done) => {
        let suiteEventArgs: TestSuiteEventArgs;
        
        testFrameworkEvents.onTestSuiteStart.subscribe((sender: object, args: TestSuiteEventArgs) => {
            Assert.deepEqual(args.Name, 'suite');
            Assert.deepEqual(args.Source, 'source');
            Assert.equal(args.StartTime instanceof Date, true);
            Assert.equal(args.InProgress, true);
            suiteEventArgs = args;
        });

        testFrameworkEvents.onTestSuiteEnd.subscribe((sender: object, args: TestSuiteEventArgs) => {
            Assert.deepEqual(suiteEventArgs, args);
            Assert.equal(args.InProgress, false);
            Assert.equal(args.EndTime instanceof Date, true);
            done();
        });

        baseTestFramework.eventHandlers.suiteStarted('suite', 'source');
        baseTestFramework.eventHandlers.suiteDone();
    });

    it('handleSuiteDone will not raise onTestSuiteStart if there is no corresponding suite', (done) => {
        // Since there are no suites in the stack another call to suiteDone should not raise onTestSuiteEnd'
        testFrameworkEvents.onTestSuiteEnd.subscribe((sender: object, args: TestSuiteEventArgs) => {
            Assert.fail('Should not have raised onTestSuiteEnd');
        });

        baseTestFramework.eventHandlers.suiteDone();
        done();
    });
});