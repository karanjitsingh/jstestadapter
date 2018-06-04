import { TestSessionManager } from '../../../../src/JSTest.Runner/TestRunner/ExecutionManagers/TestSessionManager';
import { Environment } from '../../../../src/JSTest.Runner/Environment/Node/Environment';
import * as Assert from 'assert';

describe('TestSessionManager Sutie', () => {
    let testSessionManager: TestSessionManager;
    
    beforeEach(() => {
        TestSessionManager.instance = undefined;
        TestSessionManager.INITIALIZE(new Environment());
        testSessionManager = TestSessionManager.instance;
    });

    it('INITIALIZE will set static instance', (done) => {
        Assert.notStrictEqual(TestSessionManager.instance, undefined);
        done();
    });

    it('addSession will add test session and execute', (done) => {
        const jobMap = { };
        const getJob = (id) => {
            return () => {
                jobMap[id] = 1;
                console.error('yes' + id);
            };
        };

        const errorCallback = (err: Error) => { return; };

        testSessionManager.addSession(['file 1', 'file 2'], getJob('1'), errorCallback);
        testSessionManager.addSession(['file 3', 'file 4'], getJob('2'), errorCallback);

        testSessionManager.executeSessionJobs();
        
        testSessionManager.onAllSessionsComplete.subscribe(() => {
            Assert.deepEqual(jobMap, {
                '1': 1
                // "2": 1
            });

            done();
        });

    });
});