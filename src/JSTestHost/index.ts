import { IEnvironment } from './Environment/IEnvironment';
import { EnvironmentProvider } from './Environment/EnvironmentProvider';
import { TestHost } from './TestHost/TestHost';

const environmentProvider = new EnvironmentProvider();

environmentProvider.getEnvironment().then((env: IEnvironment) => {
    try {
        // tslint:disable-next-line
        new TestHost(env);
    } catch (err) {
        console.error('JSTest ran into an internal error while executing: ' + err.message);
        env.exit(1);
    }
}, (err) => {
    console.error('JSTest ran into an internal error while executing: ' + err.message);
});