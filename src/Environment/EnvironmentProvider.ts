import { IEnvironment } from './IEnvironment';
import { Environment as NodeEnvironment } from './Node/Environment';

export namespace EnvironmentProvider {
    let environment: IEnvironment;

    export function getEnvironmnetBaseDirectory() : string {
        // tslint:disable-next-line
        const isBrowser = this['window'] === this;
        if (isBrowser) {
            return 'Browser';
        } else {
            return 'Node';
        }

    }

    export async function getEnvironmnet() : Promise<IEnvironment> {
        if (!environment) {
            const env = await import('./' + EnvironmentProvider.getEnvironmnetBaseDirectory() + '/Environment');
            environment = new env.Environment();
        }

        return environment;
    }
}