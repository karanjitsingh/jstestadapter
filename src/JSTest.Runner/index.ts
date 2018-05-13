import { IEnvironment } from './Environment/IEnvironment';
import { EnvironmentProvider } from './Environment/EnvironmentProvider';
import { TestHost } from './TestHost/TestHost';
import { Exception } from './Exceptions';

const environmentProvider = new EnvironmentProvider();

environmentProvider.getEnvironment().then((env: IEnvironment) => {
    try {
        // tslint:disable-next-line
        new TestHost(env);
    } catch (err) {
        handleError(err);
        env.exit(1);
    }
}, (err) => {
    handleError(err);
});

function handleError(err: any) {
    if (err instanceof Exception) {
        const ex = <Exception> err;
        console.error(`JSTest Runner threw an exception of type ${ex.exceptionName}: ${ex.message}`);
    } else {
        console.error(`JSTest Runner ran into an internal error: ${err.message}`);
    }
}