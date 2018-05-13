import { ICommunicationManager } from '../Environment/ICommunicationManager';
import { TestMessageLevel, Message, MessageType, TestResult } from '../ObjectModel';
// import { TestMessagePayload, TestRunCompletePayload, TestRunChangedEventArgs, DiscoveryCompletePayload,
        //  TestCaseStartEventArgs, 
        //  TestCaseEndEventArgs} from '../ObjectModel/TPPayloads';
import { TestCase } from '../ObjectModel/Common';
import { TestMessagePayload, TestCaseEndEventArgs, TestCaseFoundEventArgs, TestCaseStartEventArgs } from '../ObjectModel/Payloads';

export class MessageSender {
    private readonly commManager: ICommunicationManager;
    public static readonly protocolVersion: number = 1;

    constructor(testSessionCommManager: ICommunicationManager, dataCollectionCommManager?: ICommunicationManager) {
        this.commManager = testSessionCommManager;
    }

    public sendVersionCheck() {
        const versionCheckMessage = new Message(MessageType.VersionCheck, MessageSender.protocolVersion);
        this.commManager.sendMessage(versionCheckMessage);
    }

    public sendMessage(message: string, messageLevel: TestMessageLevel) {
        const testMessagePayload = <TestMessagePayload> {
            MessageLevel: TestMessageLevel.Error,
            Message: message
        };

        this.commManager.sendMessage(new Message(MessageType.TestMessage, testMessagePayload, MessageSender.protocolVersion));
    }

    public sendTestCaseFound(testCase: TestCase) {
        const testFoundPayload: TestCaseFoundEventArgs = {
            TestCase: testCase
        };

        this.commManager.sendMessage(new Message(MessageType.TestCaseFound, testFoundPayload, MessageSender.protocolVersion));
    }

    public sendTestCaseStart(testCase: TestCase) {
        const testStartPayload: TestCaseStartEventArgs = {
            TestCase: testCase
        };

        this.commManager.sendMessage(new Message(MessageType.TestCaseStart, testStartPayload, MessageSender.protocolVersion));
    }

    public sendTestCaseEnd(testResult: TestResult) {
        const testEndPayload: TestCaseEndEventArgs = {
            TestResult: testResult
        };

        this.commManager.sendMessage(new Message(MessageType.TestCaseEnd, testEndPayload, MessageSender.protocolVersion));
    }
    
    public sendExecutionComplete() {
        this.commManager.sendMessage(new Message(MessageType.ExecutionComplete, null, MessageSender.protocolVersion));
    }

    public sendDiscoveryComplete() {
        // const discoveryCompletePayload: DiscoveryCompletePayload = {
        //     Metrics: {},
        //     TotalTests: testDiscoveredEventArgs.TotalTestsDiscovered,
        //     LastDiscoveredTests: testDiscoveredEventArgs.DiscoveredTests,
        //     IsAborted: false
        // };

        const discoverCompleteMessage = new Message(MessageType.DiscoveryComplete, null, MessageSender.protocolVersion);
        this.commManager.sendMessage(discoverCompleteMessage);
    }

}