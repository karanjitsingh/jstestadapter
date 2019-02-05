import { EnvironmentType, IEventArgs, IEvent } from '../../ObjectModel/Common';
import { IEnvironment } from '../IEnvironment';
import { CommunicationManager } from './CommunicationManager';
import { ICommunicationManager } from '../ICommunicationManager';
import { IEventDispatcher } from '../../Events/IEventDispatcher';
import { EventDispatcher } from './EventDispatcher';
import { Event } from '../../Events/Event';
import { DebugLogger } from './DebugLogger';
import { Socket } from 'net';
import { tmpdir } from 'os';
import { IDebugLogger } from '../../ObjectModel/EqtTrace';

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

    public getTempDirectory(): string {
        return tmpdir();
    }

    public createEvent<T extends IEventArgs>(): IEvent<T> {
        return new Event<T>(this.eventDispatcher);
    }

    public exit(exitCode: number) {
        process.exit(exitCode);
    }
}