import { FailedExpectation } from '../../../ObjectModel/TestFramework';
import { TestOutcome } from '../../../ObjectModel/Common';

export interface KarmaCallbacks {
    handleKarmaRunComplete();
    handleSpecFound(fullyQualifiedName: string,
        testCaseName: string,
        sourceFile: string,
        specObject: any,
        fqnPostFix?: string,
        attachmentId?: string);
    handleSpecResult(fullyQualifiedName: string,
        testCaseName: string,
        sourceFile: string,
        testOutcome: TestOutcome,
        failedExpectations: Array<FailedExpectation>,
        startTime: Date,
        endTime: Date,
        fqnPostFix?: string,
        attachmentId?: string);
    handleErrorMessage(message: string);
}