import { JestCallbacks } from './JestCallbacks';
import { TestOutcome } from '../../../ObjectModel/Common';
import { FailedExpectation } from '../../../ObjectModel/TestFramework';
import { EqtTrace } from '../../../ObjectModel/EqtTrace';
import * as Path from 'path';

// tslint:disable:no-default-export
class JestReporter {
    private static callbacks: JestCallbacks;
    private static configFilePath: string;
    public static discovery: boolean = false;

    public static INITIALIZE_REPORTER(callbacks: JestCallbacks) {
        this.callbacks = callbacks;
        EqtTrace.info(`JestReporter: initializing`);
    }

    public static UPDATE_CONFIG(configFilePath: string) {
        this.configFilePath = configFilePath;
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

        let attachmentsFolderBase: string = null;
        if (test.path) {
            // Attachments folder is {testpath_folder}/_attachments/{test_name}
            attachmentsFolderBase = Path.join(
                Path.dirname(test.path),
                '_attachments',
                Path.basename(test.path, '.js').replace(/\s|\./gi, '_') // replace ' ' and '.' with '_'
            );
        }

        aggregatedResults.testResults.forEach((result, index: number) => {

            let outcome: TestOutcome = TestOutcome.None;
            const failedExpectations: Array<FailedExpectation> = [];

            if (result.status === 'passed') {
                outcome = TestOutcome.Passed;
            } else if (result.status === 'failed') {
                outcome = TestOutcome.Failed;

                result.failureMessages.forEach(msg => {
                    const message: Array<string> = msg.split('\n');
                    let i = 0;
                    for (; i < message.length; i++) {
                        if (message[i].match(/^\s*?at/)) {
                            break;
                        }
                    }
                    const stack = message.splice(i);

                    failedExpectations.push(<FailedExpectation>{
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

            // Jest provides test suite title as ancestor titles. Use them if provided
            let resultTitle = result.title;
            if (result.ancestorTitles && result.ancestorTitles.length > 0) {
                resultTitle = [...result.ancestorTitles, resultTitle].join(' > ');
            }

            const testFilePath = Path.relative(Path.dirname(JestReporter.configFilePath), test.path);

            if (JestReporter.discovery) {
                JestReporter.callbacks.handleSpecFound(result.fullName,
                    resultTitle,
                    JestReporter.configFilePath,
                    undefined,
                    '::' + result.fullName + '::' + testFilePath);
            } else {

                // If the test path is c:\src\jest-log\tests\advanced.test.js
                // then attachments folder becomes:
                // 
                //    c:\src\jest-log\tests\_attachments\advanced_test_spec0
                //
                const attachmentsFolder = `${attachmentsFolderBase}_spec${index}`;

                JestReporter.callbacks.handleSpecResult(result.fullName,
                    resultTitle,
                    JestReporter.configFilePath,
                    outcome,
                    failedExpectations,
                    new Date(startTime),
                    new Date(startTime + result.duration),
                    '::' + result.fullName + '::' + testFilePath,
                    attachmentsFolder);
                startTime += result.duration;
            }
        });
    }
}

export = JestReporter;