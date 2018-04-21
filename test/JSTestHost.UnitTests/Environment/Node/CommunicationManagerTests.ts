import { CommunicationManager } from '../../../../src/JSTestHost/Environment/Node/CommunicationManager';
import { IEnvironment } from '../../../../src/JSTestHost/Environment/IEnvironment';
import { Environment } from '../../../../src/JSTestHost/Environment/Node/Environment';
import { Message } from '../../../../src/JSTestHost/ObjectModel/Message';
import { MessageType } from '../../../../src/JSTestHost/ObjectModel/MessageType';
import { MessageReceivedEventArgs } from '../../../../src/JSTestHost/Environment/ICommunicationManager';
import { Socket } from 'net';
import { It, Mock, Times, MockBehavior, IMock } from 'typemoq';
import * as assert from 'assert';

describe('Node/CommunicationManager Suite', () => {
    let mockSocket: IMock<Socket>;
    let commManager: CommunicationManager;

    before(() => {
        mockSocket = Mock.ofType(Socket);
        commManager = new CommunicationManager(new Environment(), mockSocket.object);
    });

    it('connectToServer will call socket.connect', (done: any) => {
        let callBackConfirm = false;
        commManager.connectToServer(1234, '127.0.0.1', () => { callBackConfirm = true; });
        mockSocket.verify((x) => x.connect(It.isValue(1234), It.isValue('127.0.0.1'), It.isAny()), Times.once());
        done();
    });

    it('sendMessage will send message in correct format', (done: any) => {
        commManager.sendMessage(new Message(MessageType.AbortTestRun, 'abort test run', 2));
        mockSocket.verify((x) => x.write('L{"Version":2,"MessageType":"TestExecution.Abort","Payload":"abort test run"}', 'binary'),
                          Times.once());
        done();
    });

    it('Constructor will hook to socket\'s \'data\' event', (done: any) => {
        mockSocket.verify((x) => x.on('data', It.isAny()), Times.once());
        done();
    });

    it('Will raise onMessageReceived when socket emits \'data\' event', (done: any) => {
        const mockSocket = Mock.ofType(Socket);
        mockSocket.callBase = true;

        const commManager = new CommunicationManager(new Environment(), mockSocket.object);

        commManager.onMessageReceived.subscribe((sender: Object, args: MessageReceivedEventArgs) => {
            assert.equal(args.Message.MessageType, MessageType.AbortTestRun);
            assert.equal(args.Message.Payload, 'abort test run');
            done();
        });

        mockSocket.object.emit('data', new Buffer('L{"Version":2,"MessageType":"TestExecution.Abort","Payload":"abort test run"}'));
    });

    it('Will raise onMessageReceived when socket emits \'data\' event with chunked data', (done: any) => {
        const mockSocket = Mock.ofType(Socket);
        mockSocket.callBase = true;

        const commManager = new CommunicationManager(new Environment(), mockSocket.object);

        commManager.onMessageReceived.subscribe((sender: Object, args: MessageReceivedEventArgs) => {
            assert.equal(args.Message.MessageType, MessageType.AbortTestRun);
            assert.equal(args.Message.Payload, 'abort test run');
            done();
        });

        mockSocket.object.emit('data', new Buffer('L{"Version":2,"MessageType":"'));
        mockSocket.object.emit('data', new Buffer('TestExecution.Abort","Payload":"abort test run"}'));
    });
});