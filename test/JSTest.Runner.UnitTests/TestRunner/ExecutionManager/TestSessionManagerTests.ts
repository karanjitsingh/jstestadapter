import { TestSessionManager } from '../../../../src/JSTest.Runner/TestRunner/ExecutionManagers/TestSessionManager';
import { Environment } from '../../../../src/JSTest.Runner/Environment/Node/Environment';
import * as Assert from 'assert';
import { TestSessionEventArgs } from '../../../../src/JSTest.Runner/ObjectModel/TestFramework';
import { SessionHash } from '../../../../src/JSTest.Runner/Utils/Hashing/SessionHash';

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
        let jobOrder = '';
        const getJob = (id) => {
            return () => {
                jobOrder += String(id);
            };
        };

        const errorCallback = (err: Error) => { return; };
        const sourceCollection = [
            ['file 1', 'file 2'],
            ['file 3', 'file 4']
        ];

        testSessionManager.onAllSessionsComplete.subscribe(() => {
            Assert.equal(jobOrder, '12');
            done();
        });

        testSessionManager.addSession(sourceCollection[0], getJob('1'), errorCallback);
        testSessionManager.addSession(sourceCollection[1], getJob('2'), errorCallback);

        testSessionManager.executeSessionJobs();

        testSessionManager.setSessionComplete(new TestSessionEventArgs(sourceCollection[0], SessionHash(sourceCollection[0])));
        testSessionManager.setSessionComplete(new TestSessionEventArgs(sourceCollection[1], SessionHash(sourceCollection[1])));     
    });

    it('multiple setSessionComplete will not hinder session execution', (done) => {
        let jobOrder = '';
        const getJob = (id) => {
            return () => {
                jobOrder += String(id);
                if (id === 1) {
                        // trigger twice
                        sessionComplete(id - 1);
                        sessionComplete(id - 1);
                } else {
                    setTimeout(() => {
                        sessionComplete(id - 1);
                    }, 50);
                }
            };
        };

        const sessionComplete = (id) => {
            testSessionManager.setSessionComplete(new TestSessionEventArgs(sourceCollection[id], SessionHash(sourceCollection[id])));
        };

        const errorCallback = (err: Error) => { return; };
        const sourceCollection = [
            ['file 1', 'file 2'],
            ['file 3', 'file 4']
        ];

        testSessionManager.onAllSessionsComplete.subscribe(() => {
            Assert.equal(jobOrder, '12');
            done();
        });

        testSessionManager.addSession(sourceCollection[0], getJob('1'), errorCallback);
        testSessionManager.addSession(sourceCollection[1], getJob('2'), errorCallback);

        testSessionManager.executeSessionJobs();
    });
});