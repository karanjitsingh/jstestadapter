import { IEnvironment } from './IEnvironment';
import { Environment as NodeEnvironment } from './Node/Environment';

export class EnvironmentProvider {

    protected isBrowser() : boolean {
        // tslint:disable:no-string-literal
        return (function() {
            return this !== undefined && this['window'] === this;
        })();
        // tslint:enable
    }

    protected getEnvironmentBaseDirectory() : string {
        const isBrowser = this.isBrowser();

        if (isBrowser) {
            return 'Browser';
        } else {
            return 'Node';
        }
    }

    public async getEnvironment() : Promise<IEnvironment> {
        const env = await import('./' + this.getEnvironmentBaseDirectory() + '/Environment');
        return new env.Environment();
    }
}