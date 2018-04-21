import { Environment } from '../../../../src/JSTestHost/Environment/Node/Environment';
import { IEventArgs, Event } from '../../../../src/JSTestHost/Events/Event';
import * as Assert from 'assert';

describe('Node EventDispatcher suite', () => {
    it('Event subscribe, raise and unsubscribe', (done: any) => {
        const env = new Environment();
        const event = env.createEvent<TestableEventArgs>();
        Assert.equal(event instanceof Event, true);

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

        const eventArgs = <TestableEventArgs> {
            arg: 'some arg'
        };
        const testSender = new TestableSender('some property');

        event.subscribe(eventHandler);
        event.raise(testSender, eventArgs);
        subscribed = false;
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