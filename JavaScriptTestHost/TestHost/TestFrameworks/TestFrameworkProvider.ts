import ITestFramework from "./ITestFramework";
import JasmineTestFramework from "./Jasmine/JasmineTestFramework";
import IEnvironment from "../../Environment/IEnvironment";
import MochaTestFramework from "./Mocha/MochaTestFramework";

export enum TestFramework {
    Jasmine,
    Mocha
}

export default class TestFrameworkProvider {
    public static GetTestFramework(framework: TestFramework, enviroment: IEnvironment): ITestFramework {
        switch(framework) {
            case TestFramework.Jasmine:
                return new JasmineTestFramework(enviroment);
            case TestFramework.Mocha:
                return new MochaTestFramework(enviroment);
            default:
                return null;
        }
    }
}