import { ICommunicationManager } from '../Environment/ICommunicationManager';
import { TestMessageLevel, Message, MessageType, TestResult } from '../ObjectModel';
import { TestCase } from '../ObjectModel/Common';
import { TestMessagePayload, TestCaseEndEventArgs, TestCaseFoundEventArgs, TestCaseStartEventArgs } from '../ObjectModel/Payloads';
import { Constants } from '../Constants';

export class MessageSender {
    private readonly commManager: ICommunicationManager;

    constructor(testSessionCommManager: ICommunicationManager) {
        this.commManager = testSessionCommManager;
    }

    public sendVersionCheck() {
        const versionCheckMessage = new Message(MessageType.VersionCheck, Constants.messageProtocolVersion);
        this.commManager.sendMessage(versionCheckMessage);
    }

    public sendMessage(message: string, messageLevel: TestMessageLevel) {
        const testMessagePayload = <TestMessagePayload> {
            MessageLevel: TestMessageLevel.Error,
            Message: message
        };

        this.commManager.sendMessage(new Message(MessageType.TestMessage, testMessagePayload, Constants.messageProtocolVersion));
    }

    public sendTestCaseFound(testCase: TestCase) {
        const testFoundPayload: TestCaseFoundEventArgs = {
            TestCase: testCase
        };

        this.commManager.sendMessage(new Message(MessageType.TestCaseFound, testFoundPayload, Constants.messageProtocolVersion));
    }

    public sendTestCaseStart(testCase: TestCase) {
        const testStartPayload: TestCaseStartEventArgs = {
            TestCase: testCase
        };

        this.commManager.sendMessage(new Message(MessageType.TestCaseStart, testStartPayload, Constants.messageProtocolVersion));
    }

    public sendTestCaseEnd(testResult: TestResult) {
        const testEndPayload: TestCaseEndEventArgs = {
            TestResult: testResult
        };

        this.commManager.sendMessage(new Message(MessageType.TestCaseEnd, testEndPayload, Constants.messageProtocolVersion));
    }

    public sendExecutionComplete() {
        this.commManager.sendMessage(new Message(MessageType.ExecutionComplete, null, Constants.messageProtocolVersion));
    }

    public sendDiscoveryComplete() {
        const discoverCompleteMessage = new Message(MessageType.DiscoveryComplete, null, Constants.messageProtocolVersion);
        this.commManager.sendMessage(discoverCompleteMessage);
    }

}