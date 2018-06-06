import { TestSessionManager, TestSession } from '../../../../src/JSTest.Runner/TestRunner/ExecutionManagers/TestSessionManager';
import { Environment } from '../../../../src/JSTest.Runner/Environment/Node/Environment';
import * as Assert from 'assert';
import { TestSessionEventArgs } from '../../../../src/JSTest.Runner/ObjectModel/TestFramework';
import { SessionHash } from '../../../../src/JSTest.Runner/Utils/Hashing/SessionHash';
import { TestableTestSessionManager } from './Testable';

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

        testSessionManager.executeJobs();

        testSessionManager.setSessionComplete(new TestSessionEventArgs(sourceCollection[0], SessionHash(sourceCollection[0])));
        testSessionManager.setSessionComplete(new TestSessionEventArgs(sourceCollection[1], SessionHash(sourceCollection[1])));     
    });

    it('error in session will not hinder session execution', (done) => {
        let jobOrder = '';

        const sourceCollection = [
            ['file 1', 'file 2'],
            ['file 3', 'file 4']
        ];
        
        const sessionComplete = (id) => {
            testSessionManager.setSessionComplete(new TestSessionEventArgs(sourceCollection[id], SessionHash(sourceCollection[id])));
        };

        const getJob = (id) => {
            return () => {
                jobOrder += String(id);
                if (id === 1) {
                    setTimeout(() => {
                        sessionComplete(id - 1);
                    }, 50);
                    throw new Error('');
                } else {
                    setTimeout(() => {
                        sessionComplete(id - 1);
                    }, 50);
                }
            };
        };

        const errorCallback = (err: Error) => { return; };

        testSessionManager.onAllSessionsComplete.subscribe(() => {
            Assert.equal(jobOrder, '12');
            done();
        });

        testSessionManager.addSession(sourceCollection[0], getJob('1'), errorCallback);
        testSessionManager.addSession(sourceCollection[1], getJob('2'), errorCallback);

        testSessionManager.executeJobs();
    });

    it('updateSessionEventArgs and getSessionEventArgs tests', (done) => {
        const errorCallback = (err: Error) => { return; };
        const sources = ['file 1', 'file 2'];

        testSessionManager.onAllSessionsComplete.subscribe(() => {
            done();
        });

        testSessionManager.addSession(sources, () => { return; }, errorCallback);

        const args = new TestSessionEventArgs(sources, SessionHash(sources));
        args.InProgress = false;

        testSessionManager.executeJobs();
        testSessionManager.updateSessionEventArgs(args);
        
        Assert.deepEqual(testSessionManager.getSessionEventArgs(sources), args);

        testSessionManager.setSessionComplete(args);
    });

    it('domain will catch error and call error callback and update event args', (done) => {
        const args = new TestSessionEventArgs(['file 1'], SessionHash(['file 1']));
        const sessionManager = new TestableTestSessionManager(new Environment());
        let errorCallbackInvoked: boolean = false;
        let domainErrorEventRaised: boolean = false;

        const validate = () => {
            if (errorCallbackInvoked && domainErrorEventRaised) {
                // sessionError will have updated event args as well
                Assert.notStrictEqual(args.EndTime, undefined);
                Assert.strictEqual(args.InProgress, false);
                done();
            }
        };

        const errorCallback = (err: Error) => { 
            // Error was called and cought in domain;
            Assert.equal(err.message, 'some error');
            errorCallbackInvoked = true;
            validate();
        };

        const domainErrorCallback = (err: Error) => {
            Assert.equal(err.message, 'some error');            
            domainErrorEventRaised = true;
            validate();
        };

        const domain = sessionManager.runSession(<TestSession> {
            Sources: ['file 1'],
            TestSessionEventArgs: args,
            Job: () => { 
                setTimeout(() => {
                    // should throw an error and be cought by the domain
                    throw new Error('some error');
                }, 100);
            },
            ErrorCallback: errorCallback,
            Complete: false
        });

        Assert.strictEqual(args.EndTime, undefined);
        Assert.strictEqual(args.InProgress, true);

        domain.on('error', domainErrorCallback);
    });

    it('runSessionInDomain will handle require errors as well', (done) => {
        const args = new TestSessionEventArgs(['file 1'], SessionHash(['file 1']));
        const sessionManager = new TestableTestSessionManager(new Environment());

        const errorCallback = (err: Error) => { 
            // Error was called and cought in domain;
            Assert.equal(err.message.startsWith('Cannot find module'), true);
            Assert.notStrictEqual(args.EndTime, undefined);
            Assert.strictEqual(args.InProgress, false);
            done();
        };
        
        sessionManager.runSession(<TestSession> {
            Sources: ['file 1'],
            TestSessionEventArgs: args,
            Job: () => { 
                setTimeout(() => {
                    // should throw an error but will be caught by try catch and not domain
                    // tslint:disable:no-require-imports
                    require('asdfasdf');
                }, 100);
            },
            ErrorCallback: errorCallback,
            Complete: false
        });

        Assert.strictEqual(args.EndTime, undefined);
        Assert.strictEqual(args.InProgress, true);

    });
});