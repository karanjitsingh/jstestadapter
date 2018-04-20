import { EnvironmentProvider } from '../../../src/JSTestHost/Environment/EnvironmentProvider';
import { Environment as NodeEnvironment } from '../../../src/JSTestHost/Environment/Node/Environment';
import { Environment as BrowserEnvironment } from '../../../src/JSTestHost/Environment/Browser/Environment';
import { EnvironmentType } from '../../../src/JSTestHost/Environment/IEnvironment';
import { IEnvironment } from '../../../src/JSTestHost/Environment/IEnvironment';
import * as assert from 'assert';
import * as Moq from 'typemoq';

describe('EnvironmentProvider Suite', () => {

    const environments = [
        {
            // Browser
            isBrowser: true,
            folderName: 'Browser',
            envType: EnvironmentType.Browser
        },
        {
            // Node
            isBrowser: false,
            folderName: 'Node',
            envType: EnvironmentType.NodeJS
        }
    ];

    environments.forEach(data => {
        // const envProviderMock: Moq.IMock<EnvironmentProvider> = Moq.Mock.ofType(EnvironmentProvider);
        it('EnvironmentProvider will return right environment', (done: any) => {
            // data.setup();
            const envPromise = new TestableEnvironmentProvider(data.isBrowser).getEnvironment();
            envPromise.then((value) => {
                assert.equal(value.environmentType === data.envType, true, 'Instance should be ' + data.folderName + 'Environment');
                done();
            }, (err) => {
                assert.fail(err);
            }).catch((err) => {
                done(err);
            });
        });
    });
});

class TestableEnvironmentProvider extends EnvironmentProvider {
    private browser: boolean;

    constructor(isBrowser: boolean) {
        super();
        this.browser = isBrowser;
    }

    protected isBrowser() : boolean {
        return this.browser;
    }
}