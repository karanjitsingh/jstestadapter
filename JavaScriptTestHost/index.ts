import {IEnvironment, ISocket, EnvironmentProvider} from "./Environment";
import TestHost from "./TestHost";

let testHost: TestHost;

EnvironmentProvider.GetEnvironment().then((env: IEnvironment) => {
    let testhost = new TestHost(env);
    testhost.setupCommunication();
});