import { exec } from 'child_process';

// tslint:disable

exec("find ./test/JSTestHost.UnitTests | egrep '.*Tests.js$'", (error, stdout, stderr) => {
    startMocha(stdout.trimRight().split("\n"));
});

function startMocha(list) {
    const Mocha = require('mocha');

    const mocha = new Mocha();
    list.forEach(element => {
        mocha.addFile(element);
    });

    mocha.run();
}