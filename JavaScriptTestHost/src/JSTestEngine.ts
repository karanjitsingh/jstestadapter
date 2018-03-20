import TestRunner from "./TestRunner"
import EnvironmentProvider from "./Environment/EnvironmentProvider"
import IEnvironment from "./Environment/IEnvironment"

const environment:IEnvironment = EnvironmentProvider.GetEnvironment();

//connect to socket
// use IEnvironment

//listen to commands
// use interface provided by IEnvironment

//hook socket events to discover and run tests


let testRunner: TestRunner;

function discover() {
    testRunner.DiscoverTests();
}

function execute() {
    testRunner.ExecuteTests();
}