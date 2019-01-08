import { EnvironmentType, TestCase } from '../../../../../src/JSTest.Runner/ObjectModel/Common';
import { JestTestFramework } from '../../../../../src/JSTest.Runner/TestRunner/TestFrameworks/Jest/JestTestFramework';
import * as Assert from 'assert';

describe('JestTestFramework suite', () => {
    let framework: any;
    let sessionStarted: boolean;
    let configPath: string;

    beforeEach(() => {
        sessionStarted = false;
        configPath = null;

        framework = new JestTestFramework(<any>{}, EnvironmentType.NodeJS);
        framework.jestArgv = [];

        framework.handleErrorMessage = (a, b) => {
            throw new Error(a + '\n' + b);
        };
        framework.handleSessionStarted = () => {
            sessionStarted = true;
        };

        framework.jestReporter = {
            UPDATE_CONFIG: (path) => {
                configPath = path;
            }
        };

        framework.jestProjects = {};
    });

    it('startExecutionWithSources', (done) => {

        framework.jest = {
            runCLI: (argv, projects) => {
                Assert.deepEqual(argv, {
                    $0: 'C:\\a\\package.json',
                    config: 'C:\\a\\package.json',
                    rootDir: 'C:\\a',
                    reporters: [ require.resolve('../../../../../src/JSTest.Runner/TestRunner/TestFrameworks/Jest/JestReporter.js') ],
                    _: [],
                    prop: 'value'
                });
                Assert.equal(sessionStarted, true);
                Assert.equal(configPath, 'C:\\a\\package.json');
                Assert.equal(projects, framework.jestProjects);
                done();
            }
        };

        framework.startExecutionWithSources(['C:\\a\\package.json'], {prop: 'value'});
    });

    it('startDiscovery', (done) => {
        framework.jest = {
            runCLI: (argv, projects) => {
                Assert.deepEqual(argv, {
                    $0: 'C:\\a\\package.json',
                    config: 'C:\\a\\package.json',
                    rootDir: 'C:\\a',
                    reporters: [ require.resolve('../../../../../src/JSTest.Runner/TestRunner/TestFrameworks/Jest/JestReporter.js') ],
                    _: [],
                    testNamePattern: '^$a'
                });
                Assert.equal(sessionStarted, true);
                Assert.equal(configPath, 'C:\\a\\package.json');
                done();
            }
        };

        framework.startDiscovery(['C:\\a\\package.json']);
    });
    
    it('startExecutionWithTests', (done) => {
        let runCount = 0;

        framework.jest = {
            runCLI: (argv, projects) => {
                runCount++;

                switch (runCount) {
                    case 1:
                        Assert.deepEqual(argv, {
                            $0: 'C:\\a\\package.json',
                            config: 'C:\\a\\package.json',
                            rootDir: 'C:\\a',
                            reporters: [
                                require.resolve('../../../../../src/JSTest.Runner/TestRunner/TestFrameworks/Jest/JestReporter.js')
                            ],
                            _: [ 'C:/a/test1.js', 'C:/a/test2.js' ],
                            prop: 'value',
                            testNamePattern: '(fqn)|(fqn2)'
                        });
                        Assert.equal(sessionStarted, true);
                        Assert.equal(configPath, 'C:\\a\\package.json');
                        break;
                    case 2:
                        Assert.deepEqual(argv, {
                            $0: 'C:\\a\\package2.json',
                            config: 'C:\\a\\package2.json',
                            rootDir: 'C:\\a',
                            reporters: [
                                require.resolve('../../../../../src/JSTest.Runner/TestRunner/TestFrameworks/Jest/JestReporter.js')
                            ],
                            _: [ 'C:/a/test3.js' ],
                            prop: 'value',
                            testNamePattern: '(fqn)'
                        });
                        Assert.equal(sessionStarted, true);
                        Assert.equal(configPath, 'C:\\a\\package2.json');

                        break;
                }
            }
        };

        framework.handleSessionDone = () => {
            done();
        };

        const testCollection = new Map();
        testCollection.set(1, new TestCase('C:\\a\\package.json', 'fqn::fqn::test1.js', 'uri'));
        testCollection.set(2, new TestCase('C:\\a\\package.json', 'fqn2::fqn2::test2.js', 'uri'));
        testCollection.set(3, new TestCase('C:\\a\\package2.json', 'fqn::fqn::test3.js', 'uri'));

        framework.startExecutionWithTests(['C:\\a\\package.json', 'C:\\a\\package2.json'], testCollection, {prop: 'value'} );
    });

    it('startExecutionWithTests will send error message if no config', (done) => {
        let message;
        let stack;

        framework.handleErrorMessage = (err, errStack) => {
            message = err;
            stack = errStack;
        };

        framework.handleSessionDone = () => {
            Assert.equal(message, 'JestTestFramework: No configs in config source map.');
            Assert.equal(stack, '');
            done();
        };

        framework.startExecutionWithTests([], new Map());
    });

    it('startExecutionWithTests will send error message if one config execution fails', (done) => {

        framework.jest = {
            runCLI: () => {
                throw {
                    message: 'message',
                    stack: 'stack'
                };
            }
        };

        framework.handleErrorMessage = (msg, stack) => {
            
            Assert.equal(msg, 'message');
            Assert.equal(stack, 'stack');

            framework.jest = {
                runCLI: (argv) => {
                    Assert.deepEqual(argv, {
                        $0: 'C:\\a\\package2.json',
                        config: 'C:\\a\\package2.json',
                        rootDir: 'C:\\a',
                        reporters: [
                            require.resolve('../../../../../src/JSTest.Runner/TestRunner/TestFrameworks/Jest/JestReporter.js')
                        ],
                        _: [ 'C:/a/test3.js' ],
                        prop: 'value',
                        testNamePattern: '(fqn)'
                    });
                    Assert.equal(sessionStarted, true);
                    Assert.equal(configPath, 'C:\\a\\package2.json');
                }
            };
        };

        framework.handleSessionDone = () => {
            done();
        };

        const testCollection = new Map();
        testCollection.set(1, new TestCase('C:\\a\\package.json', 'fqn::fqn::test1.js', 'uri'));
        testCollection.set(2, new TestCase('C:\\a\\package.json', 'fqn2::fqn2::test2.js', 'uri'));
        testCollection.set(3, new TestCase('C:\\a\\package2.json', 'fqn::fqn::test3.js', 'uri'));

        framework.startExecutionWithTests(['C:\\a\\package.json', 'C:\\a\\package2.json'], testCollection, {prop: 'value'} );
    });
});