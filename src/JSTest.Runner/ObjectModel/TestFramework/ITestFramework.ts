import { EnvironmentType } from '../Common/EnvironmentType';
import { ITestFrameworkEvents } from './ITestFrameworkEvents';
import { TestCase } from '../Common';

export interface ITestFramework {
    readonly executorUri: string;
    readonly environmentType: EnvironmentType;
    readonly testFrameworkEvents: ITestFrameworkEvents;
    readonly canHandleMultipleSources: boolean;
    readonly supportsJsonOptions: boolean;

    initialize(): void;
    startExecutionWithSources(sources: Array<string>, options: JSON): void;
    startExecutionWithTests(sources: Array<string>, tests: Map<string, TestCase>, options: JSON): void;
    startDiscovery(sources: Array<string>): void;
}