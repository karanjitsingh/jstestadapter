import { ICommunicationManager } from '../Environment/ICommunicationManager';
import { TestMessageLevel, Message, MessageType, AttachmentSet } from '../ObjectModel';
// import { TestMessagePayload, TestRunCompletePayload, TestRunChangedEventArgs, DiscoveryCompletePayload,
        //  TestCaseStartEventArgs, 
        //  TestCaseEndEventArgs} from '../ObjectModel/TPPayloads';
import { TestCase } from '../ObjectModel/Common';
import { TestsDiscoveredEventArgs } from '../ObjectModel/EventArgs';

export class MessageSender {
    private readonly tsCommManager: ICommunicationManager;
    private readonly dcCommManager: ICommunicationManager;
    public static readonly protocolVersion: number = 1;

    constructor(testSessionCommManager: ICommunicationManager, dataCollectionCommManager?: ICommunicationManager) {
        this.tsCommManager = testSessionCommManager;
        this.dcCommManager = dataCollectionCommManager;
    }

    public sendVersionCheck() {
        const versionCheckMessage = new Message(MessageType.VersionCheck, MessageSender.protocolVersion);
        this.tsCommManager.sendMessage(versionCheckMessage);
    }

    public sendMessage(message: string, messageLevel: TestMessageLevel) {
        const testMessagePayload = <TestMessagePayload> {
            MessageLevel: TestMessageLevel.Error,
            Message: message
        };

        this.tsCommManager.sendMessage(new Message(MessageType.TestMessage, testMessagePayload, MessageSender.protocolVersion));
    }

    public sendExecutionComplete(testRuncompletePayload: TestRunCompletePayload) {
        this.tsCommManager.sendMessage(new Message(MessageType.ExecutionComplete, testRuncompletePayload, MessageSender.protocolVersion));
    }

    public sendTestRunChange(testRunChangedEventArgs: TestRunChangedEventArgs) {
        const testRunChangedMessage = new Message(MessageType.TestRunStatsChange, testRunChangedEventArgs, MessageSender.protocolVersion);
        this.tsCommManager.sendMessage(testRunChangedMessage);
    }

    public sendDiscoveryStatsChange(testFound: Array<TestCase>) {
        const testsFoundMessage = new Message(MessageType.TestCasesFound, testFound, MessageSender.protocolVersion);
        this.tsCommManager.sendMessage(testsFoundMessage);
    }

    public sendDiscoveryComplete(testDiscoveredEventArgs: TestsDiscoveredEventArgs) {
        const discoveryCompletePayload: DiscoveryCompletePayload = {
            Metrics: {},
            TotalTests: testDiscoveredEventArgs.TotalTestsDiscovered,
            LastDiscoveredTests: testDiscoveredEventArgs.DiscoveredTests,
            IsAborted: false
        };

        const discoverCompleteMessage = new Message(MessageType.DiscoveryComplete, discoveryCompletePayload, MessageSender.protocolVersion);
        this.tsCommManager.sendMessage(discoverCompleteMessage);
    }

    public sendTestCaseStart(testCaseStartEventArgs: TestCaseStartEventArgs) {
        if (!this.dcCommManager) {
            // TODO log
            return;
        }

        const testCaseStartMessage = new Message(MessageType.DataCollectionTestStart,
                                                 testCaseStartEventArgs,
                                                 MessageSender.protocolVersion);
        this.dcCommManager.sendMessage(testCaseStartMessage);

        const message = this.dcCommManager.receiveMessageSync();
        if (message.MessageType !== MessageType.DataCollectionTestStartAck) {
            // TODO EqtTrace.Err("DataCollionTestCaseEventSender.SendTestCaseStart : MessageType.DataCollectionTestStartAck not received.");
        }
    }

    public sendTestCaseEnd(testCaseEndEventArgs: TestCaseEndEventArgs): Array<AttachmentSet> {
        if (!this.dcCommManager) {
            // TODO log
            return;
        }

        const attachmentSets: Array<AttachmentSet> = [];

        const testCaseEndMessage = new Message(MessageType.DataCollectionTestEnd, testCaseEndEventArgs, MessageSender.protocolVersion);
        this.dcCommManager.sendMessage(testCaseEndMessage);

        const message = this.dcCommManager.receiveMessageSync();

        if (message.MessageType === MessageType.DataCollectionTestEndResult) {
            const rawAttachments = message.Payload;
            rawAttachments.forEach(element => {
                attachmentSets.push(new AttachmentSet(element));
            });
        }

        return attachmentSets;
    }
}