import {IEnvironment, EnvironmentProvider} from "./Environment";
import TestHost from "./TestHost";
import { Environment } from "./global";

let testHost: TestHost;

EnvironmentProvider.GetEnvironment().then((env: IEnvironment) => {
    try {
        Environment = env;
        let testhost = new TestHost(env);
        testhost.setupCommunication();
    }
    catch(err) {
        console.error(err);
    }
}, (err) => {
    console.error(err);
});
