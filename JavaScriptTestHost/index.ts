import {IEnvironment, EnvironmentProvider} from "./Environment";
import { TestHost } from "./TestHost"

let testHost: TestHost;

EnvironmentProvider.GetEnvironment().then((env: IEnvironment) => {
    // try {
        let testhost = new TestHost(env);
        testhost.setupCommunication();
    // }
    // catch(err) {
    //     console.error(err);
    // }
}, (err) => {
    console.error(err);
});
