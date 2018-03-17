import * as Test from "./Test";

export default class TestRunner {
    DiscoverTests:() => Array<Test.TestSuite>;
    ExecuteTests:() => Array<Test.TestResult>;
}