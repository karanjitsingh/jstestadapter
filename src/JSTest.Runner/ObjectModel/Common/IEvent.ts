// tslint:disable-next-line
export interface IEventArgs {
}

export type IEventHandler<Targs extends IEventArgs> = (sender: object, args: Targs) => void;

export interface IEvent<TArgs extends IEventArgs> {
    subscribe: (handler: IEventHandler<TArgs>) => void;
    unsubscribe: (handler: IEventHandler<TArgs>) => void;
    raise: (sender: object, args: TArgs) => void;
}