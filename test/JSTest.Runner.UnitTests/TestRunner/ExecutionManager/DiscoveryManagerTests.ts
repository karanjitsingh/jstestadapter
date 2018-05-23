import { DiscoveryManager } from '../../../../src/JSTest.Runner/TestRunner/ExecutionManagers/';
import { IEnvironment } from '../../../../src/JSTest.Runner/Environment/IEnvironment';
import { MessageSender } from '../../../../src/JSTest.Runner/TestRunner/MessageSender';
import { JSTestSettings } from '../../../../src/JSTest.Runner/ObjectModel';
import { TestFrameworkFactory } from '../../../../src/JSTest.Runner/TestRunner/TestFrameworks/TestFrameworkFactory';
import { Environment } from '../../../../src/JSTest.Runner/Environment/Node/Environment';
import { StartDiscoveryPayload } from '../../../../src/JSTest.Runner/ObjectModel/Payloads';
import { TestSessionManager } from '../../../../src/JSTest.Runner/TestRunner/ExecutionManagers/TestSessionManager';
import { Mock, IMock, Times, It } from 'typemoq';
import { TestFrameworks, ITestFramework } from '../../../../src/JSTest.Runner/ObjectModel/TestFramework';
import * as Assert from 'assert';
import { EnvironmentType } from '../../../../src/JSTest.Runner/ObjectModel/Common';
import { ICallContext } from 'typemoq/_all';
import { TestFrameworkEventHandlers } from '../../../../src/JSTest.Runner/TestRunner/TestFrameworks/TestFrameworkEventHandlers';
import { once } from 'cluster';

describe('DiscoveryManager Suite', () => {
    let mockDM: IMock<DiscoveryManager>;
    let mockMessageSender: IMock<MessageSender>;
    let settings: JSTestSettings;
    let mockFactory: IMock<TestFrameworkFactory>;
    let mockSessionManager: IMock<TestSessionManager>;
    let mockTestFramework: IMock<ITestFramework>;
    let mockEventHandlers: IMock<TestFrameworkEventHandlers>;

    const sources = ['file 1', 'file 2'];
    const environment = new Environment();

    TestFrameworkFactory.INITIALIZE(environment);
    TestSessionManager.INITIALIZE(environment);

    const validateSession = (sources, executeJob, errorCallback): boolean => {
        mockFactory.reset();
        mockEventHandlers.reset();
        mockTestFramework.reset();
        
        mockFactory.setup((x) => x.createTestFramework(It.isAny())).returns(() => mockTestFramework.object);
        
        executeJob();
        
        mockFactory.verify((x) => x.createTestFramework(TestFrameworks.Jest), Times.once());
        mockTestFramework.verify((x) => x.initialize(), Times.once());
        mockTestFramework.verify((x) => x.startDiscovery(It.is((x) => arrayCompare(x, sources))), Times.once());
        mockEventHandlers.verify((x) => x.Subscribe(It.is((x) => (Assert.deepEqual(x, mockTestFramework.object) || true ))), Times.once());

        return true;
    };

    const arrayCompare = (x: Array<any>, y: Array<any>) => {
        return JSON.stringify(x) === JSON.stringify(y);
    };

    beforeEach(() => {
        mockFactory = Mock.ofInstance(TestFrameworkFactory.instance);
        mockSessionManager = Mock.ofInstance(TestSessionManager.instance);

        mockTestFramework = Mock.ofInstance(<ITestFramework> {
            executorUri: '',
            environmentType: EnvironmentType.NodeJS,
            startExecutionWithSource: () => { return; },
            startExecutionWithTests: () => { return; },
            supportsJsonOptions: false,
            canHandleMultipleSources: true,
            initialize: () => { return; },
            startDiscovery: () => { return; },
            testFrameworkEvents: null
        });

        mockEventHandlers = Mock.ofInstance(<TestFrameworkEventHandlers> {
            Subscribe: () => { return; },
            TestSessionEnd: () => { return; },
            TestCaseStart: () => { return; },
            TestErrorMessage: () => { return; }
        });

        TestFrameworkFactory.instance = mockFactory.object;
        TestSessionManager.instance = mockSessionManager.object;

        settings = new JSTestSettings({
            JavaScriptTestFramework: 'jest',
            TestFrameworkConfigJson: '{}'
        });
        mockMessageSender = Mock.ofType(MessageSender);
        mockDM = Mock.ofInstance(new TestableDiscoveryManager(new Environment(),
                                                              mockMessageSender.object,
                                                              settings,
                                                              mockEventHandlers.object));
        mockDM.callBase = true;

        mockSessionManager.setup((x) => x.addSession(It.isAny(), It.isAny(), It.isAny())).callback((...args: Array<any>) => {
            validateSession(args[0], args[1], args[2]);
        });

        mockFactory.setup((x) => x.createTestFramework(It.isAny())).returns(() => <ITestFramework> { canHandleMultipleSources: true });
    });

    it('discoverTests will add single session for canHandleMultipleSources=true', (done) => {

        Assert.equal(mockDM.object.discoverTests(<StartDiscoveryPayload>{
            Sources: sources
        }) instanceof Promise, true, 'Should return completion promise.');

        mockFactory.verify((x) => x.createTestFramework(TestFrameworks.Jest), Times.once());
        mockSessionManager.verify((x) => x.addSession(It.isAny(), It.isAny(), It.isAny()), Times.once());
        mockSessionManager.verify((x) => x.addSession(It.is((x) => arrayCompare(x, sources)), It.isAny(), It.isAny()),
                                  Times.once());

        done();
    });

    it('discoverTests will add multiple sessions for canHandleMultipleSources=false', (done) => {
        Assert.equal(mockDM.object.discoverTests(<StartDiscoveryPayload>{
            Sources: sources
        }) instanceof Promise, true, 'Should return completion promise.');

        mockFactory.verify((x) => x.createTestFramework(TestFrameworks.Jest), Times.once());
        mockSessionManager.verify((x) => x.addSession(It.isAny(), It.isAny(), It.isAny()), Times.exactly(sources.length));

        sources.forEach(source => {
            mockSessionManager.verify((x) => x.addSession(It.is((x) => arrayCompare(x, sources)), It.isAny(), It.isAny()),
                                      Times.once());
        });

        done();
    });
});

class TestableDiscoveryManager extends DiscoveryManager  {

    constructor(environment: IEnvironment,
                messageSender: MessageSender,
                settings: JSTestSettings,
                eventHandlers: TestFrameworkEventHandlers) {
        super(environment, messageSender, settings);
        this.testFrameworkEventHandlers = eventHandlers;
    }
}