import * as Assert from 'assert';
import { JSTestSettings } from '../../../src/JSTest.Runner/ObjectModel';
import { Exception } from '../../../src/JSTest.Runner/Exceptions';

describe('JSTestSettings suite', () => {
    it('constructor will throw if invalid test framework', (done) => {
        Assert.throws(() => new JSTestSettings({ JavaScriptTestFramework: 'framework', TestFrameworkConfigJson: '{}' }),
                      (err) => err instanceof Exception && err.exceptionName === 'UnSupportedTestFramework',
                      'Should throw on unsupported test framework.');
        done();
    });

    it('constructor will throw if invalid config json passed', (done) => {
        Assert.throws(() => new JSTestSettings({ JavaScriptTestFramework: 'jasmine', TestFrameworkConfigJson: '{' }),
                      (err) => err instanceof Exception && err.exceptionName === 'InvalidJSONException',
                      'Should throw on invalid config json.');

        Assert.doesNotThrow(() => new JSTestSettings({ JavaScriptTestFramework: 'jasmine', TestFrameworkConfigJson: null }),
                      (err) => err instanceof Exception && err.exceptionName === 'InvalidJSONException',
                      'Should not throw on null config json');
        done();
    });

    it('JSTestSettings will create empty config object for null json', (done) => {
        const settings = new JSTestSettings({ JavaScriptTestFramework: 'jasmine', TestFrameworkConfigJson: null });
        Assert.deepEqual(settings.TestFrameworkConfigJson, {});
        done();
    });
});