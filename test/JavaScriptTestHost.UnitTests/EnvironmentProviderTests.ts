import { EnvironmentProvider } from '../../src/Environment/EnvironmentProvider';
import { Environment as NodeEnvironment } from '../../src//Environment/Node/Environment';
import { Environment as BrowserEnvironment } from '../../src//Environment/Browser/Environment';
import * as assert from 'assert';
import { EnvironmentType } from '../../src/Environment';

describe('EnvironmentProvider Suite', () => {

    const environments = [
        {
            // browser
            mock: () => {
                // tslint:disable:no-invalid-this no-string-literal
                this['window'] = 'lol';
            },
            classType: BrowserEnvironment
        },
        {
            // node
            mock: () => {
                return;
            },
            classType: NodeEnvironment
        }
    ];

    environments.forEach(data => {
        it('EnvironmentProvider will return right environment', () => {
            data.mock();
            const envPromise = EnvironmentProvider.getEnvironmnet();

            envPromise.then((value) => {
                assert.equal(value instanceof data.classType, true, 'Instance should be NodeEnvironment');
            }, (err) => {
                assert.fail(err);
            });
        });
    });
});