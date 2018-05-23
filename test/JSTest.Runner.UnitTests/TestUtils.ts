import * as Assert from 'assert';

export namespace TestUtils {
    export function assertDeepEqual(x: any, y: any): boolean {
        try { 
            Assert.deepEqual(x, y);
            return true;
        } catch (e) {
            return false;
        }
    }
}