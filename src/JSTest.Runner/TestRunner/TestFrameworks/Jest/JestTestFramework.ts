import { FailedExpectation, ITestFrameworkEvents } from '../../../ObjectModel/TestFramework';
import { EnvironmentType, TestOutcome } from '../../../ObjectModel/Common';
import { Exception, ExceptionType } from '../../../Exceptions';
import { BaseTestFramework } from '../BaseTestFramework';
import { JestReporter } from './JestReporter';
import rewire from 'rewire';
import * as path from 'path';
import { JestCallbacks } from './JestCallbacks';

enum ReporterEvent {
    SessionStarted,
    SessionDone,
    SuiteStarted,
    SuiteDone,
    SpecStarted,
    SpecDone
}

export class MochaTestFramework extends BaseTestFramework {
    public readonly executorUri: string = 'executor://MochaTestAdapter/v1';
    public readonly environmentType: EnvironmentType;
    public readonly canHandleMultipleSources: boolean = false;
    public readonly supportsJsonOptions: boolean = true;

    protected sources: Array<string>;

    private jest: any;
    private jestArgv: any;
    private jestProjects: any;
    private discoveryMode: boolean = false;

    private getJest() {
        switch (this.environmentType) {
            case EnvironmentType.NodeJS:
                // tslint:disable-next-line
                // TODO trace require.resolve('mocha');
                return rewire('jest-cli');
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

        const jestCLI = rewire(path.join(path.dirname(require.resolve('jest-cli')), 'cli'));
        this.jestArgv = jestCLI.__get__('buildArgv')();

        this.jestArgv.reporters = ['./JestReporter.js'];

        this.jestProjects = jestCLI.__get__('getProjectListFromCLIArgs')(this.jestArgv);

        JestReporter.INITIALIZE_REPORTER(<JestCallbacks> {
            handleSessionDone: this.handleSessionDone.bind(this),
            handleSessionStarted: this.handleSessionStarted.bind(this),
            handleSpecStarted: this.handleSpecStarted.bind(this),
            handleSpecDone: this.handleSpecDone.bind(this)
        });
    }

    public startExecutionWithSource(sources: Array<string>, options: JSON): void {
        this.jest.runCLI(this.sources[0], options);
    }

    public startDiscovery(sources: Array<string>): void {
        this.jest.runCLI(this.sources[0], null, true);
    }

    protected skipSpec(specObject: any) {
        specObject.pending = true;
    }

    private runJest(runConfigPath: string, configOverride: JSON, discovery: boolean = false) {
        const jestArgv = this.jestArgv;

        if (configOverride instanceof Object) {
            Object.keys(configOverride).forEach(key => {
                jestArgv[key] = configOverride[key];
            });
        }

        jestArgv.testPathPattern = ['*'];

        // TODO should run config path be test files? or runconfig? run jest --config and check buildargv
        jestArgv.$0 = path.dirname(runConfigPath);

        if (discovery) {
            // ^$a is a regex that will never match any string and force jest to skip all tests
            jestArgv.testNamePattern = '^$a';
        }

        jestArgv.reporters = [ path.resolve('./JestCustomReporter.js') ];

        this.jest.runCLI(jestArgv, this.jestProjects);
    }
}