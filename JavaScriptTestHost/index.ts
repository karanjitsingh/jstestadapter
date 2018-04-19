import {IEnvironment, EnvironmentProvider} from './Environment';
import { TestHost } from './TestHost/TestHost';

EnvironmentProvider.getEnvironmnet().then((env: IEnvironment) => {
    try {
        const testHost = new TestHost(env);
    } catch (err) {
        console.error(err, err.stack);
    }
}, (err) => {
    console.error(err, err.stack);
});
