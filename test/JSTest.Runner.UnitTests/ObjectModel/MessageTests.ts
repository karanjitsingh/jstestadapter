import { Message, MessageType } from '../../../src/JSTest.Runner/ObjectModel';
import * as Assert from 'assert';
import { Exception } from '../../../src/JSTest.Runner/Exceptions';

describe('Message Suite', () => {
    it('Message.FROM_JSON will throw if message json is incorrect', (done) => {
        Assert.throws(() => 
            Message.FROM_JSON(JSON.parse(`
            {
                "Payload": null,
                "Version": 1
            }
        `)), (err) => err instanceof Exception && err.exceptionName === 'InvalidMessageException',
        'Should throw if message type was not provided');

        Assert.throws(() => 
            Message.FROM_JSON(JSON.parse(`
            {
                "MessageType": "some message",
                "Payload": null,
                "Version": 1
            }
        `)), (err) => err instanceof Exception && err.exceptionName === 'InvalidMessageException',
        'Should throw if message type is unknown.');

        const message = Message.FROM_JSON(JSON.parse(`
            {
                "MessageType": "ProtocolVersion",
                "Payload": 1,
                "Version": 1
            }
        `));

        Assert.deepEqual(message, {
            MessageType: MessageType.VersionCheck,
            Payload: 1,
            Version: 1
        }, 'Message.FROM_JSON should set properties');

        done();
    });
});