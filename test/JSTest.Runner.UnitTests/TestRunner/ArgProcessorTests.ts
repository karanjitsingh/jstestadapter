import * as assert from 'assert';

import { ArgProcessor } from '../../../src/JSTest.Runner/ArgProcessor';
import { CLIArgs } from '../../../src/JSTest.Runner/TestRunner/CLIArgs';

describe('ArgProcessor Suite', () => {

    const mockEnv: any = {
        argv: []
    };

    it('Will process args for basic run', () => {
        mockEnv.argv = [process.env[0], process.env[1], '192.168.1.1', '9999'];
        const args: CLIArgs = ArgProcessor.processCLIArgs(mockEnv);
        
        assert.deepEqual(args, {
            ip: '192.168.1.1',
            port: '9999',
            traceEnabled: false,
            traceFilePath: '',
            runInDomain: false
        });
    });
    
    it('Will enable diag logs for --diag', () => {
        mockEnv.argv = [process.env[0], process.env[1], '192.168.1.1', '9999', '--diag'];
        const args: CLIArgs = ArgProcessor.processCLIArgs(mockEnv);
        
        assert.deepEqual(args, {
            ip: '192.168.1.1',
            port: '9999',
            traceEnabled: true,
            traceFilePath: '',
            runInDomain: false
        });
    });

    it('Will take path as parameter for --diag', () => {
        mockEnv.argv = [process.env[0], process.env[1], '192.168.1.1', '9999', '--diag', 'file'];
        const args: CLIArgs = ArgProcessor.processCLIArgs(mockEnv);
        
        assert.deepEqual(args, {
            ip: '192.168.1.1',
            port: '9999',
            traceEnabled: true,
            traceFilePath: 'file',
            runInDomain: false
        });
    });
    
    it('Will enable running in domain for logs for --runInDomain', () => {
        mockEnv.argv = [process.env[0], process.env[1], '192.168.1.1', '9999', '--runInDomain'];
        const args: CLIArgs = ArgProcessor.processCLIArgs(mockEnv);
        
        assert.deepEqual(args, {
            ip: '192.168.1.1',
            port: '9999',
            traceEnabled: false,
            traceFilePath: '',
            runInDomain: true
        });
    });

    it('Will throw invalid option', () => {
        mockEnv.argv = [process.env[0], process.env[1], '192.168.1.1', '9999', '-diag'];
        assertThrows(() => ArgProcessor.processCLIArgs(mockEnv), 'Invalid option ' + mockEnv.argv[4]);

        mockEnv.argv = [process.env[0], process.env[1], '192.168.1.1', '9999', '--diag', 'file', '-diag'];
        assertThrows(() => ArgProcessor.processCLIArgs(mockEnv), 'Invalid option ' + mockEnv.argv[6]);

        mockEnv.argv = [process.env[0], process.env[1], '192.168.1.1', '9999', 'diag'];
        assertThrows(() => ArgProcessor.processCLIArgs(mockEnv), 'Invalid option ' + mockEnv.argv[4]);
    });

    it('Will throw unknown option', () => {
        mockEnv.argv = [process.env[0], process.env[1], '192.168.1.1', '9999', '--unknown'];
        assertThrows(() => ArgProcessor.processCLIArgs(mockEnv), 'Unknown option --unknown');

        mockEnv.argv = [process.env[0], process.env[1], '192.168.1.1', '9999', '--diag', 'file', '--unknown'];
        assertThrows(() => ArgProcessor.processCLIArgs(mockEnv), 'Unknown option --unknown');
    });
});

function assertThrows(method: Function, message: string) {
    try {
        method();
    } catch (e) {
        assert.equal(e.message, message);
    }
}