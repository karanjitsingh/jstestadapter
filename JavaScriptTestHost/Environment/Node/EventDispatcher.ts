import IEventDispatcher from "Events/IEventDispatcher";
import { EventEmitter } from "events";
import { EventArgs } from "Events/Event";

export default class EventDispatcher extends IEventDispatcher {
    private events: EventEmitter;

    constructor() {
        super();

        this.events = new EventEmitter();
    }

    public subscribe(eventId: string, callback: (args) => void) {
        this.events.addListener(eventId, callback);
    }

    public unsubscribe(eventId: string, callback: (args) => void) {
        this.events.removeListener(eventId, callback);
    }
    public raise(eventId: string, args: EventArgs) {
        this.events.emit(eventId, args);
    }
}