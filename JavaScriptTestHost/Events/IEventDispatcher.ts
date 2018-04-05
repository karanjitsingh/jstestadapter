import { IEventArgs } from "./Event";

export default abstract class IEventDispatcher {
    abstract subscribe(eventId: string, callback: (sender:object, args: IEventArgs) => void);
    abstract unsubscribe(eventId: string, callback: (sender:object, args: IEventArgs) => void);
    abstract raise(eventId: string, sender:object, args: IEventArgs);
    
    private eventList: JSON;
    
    public registerEvent(): string {
        let id = String((new Date()).getTime());

        if(!this.eventList[id]) {
            this.eventList[id] = 1;
            return id;
        }

        return null;
    }

    public deregisterEvent(eventId: string) {
        if(this.eventList[eventId]) {
            delete this.eventList[eventId];
        }
    }
}