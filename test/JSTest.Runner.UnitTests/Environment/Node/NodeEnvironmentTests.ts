import * as Assert from 'assert';
import { Socket } from 'net';
import { Mock } from 'typemoq';
import { CommunicationManager } from '../../../../src/JSTest.Runner/Environment/Node/CommunicationManager';
import { Environment } from '../../../../src/JSTest.Runner/Environment/Node/Environment';
import { Event } from '../../../../src/JSTest.Runner/Events/Event';
import { IEventArgs } from '../../../../src/JSTest.Runner/ObjectModel/Common';

interface TestableEventArgs extends IEventArgs {
    arg: string;
}

class TestableSender {
    public property: string;

    constructor(property: string) {
        this.property = property;
    }
}

describe('NodeEnvironment Suite', () => {
    let env: Environment;

    before(() => {
        env = new Environment();
    });

    it('getCommunicationManager will return single instance of communication manager', (done: any) => {
        const socketMock = Mock.ofType(Socket);

        const comm = env.getCommunicationManager(socketMock.object);
        const comm2 = env.getCommunicationManager();

        Assert.equal(comm instanceof CommunicationManager, true,
            'First call to getCommunicationManager should return instnace of communication manager.');
        Assert.strictEqual(comm2, comm,
            'Second call to getCommunicationManager should return same instance.');
        done();
    });

    it('setupGlobalLogger will initialize logger', (done) => {
        // env.setupGlobalLogger();
        // // Assert.equal(logger.callCount, 1);
        done();
    });

    it('createEvent will return instance of Event', (done: any) => {

        const eventArgs = <TestableEventArgs> {
            arg: 'some arg'
        };
        const testSender = new TestableSender('some property');

        const event = env.createEvent<TestableEventArgs>();
        Assert.equal(event instanceof Event, true);

        event.subscribe((sender: Object, args: TestableEventArgs) => {
            Assert.deepEqual(args, eventArgs, 'Event should be called with correct arguments on event.raise');
            Assert.deepEqual(sender, testSender, 'Event should be called with correct sender on event.raise');
            done();
        });

        event.raise(testSender, eventArgs);

    });

    it('exit will call process.exit', (done) => {
        let exitCalled = false;
        Object.defineProperty(process, 'exit', {
            value: () => {
                exitCalled = true;
            }
        });
        
        env.exit(123);
        Assert.equal(exitCalled, true);
        done();
    });

});
