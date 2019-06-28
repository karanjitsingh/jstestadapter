import { TestFrameworkFactory } from '../../../../src/JSTest.Runner/TestRunner/TestFrameworks/TestFrameworkFactory';
import { Environment } from '../../../../src/JSTest.Runner/Environment/Node/Environment';
import * as Assert from 'assert';
import { TestFrameworks } from '../../../../src/JSTest.Runner/ObjectModel/TestFramework';
import { Event } from '../../../../src/JSTest.Runner/Events/Event';
import { JasmineTestFramework } from '../../../../src/JSTest.Runner/TestRunner/TestFrameworks/Jasmine/JasmineTestFramework';
import { MochaTestFramework } from '../../../../src/JSTest.Runner/TestRunner/TestFrameworks/Mocha/MochaTestFramework';
import { JestTestFramework } from '../../../../src/JSTest.Runner/TestRunner/TestFrameworks/Jest/JestTestFramework';
import { KarmaTestFramework } from '../../../../src/JSTest.Runner/TestRunner/TestFrameworks/Karma/KarmaTestFramework';

describe('TestFrameworkFactory Suite', () => {
    let testFrameworkFactory: TestFrameworkFactory;

    beforeEach(() => {
        TestFrameworkFactory.instance = undefined;
        TestFrameworkFactory.INITIALIZE(new Environment());
        testFrameworkFactory = TestFrameworkFactory.instance;
    });

    it('INITIALIZE will set static instance', (done) => {
        Assert.notStrictEqual(TestFrameworkFactory.instance, undefined);
        done();
    });

    it('createTestFramework will instantiate test framework', (done) => {
        const tf = testFrameworkFactory.createTestFramework(TestFrameworks.Jasmine);
        Assert.strictEqual(tf.testFrameworkEvents.onErrorMessage instanceof Event, true);
        Assert.strictEqual(tf.testFrameworkEvents.onTestCaseEnd instanceof Event, true);
        Assert.strictEqual(tf.testFrameworkEvents.onTestCaseStart instanceof Event, true);
        Assert.strictEqual(tf.testFrameworkEvents.onTestSessionEnd instanceof Event, true);
        Assert.strictEqual(tf.testFrameworkEvents.onTestSessionStart instanceof Event, true);
        Assert.strictEqual(tf.testFrameworkEvents.onTestSuiteEnd instanceof Event, true);
        Assert.strictEqual(tf.testFrameworkEvents.onTestSuiteStart instanceof Event, true);
        Assert.strictEqual(tf.testFrameworkEvents.onRunAttachment instanceof Event, true);
        done();
    });

    it('createTestFramework will return right framework', (done) => {
        Object.keys(TestFrameworks).forEach(key => {
            if (isNaN(parseInt(key))) {
                switch (key.toLowerCase()) {
                    case 'jasmine':
                        Assert.strictEqual(testFrameworkFactory.createTestFramework(TestFrameworks.Jasmine)
                            instanceof JasmineTestFramework, true);
                        break;
                    case 'mocha':
                        Assert.strictEqual(testFrameworkFactory.createTestFramework(TestFrameworks.Mocha)
                            instanceof MochaTestFramework, true);
                        break;
                    case 'jest':
                        Assert.strictEqual(testFrameworkFactory.createTestFramework(TestFrameworks.Jest)
                            instanceof JestTestFramework, true);
                        break;
                    case 'karma':
                        Assert.strictEqual(testFrameworkFactory.createTestFramework(TestFrameworks.Karma)
                            instanceof KarmaTestFramework, true);
                        break;
                    default:
                        Assert.fail('TestFrameworks.' + key);
                }
            }
        });

        done();
    });
});