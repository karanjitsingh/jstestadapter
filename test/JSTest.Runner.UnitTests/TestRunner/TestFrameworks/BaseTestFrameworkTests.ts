import { BaseTestFramework } from '../../../../src/JSTest.Runner/TestRunner/TestFrameworks/BaseTestFramework';
import { EnvironmentType, TestOutcome, TestCase } from '../../../../src/JSTest.Runner/ObjectModel/Common';
import { ITestFrameworkEvents, TestSessionEventArgs, TestSuiteEventArgs, TestSpecEventArgs }
from '../../../../src/JSTest.Runner/ObjectModel/TestFramework';
import { Environment } from '../../../../src/JSTest.Runner/Environment/Node/Environment';
import { SessionHash } from '../../../../src/JSTest.Runner/Utils/Hashing/SessionHash';
import { Constants } from '../../../../src/JSTest.Runner/Constants';
import { TestUtils } from '../../TestUtils';
import { Mock, It, Times } from 'typemoq';
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

    public getEventHandlers = (ctx?: any) => {
        const context = ctx || this;
        
        return {
            sessionStarted: this.handleSessionStarted.bind(context),
            sessionDone: this.handleSessionDone.bind(context),
            suiteStarted: this.handleSuiteStarted.bind(context),
            suiteDone: this.handleSuiteDone.bind(context),
            specStarted: this.handleSpecStarted.bind(context),
            specDone: this.handleSpecDone.bind(context),
            specResult: this.handleSpecDone.bind(context),
            errorMessage: this.handleErrorMessage.bind(context)
        };
    }
}

describe('BaseTestFramework suite', () => {
    let testFrameworkEvents: ITestFrameworkEvents;
    let baseTestFramework: TestableBaseTestFramework;
    let eventHandlers;
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
        eventHandlers = baseTestFramework.getEventHandlers();
        
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
        
        eventHandlers.sessionStarted();
        eventHandlers.sessionDone();
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
        
        eventHandlers.suiteStarted('suite', 'source');
        eventHandlers.suiteDone();        
    });

    it('handleSuiteDone will not raise onTestSuiteStart if there is no corresponding suite', (done) => {
        // Since there are no suites in the stack another call to suiteDone should not raise onTestSuiteEnd'
        testFrameworkEvents.onTestSuiteEnd.subscribe((sender: object, args: TestSuiteEventArgs) => {
            Assert.fail('Should not have raised onTestSuiteEnd');
        });

        eventHandlers.suiteDone();
        
        done();
    });

    it('handleSpecStarted/Done will raise onTestCaseStart/End', (done) => {
        const testCase: TestCase = new TestCase('source', 'fqn 1', Constants.executorURI);
        testCase.DisplayName = 'testcase';
        let specArgs: TestSpecEventArgs;

        testFrameworkEvents.onTestCaseStart.subscribe((sender: object, args: TestSpecEventArgs) => {
            Assert.deepEqual(args.FailedExpectations, []);
            Assert.equal(args.Outcome, TestOutcome.None);
            Assert.equal(args.Source, 'source');
            Assert.equal(args.StartTime instanceof Date, true);
            Assert.equal(args.InProgress, true);
            Assert.deepEqual(args.TestCase, testCase);
            specArgs = args;
        });

        testFrameworkEvents.onTestCaseEnd.subscribe((sender: object, args: TestSpecEventArgs) => {
            Assert.equal(args.InProgress, false);
            Assert.equal(args.EndTime instanceof Date, true);
            Assert.equal(args.Outcome, TestOutcome.Passed);
            Assert.deepEqual(args.FailedExpectations, ['expectation']);
            Assert.deepEqual(args, specArgs);
            done();
        });
        
        eventHandlers.specStarted('fqn', 'testcase', 'source', null);
        eventHandlers.specDone(TestOutcome.Passed, ['expectation']);
    });

    it('handleSpecStarted will handle duplicate FQNs', (done) => {
        let i = 0;
        testFrameworkEvents.onTestCaseStart.subscribe((sender: object, args: TestSpecEventArgs) => {
            i++;
            Assert.equal(args.TestCase.FullyQualifiedName, 'fqn ' + i);
        });

        eventHandlers.specStarted('fqn', 'testcase', 'source', null);
        eventHandlers.specStarted('fqn', 'testcase', 'source', null);
        eventHandlers.specStarted('fqn', 'testcase', 'source', null);
        
        done();
    });

    it('startExecutionWithTests will filter test cases', (done) => {
        const testCaseMap = new Map<string, TestCase>();
        const testcase = new TestCase('file 1', 'fqn 1', 'uri');
        
        testCaseMap.set(testcase.Id, testcase);

        const mockFramework = Mock.ofInstance(baseTestFramework);
        mockFramework.callBase = true;

        baseTestFramework = mockFramework.object;

        eventHandlers = mockFramework.object.getEventHandlers(mockFramework.object);

        baseTestFramework.startExecutionWithTests(['file 1', 'file 2'], testCaseMap, <any> 'json');
        eventHandlers.specStarted('fqn', 'testcase', 'source', 'no skip');
        eventHandlers.specStarted('fqn', 'testcase', 'source', 'skip');

        mockFramework.verify((x) => x.startExecutionWithSources(
            It.is((x) => TestUtils.assertDeepEqual(x, ['file 1', 'file 2'])),
            It.is((x) => x === <any>'json')
        ), Times.once());
        
        mockFramework.verify((x) => x.skipSpec(
            It.is((x) => x === <any> 'skip')
        ), Times.once());
    });
});