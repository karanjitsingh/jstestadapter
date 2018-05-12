import { EnvironmentType } from '../Common/EnvironmentType';
import { ITestFrameworkEvents } from './ITestFrameworkEvents';
import { TestCase } from '../Common';

export interface ITestFramework {
    readonly executorUri: string;
    readonly environmentType: EnvironmentType;
    readonly testFrameworkEvents: ITestFrameworkEvents;

    startExecutionWithSource(source: string, options: JSON): void;
    startExecutionWithTests(source: string, tests: Map<string, TestCase>, options: JSON): void;
    startDiscovery(source: string): void;
}