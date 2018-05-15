import { JestCallbacks } from './JestCallbacks';

export class JestReporter {
    private static callbacks: JestCallbacks;

    public static INITIALIZE_REPORTER(callbacks: JestCallbacks) {
        this.callbacks = callbacks;
    }

    public onRunComplete = (contexts: Set<Context>, results: AggregatedResult) {
        JestReporter.callbacks.handleSessionDone();
    }

    public onRunStart = (results: AggregatedResult, options: ReporterOnStartOptions) => {
        JestReporter.callbacks.handleSessionStarted();
        JestReporter.callbacks.handleSpecStarted(args.fullTitle(), args.title, args.file, args);
        return;
    }

    public onTestStart = (test: Test): Promise<void> => {
        return;
    }

    public onTestResult = (test: Test, testResult: TestResult, aggregatedResult: AggregatedResult) => {
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

        JestReporter.callbacks.handleSpecDone(outcome, failedExpectations);

    }
}