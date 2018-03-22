
import {default as IEnvironment, EnvironmentType} from "../IEnvironment"
import Socket from "./Socket";

export default class NodeEnvironment implements IEnvironment {
    public readonly environmentType: EnvironmentType;
    public argv: Array<string>;

    constructor() {
        this.environmentType = EnvironmentType.NodeJS;
        this.argv = <Array<string>>process.argv;
    }

    public getSocket(): Socket {
        return new Socket();
    }
}