import { TestCase, IEventArgs } from '../Common';

export interface TestsDiscoveredEventArgs extends IEventArgs {
    DiscoveredTests: Array<TestCase>;
    TotalTestsDiscovered: number;
}