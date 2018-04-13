import TestResult from "../ObjectModel/TestResult";
import TestCase from "../ObjectModel/TestCase";
import Event, { IEventArgs } from "Events/Event";
import IEnvironment from "../Environment/IEnvironment";
import TimeSpan from "../Utils/TimeSpan";
import { TestRunChangedEventArgs } from "../ObjectModel/TestRunChangedEventArgs";
import { TestRunStatistics } from "ObjectModel/TestRunStatistics";
import { TestOutcome } from "ObjectModel/TestOutcome";

// override typings for
declare function setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): number;

export class TestCache {
    public onTestRunStatsChange: Event<TestRunChangedEventArgs>;

    private testResultMap : Map<string, TestResult>;
    private inProgressTestMap : Map<string, TestCase>;

    private cacheCapacity: number;
    private cacheExpiryTime: number;
    private cacheTimer: number;
    private testRunStatistics: TestRunStatistics;

    constructor(environment: IEnvironment, cacheCapacity: number, cacheExpiryTime: string) {
        this.testResultMap = new Map<string, TestResult>();
        this.inProgressTestMap = new Map<string, TestCase>();

        this.testRunStatistics = {
            Stats: {},
            ExecutedTests: 0
        }

        this.onTestRunStatsChange = environment.createEvent();

        this.cacheCapacity = cacheCapacity;
        this.cacheExpiryTime = TimeSpan.StringToMS(cacheExpiryTime);
        this.cacheTimer = 0;


        this.setCacheExpireTimer();
    }
    
    public AddTestResult(testResult: TestResult) {
        this.inProgressTestMap.delete(testResult.TestCase.Id);
        this.testResultMap.set(testResult.TestCase.Id, testResult);
        this.testRunStatistics.ExecutedTests += 1;
        
        if(this.testRunStatistics.Stats[testResult.Outcome]) {
            this.testRunStatistics.Stats[testResult.Outcome] += 1;
        }
        else {
            this.testRunStatistics.Stats[testResult.Outcome] = 1;            
        }

        if(this.testResultMap.size == this.cacheCapacity) {
            this.onCacheHit();
        }
    }
    
    public AddInProgressTest(testCase: TestCase) {

        // TODO data driven tests will override
        this.inProgressTestMap.set(testCase.Id, testCase);
    }

    public CleanCache(): TestRunChangedEventArgs {
        if(!this.testRunStatistics.ExecutedTests) {
            return <TestRunChangedEventArgs> {
                NewTestResults: [],
                ActiveTests: [],
                TestRunStatistics: <TestRunStatistics> {
                    ExecutedTests: 0,
                    Stats: {}
                }
            };
        }

        // TODO testrunchanged event args does not really extend eventargs
        let args = <TestRunChangedEventArgs> {
            NewTestResults: Array.from(this.testResultMap.values()),
            ActiveTests: Array.from(this.inProgressTestMap.values()),
            TestRunStatistics: this.testRunStatistics
        };

        this.testRunStatistics = {
            Stats: {},
            ExecutedTests: 0
        };

        this.testResultMap.clear();

        return args;
    }

    private setCacheExpireTimer() {
        clearTimeout(this.cacheTimer);
        this.cacheTimer = setTimeout(this.onCacheHit, this.cacheExpiryTime);
    }

    private onCacheHit = () => {
        this.setCacheExpireTimer();
        if(this.testRunStatistics.ExecutedTests > 0) {
            this.onTestRunStatsChange.raise(this, this.CleanCache());
        }
    }
}