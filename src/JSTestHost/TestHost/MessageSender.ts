import { ICommunicationManager } from '../Environment/ICommunicationManager';
import { TestMessageLevel, Message, MessageType, AttachmentSet } from '../ObjectModel';
import { TestMessagePayload, TestRunCompletePayload, TestRunChangedEventArgs, DiscoveryCompletePayload,
         TestCaseStartEventArgs, 
         TestCaseEndEventArgs} from '../ObjectModel/Payloads';
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
        const testRunChangedMessage = new Message(MessageType.TestRunStatsChange, testRunChangedEventArgs, this.protocolVersion);
        this.communicationManager.sendMessage(testRunChangedMessage);
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

        const discoverCompleteMessage = new Message(MessageType.DiscoveryComplete, discoveryCompletePayload, this.protocolVersion);
        this.communicationManager.sendMessage(discoverCompleteMessage);
    }

    public sendTestCaseStart(testCaseStartEventArgs: TestCaseStartEventArgs) {
        const testCaseStartMessage = new Message(MessageType.DataCollectionTestStart, testCaseStartEventArgs, this.protocolVersion);
        this.communicationManager.sendMessage(testCaseStartMessage);

        const message = this.communicationManager.receiveMessageSync();
        if (message.MessageType !== MessageType.DataCollectionTestStartAck) {
            // EqtTrace.Error("DataCollectionTestCaseEventSender.SendTestCaseStart : MessageType.DataCollectionTestStartAck not received.");
        }
    }

    public sendTestCaseEnd(testCaseEndEventArgs: TestCaseEndEventArgs): Array<AttachmentSet> {
        const attachmentSets: Array<AttachmentSet> = [];

        const testCaseEndMessage = new Message(MessageType.DataCollectionTestEnd, testCaseEndEventArgs, this.protocolVersion);
        this.communicationManager.sendMessage(testCaseEndMessage);

        const message = this.communicationManager.receiveMessageSync();

        if (message.MessageType === MessageType.DataCollectionTestEndResult) {
            const rawAttachments = message.Payload;
            rawAttachments.forEach(element => {
                attachmentSets.push(new AttachmentSet(element));
            });
        }

        return attachmentSets;
    }
}