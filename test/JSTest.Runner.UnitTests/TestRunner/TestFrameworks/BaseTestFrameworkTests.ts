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
import { EqtTrace } from '../../../../src/JSTest.Runner/ObjectModel/EqtTrace';

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

    public sessionStarted(...args: Array<any>) {
        this.handleSessionStarted.apply(this, arguments);
    }
    public sessionDone(...args: Array<any>) {
        this.handleSessionDone.apply(this, arguments);
    }
    public suiteStarted(...args: Array<any>) {
        this.handleSuiteStarted.apply(this, arguments);
    }
    public suiteDone(...args: Array<any>) {
        this.handleSuiteDone.apply(this, arguments);
    }
    public specStarted(...args: Array<any>) {
        this.handleSpecStarted.apply(this, arguments);
    }
    public specDone(...args: Array<any>) {
        this.handleSpecDone.apply(this, arguments);
    }
    public specResult(...args: Array<any>) {
        this.handleSpecDone.apply(this, arguments);
    }
    public errorMessage(...args: Array<any>) {
        this.handleErrorMessage.apply(this, arguments);
    }
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

        baseTestFramework.sessionStarted();
        baseTestFramework.sessionDone();
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

        baseTestFramework.suiteStarted('suite', 'source');
        baseTestFramework.suiteDone();
    });

    it('handleSuiteDone will not raise onTestSuiteStart if there is no corresponding suite', (done) => {
        // Since there are no suites in the stack another call to suiteDone should not raise onTestSuiteEnd'
        testFrameworkEvents.onTestSuiteEnd.subscribe((sender: object, args: TestSuiteEventArgs) => {
            Assert.fail('Should not have raised onTestSuiteEnd');
        });

        baseTestFramework.suiteDone();

        done();
    });

    it('handleSpecStarted/Done will raise onTestCaseStart/End', (done) => {
        const testCase: TestCase = new TestCase('source', 'fqn', Constants.executorURI);
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

        baseTestFramework.specStarted('fqn', 'testcase', 'source', null);
        baseTestFramework.specDone(TestOutcome.Passed, ['expectation']);
    });

    it('handleSpecStarted will handle duplicate FQNs', (done) => {
        const logger = new TestUtils.MockDebugLogger();
        EqtTrace.initialize(logger, 'file');

        let i = 0;
        testFrameworkEvents.onTestCaseStart.subscribe((sender: object, args: TestSpecEventArgs) => {
            Assert.equal(args.TestCase.FullyQualifiedName, 'fqn');
            if (++i === 2) {
                logger.logContains('Warning: 0, 2019/1/9, 14:08:16:991, BaseTestFramework: Duplicate test case with fqn: fqn');
            }
        });

        baseTestFramework.specStarted('fqn', 'testcase', 'source', null);
        baseTestFramework.specStarted('fqn', 'testcase', 'source', null);
        done();
    });

    it('startExecutionWithTests will filter test cases', (done) => {
        const testCaseMap = new Map<string, TestCase>();
        const testcase = new TestCase('file 1', 'fqn 1', 'uri');

        testCaseMap.set(testcase.Id, testcase);

        baseTestFramework.startExecutionWithTests(['file 1', 'file 2'], testCaseMap, <any> 'json');

        const mockFramework = Mock.ofInstance(baseTestFramework);
        mockFramework.callBase = true;

        baseTestFramework = mockFramework.object;

        baseTestFramework.specStarted('fqn', 'testcase', 'source', 'no skip');
        baseTestFramework.specStarted('fqn', 'testcase', 'source', 'skip');

        mockFramework.verify((x) => x.skipSpec(
            It.is((x) => x === <any> 'skip')
        ), Times.once());

        done();
    });

    it('startExecutionWithTests will eventually call startExecutionWithSources', (done) => {
        const testCaseMap = new Map<string, TestCase>();
        const testcase = new TestCase('file 1', 'fqn 1', 'uri');

        testCaseMap.set(testcase.Id, testcase);

        const mockFramework = Mock.ofInstance(baseTestFramework);
        mockFramework.callBase = true;

        baseTestFramework = mockFramework.object;

        baseTestFramework.startExecutionWithTests(['file 1', 'file 2'], testCaseMap, <any> 'json');

        mockFramework.verify((x) => x.startExecutionWithSources(
            It.is((x) => TestUtils.assertDeepEqual(x, ['file 1', 'file 2'])),
            It.is((x) => x === <any>'json')
        ), Times.once());
        done();
    });
});