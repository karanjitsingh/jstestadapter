import { Mock, IMock, Times, It } from 'typemoq';
import { BaseEventDispatcher } from '../../../src/JSTest.Runner/Events/IEventDispatcher';
import { IEventArgs, IEventHandler } from '../../../src/JSTest.Runner/ObjectModel/Common';
import { Event } from '../../../src/JSTest.Runner/Events/Event';
import * as Assert from 'assert';

class TestableEventDispatcher extends BaseEventDispatcher {
    public subscribe(eventId: string, callback: IEventHandler<IEventArgs>) {
        return;
    }
    public unsubscribe(eventId: string, callback: IEventHandler<IEventArgs>) {
        return;
    }
    public raise(eventId: string, sender: object, args: IEventArgs) {
        return;
    }
}

describe('Event Suite', () => {
    let mockEventDispatcher: IMock<BaseEventDispatcher>;

    before(() => {
        mockEventDispatcher = Mock.ofType(TestableEventDispatcher);
    });

    it('Event constructor will call eventDispatcher.register', (done: any) => {
        // tslint:disable:no-unused-expression
        new Event<IEventArgs>(mockEventDispatcher.object);
        mockEventDispatcher.verify((x) => x.registerEvent(), Times.once());
        done();
    });

    it('Event will call eventDispatchers subscribe unsubscribe and raise.', (done: any) => {
        mockEventDispatcher.reset();
        
        mockEventDispatcher.setup((x) => x.registerEvent()).returns(() => {
            return 'eventid';
        });

        const event = new Event<IEventArgs>(mockEventDispatcher.object);
        const dummyHandler = (sender: Object, args: IEventArgs) => { return 'dummy handler'; };
        const dummyArgs = <IEventArgs>{
            arg: 'some arg'
        };
        const dummyObject = {
            property: 'dummy'
        };

        event.subscribe(dummyHandler);
        event.raise(dummyObject, dummyArgs);
        event.unsubscribe(dummyHandler);

        mockEventDispatcher.verify((x) => x.subscribe(It.isValue('eventid'),
                                                      It.is((x) => x.toString() === dummyHandler.toString())),
                                                      Times.once());
        mockEventDispatcher.verify((x) => x.raise(It.isValue('eventid'),
                                                  It.is((x) => JSON.stringify(x) === JSON.stringify(dummyObject)),
                                                  It.is((x) => x.toString() === dummyArgs.toString())),
                                                  Times.once());

        done();
    });
});

describe('BaseEventDispatcher suite', () => {
    // Base event dispatcher test
    it('EventDispatcher will create unique event ids', (done: any) => {
        const eventidMap = new Map<string, number>();
        const eventDispatcher = new TestableEventDispatcher();
        const total = 20;

        for (let i = 0; i < total; i++) {
            const id = eventDispatcher.registerEvent();
            eventidMap.set(id, 1);
            Assert.notEqual(eventDispatcher.registerEvent().match(/[0-9]+/), null);
        }

        Assert.equal(total, eventidMap.size);
        done();
    });
});