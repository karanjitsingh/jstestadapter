import { TestExecutionContext } from '.';

export interface TestRunCriteriaWithSources {
    AdapterSourceMap: JSON;
    RunSettings: string;
    TestExecutionContext: TestExecutionContext;
    Package: string;
}