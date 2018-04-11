import { IEventArgs, IEventHandler } from "./Event";


export default abstract class IEventDispatcher {
    abstract subscribe(eventId: string, callback: IEventHandler<IEventArgs>);
    abstract unsubscribe(eventId: string, callback: IEventHandler<IEventArgs>);
    abstract raise(eventId: string, sender:object, args: IEventArgs);
    
    private eventList;

    constructor() {
        this.eventList = [];
    }
    
    public registerEvent(): string {
        let id = "";

        // TODO potentially dangerous
        while(id == "" || this.eventList[id]) {
            id = String((new Date()).getTime());            
        }
        
        this.eventList[id] = 1;
        return id;

    }

    public deregisterEvent(eventId: string) {
        if(this.eventList[eventId]) {
            delete this.eventList[eventId];
        }
    }
}