import { IEnvironment } from './Environment/IEnvironment';
import { EnvironmentProvider } from './Environment/EnvironmentProvider';
import { TestHost } from './TestHost/TestHost';

const environmentProvider = new EnvironmentProvider();

environmentProvider.getEnvironment().then((env: IEnvironment) => {
    try {
        const testHost = new TestHost(env);
    } catch (err) {
        console.error(err, err.stack);
    }
}, (err) => {
    console.error(err, err.stack);
});
