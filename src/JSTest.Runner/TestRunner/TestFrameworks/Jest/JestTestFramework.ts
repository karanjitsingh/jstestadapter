import * as fs from 'fs';
import * as path from 'path';
import * as rewire from 'rewire';
import { Exception, ExceptionType } from '../../../Exceptions';
import { EnvironmentType, TestCase } from '../../../ObjectModel/Common';
import { EqtTrace } from '../../../ObjectModel/EqtTrace';
import { ITestFrameworkEvents } from '../../../ObjectModel/TestFramework';
import { BaseTestFramework } from '../BaseTestFramework';
import { JestCallbacks } from './JestCallbacks';

export class JestTestFramework extends BaseTestFramework {
    public readonly environmentType: EnvironmentType;
    public readonly canHandleMultipleSources: boolean = false;
    public readonly supportsJsonOptions: boolean = true;
    public readonly supportsCodeCoverage: boolean = true;

    protected sources: Array<string>;

    private tempDir: string;

    private jest: any;
    private jestArgv: any;
    private jestProjects: any;
    private jestReporter: any;

    private getJest() {
        switch (this.environmentType) {
            case EnvironmentType.NodeJS:
                // tslint:disable-next-line
                // tslint:disable-next-line:no-require-imports
                return require('jest');
            default:
                throw new Exception('Not implemented.', ExceptionType.NotImplementedException);
                /*
                 * TODO CHECK FOR FRAMEWORK SPECIFIC ERRORS
                 * report as test framework threw an error,
                 * rethrow all errors wrapped in exception
                 * don't take dependency on exception here
                 */
        }
    }

    constructor(testFrameworkEvents: ITestFrameworkEvents, envrionmentType: EnvironmentType) {
        super(testFrameworkEvents);
        this.environmentType = envrionmentType;
    }

    public initialize(tempDir?: string) {
        EqtTrace.info('JestTestFramework: initializing jest');
        this.tempDir = tempDir;

        if (tempDir) {
            EqtTrace.info('Temp dir: ' + tempDir);
        } else {
            EqtTrace.info('No temp dir provided.');
        }

        this.jest = this.getJest();

        const jestjs = require.resolve('jest');
        const jestCLI = rewire(path.join(path.dirname(path.dirname(jestjs)), 'node_modules', 'jest-cli', 'build', 'cli'));

        this.jestArgv = jestCLI.__get__('buildArgv')();
        this.jestArgv.reporters = ['./JestReporter.js'];

        this.jestProjects = jestCLI.__get__('getProjectListFromCLIArgs')(this.jestArgv);

        //tslint:disable:no-require-imports
        this.jestReporter = require('./JestReporter');
        this.jestReporter.INITIALIZE_REPORTER(<JestCallbacks> {
            handleSessionDone: this.handleSessionDone.bind(this),
            handleSpecFound: this.handleSpecStarted.bind(this),
            handleSpecResult: this.handleSpecResult.bind(this),
            handleErrorMessage: this.handleErrorMessage.bind(this)
        });

        //tslint:disable:no-require-imports
        // const jestSetup = require('./JestSetup');
        // jestSetup.INITIALIZE(Environment.instance.reinitializeConsoleLogger);
    }

    public startExecutionWithTests(sources: Array<string>, testCollection: Map<string, TestCase>, options: JSON) {
        const configToSourceMap: Map<string, Array<string>> = new Map();
        const configToTestNamesMap: Map<string, Array<string>> = new Map();

        const testCaseIterator = testCollection.values();
        let testCaseIteration = testCaseIterator.next();
        while (!testCaseIteration.done) {
            const testCase = testCaseIteration.value;
            const fqnRegex = testCase.FullyQualifiedName.match(/.*::(.*)::(.*)/);

            const configPath = testCase.Source;

            if (fqnRegex) {
                
                // source path appended to the fqn is relative to the config file

                const source = path.normalize(path.dirname(configPath) + '\\' + fqnRegex[2]);
                if (configToSourceMap.has(configPath)) {
                    configToTestNamesMap.get(configPath).push(fqnRegex[1]);
                    configToSourceMap.get(configPath)[source] = 1;
                } else {
                    const sourceArray = [];
                    sourceArray[source] = 1;
                    configToSourceMap.set(configPath, sourceArray);
                    
                    configToTestNamesMap.set(configPath, [fqnRegex[1]]);
                }
            } else {
                EqtTrace.warn('Incorrect fqn pattern for test case ' + JSON.stringify(testCase));
            }

            testCaseIteration = testCaseIterator.next();
        }

        const packageIterator = configToSourceMap.entries();
        let packageIteration = packageIterator.next();

        while (!packageIteration.done) {
            configToSourceMap.set(packageIteration.value[0], Object.keys(packageIteration.value[1]));
            packageIteration = packageIterator.next();
        }

        this.sources = sources;
        this.runTestsAsync(configToSourceMap, options, configToTestNamesMap);
    }

    public startExecutionWithSources(sources: Array<string>, options: JSON): void {
        EqtTrace.info(`JestTestFramework: starting with options: ${JSON.stringify(options)}`);

        this.sources = sources;
        
        const map = new Map();
        map.set(sources[0], []);

        this.runTestsAsync(map, options);
    }

    public startDiscovery(sources: Array<string>): void {
        this.sources = sources;
        this.jestReporter.discovery = true;
        this.runTestAsync(sources[0], null, null, null, true);
    }

    protected skipSpec(specObject: any) {
        // Cannot skip at test case level while execution in jest
    }

    private async runTestsAsync(configToSourceMap: Map<string, Array<string>>,
                                configOverride: JSON, 
                                configToTestNameMap?: Map<string, Array<string>>) {
        
        if (!configToSourceMap.size) {
            this.handleErrorMessage('JestTestFramework: No configs in config source map.', '');
            this.handleSessionDone();
            return;
        }

        const entries = configToSourceMap.entries();
        let kvp = entries.next();

        while (!kvp.done) {
            try {
                await this.runTestAsync(kvp.value[0],
                                        kvp.value[1],
                                        configOverride,
                                        configToTestNameMap ? configToTestNameMap.get(kvp.value[0]) : null);
            } catch (err) {
                this.handleErrorMessage(err.message, err.stack);
            }

            kvp = entries.next();
        }

        this.handleSessionDone();
    }

    private async runTestAsync(runConfigPath: string,
                               sources: Array<string>,
                               configOverride: JSON,
                               testNames?: Array<string>,
                               discovery: boolean = false) {
        const jestArgv = this.jestArgv;
        sources = sources || [];
        
        if (configOverride instanceof Object) {
            Object.keys(configOverride).forEach(key => {
                jestArgv[key] = configOverride[key];
            });
        }

        if (discovery) {
            // ^$a is a regex that will never match any string and force jest to skip all tests
            jestArgv.testNamePattern = '^$a';
        } else if (testNames) {
            jestArgv.testNamePattern = this.getTestNamePattern(testNames);
        }

        jestArgv.$0 = runConfigPath;
        jestArgv.config = runConfigPath;
        jestArgv.rootDir = path.dirname(runConfigPath);
        jestArgv.reporters = [ require.resolve('./JestReporter.js') ];

        if (this.supportsCodeCoverage && this.codeCoverageEnabled && this.tempDir) {
            const testResultsDirectory: string = path.join(this.tempDir, this.getPseudoGuid());
            
            try {
                fs.mkdtempSync(testResultsDirectory);
                jestArgv.collectCoverage = true;
                jestArgv.coverageReporters = [ 'clover' ];

                EqtTrace.info('Generating coverage for jest at ' + testResultsDirectory);
            } catch (e) {
                EqtTrace.error('Could not create directory ' + testResultsDirectory + 'for test results.', e);
            }
        }
        
        const src = [];
        sources.forEach((source, i) => {
            src.push(source.replace(/\\/g, '/'));  //  Cannot run specific test files in jest unless path separator is '/'
        });

        // the property '_' will be set as process.argv which in this case are for TestRunner not for jest
        jestArgv._ = src;

        EqtTrace.info(`JestTestFramework: JestArgv: ${JSON.stringify(jestArgv)}`);

        this.handleSessionStarted();
        this.jestReporter.UPDATE_CONFIG(runConfigPath);

        //tslint:disable-next-line
        const value = this.jest.runCLI(jestArgv, this.jestProjects);
        value.then((...args) => {
            EqtTrace.info('stufff');
            EqtTrace.info(JSON.stringify(args));
        });

        return value;
    }

    private getTestNamePattern(testCaseNames: Array<string>) {
        const escapeRegex = /[.*+?^${}()|[\]\\]/g;

        testCaseNames.forEach((str, i) => {
            testCaseNames[i] = '(' + str.replace(escapeRegex, '\\$&') + ')';
        });

        return testCaseNames.join('|');
    }

    private getPseudoGuid() {
        const S4 = () => {
            // tslint:disable-next-line
            return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
        };
         
        return (S4() + S4() + '-' + S4() + '-4' + S4().substr(0, 3) + '-' + S4() + '-' + S4() + S4() + S4()).toLowerCase();
    }
}