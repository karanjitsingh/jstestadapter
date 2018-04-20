import { CommunicationManager } from '../../../../src/JSTestHost/Environment/Node/CommunicationManager';
import { IEnvironment } from '../../../../src/JSTestHost/Environment/IEnvironment';
import { Environment } from '../../../../src/JSTestHost/Environment/Node/Environment';
import { Socket } from 'net';
import * as assert from 'assert';
import * as Moq from 'typemoq';

describe('Node/CommunicationManager Suite', () => {

    it('connectToServer will call socket.connect', (done: any) => {
        const mockSocket = Moq.Mock.ofType(Socket);
        const commManager = new TestableCommunicationManager(new Environment(), mockSocket.object);
    });
});

class TestableCommunicationManager extends CommunicationManager {
    protected socket: Socket;

    constructor(environment: IEnvironment, socket: Socket) {
        super(environment);
        this.socket = socket;
    }
}