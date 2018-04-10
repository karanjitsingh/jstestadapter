import * as Test from "./Test";
import TestRunCriteriaWithSources from "../ObjectModel/TestRunCriteriaWithSources";
import TestFrameworkProvider, { TestFramework } from "./TestFrameworks/TestFrameworkProvider";
import IEnvironment from "../Environment/IEnvironment";

export default class TestRunner {

    private environment: IEnvironment;

    constructor(environment: IEnvironment) {
        this.environment = environment;
    }

    public DiscoverTests(): Array<Test.TestCase> {

        return;
    }
    
    public StartTestRunWithSources(criteria: TestRunCriteriaWithSources): Array<Test.TestResult> {
        console.log("test runner here: ", criteria);

        let framework = TestFrameworkProvider.GetTestFramework(TestFramework.Jasmine, this.environment);

        var sources = criteria.AdapterSourceMap[Object.keys(criteria.AdapterSourceMap)[0]];

        framework.StartExecution([sources[0]])
        return;
    }
}