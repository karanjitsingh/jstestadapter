import * as fs from 'fs';
import * as path from 'path';
import * as rewire from 'rewire';
import { Constants } from '../../../Constants';
import { Exception, ExceptionType } from '../../../Exceptions';
import { AttachmentSet } from '../../../ObjectModel';
import { EnvironmentType, TestCase } from '../../../ObjectModel/Common';
import { EqtTrace } from '../../../ObjectModel/EqtTrace';
import { ITestFrameworkEvents, TestFrameworkOptions } from '../../../ObjectModel/TestFramework';
import { BaseTestFramework } from '../BaseTestFramework';
import { JestCallbacks } from './JestCallbacks';

export class JestTestFramework extends BaseTestFramework {
    public readonly environmentType: EnvironmentType;
    // Even though we can handle multiple sources for all types of executions we'll leave this option be for now
    public readonly canHandleMultipleSources: boolean = true;
    public readonly supportsJsonOptions: boolean = true;
    public readonly supportsCodeCoverage: boolean = false;

    protected sources: Array<string>;

    private options: TestFrameworkOptions;
    private jest: any;
    private jestArgv: any;
    private jestProjects: any;
    private jestReporter: any;

    private getJest() {
        switch (this.environmentType) {
            case EnvironmentType.NodeJS:
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

    private getJestCLI() {
        return rewire(path.join(path.dirname(require.resolve('jest-cli')), 'cli'));
    }

    constructor(testFrameworkEvents: ITestFrameworkEvents, envrionmentType: EnvironmentType) {
        super(testFrameworkEvents);
        this.environmentType = envrionmentType;
    }

    public initialize(options: TestFrameworkOptions) {
        EqtTrace.info('JestTestFramework: initializing jest');

        this.options = options;

        if (this.options.CollectCoverage) {
            if (this.options.RunAttachmentsDirectory) {
                EqtTrace.info(`JestTestFramework: Attachments directory "${this.options.RunAttachmentsDirectory}"`);
            } else {
                EqtTrace.warn('JestTestFramework: Code coverage was enabled but run attachments directory was not provided.');
            }
        }

        this.jest = this.getJest();
        const jestCLI = this.getJestCLI();

        this.jestArgv = jestCLI.__get__('buildArgv')();
        this.jestArgv.reporters = ['./JestReporter.js'];

        this.jestProjects = jestCLI.__get__('getProjectListFromCLIArgs')(this.jestArgv);

        //tslint:disable:no-require-imports
        this.jestReporter = require('./JestReporter');
        this.jestReporter.INITIALIZE_REPORTER(<JestCallbacks>{
            handleJestRunComplete: this.reporterRunCompleteHandler.bind(this),
            handleSpecFound: this.handleSpecStarted.bind(this),
            handleSpecResult: this.handleSpecResult.bind(this),
            handleErrorMessage: this.handleErrorMessage.bind(this)
        });

        //tslint:disable:no-require-imports
        // const jestSetup = require('./JestSetup');
        // jestSetup.INITIALIZE(Environment.instance.reinitializeConsoleLogger);
    }

    public startExecutionWithTests(sources: Array<string>, testCollection: Map<string, TestCase>, options: JSON) {
        this.setExecutingWithTests(testCollection);

        const configToSourceMap: Map<string, Array<string>> = new Map();
        const configToTestNamesMap: Map<string, Array<string>> = new Map();

        const testCaseIterator = testCollection.values();
        let testCaseIteration = testCaseIterator.next();
        while (!testCaseIteration.done) {
            const testCase = testCaseIteration.value;

            if (sources.indexOf(testCase.Source) !== -1) {
                const fqnRegex = testCase.FullyQualifiedName.match(/.*::(.*)::(.*)/);
                const configPath = testCase.Source;

                if (fqnRegex) {

                    // source path appended to the fqn is relative to the config file

                    const source = path.normalize(path.dirname(configPath) + '\\' + fqnRegex[2]);
                    if (configToSourceMap.has(configPath)) {
                        configToTestNamesMap.get(configPath).push(fqnRegex[1]);
                        configToSourceMap.get(configPath)[source] = <any>1;
                    } else {
                        const sourceArray = [];
                        sourceArray[source] = 1;
                        configToSourceMap.set(configPath, sourceArray);

                        configToTestNamesMap.set(configPath, [fqnRegex[1]]);
                    }
                } else {
                    EqtTrace.warn('Incorrect fqn pattern for test case ' + JSON.stringify(testCase));
                }
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
        this.executeTestsAsync(sources, configToSourceMap, options, configToTestNamesMap);
    }

    public startExecutionWithSources(sources: Array<string>, options: JSON): void {
        EqtTrace.info(`JestTestFramework: starting with options: ${JSON.stringify(options)}`);

        this.sources = sources;

        const map = new Map();
        map.set(sources[0], []);

        this.executeTestsAsync(sources, map, options);
    }

    public startDiscovery(sources: Array<string>): void {
        this.sources = sources;
        this.jestReporter.discovery = true;
        this.discoverTestsAsync(sources);
    }

    protected skipSpec(specObject: any) {
        // Cannot skip at test case level while execution in jest
    }

    private async discoverTestsAsync(sources: Array<string>) {
        if (sources) {
            for (let i = 0; i < sources.length; i++) {
                try {
                    await this.runTestAsync(sources[i], null, null, null, true);
                } catch (err) {
                    this.handleErrorMessage(err.message, err.stack);
                }
            }
        }

        this.handleSessionDone();
    }

    private async executeTestsAsync(sources: Array<string>, configToSourceMap: Map<string, Array<string>>,
        configOverride: JSON,
        configToTestNameMap?: Map<string, Array<string>>) {

        if (!configToSourceMap.size) {
            this.handleErrorMessage('JestTestFramework: No configs in config source map.', '');
            this.handleSessionDone();
            return;
        }

        /* sometimes (usually in execute with tests scenario)
         * configToSourceMap can contain configs/sources which
         * are not supposed to be executed, hence filter with sources
         */
        for (let i = 0; i < sources.length; i++) {
            try {
                await this.runTestAsync(sources[i],
                    configToSourceMap.get(sources[i]),
                    configOverride,
                    configToTestNameMap ? configToTestNameMap.get(sources[i]) : null);
            } catch (err) {
                this.handleErrorMessage(err.message, err.stack);
            }

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
        jestArgv.reporters = [require.resolve('./JestReporter.js')];

        let coverageDirectory: string = null;

        if (this.options.CollectCoverage && this.options.RunAttachmentsDirectory && !discovery) {
            coverageDirectory = path.join(this.options.RunAttachmentsDirectory, this.getPseudoGuid());

            try {
                fs.mkdirSync(coverageDirectory);
                jestArgv.collectCoverage = true;
                jestArgv.coverageReporters = ['clover'];
                jestArgv.coverageDirectory = coverageDirectory;

                EqtTrace.info(`JestTestFramework: Generating coverage for jest at ${coverageDirectory}`);
            } catch (e) {
                EqtTrace.error(`JestTestFramework: Could not create directory ${coverageDirectory} for test results.`, e);
                coverageDirectory = null;
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

        try {
            await this.jest.runCLI(jestArgv, this.jestProjects);
            EqtTrace.info('JestTestFramework: Execution complete');
        } catch (e) {
            EqtTrace.error('JestTestFramework: Exception on await runCLI', e);
        }

        if (coverageDirectory) {
            const coverageFile = path.join(coverageDirectory, 'clover.xml');
            if (fs.existsSync(coverageFile)) {
                this.handleRunAttachments([this.getAttachmentObject([coverageFile], 'Code Coverage')]);
            } else {
                EqtTrace.error(`JestTestFramework: Coverage file ${coverageFile} does not exist`, null);
            }
        }
        return;
    }

    private getTestNamePattern(testCaseNames: Array<string>) {
        const escapeRegex = /[.*+?^${}()|[\]\\]/g;

        testCaseNames.forEach((str, i) => {
            testCaseNames[i] = '(' + str.replace(escapeRegex, '\\$&') + ')';
        });

        return testCaseNames.join('|');
    }

    private getPseudoGuid() {
        const s = () => {
            // tslint:disable-next-line
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        };

        return (`${s()}${s()}-${s()}-${s()}-${s()}-${s()}${s()}${s()}`).toLowerCase();
    }

    private getAttachmentObject(attachments: Array<string>, displayName: string): AttachmentSet {
        const attachmentSet = new AttachmentSet(Constants.ExecutorURI, displayName);
        attachments.forEach(filePath => attachmentSet.addAttachment(path.resolve(filePath), ''));

        return attachmentSet;
    }

    private reporterRunCompleteHandler() {
        // do nothing
    }
}