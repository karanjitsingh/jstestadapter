import { EnvironmentType } from '../Common/EnvironmentType';
import { ITestFrameworkEvents } from './ITestFrameworkEvents';
import { TestCase } from '../Common';

export interface ITestFramework {
    readonly executorUri: string;
    readonly environmentType: EnvironmentType;
    readonly testFrameworkEvents: ITestFrameworkEvents;

    startExecutionWithSource(source: string): void;
    startExecutionWithTests(source: string, tests: Map<string, TestCase>): void;
    startDiscovery(source: string): void;
}