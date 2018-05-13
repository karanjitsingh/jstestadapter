import { IEnvironment } from './IEnvironment';

export class EnvironmentProvider {

    protected isBrowser() : boolean {
        // this['window'] === this will hold true only for a browser

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