import { TestCase } from '../TestCase';
import { IEventArgs } from 'Events/Event';

export interface TestsDiscoveredEventArgs extends IEventArgs {
    DiscoveredTests: Array<TestCase>;
    TotalTestsDiscovered: number;
}
