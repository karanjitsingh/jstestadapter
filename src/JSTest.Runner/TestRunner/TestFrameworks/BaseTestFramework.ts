import { ITestFramework, TestSessionEventArgs, TestSuiteEventArgs, TestSpecEventArgs,
         FailedExpectation, ITestFrameworkEvents, TestErrorMessageEventArgs } from '../../ObjectModel/TestFramework';
import { TestCase, TestOutcome, EnvironmentType } from '../../ObjectModel/Common';
import { SessionHash } from '../../Utils/Hashing/SessionHash';
import { Constants } from '../../Constants';
import { EqtTrace } from '../../ObjectModel/EqtTrace';

export abstract class BaseTestFramework implements ITestFramework {
    public readonly abstract environmentType: EnvironmentType;
    public readonly abstract canHandleMultipleSources: boolean;
    public readonly abstract supportsJsonOptions: boolean;
    public readonly abstract supportsCodeCoverage: boolean;
    public readonly testFrameworkEvents: ITestFrameworkEvents;

    protected abstract sources: Array<string>;
    protected executingWithTests: boolean = false;

    private sessionEventArgs: TestSessionEventArgs;
    private suiteStack: Array<TestSuiteEventArgs>;
    private activeSpec: TestSpecEventArgs;
    private testCollection: Map<string, TestCase>;
    private testExecutionCount: Map<string, number>;
    private sessionActive: boolean;

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
        this.setExecutingWithTests(testCollection);
        this.startExecutionWithSources(sources, options);
    }

    protected setExecutingWithTests(testCollection: Map<string, TestCase>) {
        this.executingWithTests = true;
        this.testCollection = testCollection;
    }

    protected handleSessionStarted() {
        EqtTrace.info(`BaseTestFramework: Test session started`);

        this.sessionEventArgs = new TestSessionEventArgs(this.sources, SessionHash(this.sources));
        this.testFrameworkEvents.onTestSessionStart.raise(this, this.sessionEventArgs);

        this.sessionActive = true;
    }

    protected handleSessionDone() {
        
        if (this.sessionActive) {
            this.sessionEventArgs.EndTime = new Date();
            this.sessionEventArgs.InProgress = false;

            this.testFrameworkEvents.onTestSessionEnd.raise(this, this.sessionEventArgs);
            this.sessionActive = false;

            EqtTrace.info(`BaseTestFramework: Test session done ${JSON.stringify(this.sessionEventArgs)}`);
        } else {
            EqtTrace.info(`BaseTestFramework: Test session done received without active session.`);
        }
    }

    protected handleSuiteStarted(suiteName: string, source: string) {
        const suiteEventArgs: TestSuiteEventArgs = {
            Name: suiteName,
            Source: source,
            StartTime: new Date(),
            InProgress: true,
            EndTime: undefined
        };

        EqtTrace.info(`BaseTestFramework: Test suite started ${JSON.stringify(suiteEventArgs)}`);

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

        EqtTrace.info(`BaseTestFramework: Test suite done ${JSON.stringify(suiteEndEventArgs)}`);

        this.testFrameworkEvents.onTestSuiteEnd.raise(this, suiteEndEventArgs);
    }

    protected handleSpecStarted(fullyQualifiedName: string,
                                testCaseName: string,
                                sourceFile: string,
                                specObject: any,
                                fqnPostFix?: string) {
        const testCase = this.getTestCase(testCaseName, fullyQualifiedName, sourceFile, fqnPostFix);
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

        EqtTrace.info(`BaseTestFramework: Test case started ${JSON.stringify(this.activeSpec)}`);

        this.testFrameworkEvents.onTestCaseStart.raise(this, this.activeSpec);
    }

    protected handleSpecDone(testOutcome: TestOutcome, failedExpectations: Array<FailedExpectation>) {

        this.activeSpec.InProgress = false;
        this.activeSpec.EndTime = new Date();
        this.activeSpec.Outcome = testOutcome;
        this.activeSpec.FailedExpectations = failedExpectations;

        EqtTrace.info(`BaseTestFramework: Test case done ${JSON.stringify(this.activeSpec)}`);

        this.handleTestCaseEnd(this.activeSpec);
    }

    protected handleSpecResult(fullyQualifiedName: string,
                               testCaseName: string,
                               sourceFile: string,
                               testOutcome: TestOutcome,
                               failedExpectations: Array<FailedExpectation>,
                               startTime: Date,
                               endTime: Date,
                               fqnPostFix?: string) {

        const testCase = this.getTestCase(testCaseName, fullyQualifiedName, sourceFile, fqnPostFix);

        const specResult = <TestSpecEventArgs> {
            TestCase: testCase,
            FailedExpectations: failedExpectations,
            Outcome: testOutcome,
            Source: sourceFile,
            StartTime: startTime,
            InProgress: false,
            EndTime: endTime
        };

        EqtTrace.info(`BaseTestFramework: Test result received ${JSON.stringify(specResult)}`);

        this.handleTestCaseEnd(specResult);
    }

    protected handleErrorMessage(errMessage: string, errStack: string) {
        let message;
        if (errMessage === errStack || !errStack) {
            message = errMessage;
        } else {
            message = `${errMessage}\n ${errStack}`;
        }

        EqtTrace.warn(`BaseTestFramework: Error message was received from test framework: ${message}`);

        this.testFrameworkEvents.onErrorMessage.raise(this, <TestErrorMessageEventArgs> {
            Message: message
        });
    }

    private handleTestCaseEnd(testSpecEventArgs: TestSpecEventArgs) {
        if (this.executingWithTests && !this.testCollection.has(testSpecEventArgs.TestCase.Id)) {
            EqtTrace.verbose('BaseTestFramework: Skipping test result since it is not part of the slice. Test: ' +
            JSON.stringify(testSpecEventArgs));
            return;
        }
        
        this.testFrameworkEvents.onTestCaseEnd.raise(this, testSpecEventArgs);
    }

    private getTestCase(testCaseName: string, fqn: string, source: string, fqnPostFix: string): TestCase {
        fqn = fqn + (fqnPostFix || '');

        if (this.testExecutionCount.has(fqn)) {
            EqtTrace.warn(`BaseTestFramework: Duplicate test case with fqn: '${fqn}'`);
            this.testExecutionCount.set(fqn, this.testExecutionCount.get(fqn) + 1);
        } else {
            this.testExecutionCount.set(fqn, 1);
        }

        if (fqn.length > 512) {
            EqtTrace.warn(`BaseTestFramework: Fqn length exceeding 512 characters with value: '${fqn}'`);
        }

        const testCase = new TestCase(source, fqn, Constants.executorURI);
        testCase.DisplayName = testCaseName;

        return testCase;
    }

    private applyTestCaseFilter(testCase: TestCase, specObject: any) {
        if (this.testCollection) {
            if (!this.testCollection.has(testCase.Id)) {
                EqtTrace.info(`BaseTestFramework: Skipping test case ${JSON.stringify(testCase)}`);
                this.skipSpec(specObject);
            }
        }
    }
}