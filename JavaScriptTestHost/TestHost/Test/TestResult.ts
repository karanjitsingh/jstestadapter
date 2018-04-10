import TestCase from "./TestCase";

enum Result {
    Pass,
    Fail
}

export default interface TestResult {
    Result: Result;
    TestCase: TestCase;
}