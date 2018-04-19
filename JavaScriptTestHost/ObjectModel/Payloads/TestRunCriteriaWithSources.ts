import { TestExecutionContext } from './TestExecutionContext';

export interface TestRunCriteriaWithSources {
    AdapterSourceMap: JSON;
    RunSettings: string;
    TestExecutionContext: TestExecutionContext;
    Package: string;
}