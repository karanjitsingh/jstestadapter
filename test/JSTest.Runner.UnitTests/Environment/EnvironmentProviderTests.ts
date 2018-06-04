import { EnvironmentType } from '../../../src/JSTest.Runner/ObjectModel/Common';
import { EnvironmentProvider } from '../../../src/JSTest.Runner/Environment/EnvironmentProvider';
import * as Assert from 'assert';

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
        it('EnvironmentProvider will return right environment', (done: any) => {
            const envPromise = new TestableEnvironmentProvider(data.isBrowser).getEnvironment();
            envPromise.then((value) => {
                Assert.equal(value.environmentType === data.envType, true, 'Instance should be ' + data.folderName + 'Environment');
                done();
            }, (err) => {
                Assert.fail(err);
            }).catch((err) => {
                done(err);
            });
        });
    });
});
