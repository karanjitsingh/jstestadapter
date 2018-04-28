import { BaseEventDispatcher } from '../../Events/IEventDispatcher';
import { IEventHandler, IEventArgs } from '../../ObjectModel/Common';
import { EventEmitter } from 'events';

/* 
 * for some reason tslint(5.9.1) throws an error even when class name and filename
 * are same for this particular file
*/
// tslint:disable:export-name
export class EventDispatcher extends BaseEventDispatcher {
    private events: EventEmitter;

    constructor() {
        super();
        this.events = new EventEmitter();
    }

    public subscribe(eventId: string, callback: IEventHandler<IEventArgs>): void {
        this.events.addListener(eventId, callback);
    }

    public unsubscribe(eventId: string, callback: IEventHandler<IEventArgs>): void {
        this.events.removeListener(eventId, callback);
    }
    
    public raise(eventId: string, sender: object, args: IEventArgs): void {
        this.events.emit(eventId, sender, args);
    }
}