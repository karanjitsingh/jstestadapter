import { FailedExpectation, ITestFrameworkEvents, ITestFramework } from '../../../ObjectModel/TestFramework';
import { EnvironmentType, TestOutcome } from '../../../ObjectModel/Common';
import { Exception, ExceptionType } from '../../../Exceptions';
import { BaseTestFramework } from '../BaseTestFramework';

enum JasmineReporterEvent {
    JasmineStarted,
    JasmineDone,
    SuiteStarted,
    SuiteDone,
    SpecStarted,
    SpecDone
}

export class JasmineTestFramework extends BaseTestFramework implements ITestFramework {
    public readonly executorUri: string = 'executor://JasmineTestAdapter/v1';
    public readonly environmentType: EnvironmentType;
    public readonly canHandleMultipleSources: boolean = false;
    public readonly supportsJsonOptions: boolean = false;

    protected sources: Array<string>;

    private jasmine: any;
    private skipCurrentSpec: boolean = false;

    private getJasmine() {
        switch (this.environmentType) {
            case EnvironmentType.NodeJS:
                // tslint:disable-next-line
                return require('jasmine');
            default:
                throw new Exception('Not implemented.', ExceptionType.NotImplementedException);
        }
    }

    constructor(testFrameworkEvents: ITestFrameworkEvents, environmentType: EnvironmentType) {
        super(testFrameworkEvents);
        this.testFrameworkEvents = testFrameworkEvents;
        this.environmentType = environmentType;
    }

    public initialize() {
        const jasmineLib = this.getJasmine();
        this.jasmine = new jasmineLib();
        
        // Jasmine forces node to close after completion
        // tslint:disable: no-empty
        this.jasmine.exit = () => {};
        this.jasmine.exitCodeCompletion = () => { };
        // tslint:enable: no-empty

        this.initializeReporter();
    }

    public startExecutionWithSource(sources: Array<string>, options: JSON): void {        
        this.sources = sources;
        this.overrideJasmineExecute(false);
        
        this.jasmine.execute([sources[0]]);
    }

    public startDiscovery(sources: Array<string>): void {
        this.sources = sources;

        // tslint:disable: no-empty
        this.jasmine.jasmine.getEnv().beforeAll = () => {};
        this.jasmine.jasmine.getEnv().afterAll = () => {};
        // tslint:enable: no-emptys

        this.overrideJasmineExecute(true);

        this.jasmine.execute([sources[0]]);
    }

    private handleJasmineReporterEvents(reporterEvent: JasmineReporterEvent, args: any) {
        switch (reporterEvent) {
            case JasmineReporterEvent.JasmineStarted:
                this.handleSessionStarted();
                break;

            case JasmineReporterEvent.JasmineDone:
                this.handleSessionDone();
                break;

            case JasmineReporterEvent.SuiteStarted:
                this.handleSuiteStarted(args.description, this.sources[0]);
                break;

            case JasmineReporterEvent.SuiteDone:
                if (args.failedExpectations.length > 0) {
                    this.reportErrorMessage(`Error executing ${this.sources[0]}\n${args.failedExpectations[0].message}\n` +
                                            args.failedExpectations[0].stack);
                }
                this.handleSuiteDone();
                break;

            case JasmineReporterEvent.SpecStarted:
                this.handleSpecStarted(args.fullName, args.description, this.sources[0], null);
                break;

            case JasmineReporterEvent.SpecDone:
                let outcome: TestOutcome = TestOutcome.None;
                const failedExpectations: Array<FailedExpectation> = [];

                if (!args.failedExpectations) {
                    args.failedExpectations = [];
                }

                for (let i = 0; i < args.failedExpectations.length; i++) {
                    const expectation = args.failedExpectations[i];

                    const failedExpectation: FailedExpectation = {
                        Message: expectation.message,
                        StackTrace: expectation.stack
                    };
                    failedExpectations.push(failedExpectation);
                }

                outcome = args.failedExpectations.length ? TestOutcome.Failed : TestOutcome.Passed;

                if (args.status === 'disabled' || this.skipCurrentSpec) {
                    outcome = TestOutcome.Skipped;
                }

                if (args.status === 'failed') {
                    outcome = TestOutcome.Failed;
                }

                this.handleSpecDone(outcome, failedExpectations);
                break;
        }
    }

    protected skipSpec() {
        this.skipCurrentSpec = true;
    }
    
    private overrideJasmineExecute(discovery: boolean) {
        const executeSpecHandle = this.jasmine.jasmine.Spec.prototype.execute;
        const skipSpecHandle = function(onComplete: any) {
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
            this.handleSpecStarted(this.sources[0], fullyQualifiedName, testCaseName);  // Will eventually call skip if skip is required
            if (discovery || this.skipCurrentSpec === true) {
                return skipSpecHandle;
            } else {
                return executeSpecHandle;
            }
        }.bind(this);

        // tslint:disable-next-line
        this.jasmine.jasmine.Spec.prototype.execute = function (onComplete: any, args: any, executor: any = getExecutor) {
            executor(this.getFullName(), this.description).apply(this, arguments);
        };
    }
    
    private initializeReporter() {
        this.jasmine.clearReporters();
        this.jasmine.addReporter({
            jasmineStarted: (args) => { this.handleJasmineReporterEvents(JasmineReporterEvent.JasmineStarted, args); },
            jasmineDone: (args) => { this.handleJasmineReporterEvents(JasmineReporterEvent.JasmineDone, args); },
            suiteStarted: (args) => { this.handleJasmineReporterEvents(JasmineReporterEvent.SuiteStarted, args); },
            suiteDone: (args) => { this.handleJasmineReporterEvents(JasmineReporterEvent.SuiteDone, args); },
            // specStarted: (args) => { this.handleJasmineReporterEvents(JasmineReporterEvent.SpecStarted, args); },
            specDone: (args) => { this.handleJasmineReporterEvents(JasmineReporterEvent.SpecDone, args); }
        });
    }
}