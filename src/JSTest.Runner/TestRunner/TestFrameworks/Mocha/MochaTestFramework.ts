import { FailedExpectation, ITestFrameworkEvents } from '../../../ObjectModel/TestFramework';
import { EnvironmentType, TestOutcome } from '../../../ObjectModel/Common';
import { Exception, ExceptionType } from '../../../Exceptions';
import { BaseTestFramework } from '../BaseTestFramework';

enum ReporterEvent {
    SessionStarted,
    SessionDone,
    SuiteStarted,
    SuiteDone,
    SpecStarted,
    SpecDone,
    SessionError
}

export class MochaTestFramework extends BaseTestFramework {
    public readonly executorUri: string = 'executor://MochaTestAdapter/v1';
    public readonly environmentType: EnvironmentType;
    public readonly canHandleMultipleSources: boolean = true;
    public readonly supportsJsonOptions: boolean = true;

    protected sources: Array<string>;

    private mochaLib: any;
    private mocha: Mocha;
    private discoveryMode: boolean = false;

    private getMocha() {
        switch (this.environmentType) {
            case EnvironmentType.NodeJS:
            // tslint:disable-next-line
                return require('mocha');
            default:
                throw new Exception('Not implemented.', ExceptionType.NotImplementedException);
        }
    }

    constructor(testFrameworkEvents: ITestFrameworkEvents, envrionmentType: EnvironmentType) {
        super(testFrameworkEvents);
        this.environmentType = envrionmentType;
    }

    public initialize() {
        this.mochaLib = this.getMocha();
    }

    public startExecutionWithSource(sources: Array<string>, options: JSON): void {
        this.sources = sources;

        // tslint:disable-next-line
        options['reporter'] = 'base';
        this.mocha = new this.mochaLib(options);

        this.handleReporterEvents(ReporterEvent.SessionStarted, null);

        sources.forEach(source => {
            this.mocha.addFile(source);
        });

        this.initializeReporter(this.mocha.run());
    }

    public startDiscovery(sources: Array<string>): void {
        // tslint:disable:no-empty
        this.mochaLib.Suite.prototype.beforeAll = () => { };
        this.mochaLib.Suite.prototype.afterAll = () => { };
        this.mochaLib.Suite.prototype.beforeEach = () => { };
        this.mochaLib.Suite.prototype.afterEach = () => { };
        // tslint:enable:no-empty

        this.discoveryMode = true;
        this.startExecutionWithSource(sources, JSON.parse('{ }'));
    }

    protected skipSpec(specObject: any) {
        specObject.pending = true;
    }

    private handleReporterEvents(reporterEvent: ReporterEvent, args: any) {
        switch (reporterEvent) {
            case ReporterEvent.SessionStarted:
                this.handleSessionStarted();
                break;

            case ReporterEvent.SessionDone:
                this.handleSessionDone();
                break;

            case ReporterEvent.SuiteStarted:
                this.handleSuiteStarted(args.title, args.file);
                break;

            case ReporterEvent.SuiteDone:
                this.handleSuiteDone();
                break;

            case ReporterEvent.SpecStarted:
                if (this.discoveryMode) {
                    args.pending = true;
                }
                this.handleSpecStarted(args.fullTitle(), args.title, args.file, args);
                break;

            case ReporterEvent.SpecDone:
                let outcome: TestOutcome = TestOutcome.None;
                const failedExpectations: Array<FailedExpectation> = [];

                if (args.state === 'passed') {
                    outcome = TestOutcome.Passed;
                } else if (args.state === 'failed') {
                    outcome = TestOutcome.Failed;
                    failedExpectations.push(<FailedExpectation> {
                        Message: args.err.message,
                        StackTrace: args.err.stack
                    });
                }

                if (args.pending === true) {
                    outcome = TestOutcome.Skipped;
                }

                this.handleSpecDone(outcome, failedExpectations);

                break;
            
                case ReporterEvent.SessionError:
                    if (args.title === `"before all" hook` || args.title === `"after all" hook`) {
                        this.reportErrorMessage(args.err.message, args.err.stack);
                    }
        }
    }

    private initializeReporter(runner: any) {
        runner.setMaxListeners(20);

        runner.on('suite', (args) => { this.handleReporterEvents(ReporterEvent.SuiteStarted, args); });
        runner.on('suite end', (args) => { this.handleReporterEvents(ReporterEvent.SuiteDone, args); });
        runner.on('test', (args) => { this.handleReporterEvents(ReporterEvent.SpecStarted, args); });
        runner.on('test end', (args) => { this.handleReporterEvents(ReporterEvent.SpecDone, args); });
        runner.on('end', (args) => { this.handleReporterEvents(ReporterEvent.SessionDone, args); });
        runner.on('fail', (args) => { this.handleReporterEvents(ReporterEvent.SessionError, args); });
    }
}