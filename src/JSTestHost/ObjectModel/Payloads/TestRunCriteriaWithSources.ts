import { TestExecutionContext } from '.';

export interface TestRunCriteriaWithSources {
    AdapterSourceMap: {[key: string]: Array<string>};
    RunSettings: string;
    TestExecutionContext: TestExecutionContext;
    Package: string;
}