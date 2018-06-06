import { ITestFramework, TestSessionEventArgs, TestSuiteEventArgs, TestSpecEventArgs,
         FailedExpectation, ITestFrameworkEvents, TestErrorMessageEventArgs } from '../../ObjectModel/TestFramework';
import { TestCase, TestOutcome, EnvironmentType } from '../../ObjectModel/Common';
import { SessionHash } from '../../Utils/Hashing/SessionHash';
import { Constants } from '../../Constants';

/*
 * TODO:
 * try catch all event handlers
 * if this code breaks sometimes it might never be caught
 * at least trace all errors in event handlers
 */

export abstract class BaseTestFramework implements ITestFramework {
    public readonly abstract environmentType: EnvironmentType;
    public readonly abstract canHandleMultipleSources: boolean;
    public readonly abstract supportsJsonOptions: boolean;
    public readonly testFrameworkEvents: ITestFrameworkEvents;

    protected abstract sources: Array<string>;

    private sessionEventArgs: TestSessionEventArgs;
    private suiteStack: Array<TestSuiteEventArgs>;
    private activeSpec: TestSpecEventArgs;
    private testCollection: Map<string, TestCase>;
    private testExecutionCount: Map<string, number>;

    constructor(testFrameworkEvents: ITestFrameworkEvents) {
        this.testFrameworkEvents = testFrameworkEvents;
        this.testExecutionCount = new Map();
        this.suiteStack = [];
    }

    public abstract startExecutionWithSources(sources: Array<string>, options: JSON);
    public abstract startDiscovery(sources: Array<string>);
    public abstract initialize();

    protected abstract skipSpec(specObject: any);

    public startExecutionWithTests(sources: Array<string>, testCollection: Map<string, TestCase>, options: JSON) {
        this.testCollection = testCollection;
        this.startExecutionWithSources(sources, options);
    }

    protected handleSessionStarted() {
        this.sessionEventArgs = new TestSessionEventArgs(this.sources, SessionHash(this.sources));
        this.testFrameworkEvents.onTestSessionStart.raise(this, this.sessionEventArgs);
    }

    protected handleSessionDone() {
        this.sessionEventArgs.EndTime = new Date();
        this.sessionEventArgs.InProgress = false;

        this.testFrameworkEvents.onTestSessionEnd.raise(this, this.sessionEventArgs);
    }

    protected handleSuiteStarted(suiteName: string, source: string) {
        const suiteEventArgs: TestSuiteEventArgs = {
            Name: suiteName,
            Source: source,
            StartTime: new Date(),
            InProgress: true,
            EndTime: undefined
        };

        this.suiteStack.push(suiteEventArgs);

        this.testFrameworkEvents.onTestSuiteStart.raise(this, suiteEventArgs);
    }

    protected handleSuiteDone() {

        /*
         * Extra handle suite done should not trigger event raise
         * Some frameworks throw an extra suite done event for the
         * root suite even though it does not correspond to a start event
         */

        if (!this.suiteStack.length) {
            return;
        }

        const suiteEndEventArgs = this.suiteStack.pop();

        suiteEndEventArgs.InProgress = false;
        suiteEndEventArgs.EndTime = new Date();

        this.testFrameworkEvents.onTestSuiteEnd.raise(this, suiteEndEventArgs);
    }

    protected handleSpecStarted(fullyQualifiedName: string, testCaseName: string, sourceFile: string, specObject: any) {
        const testCase = this.getTestCase(testCaseName, fullyQualifiedName, sourceFile);
        this.applyTestCaseFilter(testCase, specObject);
        
        // should check if spec was already active and not ended

        this.activeSpec = <TestSpecEventArgs> {
            TestCase: testCase,
            FailedExpectations: [],
            Outcome: TestOutcome.None,
            Source: sourceFile,
            StartTime: new Date(),
            InProgress: true,
            EndTime: null
        };

        this.testFrameworkEvents.onTestCaseStart.raise(this, this.activeSpec);
    }

    protected handleSpecDone(testOutcome: TestOutcome, failedExpectations: Array<FailedExpectation>) {

        this.activeSpec.InProgress = false;
        this.activeSpec.EndTime = new Date();
        this.activeSpec.Outcome = testOutcome;
        this.activeSpec.FailedExpectations = failedExpectations;

        this.testFrameworkEvents.onTestCaseEnd.raise(this, this.activeSpec);
    }

    protected handleSpecResult(fullyQualifiedName: string,
                               testCaseName: string,
                               sourceFile: string,
                               testOutcome: TestOutcome,
                               failedExpectations: Array<FailedExpectation>,
                               startTime: Date,
                               endTime: Date) {
        
        const specResult = <TestSpecEventArgs> {
            TestCase: this.getTestCase(testCaseName, fullyQualifiedName, sourceFile),
            FailedExpectations: failedExpectations,
            Outcome: testOutcome,
            Source: sourceFile,
            StartTime: startTime,
            InProgress: false,
            EndTime: endTime
        };

        this.testFrameworkEvents.onTestCaseEnd.raise(this, specResult);
    }

    protected handleErrorMessage(errMessage: string, errStack: string) {
        const message = `Error: ${errMessage}\n ${errStack}`;

        this.testFrameworkEvents.onErrorMessage.raise(this, <TestErrorMessageEventArgs> {
            Message: message
        });
    }

    private getTestCase(testCaseName: string, fqn: string, source: string): TestCase {
        let executionCount = 1;

        if (this.testExecutionCount.has(fqn)) {
            executionCount = this.testExecutionCount.get(fqn) + 1;
        }
        this.testExecutionCount.set(fqn, executionCount);

        const testCase = new TestCase(source, fqn + ' ' + executionCount, Constants.executorURI);
        testCase.DisplayName = testCaseName;

        return testCase;
    }

    private applyTestCaseFilter(testCase: TestCase, specObject: any) {
        if (this.testCollection) {
            if (!this.testCollection.has(testCase.Id)) {
                this.skipSpec(specObject);
            }
        }
    }
}