import {default as IEnvironment, EnvironmentType} from "../IEnvironment"

export default class BrowserEnvironment implements IEnvironment {
    public environmentType: EnvironmentType

    constructor() {
        this.environmentType = EnvironmentType.Browser;
    }
}