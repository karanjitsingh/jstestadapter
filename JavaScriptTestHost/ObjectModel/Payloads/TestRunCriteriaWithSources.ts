import TestExecutionContext from "./TestExecutionContext";

export default interface TestRunCriteriaWithSources {
    AdapterSourceMap: JSON;
    RunSettings: string;
    TestExecutionContext: TestExecutionContext;
    Package: string;
}