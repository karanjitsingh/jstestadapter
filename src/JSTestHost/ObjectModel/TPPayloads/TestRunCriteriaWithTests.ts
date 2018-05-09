import { TestExecutionContext } from '.';
import { TestCase } from '../Common';

export interface TestRunCriteriaWithTests {
    Tests: Array<TestCase>;
    RunSettings: string;
    TestExecutionContext: TestExecutionContext;
    Package: string;
}