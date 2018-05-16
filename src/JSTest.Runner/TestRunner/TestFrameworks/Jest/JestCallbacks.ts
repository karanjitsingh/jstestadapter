import { FailedExpectation } from '../../../ObjectModel/TestFramework';
import { TestOutcome } from '../../../ObjectModel/Common';

export interface JestCallbacks {
    handleSessionDone();
    
    handleSpecResult(fullyQualifiedName: string,
        testCaseName: string,
        sourceFile: string,
        testOutcome: TestOutcome,
        failedExpectations: Array<FailedExpectation>,
        startTime: Date,
        endTime: Date);
}