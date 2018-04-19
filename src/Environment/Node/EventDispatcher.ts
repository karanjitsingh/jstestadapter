import { IEventDispatcher } from '../../Events/IEventDispatcher';
import { IEventArgs } from '../../Events/Event';
import { EventEmitter } from 'events';

// for some reason tslint(5.9.1) throws an error even when class name and filename are same
// tslint:disable:export-name
export class EventDispatcher extends IEventDispatcher {
    private events: EventEmitter;

    constructor() {
        super();
        this.events = new EventEmitter();
    }

    public subscribe(eventId: string, callback: (sender: object, args: IEventArgs) => void) {
        this.events.addListener(eventId, callback);
    }

    public unsubscribe(eventId: string, callback: (sender: object, args: IEventArgs) => void) {
        this.events.removeListener(eventId, callback);
    }
    public raise(eventId: string, sender: object, args: IEventArgs) {
        this.events.emit(eventId, sender, args);
    }
}