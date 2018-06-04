import { Environment } from '../../../../src/JSTest.Runner/Environment/Node/Environment';
import * as Assert from 'assert';
import { IEventArgs } from '../../../../src/JSTest.Runner/ObjectModel/Common';
import { Event } from '../../../../src/JSTest.Runner/Events/Event';

interface TestableEventArgs extends IEventArgs {
    arg: string;
}

class TestableSender {
    public property: string;

    constructor(property: string) {
        this.property = property;
    }
}

describe('Node EventDispatcher suite', () => {
    it('Event subscribe, raise and unsubscribe', (done: any) => {
        const env = new Environment();
        const event = env.createEvent<TestableEventArgs>();
        Assert.equal(event instanceof Event, true);

        const eventArgs = <TestableEventArgs> {
            arg: 'some arg'
        };
        const testSender = new TestableSender('some property');

        let subscribed = true;

        const eventHandler = (sender: Object, args: TestableEventArgs) => {
            if (subscribed) {
                Assert.deepEqual(args, eventArgs, 'Event should be called with correct arguments on event.raise.');
                Assert.deepEqual(sender, testSender, 'Event should be called with correct sender on event.raise.');
                done();
            } else {
                Assert.fail('Event should not have been raised after unsubscribing.');
                done();
            }
        };
        event.subscribe(eventHandler);
        event.raise(testSender, eventArgs);
        subscribed = false;
        event.raise(testSender, eventArgs);
    });
});