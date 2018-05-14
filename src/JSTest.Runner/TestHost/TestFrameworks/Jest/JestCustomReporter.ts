import jest from 'jest';

export class JestCustomReporter {
    public onTestResult = (test: Test, testResult: TestResult, aggregatedResult: AggregatedResult): Promise<void> => {
        return;
    }
    public onRunStart = (results: AggregatedResult, options: ReporterOnStartOptions): Promise<void> => {
        return;
    }
    public onTestStart = (test: Test): Promise<void> => {
        return;
    }

    public onRunComplete = (contexts: Set<Context>, results: AggregatedResult): Promise<void> => {
        return;
    }
    public getLastError = (): ?Error => {
        return;
    }
}