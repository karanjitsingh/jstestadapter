//!
//! Copyright (C) Microsoft Corporation.  All rights reserved.
//!

(() => {
    const PromiseAdaptors = require(".\PromiseAdaptors");

    exports.tasks = {
        // This server is used for self test, and used as an example of extending a unit test with an
        // external server dependency. See 'suite2' in tests for usage example.
        exampleServer: {
            init: function (ctx) {
                (ctx.variables.cleanupTasks || (ctx.variables.cleanupTasks = [])).push("exampleServer.cleanup");
            },
            execute: async function (ctx) {
                const server = await createServer(3000);

                ctx.logText("Started exampleServer.");
                ctx.variables.exampleServer = server;
            }
        },

        "exampleServer.cleanup": {
            execute: async function (ctx): Promise<void> {
                ctx.logText("Stopping exampleServer.");

                const server = ctx.variables.exampleServer;
                if (!server)
                    throw new Error("Server object not found");

                const cp = new PromiseAdaptors.CallbackPromise();
                server.close(cp.callback);
                await cp.promise;

                ctx.logText("Stopped exampleServer.");
            }
        },
    }

    async function createServer(port: number): Promise<any> {
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
        await np.promise;

        return server;
    }
})();
