import { ICommunicationManager } from '../Environment/ICommunicationManager';
import { TestMessageLevel, Message, MessageType } from '../ObjectModel';
import { TestMessagePayload, TestRunCompletePayload, TestRunChangedEventArgs, DiscoveryCompletePayload } from '../ObjectModel/Payloads';
import { TestCase } from '../ObjectModel/Common';
import { TestsDiscoveredEventArgs } from '../ObjectModel/EventArgs';

export class MessageSender {
    private readonly communicationManager: ICommunicationManager;
    private readonly protocolVersion: number = 2;

    constructor(communicationManager: ICommunicationManager) {
        this.communicationManager = communicationManager;
    }

    public sendVersionCheck() {
        const versionCheckMessage = new Message(MessageType.VersionCheck, this.protocolVersion);
        this.communicationManager.sendMessage(versionCheckMessage);
    }

    public sendMessage(message: string, messageLevel: TestMessageLevel) {
        const testMessagePayload = <TestMessagePayload> {
            MessageLevel: TestMessageLevel.Error,
            Message: message
        };

        this.communicationManager.sendMessage(new Message(MessageType.TestMessage, testMessagePayload, this.protocolVersion));
    }

    public sendExecutionComplete(testRuncompletePayload: TestRunCompletePayload) {
        this.communicationManager.sendMessage(new Message(MessageType.ExecutionComplete, testRuncompletePayload, this.protocolVersion));
    }

    public sendTestRunChange(testRunChangedEventArgs: TestRunChangedEventArgs) {
        const testRunChangedMessaged = new Message(MessageType.TestRunStatsChange, testRunChangedEventArgs, this.protocolVersion);
        this.communicationManager.sendMessage(testRunChangedMessaged);
    }

    public sendDiscoveryStatsChange(testFound: Array<TestCase>) {
        const testsFoundMessage = new Message(MessageType.TestCasesFound, testFound, this.protocolVersion);
        this.communicationManager.sendMessage(testsFoundMessage);
    }

    public sendDiscoveryComplete(testDiscoveredEventArgs: TestsDiscoveredEventArgs) {
        const discoveryCompletePayload: DiscoveryCompletePayload = {
            Metrics: {},
            TotalTests: testDiscoveredEventArgs.TotalTestsDiscovered,
            LastDiscoveredTests: testDiscoveredEventArgs.DiscoveredTests,
            IsAborted: false
        };

        this.communicationManager.sendMessage(new Message(MessageType.DiscoveryComplete, discoveryCompletePayload, this.protocolVersion));
    }
}