import { ITestFramework, TestSessionEventArgs, TestSpecEventArgs, TestFrameworks } from '../../ObjectModel/TestFramework';
import { TestsDiscoveredEventArgs } from '../../ObjectModel/EventArgs';
// import { DiscoveryCriteria } from '../../ObjectModel/TPPayloads';
import { TestMessageLevel } from '../../ObjectModel';
import { TestDiscoveryCache } from '../TestCache';
import { IEnvironment } from '../../Environment/IEnvironment';
import { MessageSender } from '../MessageSender';
import { TestFrameworkEventHandlers } from '../TestFrameworks/TestFrameworkEventHandlers';
import { BaseExecutionManager } from './BaseExecutionManager';

export class DiscoveryManager extends BaseExecutionManager {

    private testFramework: TestFrameworks;

    constructor(environment: IEnvironment, messageSender: MessageSender, testFramework: TestFrameworks) {
        super(environment, messageSender, testFramework);
        this.testFramework = testFramework;
        this.testSessionManager.onSessionsComplete.subscribe(this.discoveryComplete);
    }

    public discoverTests(criteria: DiscoveryCriteria): Promise<void> {
        this.setRunSettingsFromXml(criteria.RunSettings);
        
        const sources = this.getSourcesFromAdapterSourceMap(criteria.AdapterSourceMap);

        this.testDiscoveryCache = new TestDiscoveryCache(this.environment,
                                                         criteria.FrequencyOfDiscoveredTestsEvent,
                                                         criteria.DiscoveredTestEventTimeout);

        this.testDiscoveryCache.onReportTestCases.subscribe(this.runStatsChange);
        
        sources.forEach(source => {
            this.testSessionManager.addSession(source, () => {
                const testFrameworkInstance = this.testFrameworkFactory.createTestFramework(this.testFramework);
                this.testFrameworkEventHandlers.Subscribe(testFrameworkInstance);
                testFrameworkInstance.startDiscovery(source);
            },
            (e) => {
                this.sessionError(source, e);
            });
        });

        return this.getCompletetionPromise();
    }

    private sessionError(source: string, err: Error) {
        if (err) {
            this.messageSender.sendMessage(err.stack ?
                err.stack :
                (err.constructor.name + ': ' + err.message + ' at ' + source),
            TestMessageLevel.Error);
        }

        const currentSession = this.testSessionManager.getSessionEventArgs(source);

        if (currentSession != null) {
            currentSession.InProgress = false;
            currentSession.EndTime = new Date();
        } else {
            // TODO ??
        }

        this.testSessionManager.setSessionComplete(currentSession);
    }

    private discoveryComplete = () => {
        console.log('discovery complete');

        const remainingTests = this.testDiscoveryCache.cleanCache();
        this.messageSender.sendDiscoveryComplete(remainingTests);
        this.onComplete.raise(this, null);
    }

    protected testFrameworkEventHandlers: TestFrameworkEventHandlers = {
        Subscribe: (framework: ITestFramework) => {
            framework.testFrameworkEvents.onTestSessionEnd.subscribe(this.testFrameworkEventHandlers.TestSessionEnd);
            framework.testFrameworkEvents.onTestCaseStart.subscribe(this.testFrameworkEventHandlers.TestCaseStart);
        },

        TestSessionEnd: (sender: object, args: TestSessionEventArgs) => {
            console.log('test session end trigger');
            this.testSessionManager.setSessionComplete(args);
        },

        TestCaseStart: (sender: object, args: TestSpecEventArgs) => {
            console.log('adding test case to cache');
            this.testDiscoveryCache.addTest(args.TestCase);
        }
    };
    
    protected runStatsChange = (sender: object, args: TestsDiscoveredEventArgs) => {
        console.log('tests discovered');
        this.messageSender.sendDiscoveryStatsChange(args.DiscoveredTests);
    }
}