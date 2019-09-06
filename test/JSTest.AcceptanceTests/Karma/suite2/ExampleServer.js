//!
//! Copyright (C) Microsoft Corporation.  All rights reserved.
//!
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(() => {
    const PromiseAdaptors = require("./PromiseAdaptors");
    exports.tasks = {
        // This server is used for self test, and used as an example of extending a unit test with an 
        // external server dependency. See 'suite2' in tests for usage example.
        exampleServer: {
            init: function (ctx) {
                (ctx.variables.cleanupTasks || (ctx.variables.cleanupTasks = [])).push("exampleServer.cleanup");
            },
            execute: function (ctx) {
                return __awaiter(this, void 0, void 0, function* () {
                    const server = yield createServer(3000);
                    ctx.logText("Started exampleServer.");
                    ctx.variables.exampleServer = server;
                });
            }
        },
        "exampleServer.cleanup": {
            execute: function (ctx) {
                return __awaiter(this, void 0, void 0, function* () {
                    ctx.logText("Stopping exampleServer.");
                    const server = ctx.variables.exampleServer;
                    if (!server)
                        throw new Error("Server object not found");
                    const cp = new PromiseAdaptors.CallbackPromise();
                    server.close(cp.callback);
                    yield cp.promise;
                    ctx.logText("Stopped exampleServer.");
                });
            }
        },
    };
    function createServer(port) {
        return __awaiter(this, void 0, void 0, function* () {
            const http = require('http');
            const hostname = 'localhost';
            const server = http.createServer((req, res) => {
                const match = req.url.match(/\/name\/(\w+)\//);
                const name = match ? match[1] : "World";
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/plain');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(`Hello ${name}`);
            });
            const np = new PromiseAdaptors.NodePromise();
            server.listen(port, hostname, np.callback);
            yield np.promise;
            return server;
        });
    }
})();
//# sourceMappingURL=ExampleServer.js.map