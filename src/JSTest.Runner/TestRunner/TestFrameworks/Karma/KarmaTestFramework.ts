import { ITestFrameworkEvents, ITestFramework } from '../../../ObjectModel/TestFramework';
import { EnvironmentType } from '../../../ObjectModel/Common';
import { Exception, ExceptionType } from '../../../Exceptions';
import { BaseTestFramework } from '../BaseTestFramework';
import { EqtTrace } from '../../../ObjectModel/EqtTrace';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

enum ReporterEvent {
    BrowserRegister,
    BrowserError,
    BrowserStart,
    BrowserComplete,
    BrowsersChange,
    BrowsersReady,
    RunStarted,
    RunCompleted,
    Error
}

export class KarmaTestFramework extends BaseTestFramework implements ITestFramework {
    public readonly environmentType: EnvironmentType;
    public readonly canHandleMultipleSources: boolean = false;
    public readonly supportsJsonOptions: boolean = false;
    public readonly supportsCodeCoverage: boolean = false;

    protected sources: Array<string>;

    private karma: any;
    private skipCurrentSpec: boolean = false;
    private nextPort: number = 9900;
    private karmaConfig: any;

    private getKarma() {
        switch (this.environmentType) {
            case EnvironmentType.NodeJS:
                // tslint:disable-next-line
                return require('karma');
            default:
                throw new Exception('Not implemented.', ExceptionType.NotImplementedException);
        }
    }

    constructor(testFrameworkEvents: ITestFrameworkEvents, environmentType: EnvironmentType) {
        super(testFrameworkEvents);
        this.environmentType = environmentType;
    }

    public initialize() {
        EqtTrace.info('KarmaTestFramework: initializing Karma');
        this.karma = this.getKarma();
    }

    public startExecutionWithSources(sources: Array<string>, options: JSON): void {
        this.sources = sources;
        const karmaServer = this.karma.Server;
        const debug = false;
        const browsers = ['Chrome'];
        const testResultsFolder = options['testResultsPath'];

        this.karmaConfig = {
            files: this.sources,
            frameworks: ['mocha', 'chai'],
            basePath: '',
            port: this.nextPort++,
            autoWatch: true,
            failOnEmptyTestSuite: false,
            reporters: ['spec', 'xml'],
            specReporter: {
                suppressSkipped: true
            },
            plugins: ['karma-*'],
            logLevel:  this.karma.constants.LOG_WARN
        };

        if (debug) {
            this.karmaConfig.singleRun = false;
            this.karmaConfig.useIframe = false;
        } else {
            this.karmaConfig.singleRun = true;
        }
        if (browsers) {
            this.karmaConfig.browsers = browsers;
        } else {
            this.karmaConfig.browsers = ['ChromeHeadless'];
        }

        const testResultsPath = path.resolve(__dirname, testResultsFolder);

        if (!fs.existsSync(testResultsPath)) {
            fs.mkdirSync(testResultsPath);
        }

        if (testResultsFolder) {
            //this.karmaConfig.plugins.push(require("karma-trx-reporter"));
            //Trx Reporter
            this.karmaConfig.reporters.push('trx');
            const testResultsFileNameSuffix = os.hostname() + '-' + os.userInfo().username + '-' + (new Date()).getTime();
            this.karmaConfig.trxReporter = {
                outputFile: path.resolve(testResultsPath, 'karma-test-results-' + testResultsFileNameSuffix + '.trx'),
                shortTestName: false
            };

            //Xml Reporter
            this.karmaConfig.xmlReporter = {
                outputFile: path.resolve(testResultsPath, 'karma-test-results-' + testResultsFileNameSuffix + '.xml')
            };
        }

        EqtTrace.info(`KarmaTestFramework: starting with options: ${JSON.stringify(options)}`);
        EqtTrace.info(`KarmaTestFramework: Karma Server starting with config: ${JSON.stringify(this.karmaConfig)}`);
        EqtTrace.info('KarmaTestFramework: Karma Server started at ' + this.karmaConfig.port + ' ...');
        const server = new karmaServer(this.karmaConfig, (exitCode: any) => {
            if (exitCode === 0 || exitCode === null || exitCode === 'undefined') {
                EqtTrace.info('KarmaTestFramework: Karma Server exited with code: ' + exitCode + ' ...');
            } else {
                this.handleErrorMessage('KarmaTestFramework: Karma Server exited with code: ' + exitCode, exitCode);
            }
            this.handleSessionDone();
        }
        );

        this.initializeReporter(server);
        //server.start();

        server.start()
        .then(() =>   this.karma.stopper.stop({port: this.karmaConfig.port}))
        .then(() => EqtTrace.info('KarmaTestFramework: Karma server exited gracefully'));
    }

    public startDiscovery(sources: Array<string>): void {
        this.sources = sources;

        // tslint:disable: no-empty
        this.karma.Karma.getEnv().beforeAll = () => { };
        this.karma.Karma.getEnv().afterAll = () => { };
        // tslint:enable: no-emptys

        this.overrideKarmaExecute(true);

        this.karma.execute([sources[0]]);
        //this.discoveryMode = true;
    }

    private handleReporterEvents(reporterEvent: ReporterEvent, args: any) {
        switch (reporterEvent) {

            case ReporterEvent.BrowserRegister:
                break;

            case ReporterEvent.BrowserError:
                if (args.error === 0 || args.error === null || args.error === 'undefined') {
                    this.handleErrorMessage(args.error, args.error.stack);
                }
                this.handleSuiteDone();
                break;

            case ReporterEvent.BrowserStart:
               // this.handleSpecStarted(args.fullName, args.description, this.sources[0], null);
                break;

            case ReporterEvent.BrowsersChange:
                break;

            case ReporterEvent.BrowsersReady:
                break;

            case ReporterEvent.BrowserComplete:

                break;

            case ReporterEvent.RunStarted:
                this.handleSessionStarted();
                break;

            case ReporterEvent.RunCompleted:
                // this.karma.stopper.stop({
                //     port: this.karmaConfig.port
                // });
                //this.handleSessionDone();
                //EqtTrace.info(`KarmaTestFramework: Run complete, exiting with code: ${args.results.exitCode}`);
                break;
            case ReporterEvent.Error:
                    // this.karma.stopper.stop({
                    //     port: this.karmaConfig.port
                    // });
                    //this.handleSessionDone();
                    //EqtTrace.info(`KarmaTestFramework: Run complete, exiting with code: ${args.results.exitCode}`);
                    break;
        }
    }

    protected skipSpec() {
        this.skipCurrentSpec = true;
    }

    private overrideKarmaExecute(discovery: boolean) {
        const executeSpecHandle = this.karma.Karma.Spec.prototype.execute;
        const skipSpecHandle = function (onComplete: any) {
            this.onStart(this);
            if (!discovery) {
                this.result.status = 'disabled';
            }
            this.resultCallback(this.result);
            if (onComplete) {
                onComplete();
            }
        };

        // tslint:disable-next-line
        const getExecutor = function (fullyQualifiedName: string, testCaseName: string) {
            this.skipCurrentSpec = false;
            this.handleSpecStarted(fullyQualifiedName, testCaseName, this.sources[0]);  // Will eventually call skip if skip is required
            if (discovery || this.skipCurrentSpec === true) {
                return skipSpecHandle;
            } else {
                return executeSpecHandle;
            }
        }.bind(this);

        // tslint:disable-next-line
        this.karma.Karma.Spec.prototype.execute = function (onComplete: any, args: any, executor: any = getExecutor) {
            executor(this.getFullName(), this.description).apply(this, arguments);
        };
    }

    private initializeReporter(server: any) {
        server.on('browser_register', (args) => { this.handleReporterEvents(ReporterEvent.BrowserRegister, args); });
        server.on('browser_error', (args) => { this.handleReporterEvents(ReporterEvent.BrowserError, args); });
        server.on('browser_start', (args) => { this.handleReporterEvents(ReporterEvent.BrowserStart, args); });
        server.on('browser_complete', (args) => { this.handleReporterEvents(ReporterEvent.BrowserComplete, args); });
        server.on('browsers_change', (args) => { this.handleReporterEvents(ReporterEvent.BrowsersChange, args); });
        server.on('browsers_ready', (args) => { this.handleReporterEvents(ReporterEvent.BrowsersReady, args); });
        server.on('run_start', (args) => { this.handleReporterEvents(ReporterEvent.RunStarted, args); });
        server.on('run_complete', (args) => { this.handleReporterEvents(ReporterEvent.RunCompleted, args); });
        server.on('error', (args) => { this.handleReporterEvents(ReporterEvent.Error, args); });
    }
}