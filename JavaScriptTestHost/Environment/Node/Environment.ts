
import {default as IEnvironment, EnvironmentType} from "../IEnvironment"
import CommunicationManager from "./CommunicationManager"

export default class NodeEnvironment implements IEnvironment {
    public readonly environmentType: EnvironmentType = EnvironmentType.NodeJS;
    public argv: Array<string>;

    constructor() {
        this.argv = <Array<string>>process.argv;
    }

    public GetCommunicationManager(): CommunicationManager {
        return new CommunicationManager();
    }
}