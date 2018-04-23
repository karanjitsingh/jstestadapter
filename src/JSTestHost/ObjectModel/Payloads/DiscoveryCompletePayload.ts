import { TestCase } from '../Common/TestCase';
import { ISerializable } from '../../Utils/ISerializable';

export interface DiscoveryCompletePayload {
    TotalTests: number;
    LastDiscoveredTests: Array<TestCase>;
    IsAborted: boolean;
    Metrics: {[id: string]: ISerializable};
}