import {IEnvironment, EnvironmentProvider} from "./Environment";
import { default as TestHost } from "./TestHost/TestHost"

let testHost: TestHost;

EnvironmentProvider.GetEnvironment().then((env: IEnvironment) => {
    try {
        let testhost = new TestHost(env);
    }
    catch(err) {
        var e:Error = <Error>err;
        console.error(err, err.stack);
    }
}, (err) => {
    console.error(err);
});
