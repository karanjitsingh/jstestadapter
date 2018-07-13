import { JestCallbacks } from './JestCallbacks';
import { TestOutcome } from '../../../ObjectModel/Common';
import { FailedExpectation } from '../../../ObjectModel/TestFramework';
import { EqtTrace } from '../../../ObjectModel/EqtTrace';

// tslint:disable:no-default-export
class JestReporter {
    private static callbacks: JestCallbacks;
    public static discovery: boolean = false;

    public static INITIALIZE_REPORTER(callbacks: JestCallbacks) {
        this.callbacks = callbacks;
        EqtTrace.info(`JestReporter: initializing`);
    }

    public onRunComplete = () => {
        EqtTrace.info(`JestReporter: run complete`);
        JestReporter.callbacks.handleSessionDone();
    }

    public onTestResult = (test: any, aggregatedResults: any) => {
        
        let startTime = aggregatedResults.perfStats.start;

        if (aggregatedResults.testResults.length === 0 && aggregatedResults.failureMessage) {
            JestReporter.callbacks.handleErrorMessage(aggregatedResults.failureMessage);
            return;
        }

        aggregatedResults.testResults.forEach(result => {

            let outcome: TestOutcome = TestOutcome.None;
            const failedExpectations: Array<FailedExpectation> = [];
    
            if (result.status === 'passed') {
                outcome = TestOutcome.Passed;
            } else if (result.status === 'failed') {
                outcome = TestOutcome.Failed;
                
                result.failureMessages.forEach(msg => {
                    const message: Array<string> = msg.split('\n');
                    let i = 0;
                    for (; i < message.length ; i++) {
                        if (message[i].match(/^\s*?at/)) {
                            break;
                        }
                    }
                    const stack = message.splice(i);

                    failedExpectations.push(<FailedExpectation> {
                        Message: message.join('\n'),
                        StackTrace: stack.join('\n')
                    });
                });

            } else if (result.status === 'pending') {
                outcome = TestOutcome.Skipped;
            }
    
            if (result.pending === true) {
                outcome = TestOutcome.Skipped;
            }
            
            if (JestReporter.discovery) {
                JestReporter.callbacks.handleSpecFound(result.fullName, result.title, test.path);
            } else {
                JestReporter.callbacks.handleSpecResult(result.fullName,
                                                        result.title,
                                                        test.path,
                                                        outcome,
                                                        failedExpectations,
                                                        new Date(startTime),
                                                        new Date(startTime + result.duration));
                startTime += result.duration;
            }
        });
    }
}

export = JestReporter;