import { DiscoveryManager, ExecutionManager } from '../../../../src/JSTest.Runner/TestRunner/ExecutionManagers/';
import { IEnvironment } from '../../../../src/JSTest.Runner/Environment/IEnvironment';
import { MessageSender } from '../../../../src/JSTest.Runner/TestRunner/MessageSender';
import { JSTestSettings, TestMessageLevel } from '../../../../src/JSTest.Runner/ObjectModel';
import { TestFrameworkFactory } from '../../../../src/JSTest.Runner/TestRunner/TestFrameworks/TestFrameworkFactory';
import { Environment } from '../../../../src/JSTest.Runner/Environment/Node/Environment';
import { StartDiscoveryPayload } from '../../../../src/JSTest.Runner/ObjectModel/Payloads';
import { TestSessionManager } from '../../../../src/JSTest.Runner/TestRunner/ExecutionManagers/TestSessionManager';
import { TestFrameworks, ITestFramework, ITestFrameworkEvents, TestSessionEventArgs }
from '../../../../src/JSTest.Runner/ObjectModel/TestFramework';
import { EnvironmentType } from '../../../../src/JSTest.Runner/ObjectModel/Common';
import { TestFrameworkEventHandlers } from '../../../../src/JSTest.Runner/TestRunner/TestFrameworks/TestFrameworkEventHandlers';
import { Mock, IMock, Times, It } from 'typemoq';
import * as Assert from 'assert';
import { TestUtils } from '../../TestUtils';
import { Exception, ExceptionType } from '../../../../src/JSTest.Runner/Exceptions';
import { TestableExecutionManager, TestableTestFrameworkFactory, TestableTestSessionManager, TestableFramework } from './Testable';

describe('ExecutionManager Suite', () => {
    let mockEM: IMock<TestableExecutionManager>;
    let mockMessageSender: IMock<MessageSender>;
    let settings: JSTestSettings;
    let mockFactory: IMock<TestFrameworkFactory>;
    let mockSessionManager: IMock<TestSessionManager>;
    let mockTestFramework: IMock<ITestFramework>;
    let mockEventHandlers: IMock<TestFrameworkEventHandlers>;

    const sources = ['file 1', 'file 2', 'file 3'];
    const environment = new Environment();

    const testableTestFrameworkFactory = new TestableTestFrameworkFactory(environment);
    const testableTestSessionManager = new TestableTestSessionManager(environment);

    before(() => {
        mockFactory = Mock.ofInstance(testableTestFrameworkFactory);
        mockSessionManager = Mock.ofInstance(testableTestSessionManager);
        TestFrameworkFactory.instance = mockFactory.object;
        TestSessionManager.instance = mockSessionManager.object;
    });

    beforeEach(() => {

        mockTestFramework = Mock.ofInstance(new TestableFramework(environment));

        mockEventHandlers = Mock.ofInstance(<TestFrameworkEventHandlers> {
            Subscribe: () => { return; },
            TestSessionEnd: () => { return; },
            TestCaseStart: () => { return; },
            TestErrorMessage: () => { return; }
        });

        settings = new JSTestSettings({
            JavaScriptTestFramework: 'jest',
            TestFrameworkConfigJson: '{}'
        });
        mockMessageSender = Mock.ofType(MessageSender);
        mockEM = Mock.ofInstance(new TestableExecutionManager(new Environment(),
                                                              mockMessageSender.object,
                                                              settings,
                                                              mockEventHandlers.object));
        mockEM.callBase = true;        

        mockSessionManager.reset();
        mockFactory.reset();
    });

    it('startExecution will add single session for canHandleMultipleSources=true', (done) => {
        mockFactory.setup((x) => x.createTestFramework(It.isAny())).returns(() => <ITestFramework> { canHandleMultipleSources: true });
        
        mockSessionManager.setup((x) => x.addSession(It.isAny(), It.isAny(), It.isAny())).callback((...args: Array<any>) => {
            validateSession(args[0], args[1], args[2]);
        });

        Assert.equal(mockEM.object.startExec(sources) instanceof Promise, true, 'Should return completion promise.');

        mockFactory.verify((x) => x.createTestFramework(TestFrameworks.Jest), Times.once());
        mockSessionManager.verify((x) => x.addSession(It.isAny(), It.isAny(), It.isAny()), Times.once());
        mockSessionManager.verify((x) => x.addSession(It.is((x) => TestUtils.assertDeepEqual(x, sources)), It.isAny(), It.isAny()),
                                  Times.once());

        done();
    });

    it('startExeuction will add multiple sessions for canHandleMultipleSources=false', (done) => {
        mockFactory.setup((x) => x.createTestFramework(It.isAny())).returns(() => <ITestFramework> { canHandleMultipleSources: false });

        mockSessionManager.setup((x) => x.addSession(It.isAny(), It.isAny(), It.isAny())).callback((...args: Array<any>) => {
            validateSession(args[0], args[1], args[2]);
        });

        Assert.equal(mockEM.object.startExec(sources) instanceof Promise, true, 'Should return completion promise.');

        mockFactory.verify((x) => x.createTestFramework(TestFrameworks.Jest), Times.once());
        mockSessionManager.verify((x) => x.addSession(It.isAny(), It.isAny(), It.isAny()), Times.exactly(sources.length));

        sources.forEach(source => {
            mockSessionManager.verify((x) => x.addSession(It.is((x) => TestUtils.assertDeepEqual(x, [source])), It.isAny(), It.isAny()),
                                      Times.once());
        });

        done();
    });

    it('testFrameworkEventHandlers will handle TestCaseStart, TestSessionEnd, TestErrorMessage', (done) => {
        const testableDiscoveryManager = new TestableExecutionManager(new Environment(),
                                                                      mockMessageSender.object,
                                                                      settings);
        
        const eventHandlers = testableDiscoveryManager.getEventHandlers();

        const sender = <any> { sender: 'this' };
        const args = <any> { key: 'value', TestCase: 'test case', Message: 'message' };

        eventHandlers.Subscribe(mockTestFramework.object);

        mockTestFramework.object.testFrameworkEvents.onTestSessionEnd.raise(sender, args);
        mockTestFramework.object.testFrameworkEvents.onTestCaseStart.raise(sender, args);
        mockTestFramework.object.testFrameworkEvents.onErrorMessage.raise(sender, args);

        mockSessionManager.verify((x) => x.setSessionComplete(It.is((x) => TestUtils.assertDeepEqual(x, args))), Times.once());
        mockMessageSender.verify((x) => x.sendTestCaseFound(It.is((x) => x === args.TestCase)), Times.once());
        mockMessageSender.verify((x) => x.sendMessage(It.is((x) => x === args.Message), It.is((x) => x === TestMessageLevel.Error)),
                                 Times.once());

        done();
    });

    it('sessionError will send error message and call sessionComplete', (done) => {
        const err = new Exception('session error', ExceptionType.UnknownException);
        mockEM.object.sessionError(sources, err);
        mockMessageSender.verify((x) => x.sendMessage(It.is((x) => x === err.stack), It.isAny()), Times.once());

        err.stack = null;
        mockEM.object.sessionError(sources, err);
        mockMessageSender.verify((x) => x.sendMessage(It.is((x) => x === (err.constructor.name + ': ' + err.message)), It.isAny()),
                                 Times.once());

        done();
    });

    it('will eventually send discovery complete and resolve compleition promise', (done) => {
        
        mockFactory.setup((x) => x.createTestFramework(It.isAny())).returns(() => <ITestFramework> { canHandleMultipleSources: false });
        mockEM.object.startExec(sources).then(() => {
            done();
        });

        mockSessionManager.object.onAllSessionsComplete.raise(null, null);
        mockMessageSender.verify((x) => x.sendDiscoveryComplete(), Times.once());
    });

    function validateSession(sources: Array<string>, executeJob: () => void, errorCallback: (err: Error) => void) {
        mockFactory.reset();
        mockEventHandlers.reset();
        mockTestFramework.reset();
        mockEM.reset();
        
        mockFactory.setup((x) => x.createTestFramework(It.isAny())).returns(() => mockTestFramework.object);
        
        // Validate execute job
        executeJob();
        mockFactory.verify((x) => x.createTestFramework(TestFrameworks.Jest), Times.once());
        mockTestFramework.verify((x) => x.initialize(), Times.once());
        mockTestFramework.verify((x) => x.startDiscovery(It.is((x) => TestUtils.assertDeepEqual(x, sources))), Times.once());
        mockEventHandlers.verify((x) => x.Subscribe(It.is((x) => TestUtils.assertDeepEqual(x, mockTestFramework.object))), Times.once());

        const dummyError = new Error('dummy error');

        // Validate error callback
        errorCallback(dummyError);
        mockEM.verify((x) => x.sessionError(It.is((x) => TestUtils.assertDeepEqual(x, sources)), It.is((x) => x === dummyError)),
                      Times.once());

    }
});