import { ITestFramework, TestSessionEventArgs, TestSuiteEventArgs, TestSpecEventArgs, FailedExpectation }
from '../../ObjectModel/TestFramework';
import { ITestFrameworkEvents } from '../../ObjectModel/TestFramework';
import { TestCase, TestOutcome, EnvironmentType } from '../../ObjectModel/Common';

export abstract class BaseTestFramework implements ITestFramework {
    public abstract environmentType: EnvironmentType;
    public abstract executorUri: string;
    public testFrameworkEvents: ITestFrameworkEvents;
    
    protected source: string;
    
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
    
    public abstract startExecutionWithSource(source: string);
    public abstract startDiscovery(source: string);
    
    protected abstract skip(specObject: any);

    public startExecutionWithTests(source: string, testCollection: Map<string, TestCase>) {
        this.testCollection = testCollection;
        this.startExecutionWithSource(source);
    }

    protected handleSessionStarted() {
        const start = new Date();

        let id = '';
        while (id === '') {
            id = String(start.getTime());
        }

        this.sessionEventArgs = {
            SessionId: id,
            Source: this.source,
            StartTime: start,
            InProgress: true,
            EndTime: null
        };

        this.testFrameworkEvents.onTestSessionStart.raise(this, this.sessionEventArgs);
    }

    protected handleSessionDone() {
        this.sessionEventArgs.EndTime = new Date();
        this.sessionEventArgs.InProgress = false;

        this.testFrameworkEvents.onTestSessionEnd.raise(this, this.sessionEventArgs);
    }

    protected handleSuiteStarted(suiteName: string) {
        const suiteEventArgs: TestSuiteEventArgs = {
            Name: suiteName,
            Source: this.source,
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

    protected handleSpecStarted(fullyQualifiedName: string, testCaseName: string, specObject: any) {
        let executionCount = 1;

        if (this.testExecutionCount.has(fullyQualifiedName)) {
            executionCount = this.testExecutionCount.get(fullyQualifiedName) + 1;
        }
        this.testExecutionCount.set(fullyQualifiedName, executionCount);

        const testCase = new TestCase(this.source, fullyQualifiedName + ' ' + executionCount, this.executorUri);
        this.applyTestCaseFilter(testCase, specObject);
        
        testCase.DisplayName = testCaseName;

        this.activeSpec = <TestSpecEventArgs> {
            TestCase: testCase,
            FailedExpectations: [],
            Outcome: TestOutcome.None,
            Source: this.source,
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

    private applyTestCaseFilter(testCase: TestCase, specObject: any) {
        if (this.testCollection) {
            if (!this.testCollection.has(testCase.Id)) {
                this.skip(specObject);
            }
        }
    }
}