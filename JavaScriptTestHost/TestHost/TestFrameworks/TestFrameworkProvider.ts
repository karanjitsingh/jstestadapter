import ITestFramework from "./ITestFramework";
import JasmineTestFramework from "./Jasmine/JasmineTestFramework";
import IEnvironment from "../../Environment/IEnvironment";

export enum TestFramework {
    Jasmine
}

export default class TestFrameworkProvider {
    public static GetTestFramework(framework: TestFramework, enviroment: IEnvironment): ITestFramework {
        switch(framework) {
            case TestFramework.Jasmine:
                return new JasmineTestFramework(enviroment);
            default:
                return null;
        }
    }
}