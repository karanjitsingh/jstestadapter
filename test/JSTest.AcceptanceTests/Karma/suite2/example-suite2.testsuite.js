//const base = require("./BaseConfig");

module.exports = function(config) {
    config.set({
        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: ".",

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ["qunit"],

        // ScriptTestOrchestrator dependencies:
        ScriptTestOrchestrator: {
            dependencies: [ "exampleServer" ],
            modules: [ "./ExampleServer.js" ]
        },

        // list of files / patterns to load in the browser
        files: [
            "suite2.js"
        ]
    });
}