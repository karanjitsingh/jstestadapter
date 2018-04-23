import { IEnvironment } from '../../../../src/JSTestHost/Environment/IEnvironment';
import { Environment } from '../../../../src/JSTestHost/Environment/Node/Environment';
import * as Assert from 'assert';
import { CommunicationManager } from '../../../../src/JSTestHost/Environment/Node/CommunicationManager';
import { IEventArgs } from '../../../../src/JSTestHost/ObjectModel/Common';
import { Event } from '../../../../src/JSTestHost/Events/Event';

describe('NodeEnvironment Suite', () => {
    let env: IEnvironment;

    before(() => {
        env = new Environment();
    });

    it('createCommunicationManager will return instance of communication manager', (done: any) => {
        Assert.equal(env.createCommunicationManager() instanceof CommunicationManager, true);
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
});

interface TestableEventArgs extends IEventArgs {
    arg: string;
}

class TestableSender {
    public property: string;

    constructor(property: string) {
        this.property = property;
    }
}