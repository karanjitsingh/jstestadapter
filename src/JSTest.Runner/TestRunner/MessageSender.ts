import { Constants } from '../Constants';
import { ICommunicationManager } from '../Environment/ICommunicationManager';
import { AttachmentSet, Message, MessageType, TestMessageLevel, TestResult } from '../ObjectModel';
import { TestCase } from '../ObjectModel/Common';
import { TestCaseEndEventArgs, TestCaseFoundEventArgs, TestCaseStartEventArgs,
         TestMessagePayload, TestRunAttachmentsPayload } from '../ObjectModel/Payloads';

export class MessageSender {
    private readonly commManager: ICommunicationManager;

    constructor(testSessionCommManager: ICommunicationManager) {
        this.commManager = testSessionCommManager;
    }

    public sendVersionCheck() {
        const versionCheckMessage = new Message(MessageType.VersionCheck, Constants.MessageProtocolVersion);
        this.commManager.sendMessage(versionCheckMessage);
    }

    public sendMessage(message: string, messageLevel: TestMessageLevel) {
        const testMessagePayload = <TestMessagePayload> {
            MessageLevel: TestMessageLevel.Error,
            Message: message
        };

        this.commManager.sendMessage(new Message(MessageType.TestMessage, testMessagePayload));
    }

    public sendTestCaseFound(testCase: TestCase) {
        const testFoundPayload: TestCaseFoundEventArgs = {
            TestCase: testCase
        };

        this.commManager.sendMessage(new Message(MessageType.TestCaseFound, testFoundPayload));
    }

    public sendTestCaseStart(testCase: TestCase) {
        const testStartPayload: TestCaseStartEventArgs = {
            TestCase: testCase
        };

        this.commManager.sendMessage(new Message(MessageType.TestCaseStart, testStartPayload));
    }

    public sendTestCaseEnd(testResult: TestResult) {
        const testEndPayload: TestCaseEndEventArgs = {
            TestResult: testResult
        };

        this.commManager.sendMessage(new Message(MessageType.TestCaseEnd, testEndPayload));
    }

    public sendExecutionComplete() {
        this.commManager.sendMessage(new Message(MessageType.ExecutionComplete, null));
    }

    public sendDiscoveryComplete() {
        const discoverCompleteMessage = new Message(MessageType.DiscoveryComplete, null);
        this.commManager.sendMessage(discoverCompleteMessage);
    }

    public sendRunAttachments(attachmentCollection: Array<AttachmentSet>) {
        this.commManager.sendMessage(new Message(MessageType.RunAttachments, <TestRunAttachmentsPayload> {
            Attachments: attachmentCollection
        }));
    }

}
