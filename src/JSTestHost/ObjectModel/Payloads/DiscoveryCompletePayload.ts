import { TestCase } from '../Common';
import { ISerializable } from '../../Utils/ISerializable';

export interface DiscoveryCompletePayload {
    TotalTests: number;
    LastDiscoveredTests: Array<TestCase>;
    IsAborted: boolean;
    Metrics: {[id: string]: ISerializable};
}