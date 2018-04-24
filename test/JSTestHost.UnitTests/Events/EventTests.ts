import { Mock, IMock, Times, It } from 'typemoq';
import { IEventDispatcher } from '../../../src/JSTestHost/Events/IEventDispatcher';
import { IEventArgs, IEventHandler } from '../../../src/JSTestHost/ObjectModel/Common';
import { Event } from '../../../src/JSTestHost/Events/Event';

describe('Event Suite', () => {
    let mockEventDispatcher: IMock<IEventDispatcher>;

    before(() => {
        mockEventDispatcher = Mock.ofType(TestableEventDispatcher);
    });

    it('Event constructor will call eventDispatcher.register', (done: any) => {
        const event = new Event<IEventArgs>(mockEventDispatcher.object);
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

class TestableEventDispatcher extends IEventDispatcher {
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