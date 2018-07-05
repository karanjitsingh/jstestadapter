import { ITestFrameworkEvents } from '../../../ObjectModel/TestFramework';
import { EnvironmentType, TestCase } from '../../../ObjectModel/Common';
import { Exception, ExceptionType } from '../../../Exceptions';
import { BaseTestFramework } from '../BaseTestFramework';
import { JestCallbacks } from './JestCallbacks';
import * as rewire from 'rewire';
import * as path from 'path';

export class JestTestFramework extends BaseTestFramework {
    public readonly environmentType: EnvironmentType;
    public readonly canHandleMultipleSources: boolean = false;
    public readonly supportsJsonOptions: boolean = true;

    protected sources: Array<string>;

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

    public initialize() {
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
        let runConfigPath;
        try {
            // tslint:disable-next-line:no-string-literal
            runConfigPath = testCollection.entries().next().value[1].Properties[0]['Value'];
        } catch (e) {
            throw new Exception('TestCase object does not contain jestConfigPath in Properties', ExceptionType.TestFrameworkError);
        }
        this.sources = sources;
        this.runJest(runConfigPath, null, sources);
    }

    public startExecutionWithSources(sources: Array<string>, options: JSON): void {
        this.sources = sources;
        this.runJest(sources[0], null, null);
    }

    public startDiscovery(sources: Array<string>): void {
        this.sources = sources;
        this.jestReporter.discovery = true;
        this.runJest(sources[0], null, null, true);
    }

    protected skipSpec(specObject: any) {
        // Cannot skip at test case level in jest
    }

    private runJest(runConfigPath: string, configOverride: JSON, sources: Array<string>, discovery: boolean = false) {
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
        }

        jestArgv.$0 = runConfigPath;
        jestArgv.config = runConfigPath;
        jestArgv.rootDir = path.dirname(runConfigPath);
        jestArgv.reporters = [ require.resolve('./JestReporter.js') ];

        // if (jestArgv.setupFiles instanceof Array) {
        //     jestArgv.setupFiles.unshift(require.resolve('./JestSetup'));
        // } else {
        //     jestArgv.setupFiles = [ require.resolve('./JestSetup') ];
        // }
        const src = [];
        sources.forEach((source, i) => {
            src.push(source.replace(/\\/g, '/'));  //  Cannot run specific test files in jest unless path separator is '/'
        });

        // the property '_' will be set as process.argv which in this case are for TestRunner not for jest
        jestArgv._ = src;

        this.handleSessionStarted();

        this.jest.runCLI(jestArgv, this.jestProjects).then(() => {
            this.handleSessionDone();
        }, (err) => {
            this.handleErrorMessage(err.message, err.stack);
            this.handleSessionDone();
        });
    }
}