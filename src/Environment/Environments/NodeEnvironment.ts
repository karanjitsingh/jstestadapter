import {default as IEnvironment, EnvironmentType} from "../IEnvironment"

export default class NodeEnvironment implements IEnvironment {
    public environmentType: EnvironmentType;

    constructor() {
        this.environmentType = EnvironmentType.NodeJS;
    }
}