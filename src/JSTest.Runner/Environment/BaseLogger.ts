import { TestMessageLevel, MessageType, Message } from '../ObjectModel';
import { ICommunicationManager } from './ICommunicationManager';
import { TestMessagePayload } from '../ObjectModel/Payloads';
import { IDebugLogger } from '../ObjectModel/EqtTrace';
import { EqtTrace } from '../ObjectModel/EqtTrace';

export abstract class BaseLogger {
    private commManager: ICommunicationManager;

    constructor(commManager: ICommunicationManager, debugLogger: IDebugLogger) {
        this.commManager = commManager;

        this.overrideGlobalConsole();
        EqtTrace.initializeTracer(debugLogger);
    }
    
    public overrideGlobalConsole() {
        ['log', 'warn', 'error'].forEach((method) => {
            // tslint:disable-next-line
            console[method] = function() {
                this.logMessage(method, arguments);
            }.bind(this);
        });
    }

    // tslint:disable-next-line
    private logMessage(method: string, args: Array<any>): void {
        if (!args || !args.length) {
            return;
        }

        args = Array.from(args);

        let messageLevel = TestMessageLevel.Informational;

        switch (method) {
            case 'log':
                messageLevel = TestMessageLevel.Informational;
                break;
            case 'warn':
                messageLevel = TestMessageLevel.Warning;
                break;
            case 'error':
                messageLevel = TestMessageLevel.Error;
                break;
        }

        args.forEach((arg, i) => {
            if (typeof(args[i]) !== 'string') {
                args[i] = JSON.stringify(arg);
            }
        });
        
        const messageString = args.join('\n');

        const message = new Message(MessageType.ConsoleMessage, <TestMessagePayload> {
            Message: messageString,
            MessageLevel: messageLevel
        });

        this.commManager.sendMessage(message);
    }
}