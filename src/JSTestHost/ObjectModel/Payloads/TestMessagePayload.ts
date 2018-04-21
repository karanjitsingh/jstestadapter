import { TestMessageLevel } from '../TestMessageLevel';

export interface TestMessagePayload {
    MessageLevel: TestMessageLevel;
    Message: string;
}