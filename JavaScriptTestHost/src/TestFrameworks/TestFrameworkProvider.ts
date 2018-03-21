import ITestFramework from "./ITestFramework";
import JasmineTestFramework from "./JasmineTestFramework";

export enum TestFramework {
    Jasmine
}

export default class TestFrameworkProvider {
    public static GetTestFrameWork(framework: TestFramework): ITestFramework {
        switch(framework) {
            case TestFramework.Jasmine:
                return new JasmineTestFramework();
            default:
                return null;
        }
    }
}