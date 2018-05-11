export class Logger {
    private overrideLogging() {
        ['log', 'warn', 'error'].forEach((method) => {
            // const oldMethod = console[method].bind(console);
            // tslint:disable-next-line
            console[method] = function() {
                // oldMethod.apply(
                //     console,
                //     [new Date().toISOString()].concat(arguments)
                // );
                this.logMessage(method, arguments);
            }.bind(this);
        });

        // tslint:disable-next-line
        console.debug = this.debugMessage;
    }
}