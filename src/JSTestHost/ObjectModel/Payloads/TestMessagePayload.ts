import { TestMessageLevel } from '../';

export interface TestMessagePayload {
    MessageLevel: TestMessageLevel;
    Message: string;
}