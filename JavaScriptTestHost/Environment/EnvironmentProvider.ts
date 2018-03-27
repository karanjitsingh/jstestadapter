import IEnvironment from "./IEnvironment";
import Node from "./Node/Environment";

export default class EnvironmentProvider {
    private static environment: IEnvironment;

    private static GetFolderString() : string {
        const isBrowser = this["window"] === this;
        if(isBrowser) {
            return "Browser";
        }
        else {
            return "Node";
        }

    }
    
    public static async GetEnvironment() : Promise<IEnvironment> {
        if(! this.environment) {
            const module = await import("./" + this.GetFolderString() + "/Environment");
            this.environment = new module.default();
        }

        return this.environment;
    }
}