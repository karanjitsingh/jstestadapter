import * as fs from 'fs';
import * as path from 'path';
import { IEnvironment } from '../../Environment/IEnvironment';
import { AttachmentSet, JSTestSettings, TestMessageLevel, TestResult } from '../../ObjectModel';
import { TestCase } from '../../ObjectModel/Common';
import { EqtTrace } from '../../ObjectModel/EqtTrace';
import {
    ITestFramework, TestErrorMessageEventArgs, TestFrameworks,
    TestSessionEventArgs, TestSpecEventArgs, TestRunAttachmentEventArgs
} from '../../ObjectModel/TestFramework';
import { TimeSpan } from '../../Utils/TimeUtils';
import { MessageSender } from '../MessageSender';
import { TestFrameworkEventHandlers } from '../TestFrameworks/TestFrameworkEventHandlers';
import { BaseExecutionManager } from './BaseExecutionManager';

export class ExecutionManager extends BaseExecutionManager {
    protected readonly jsTestSettings: JSTestSettings;
    protected readonly testFramework: TestFrameworks;

    private testCollection: Map<string, TestCase>;

    constructor(environment: IEnvironment, messageSender: MessageSender, jsTestSettings: JSTestSettings) {
        super(environment, messageSender, jsTestSettings.JavaScriptTestFramework);
        this.jsTestSettings = jsTestSettings;
        this.testFramework = this.jsTestSettings.JavaScriptTestFramework;
        this.testSessionManager.onAllSessionsComplete.subscribe(this.executionComplete);
        this.testCollection = null;
    }

    public startTestRunWithSources(sources: Array<string>): Promise<void> {
        const testFrameworkInstance = this.testFrameworkFactory.createTestFramework(this.testFramework);
        if (testFrameworkInstance.canHandleMultipleSources) {
            this.addSessionToSessionManager(sources);
        } else {
            sources.forEach((source => {
                this.addSessionToSessionManager([source]);
            }));
        }

        this.testSessionManager.executeJobs();

        return this.getCompletionPromise();
    }

    public startTestRunWithTests(tests: Array<TestCase>): Promise<void> {
        const sourceMap = {};

        // map each unique TestCase id to the object itself
        this.testCollection = new Map<string, TestCase>();

        tests.forEach((test: TestCase) => {
            this.testCollection.set(test.Id, test);
            if (!sourceMap.hasOwnProperty(test.Source)) {
                sourceMap[test.Source] = 1;
            }
        });

        const sources = Object.keys(sourceMap);
        return this.startTestRunWithSources(sources);
    }

    protected testFrameworkEventHandlers: TestFrameworkEventHandlers = {
        Subscribe: (framework: ITestFramework) => {
            framework.testFrameworkEvents.onTestSessionStart.subscribe(this.testFrameworkEventHandlers.TestSessionStart);
            framework.testFrameworkEvents.onTestSessionEnd.subscribe(this.testFrameworkEventHandlers.TestSessionEnd);
            framework.testFrameworkEvents.onTestCaseStart.subscribe(this.testFrameworkEventHandlers.TestCaseStart);
            framework.testFrameworkEvents.onTestCaseEnd.subscribe(this.testFrameworkEventHandlers.TestCaseEnd);
            framework.testFrameworkEvents.onErrorMessage.subscribe(this.testFrameworkEventHandlers.TestErrorMessage);
            framework.testFrameworkEvents.onRunAttachment.subscribe(this.testFrameworkEventHandlers.TestRunAttachment);
        },

        TestSessionStart: (sender: object, args: TestSessionEventArgs) => {
            this.testSessionManager.updateSessionEventArgs(args);
        },

        TestSessionEnd: (sender: object, args: TestSessionEventArgs) => {
            this.testSessionManager.setSessionComplete(args);
        },

        TestCaseStart: (sender: object, args: TestSpecEventArgs) => {
            this.messageSender.sendTestCaseStart(args.TestCase);
        },

        TestCaseEnd: (sender: object, args: TestSpecEventArgs) => {
            const testResult: TestResult = {
                TestCase: args.TestCase,
                Attachments: this.getTestAttachments(args.TestCase),
                Outcome: args.Outcome,
                ErrorMessage: null,
                ErrorStackTrace: null,
                DisplayName: args.TestCase.DisplayName,
                Messages: [],
                ComputerName: null,
                Duration: TimeSpan.MSToString(args.EndTime.getTime() - args.StartTime.getTime()),
                StartTime: args.StartTime,
                EndTime: args.EndTime
            };

            // TODO how to handle multiple failed expectations?
            if (args.FailedExpectations.length > 0) {
                testResult.ErrorMessage = args.FailedExpectations[0].Message;
                testResult.ErrorStackTrace = args.FailedExpectations[0].StackTrace;
            }

            this.messageSender.sendTestCaseEnd(testResult);
        },

        TestErrorMessage: (sender: object, args: TestErrorMessageEventArgs) => {
            this.messageSender.sendMessage(args.Message, TestMessageLevel.Error);
        },

        TestRunAttachment: (sender: object, args: TestRunAttachmentEventArgs) => {
            this.messageSender.sendRunAttachments(args.AttachmentCollection);
        }
    };

    protected sessionError(sources: Array<string>, err: Error) {
        if (err) {
            this.messageSender.sendMessage(err.stack ?
                err.stack :
                (err.constructor.name + ': ' + err.message),
                TestMessageLevel.Error);
        }
    }

    private addSessionToSessionManager(sources: Array<string>) {
        this.testSessionManager.addSession(sources, () => {
            const framework = this.createTestFramework(this.testFramework);
            if (this.testCollection) {
                framework.startExecutionWithTests(sources, this.testCollection, this.jsTestSettings.TestFrameworkConfigJson);
            } else {
                framework.startExecutionWithSources(sources, this.jsTestSettings.TestFrameworkConfigJson);
            }
        },
            (e) => {
                this.sessionError(sources, e);
            });
    }

    private executionComplete = () => {
        this.messageSender.sendExecutionComplete();
        this.onComplete.raise(this, null);
    }

    private getTestAttachments(testCase: TestCase): Array<AttachmentSet> {
        EqtTrace.info(`ExectuionManager.getTestAttachments: getting attachments for test case ${testCase.DisplayName}`);
        const attachments = new Array<AttachmentSet>();

        // Lets see any file exists in the attachments folder upload
        if (this.jsTestSettings.AttachmentsFolder && testCase.AttachmentGuid) {
            try {
                const attachmentsFolder = path.join(this.jsTestSettings.AttachmentsFolder, testCase.AttachmentGuid);
                if (fs.lstatSync(attachmentsFolder).isDirectory()) {
                    let attachmentSet: AttachmentSet = null;

                    // Iterate through the files under attachments folder to get the list of attachments
                    fs.readdirSync(attachmentsFolder).forEach(file => {
                        const filePath = path.join(attachmentsFolder, file);
                        const fileStats = fs.lstatSync(filePath);
                        if (fileStats.isFile()) {
                            EqtTrace.info(`ExectuionManager.getTestAttachments: adding set ${testCase.ExecutorUri}`);

                            // Ensure top level attachment set
                            if (!attachmentSet) {
                                attachmentSet = new AttachmentSet(testCase.ExecutorUri, 'Attachments');
                                attachments.push(attachmentSet);
                            }

                            EqtTrace.info(`ExectuionManager.getTestAttachments: adding attachment ${filePath}`);

                            // Add current file as attachment
                            attachmentSet.addAttachment(filePath);
                        }
                    });
                }
            } catch (e) {
                // tslint:disable-next-line:max-line-length
                EqtTrace.error(`ExectuionManager.getTestAttachments: Error while getting attachments from ${this.jsTestSettings.AttachmentsFolder} for ${testCase.AttachmentGuid}`, e);
                return new Array<AttachmentSet>();
            }
        }

        return attachments;
    }
}