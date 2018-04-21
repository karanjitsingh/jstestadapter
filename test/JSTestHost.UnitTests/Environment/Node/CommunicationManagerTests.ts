import { CommunicationManager } from '../../../../src/JSTestHost/Environment/Node/CommunicationManager';
import { IEnvironment } from '../../../../src/JSTestHost/Environment/IEnvironment';
import { Environment } from '../../../../src/JSTestHost/Environment/Node/Environment';
import { Message } from '../../../../src/JSTestHost/ObjectModel/Message';
import { MessageType } from '../../../../src/JSTestHost/ObjectModel/MessageType';
import { Socket } from 'net';
import { It, Mock, Times } from 'typemoq';
import * as assert from 'assert';

describe('Node/CommunicationManager Suite', () => {

    const mockSocket = Mock.ofType(Socket);
    const commManager = new TestableCommunicationManager(new Environment(), mockSocket.object);

    it('connectToServer will call socket.connect', (done: any) => {
        let callBackConfirm = false;

        commManager.connectToServer(12344, '127.0.0.1', () => { callBackConfirm = true; });
        mockSocket.verify((x) => x.connect(It.isValue(1234), It.isValue('127.0.0.1'), It.isAny()), Times.once());
        done();
    });

    it('sendMessage will send message in correct format', (done: any) => {
        commManager.sendMessage(new Message(MessageType.AbortTestRun, 'abort test run'));
        mockSocket.setup((x) => x.write(It.isAny(), It.isAny()));
        // mockSocket.verify((x) => x.write('', 'binary'))
        done();
    });
});

class TestableCommunicationManager extends CommunicationManager {
    protected socket: Socket;

    constructor(environment: IEnvironment, socket: Socket) {
        super(environment);
        this.socket = socket;
    }
}