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

describe('DiscoveryManager Suite', () => {
    let mockDM: IMock<DiscoveryManager>;
    let mockMessageSender: IMock<MessageSender>;
    let settings: JSTestSettings;
    let mockFactory: IMock<TestFrameworkFactory>;
    let mockSessionManager: IMock<TestSessionManager>;
    
    const sources = ['file 1', 'file 2'];
    const environment = new Environment();

    TestFrameworkFactory.INITIALIZE(environment);
    TestSessionManager.INITIALIZE(environment);

    before(() => {
        mockFactory = Mock.ofInstance(TestFrameworkFactory.instance);
        mockSessionManager = Mock.ofInstance(TestSessionManager.instance);

        TestFrameworkFactory.instance = mockFactory.object;
        TestSessionManager.instance = mockSessionManager.object;

        settings = new JSTestSettings({
            JavaScriptTestFramework: 'jest',
            TestFrameworkConfigJson: '{}'
        });
        mockMessageSender = Mock.ofType(MessageSender);
        mockDM = Mock.ofInstance(new DiscoveryManager(new Environment(), mockMessageSender.object, settings));
        mockDM.callBase = true;
    });

    it('discoverTests will add single session for canHandleMultipleSources=true', (done) => {
        mockFactory.setup((x) => x.createTestFramework(It.isAny())).returns(() => 
            <ITestFramework> {
                canHandleMultipleSources: true
            }
        );

        Assert.equal(mockDM.object.discoverTests(<StartDiscoveryPayload>{
            Sources: sources
        }) instanceof Promise, true, 'Should return completion promise.');

        mockFactory.verify((x) => x.createTestFramework(TestFrameworks.Jest), Times.once());
        
        mockSessionManager.verify((x) => x.addSession(It.isAny(), It.isAny(), It.isAny()), Times.once());
        mockSessionManager.verify((x) => x.addSession(It.is((x) => JSON.stringify(x) === JSON.stringify(sources)), It.isAny(), It.isAny()),
                                  Times.once());

        done();
    });

    it('discoverTests will add multiple sessions for canHandleMultipleSources=false', (done) => {
        mockFactory.setup((x) => x.createTestFramework(It.isAny())).returns(() => 
            <ITestFramework> {
                canHandleMultipleSources: false
            }
        );

        Assert.equal(mockDM.object.discoverTests(<StartDiscoveryPayload>{
            Sources: sources
        }) instanceof Promise, true, 'Should return completion promise.');

        mockFactory.verify((x) => x.createTestFramework(TestFrameworks.Jest), Times.once());
        
        mockSessionManager.verify((x) => x.addSession(It.isAny(), It.isAny(), It.isAny()), Times.exactly(sources.length));

        sources.forEach(source => {
            mockSessionManager.verify((x) => x.addSession(It.is((x) => JSON.stringify(x) === JSON.stringify([source])),
                                                          It.isAny(),
                                                          It.isAny()),
                                      Times.once());
        });

        done();
    });
});

class TestableDiscoveryManager extends DiscoveryManager  {

    constructor(environment: IEnvironment, messageSender: MessageSender, settings: JSTestSettings) {
        super(environment, messageSender, settings);
    }
}