import * as Assert from 'assert';
import * as fs from 'fs';
import { EnvironmentType, TestCase } from '../../../../../src/JSTest.Runner/ObjectModel/Common';
import { EqtTrace } from '../../../../../src/JSTest.Runner/ObjectModel/EqtTrace';
import { JestTestFramework } from '../../../../../src/JSTest.Runner/TestRunner/TestFrameworks/Jest/JestTestFramework';
import { TestUtils } from '../../../TestUtils';
import { TestFrameworkOptions } from '../../../../../src/JSTest.Runner/ObjectModel/TestFramework';
import { AttachmentSet } from '../../../../../src/JSTest.Runner/ObjectModel';
import { Constants } from '../../../../../src/JSTest.Runner/Constants';

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

        framework.options = <TestFrameworkOptions> {
            RunAttachmentsDirectory: 'C:\\temp',
            CollectCoverage: false
        };
    });
    
    it('startExecutionWithSources', (done) => {
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
                            _: [],
                            prop: 'value'
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
                            _: [],
                            prop: 'value'
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

        framework.startExecutionWithSources(['C:\\a\\package.json', 'C:\\a\\package2.json'], {prop: 'value'});
    });

    it('startDiscovery', (done) => {
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
                            _: [],
                            testNamePattern: '^$a'
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
                            _: [],
                            testNamePattern: '^$a'
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

        framework.startDiscovery(['C:\\a\\package.json', 'C:\\a\\package2.json']);
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

    it('initialize', () => {
        const logger = new TestUtils.MockDebugLogger();
        EqtTrace.initialize(logger, 'file');

        const mockJest = {};
        const mockJestArgv = {};
        const mockJestProjects = {};
        const options = {
            RunAttachmentsDirectory: 'C:\\temp',
            CollectCoverage: true
        };

        framework.getJest = () => mockJest;
        framework.getJestCLI = () => ({
            __get__: (str: string) => {
                switch (str) {
                    case 'buildArgv':
                        return () => {
                            return mockJestArgv;
                        };
                    case 'getProjectListFromCLIArgs':
                        return (arg: any) => {
                            if (arg !== mockJestArgv) {
                                Assert.fail();
                            }
                            return mockJestProjects;
                        };
                    default:
                        Assert.fail();
                }
            }
        });
    
        framework.initialize(options);

        Assert.equal(logger.logContains(/Information.*initializing jest.*/), true);
        Assert.equal(logger.logContains(/Information.*Attachments directory.*C:\\temp.*/), true);
        Assert.deepEqual(options, framework.options);

        Assert.equal(mockJest, framework.jest);
        Assert.equal(mockJestArgv, framework.jestArgv);
        Assert.equal(mockJestProjects, framework.jestProjects);

    });

    it('initialize, no run attachments dir', () => {
        const logger = new TestUtils.MockDebugLogger();
        EqtTrace.initialize(logger, 'file');
        
        const options = {
            RunAttachmentsDirectory: '',
            CollectCoverage: true
        };

        framework.getJest = () => ({});
        framework.getJestCLI = () => ({
            __get__: (str: string) => (() => ({ reporters: null}))
        });
    
        framework.initialize(options);

        Assert.equal(logger.logContains(/Warning.*Code coverage was enabled but run attachments directory was not provided.*/), true);
    });

    it('sets code coverage arguments for jest', (done) => {
        const logger = new TestUtils.MockDebugLogger();
        let coverageDir: string = '';

        Object.defineProperty(fs, 'existsSync', {
            writable: false,
            value: () => {
                return true;
            }
        });
        Object.defineProperty(fs, 'mkdirSync', {
            writable: false,
            value: (dir) => {
                coverageDir = dir;
            }
        });

        EqtTrace.initialize(logger, 'file');

        framework.options = {
            RunAttachmentsDirectory: 'C:\\temp',
            CollectCoverage: true
        };
        framework.jest = {
            runCLI: async (argv, projects) => {
                return Promise.resolve();
            }
        };

        const guid = framework.getPseudoGuid();
        
        const attachments = new AttachmentSet(Constants.ExecutorURI, 'Code Coverage');
        attachments.addAttachment(`C:\\temp\\${guid}\\clover.xml`, '');

        framework.handleRunAttachments = (attachmentSet) => {
            Assert.deepEqual(attachmentSet[0], attachments);
            done();
        };

        framework.getPseudoGuid = () => guid;
        framework.startExecutionWithSources(['C:\\a\\package.json'], {prop: 'value'});

        Assert.equal('C:\\temp\\' + guid, coverageDir);
    });
});