import { EnvironmentProvider } from '../../src/Environment/EnvironmentProvider';
import { Environment as NodeEnvironment } from '../../src//Environment/Node/Environment';
import { Environment as BrowserEnvironment } from '../../src//Environment/Browser/Environment';
import * as assert from 'assert';

describe('EnvironmentProvider Suite', () => {
    it('EnvironmentProvider will return right environment', () => {
        const envPromise = EnvironmentProvider.getEnvironmnet();

        envPromise.then((value) => {
            assert.equal(value instanceof NodeEnvironment, true, 'Instance should be NodeEnvironment');
        }, (err) => {
            assert.fail(err);
        });
    });
});