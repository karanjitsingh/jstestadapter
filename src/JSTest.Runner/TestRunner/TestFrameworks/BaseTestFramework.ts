import { ITestFramework, TestSessionEventArgs, TestSuiteEventArgs, TestSpecEventArgs,
         FailedExpectation, ITestFrameworkEvents, TestErrorMessageEventArgs } from '../../ObjectModel/TestFramework';
import { TestCase, TestOutcome, EnvironmentType } from '../../ObjectModel/Common';
import { SessionHash } from 'Utils/Hashing/SessionHash';

/*
 * TODO:
 * try catch all event handlers
 * if this code breaks sometimes it might never be caught
 * at least trace all errors in event handlers
 */

export abstract class BaseTestFramework implements ITestFramework {
    public abstract environmentType: EnvironmentType;
    public abstract executorUri: string;
    public abstract canHandleMultipleSources: boolean;
    public abstract supportsJsonOptions: boolean;

    protected abstract sources: Array<string>;

    public testFrameworkEvents: ITestFrameworkEvents;

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
        this.startExecutionWithSources([sources[0]], options);
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
        if (!this.suiteStack.length) {
            return;
        }

        const suiteEndEventArgs = this.suiteStack.pop();

        suiteEndEventArgs.InProgress = false;
        suiteEndEventArgs.EndTime = new Date();

        this.testFrameworkEvents.onTestSuiteEnd.raise(this, suiteEndEventArgs);
    }

    protected handleSpecStarted(fullyQualifiedName: string, testCaseName: string, sourceFile: string, specObject: any) {
        let executionCount = 1;

        if (this.testExecutionCount.has(fullyQualifiedName)) {
            executionCount = this.testExecutionCount.get(fullyQualifiedName) + 1;
        }
        this.testExecutionCount.set(fullyQualifiedName, executionCount);

        const testCase = new TestCase(sourceFile, fullyQualifiedName + ' ' + executionCount, this.executorUri);
        this.applyTestCaseFilter(testCase, specObject);

        testCase.DisplayName = testCaseName;

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
        let executionCount = 1;

        if (this.testExecutionCount.has(fullyQualifiedName)) {
            executionCount = this.testExecutionCount.get(fullyQualifiedName) + 1;
        }
        this.testExecutionCount.set(fullyQualifiedName, executionCount);

        const testCase = new TestCase(sourceFile, fullyQualifiedName + ' ' + executionCount, this.executorUri);
        testCase.DisplayName = testCaseName;

        const specResult = <TestSpecEventArgs> {
            TestCase: testCase,
            FailedExpectations: failedExpectations,
            Outcome: testOutcome,
            Source: sourceFile,
            StartTime: startTime,
            InProgress: false,
            EndTime: endTime
        };

        this.testFrameworkEvents.onTestCaseEnd.raise(this, specResult);
    }

    protected reportErrorMessage(errMessage: string, errStack: string) {
        const message = `Error: ${errMessage}\n ${errStack}`;

        this.testFrameworkEvents.onErrorMessage.raise(this, <TestErrorMessageEventArgs> {
            Message: message
        });
    }

    private applyTestCaseFilter(testCase: TestCase, specObject: any) {
        if (this.testCollection) {
            if (!this.testCollection.has(testCase.Id)) {
                this.skipSpec(specObject);
            }
        }
    }
}