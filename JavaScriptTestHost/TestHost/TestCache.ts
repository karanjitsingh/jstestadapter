import TestResult from "../ObjectModel/TestResult";
import TestCase from "../ObjectModel/TestCase";
import Event, { IEventArgs } from "Events/Event";
import IEnvironment from "../Environment/IEnvironment";
import TimeSpan from "../Utils/TimeSpan";

// override typings for
declare function setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): number;

export interface TestRunStatsChangeEventArgs extends IEventArgs {
    NewTestResults: Map<string, TestResult>;
    InProgressTests: Map<string, TestCase>;
}

export class TestCache {
    public onTestRunStatsChange: Event<TestRunStatsChangeEventArgs>;

    private testResultMap : Map<string, TestResult>;
    private inProgressTestMap : Map<string, TestCase>;

    private cacheCapacity: number;
    private cacheExpiryTime: number;
    private cacheTimer: number;

    constructor(environment: IEnvironment, cacheCapacity: number, cacheExpiryTime: string) {
        this.testResultMap = new Map<string, TestResult>();
        this.inProgressTestMap = new Map<string, TestCase>();

        this.onTestRunStatsChange = environment.createEvent();

        this.cacheCapacity = cacheCapacity;
        this.cacheExpiryTime = TimeSpan.StringToMS(cacheExpiryTime);
        this.cacheTimer = setTimeout(this.onCacheHit.bind(this), this.cacheExpiryTime);
    }
    
    public AddTestResult(testResult: TestResult) {
        this.inProgressTestMap.delete(testResult.TestCase.Id);
        this.testResultMap.set(testResult.TestCase.Id, testResult);

        if(this.testResultMap.size == this.cacheCapacity) {
            this.onCacheHit();
        }
    }
    
    public AddInProgressTest(testCase: TestCase) {
        this.inProgressTestMap.set(testCase.Id, testCase);
    }

    public CleanCache() {
        this.onCacheHit();
    }

    private onCacheHit() {
        if(!this.testResultMap.size) {
            return;
        }

        let newTestResults = new Map(this.testResultMap);
        this.testResultMap.clear();

        let args = <TestRunStatsChangeEventArgs> {
            NewTestResults: newTestResults,
            InProgressTests: new Map(this.inProgressTestMap)
        }

        this.onTestRunStatsChange.raise(this, args);
    }
}