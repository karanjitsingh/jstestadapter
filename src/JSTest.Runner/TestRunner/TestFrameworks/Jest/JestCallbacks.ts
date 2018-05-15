import { FailedExpectation } from '../../../ObjectModel/TestFramework';
import { TestOutcome } from '../../../ObjectModel/Common';

export interface JestCallbacks {
    handleSessionStarted();
    handleSessionDone();
    handleSpecStarted(fullyQualifiedName: string, testCaseName: string, sourceFile: string, specObject: any);
    handleSpecDone(testOutcome: TestOutcome, failedExpectations: Array<FailedExpectation>);
}