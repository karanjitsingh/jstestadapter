import * as Assert from 'assert';
import * as fs from 'fs';
import * as OS from 'os';
import * as path from 'path';
import { IMock, It, Mock, Times } from 'typemoq';
import { IEnvironment } from '../../../../src/JSTest.Runner/Environment/IEnvironment';
import { Environment } from '../../../../src/JSTest.Runner/Environment/Node/Environment';
import { Exception, ExceptionType } from '../../../../src/JSTest.Runner/Exceptions';
import { AttachmentSet, JSTestSettings, TestMessageLevel, TestResult } from '../../../../src/JSTest.Runner/ObjectModel';
import { TestCase, TestOutcome } from '../../../../src/JSTest.Runner/ObjectModel/Common';
import { ITestFramework, TestFrameworks, TestSpecEventArgs } from '../../../../src/JSTest.Runner/ObjectModel/TestFramework';
import { TestSessionManager } from '../../../../src/JSTest.Runner/TestRunner/ExecutionManagers/TestSessionManager';
import { MessageSender } from '../../../../src/JSTest.Runner/TestRunner/MessageSender';
import { TestFrameworkEventHandlers } from '../../../../src/JSTest.Runner/TestRunner/TestFrameworks/TestFrameworkEventHandlers';
import { TestFrameworkFactory } from '../../../../src/JSTest.Runner/TestRunner/TestFrameworks/TestFrameworkFactory';
import { TimeSpan } from '../../../../src/JSTest.Runner/Utils/TimeUtils';
import { TestUtils } from '../../TestUtils';
import { TestableExecutionManager, TestableFramework, TestableTestFrameworkFactory, TestableTestSessionManager } from './Testable';

describe('ExecutionManager Suite', () => {
    let mockEM: IMock<TestableExecutionManager>;
    let mockMessageSender: IMock<MessageSender>;
    let settings: JSTestSettings;
    let mockFactory: IMock<TestFrameworkFactory>;
    let mockSessionManager: IMock<TestSessionManager>;
    let mockTestFramework: IMock<ITestFramework>;
    let mockEventHandlers: IMock<TestFrameworkEventHandlers>;

    const sources = ['file 1', 'file 2', 'file 3'];
    const tests = [
        new TestCase('file 1', 'fqn', 'uri'),
        new TestCase('file 2', 'fqn', 'uri'),
        new TestCase('file 3', 'fqn', 'uri')
    ];
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

        mockEventHandlers = Mock.ofInstance(<TestFrameworkEventHandlers>{
            Subscribe: () => { return; },
            TestSessionEnd: () => { return; },
            TestCaseStart: () => { return; },
            TestErrorMessage: () => { return; }
        });

        settings = new JSTestSettings({
            JavaScriptTestFramework: 'jest',
            TestFrameworkConfigJson: '{"key": "value"}'
        }, <IEnvironment>{ getTempDirectory: () => OS.tmpdir() });
        mockMessageSender = Mock.ofType(MessageSender);
        mockEM = Mock.ofInstance(new TestableExecutionManager(new Environment(),
            mockMessageSender.object,
            settings,
            mockEventHandlers.object));
        mockEM.callBase = true;

        mockSessionManager.reset();
        mockFactory.reset();
    });

    it('startExecutionWithTests will call startExecutionWithSources', (done) => {
        mockFactory.setup((x) => x.createTestFramework(It.isAny())).returns(() => <ITestFramework>{ canHandleMultipleSources: true });

        mockEM.object.startTestRunWithTests(tests);

        mockEM.callBase = false;

        mockEM.verify((x) => x.startTestRunWithSources(It.is((x) => TestUtils.assertDeepEqual(x, sources))), Times.once());
        done();
    });

    it('startExeuctionWithSources will add single session for canHandleMultipleSources=true', (done) => {
        mockFactory.setup((x) => x.createTestFramework(It.isAny())).returns(() => <ITestFramework>{ canHandleMultipleSources: true });

        mockSessionManager.setup((x) => x.addSession(It.isAny(), It.isAny(), It.isAny())).callback((...args: Array<any>) => {
            validateSession(args[0], args[1], args[2]);
        });

        Assert.equal(mockEM.object.startTestRunWithSources(sources) instanceof Promise, true, 'Should return completion promise.');

        mockFactory.verify((x) => x.createTestFramework(TestFrameworks.Jest), Times.once());
        mockSessionManager.verify((x) => x.addSession(It.isAny(), It.isAny(), It.isAny()), Times.once());
        mockSessionManager.verify((x) => x.addSession(It.is((x) => TestUtils.assertDeepEqual(x, sources)), It.isAny(), It.isAny()),
            Times.once());

        done();
    });

    it('startExeuctionWithSources will add multiple sessions for canHandleMultipleSources=false', (done) => {
        mockFactory.setup((x) => x.createTestFramework(It.isAny())).returns(() => <ITestFramework>{ canHandleMultipleSources: false });

        mockSessionManager.setup((x) => x.addSession(It.isAny(), It.isAny(), It.isAny())).callback((...args: Array<any>) => {
            validateSession(args[0], args[1], args[2]);
        });

        Assert.equal(mockEM.object.startTestRunWithSources(sources) instanceof Promise, true, 'Should return completion promise.');

        mockFactory.verify((x) => x.createTestFramework(TestFrameworks.Jest), Times.once());
        mockSessionManager.verify((x) => x.addSession(It.isAny(), It.isAny(), It.isAny()), Times.exactly(sources.length));

        sources.forEach(source => {
            mockSessionManager.verify((x) => x.addSession(It.is((x) => TestUtils.assertDeepEqual(x, [source])), It.isAny(), It.isAny()),
                Times.once());
        });

        done();
    });

    it('startExeuctionWithTests will add single session for canHandleMultipleSources=true', (done) => {
        mockFactory.setup((x) => x.createTestFramework(It.isAny())).returns(() => <ITestFramework>{ canHandleMultipleSources: true });

        mockSessionManager.setup((x) => x.addSession(It.isAny(), It.isAny(), It.isAny())).callback((...args: Array<any>) => {
            validateSession(args[0], args[1], args[2], tests);
        });

        Assert.equal(mockEM.object.startTestRunWithTests(tests) instanceof Promise, true, 'Should return completion promise.');

        mockFactory.verify((x) => x.createTestFramework(TestFrameworks.Jest), Times.once());
        mockSessionManager.verify((x) => x.addSession(It.isAny(), It.isAny(), It.isAny()), Times.once());
        mockSessionManager.verify((x) => x.addSession(It.is((x) => TestUtils.assertDeepEqual(x, sources)), It.isAny(), It.isAny()),
            Times.once());

        done();
    });

    it('startExeuctionWithTests will add multiple sessions for canHandleMultipleSources=false', (done) => {
        mockFactory.setup((x) => x.createTestFramework(It.isAny())).returns(() => <ITestFramework>{ canHandleMultipleSources: false });

        mockSessionManager.setup((x) => x.addSession(It.isAny(), It.isAny(), It.isAny())).callback((...args: Array<any>) => {
            validateSession(args[0], args[1], args[2], tests);
        });

        Assert.equal(mockEM.object.startTestRunWithTests(tests) instanceof Promise, true, 'Should return completion promise.');

        mockFactory.verify((x) => x.createTestFramework(TestFrameworks.Jest), Times.once());
        mockSessionManager.verify((x) => x.addSession(It.isAny(), It.isAny(), It.isAny()), Times.exactly(sources.length));

        sources.forEach(source => {
            mockSessionManager.verify((x) => x.addSession(It.is((x) => TestUtils.assertDeepEqual(x, [source])), It.isAny(), It.isAny()),
                Times.once());
        });

        done();
    });

    it('testFrameworkEventHandlers will handle TestSessionStart/End, TestCaseStart/End, TestErrorMessage', (done) => {
        const testableDiscoveryManager = new TestableExecutionManager(new Environment(),
            mockMessageSender.object,
            settings);

        const eventHandlers = testableDiscoveryManager.getEventHandlers();

        const sender = <any>{ sender: 'this' };
        const args = <any>{ key: 'value', TestCase: 'test case', Message: 'message' };

        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + 1000);

        const testCase = new TestCase('file 1', 'fqn', 'uri');
        testCase.DisplayName = 'name';

        const testSpecEventArgs: TestSpecEventArgs = {
            Source: null,
            InProgress: false,
            TestCase: testCase,
            Outcome: TestOutcome.Passed,
            StartTime: startTime,
            EndTime: endTime,
            FailedExpectations: [{
                Message: 'msg a',
                StackTrace: 'stack a'
            },
            {
                Message: 'msg b',
                StackTrace: 'stack v'
            }]
        };

        const testResult: TestResult = {
            TestCase: testSpecEventArgs.TestCase,
            Attachments: [],
            Outcome: testSpecEventArgs.Outcome,
            ErrorMessage: testSpecEventArgs.FailedExpectations[0].Message,
            ErrorStackTrace: testSpecEventArgs.FailedExpectations[0].StackTrace,
            DisplayName: testSpecEventArgs.TestCase.DisplayName,
            Messages: [],
            ComputerName: null,
            Duration: TimeSpan.MSToString(testSpecEventArgs.EndTime.getTime() - testSpecEventArgs.StartTime.getTime()),
            StartTime: testSpecEventArgs.StartTime,
            EndTime: testSpecEventArgs.EndTime
        };

        eventHandlers.Subscribe(mockTestFramework.object);

        mockTestFramework.object.testFrameworkEvents.onTestSessionStart.raise(sender, args);
        mockSessionManager.verify((x) => x.updateSessionEventArgs(It.is((x) => TestUtils.assertDeepEqual(x, args))), Times.once());

        mockTestFramework.object.testFrameworkEvents.onTestCaseStart.raise(sender, args);
        mockMessageSender.verify((x) => x.sendTestCaseStart(It.is((x) => x === args.TestCase)), Times.once());

        mockTestFramework.object.testFrameworkEvents.onTestCaseEnd.raise(sender, testSpecEventArgs);
        mockMessageSender.verify((x) => x.sendTestCaseEnd(It.is((x) => TestUtils.assertDeepEqual(x, testResult))), Times.once());

        mockTestFramework.object.testFrameworkEvents.onErrorMessage.raise(sender, args);
        mockMessageSender.verify((x) => x.sendMessage(It.is((x) => x === args.Message), It.is((x) => x === TestMessageLevel.Error)),
            Times.once());

        mockTestFramework.object.testFrameworkEvents.onTestSessionEnd.raise(sender, args);
        mockSessionManager.verify((x) => x.setSessionComplete(It.is((x) => TestUtils.assertDeepEqual(x, args))), Times.once());

        done();
    });
    
    it('testFrameworkEventHandlers will handle TestRunAttachment', (done) => {
        const testableDiscoveryManager = new TestableExecutionManager(new Environment(),
            mockMessageSender.object,
            settings);

        const eventHandlers = testableDiscoveryManager.getEventHandlers();
        const sender = <any>{ sender: 'this' };

        eventHandlers.Subscribe(mockTestFramework.object);

        mockTestFramework.object.testFrameworkEvents.onRunAttachment.raise(sender, {
            AttachmentCollection: <any>'attachments'
        });

        mockMessageSender.verify((x) => x.sendRunAttachments(It.is((x) => x === <any>'attachments')), Times.once());

        done();
    });
    
    it('TestCaseEnd handles the attachments', (done) => {
        // Setup events
        const testableDiscoveryManager = new TestableExecutionManager(new Environment(),
            mockMessageSender.object,
            settings);

        const eventHandlers = testableDiscoveryManager.getEventHandlers();
        eventHandlers.Subscribe(mockTestFramework.object);

        // Setup attachments
        const attachmentsFolder = path.join(settings.AttachmentsFolder, 'c5c8b4b5-ade3-2992-aa1b-95c1661977a7');
        if (!fs.existsSync(attachmentsFolder)) {
            fs.mkdirSync(attachmentsFolder);
        }

        // Add 2 files to upload to attachments folder
        const file1 = path.join(attachmentsFolder, 'debug.log');
        fs.writeFileSync(file1, 'Hey there!');
        const file2 = path.join(attachmentsFolder, 'screenshot.png');
        fs.writeFileSync(file2, 'Hey there!');

        const sender = <any>{ sender: 'this' };
        const testCase = new TestCase('file 1', 'fqn', 'uri', 'attachmentId');
        testCase.DisplayName = 'name';

        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + 1000);

        const testSpecEventArgs: TestSpecEventArgs = {
            Source: null,
            InProgress: false,
            TestCase: testCase,
            Outcome: TestOutcome.Passed,
            StartTime: startTime,
            EndTime: endTime,
            FailedExpectations: []
        };

        const attachmentSet = new AttachmentSet('uri', 'Attachments');
        attachmentSet.addAttachment(file1);
        attachmentSet.addAttachment(file2);
        const attachments = [attachmentSet];
        
        const testResult: TestResult = {
            TestCase: testSpecEventArgs.TestCase,
            Attachments: attachments,
            Outcome: testSpecEventArgs.Outcome,
            ErrorMessage: null,
            ErrorStackTrace: null,
            DisplayName: testSpecEventArgs.TestCase.DisplayName,
            Messages: [],
            ComputerName: null,
            Duration: TimeSpan.MSToString(testSpecEventArgs.EndTime.getTime() - testSpecEventArgs.StartTime.getTime()),
            StartTime: testSpecEventArgs.StartTime,
            EndTime: testSpecEventArgs.EndTime
        };

        mockTestFramework.object.testFrameworkEvents.onTestCaseEnd.raise(sender, testSpecEventArgs);
        mockMessageSender.verify((x) => x.sendTestCaseEnd(It.is((x) => TestUtils.assertDeepEqual(x, testResult))), Times.once());
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

    it('will eventually send execution complete and resolve compleition promise', (done) => {

        mockFactory.setup((x) => x.createTestFramework(It.isAny())).returns(() => <ITestFramework>{ canHandleMultipleSources: false });
        mockEM.object.startTestRunWithSources(sources).then(() => {
            done();
        });

        mockSessionManager.object.onAllSessionsComplete.raise(null, null);
        mockMessageSender.verify((x) => x.sendExecutionComplete(), Times.once());
    });

    function validateSession(sources: Array<string>,
        executeJob: () => void,
        errorCallback: (err: Error) => void,
        testCollection?: Array<TestCase>) {
        mockFactory.reset();
        mockEventHandlers.reset();
        mockTestFramework.reset();
        mockEM.reset();

        mockFactory.setup((x) => x.createTestFramework(It.isAny())).returns(() => mockTestFramework.object);

        // Validate execute job
        executeJob();
        mockFactory.verify((x) => x.createTestFramework(TestFrameworks.Jest), Times.once());
        mockTestFramework.verify((x) => x.initialize(It.isAny()), Times.once());

        if (testCollection) {
            mockTestFramework.verify((x) => x.startExecutionWithTests(
                It.is((x) => TestUtils.assertDeepEqual(x, sources)),
                It.is((x) => x instanceof Map),
                It.is((x) => TestUtils.assertDeepEqual(x, settings.TestFrameworkConfigJson))
            ), Times.once());
        } else {
            mockTestFramework.verify((x) => x.startExecutionWithSources(
                It.is((x) => TestUtils.assertDeepEqual(x, sources)),
                It.is((x) => TestUtils.assertDeepEqual(x, settings.TestFrameworkConfigJson))
            ), Times.once());
        }
        mockEventHandlers.verify((x) => x.Subscribe(It.is((x) => TestUtils.assertDeepEqual(x, mockTestFramework.object))), Times.once());

        const dummyError = new Error('dummy error');

        // Validate error callback
        errorCallback(dummyError);
        mockEM.verify((x) => x.sessionError(It.is((x) => TestUtils.assertDeepEqual(x, sources)), It.is((x) => x === dummyError)),
            Times.once());

    }
});