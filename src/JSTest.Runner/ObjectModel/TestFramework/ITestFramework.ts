import { TestCase } from '../Common';
import { EnvironmentType } from '../Common/EnvironmentType';
import { ITestFrameworkEvents, TestFrameworkOptions } from './';

export interface ITestFramework {
    readonly environmentType: EnvironmentType;
    readonly testFrameworkEvents: ITestFrameworkEvents;
    readonly canHandleMultipleSources: boolean;
    readonly supportsJsonOptions: boolean;
    readonly supportsCodeCoverage: boolean;

    initialize(options: TestFrameworkOptions): void;
    startExecutionWithSources(sources: Array<string>, options: JSON): void;
    startExecutionWithTests(sources: Array<string>, tests: Map<string, TestCase>, options: JSON): void;
    startDiscovery(sources: Array<string>): void;
}