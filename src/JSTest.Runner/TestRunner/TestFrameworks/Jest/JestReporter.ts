import { JestCallbacks } from './JestCallbacks';
import { TestOutcome } from '../../../ObjectModel/Common';
import { FailedExpectation } from '../../../ObjectModel/TestFramework';

export class JestReporter {
    private static callbacks: JestCallbacks;

    public static INITIALIZE_REPORTER(callbacks: JestCallbacks) {
        this.callbacks = callbacks;
    }

    public onRunComplete = () => {
        JestReporter.callbacks.handleSessionDone();
    }

    public onTestResult = (test: any, aggregatedResults: any) => {

        let startTime = aggregatedResults.perfStats.start;

        aggregatedResults.testResults.forEach(result => {

            let outcome: TestOutcome = TestOutcome.None;
            const failedExpectations: Array<FailedExpectation> = [];
    
            if (result.status === 'passed') {
                outcome = TestOutcome.Passed;
            } else if (result.status === 'failed') {
                outcome = TestOutcome.Failed;
                
                result.failureMessages.forEach(msg => {
                    const message = msg.split('\n');
                    const stack = message.splice(1);

                    failedExpectations.push(<FailedExpectation> {
                        Message: message,
                        StackTrace: stack
                    });
                });

            } else if (result.status === 'pending') {
                outcome = TestOutcome.Skipped;
            }
    
            if (result.pending === true) {
                outcome = TestOutcome.Skipped;
            }
    
            JestReporter.callbacks.handleSpecResult(result.fullName,
                                                    result.title,
                                                    test.path,
                                                    outcome,
                                                    failedExpectations,
                                                    new Date(startTime),
                                                    new Date(startTime + result.duration));
            
            startTime += result.duration;
        });
        
    }
}