import { Socket } from 'net';
import * as OS from 'os';
import { Event } from '../../Events/Event';
import { IEventDispatcher } from '../../Events/IEventDispatcher';
import { EnvironmentType, IEvent, IEventArgs } from '../../ObjectModel/Common';
import { IDebugLogger } from '../../ObjectModel/EqtTrace';
import { ICommunicationManager } from '../ICommunicationManager';
import { IEnvironment } from '../IEnvironment';
import { CommunicationManager } from './CommunicationManager';
import { DebugLogger } from './DebugLogger';
import { EventDispatcher } from './EventDispatcher';

export class Environment implements IEnvironment {
    public readonly environmentType: EnvironmentType = EnvironmentType.NodeJS;
    public argv: Array<string>;
    
    private communicationManager: ICommunicationManager;
    private eventDispatcher: IEventDispatcher;
    private debugLogger: IDebugLogger;

    constructor() {
        this.argv = <Array<string>>process.argv;
        this.eventDispatcher = new EventDispatcher();
    }

    public getDebugLogger(): IDebugLogger {
        if (!this.debugLogger) {
            this.debugLogger = new DebugLogger();
        }
        return this.debugLogger;
    }
    
    public getCommunicationManager(socket?: Socket): ICommunicationManager {
        if (!this.communicationManager) {
            this.communicationManager = new CommunicationManager(this, socket);
        }
        return this.communicationManager;
    }

    public createEvent<T extends IEventArgs>(): IEvent<T> {
        return new Event<T>(this.eventDispatcher);
    }

    public exit(exitCode: number) {
        process.exit(exitCode);
    }

    public getTempDirectory(): string {
        return OS.tmpdir();
    }
}