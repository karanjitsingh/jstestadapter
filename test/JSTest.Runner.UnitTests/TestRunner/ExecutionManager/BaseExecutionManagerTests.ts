import * as Assert from 'assert';

import { Environment } from '../../../../src/JSTest.Runner/Environment/Node/Environment';
import { Event } from '../../../../src/JSTest.Runner/Events/Event';
import { TestFrameworkFactory } from '../../../../src/JSTest.Runner/TestRunner/TestFrameworks/TestFrameworkFactory';
import { TestSessionManager } from '../../../../src/JSTest.Runner/TestRunner/ExecutionManagers/TestSessionManager';
import { TestableBaseExecutionManager } from './Testable';

describe('BaseExecutionManager Suite', () => {
    let executionManager: TestableBaseExecutionManager;
    const environment = new Environment();

    TestFrameworkFactory.INITIALIZE(environment);
    TestSessionManager.INITIALIZE(environment, true);

    before(() => {
        executionManager = new TestableBaseExecutionManager(environment);
    });

    it('constructor will initialize onComplete, testFrameworkFactory and testSessionManager', (done) => {
        Assert.equal(executionManager.getOnCompleteEvent() instanceof Event, true);
        Assert.equal(executionManager.getTestFrameworkFactory() === TestFrameworkFactory.instance, true);
        Assert.equal(executionManager.getTestSessionManager() === TestSessionManager.instance, true);
        done();
    });

    it('getCompletionPromise returns a promise which resolves on completion.', (done) => {
        const promise = executionManager.getPromise();
        promise.then(() => {
            done();
        });
        executionManager.raiseCompletion();
    });

    it('getSourcesFromAdapterSourceMap will return source list', (done) => {
        const sourceMap = {
            x: ['file 1', 'file 2'],
            y: ['file 3', 'file 4', 'file 5']
        };
        
        const sourcelist = executionManager.getSources(sourceMap);
        Assert.deepEqual(['file 1', 'file 2', 'file 3', 'file 4', 'file 5'], sourcelist);
        done();
    });
});