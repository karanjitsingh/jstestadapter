var path = require('path');
var fs = require('fs');
var os = require('os');
var builder = require('xmlbuilder');
var KarmaCallbacks = require('./KarmaCallbacks');
var TestOutcome = require('../../../ObjectModel/Common');

var KarmaReporter = function(baseReporterDecorator, config, emitter, logger, helper, formatError) {
    var outputFile = config.outputFile;
    var shortTestName = !!config.shortTestName;
    var discovery = !!config.discovery;
    var configFilePath = config.configFilePath;

    var log = logger.create('reporter.karma');
    var hostName = require('os').hostname();
    var browsers = {};
    var testRun;
    var resultSummary;
    var counters;
    var testDefinitions;
    var testListIdNotInAList;
    var testEntries;
    var results;
    var times;

    var karmaCallbacks = KarmaReporter.karmaCallbacks;

    baseReporterDecorator(this);

    var getTimestamp = function() {
        // todo: use local time ?
        return (new Date()).toISOString().substr(0, 19);
    };

    var s4 = function() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    };

    var newGuid = function() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    };

    var formatDuration = function(duration) {
        duration = duration | 0;
        var ms = duration % 1000;
        duration -= ms;
        var s = (duration / 1000) % 60;
        duration -= s * 1000;
        var m = (duration / 60000) % 60;
        duration -= m * 60000;
        var h = (duration / 3600000) % 24;
        duration -= h * 3600000;
        var d = duration / 86400000;

        return (d > 0 ? d + '.' : '') +
            (h < 10 ? '0' + h : h) + ':' +
            (m < 10 ? '0' + m : m) + ':' +
            (s < 10 ? '0' + s : s) + '.' +
            (ms < 10 ? '00' + ms : ms < 100 ? '0' + ms : ms);
    };

    this.getBrowser = function(browser) {
        var b = browsers[browser.id];

        if (b) {
            return b;
        }

        var newRecord = {
            browser: browser,
            logs: []
        };

        browsers[browser.id] = newRecord;
        return newRecord;
    };

    this.clear = function() {
       browsers = {};
    };

    this.onRunStart = function() {
        var userName = process.env.USERNAME || process.env.USER;
        var runStartTimestamp = getTimestamp();

        testRun = builder.create("TestRun", {version: '1.0', encoding: 'UTF-8'})
            .att('id', newGuid())
            .att('name', userName + '@' + hostName + ' ' + runStartTimestamp)
            .att('runUser', userName)
            .att('xmlns', 'http://microsoft.com/schemas/VisualStudio/TeamTest/2010');

        testRun.ele('TestSettings')
            .att('name', 'Karma Test Run')
            .att('id', newGuid());

        times = testRun.ele('Times')
        times.att('creation', runStartTimestamp)
        times.att('queuing', runStartTimestamp)
        times.att('start', runStartTimestamp);

        resultSummary = testRun.ele('ResultSummary');
        counters = resultSummary.ele('Counters');
        testDefinitions = testRun.ele('TestDefinitions');

        testListIdNotInAList = "8c84fa94-04c1-424b-9868-57a2d4851a1d";
        var testLists = testRun.ele('TestLists');

        testLists.ele('TestList')
            .att('name', 'Results Not in a List')
            .att('id', testListIdNotInAList);

        // seems to be VS is expecting that exact id
        testLists.ele('TestList')
            .att('name', 'All Loaded Results')
            .att('id', "19431567-8539-422a-85d7-44ee4e166bda");

        testEntries = testRun.ele('TestEntries');
        results = testRun.ele('Results');
    };

    this.onRunComplete = function(browsers, summary) {
        times.att('finish', getTimestamp());
        var xmlToOutput = testRun;

        helper.mkdirIfNotExists(path.dirname(outputFile), function () {
            fs.writeFile(outputFile, xmlToOutput.end({pretty: true}), function (err) {
                if (err) {
                    log.warn('Cannot write TRX testRun\n\t' + err.message);
                } else {
                    log.debug('TRX results written to "%s".', outputFile);
                }
            });
        });

        this.clear();
        karmaCallbacks.handleKarmaRunComplete();
    };

    this.onBrowserStart = function(browser) {
        this.getBrowser(browser).logs = [];
    };

    this.onBrowserError = function(browser, error) {
        this.getBrowser(browser).logs.push(error);
    };

    this.onBrowserLog = function(browser, log, type) {
        this.getBrowser(browser).logs.push(log);
    };

    this.onBrowserComplete = function(browser) {
        var result = browser.lastResult;

        //Start - Modified for PowerApps - Handle catastrophic failures
        const executed = result.total - result.skipped;
        const failed = executed - result.success;
        const error = result.error || failed > 0 || result.failed > 0;
        resultSummary.att('outcome', error ? 'Failed' : 'Passed');

        if (error && result.failed === 0) {
            var outputElement = resultSummary.ele('Output');
            const browserLogs = this.getBrowser(browser).logs;
            var logMessage = "";
            browserLogs.forEach(function (log) {
                logMessage += log + "\n";
            });
            outputElement.ele('StdOut').dat("\n" + logMessage + "        ");
            outputElement.ele('ErrorInfo').ele('Message', logMessage);

            const failedResult = Object.assign({}, result);
            failedResult.success = false;
            failedResult.suite = ["Catastrophic Failure"];
            failedResult.log = browserLogs;
            this.specFailure(browser, failedResult);
        }
        //End - Modified for PowerApps

        // todo: checkout if all theses numbers map well
        counters.att('total', result.total)
            .att('executed', executed)
            .att('passed', result.success)
            .att('error', error ? 1 : 0)
            .att('failed', failed);

        // possible useful info:
        // todo: result.disconnected => this seems to happen occasionally? => Possibly handle it!
        // (result.netTime || 0) / 1000)
    };

    this.specSuccess = this.specSkipped = this.specFailure = function (browser, result) {
        var unitTestId = newGuid();
        var className = result.suite.join('.');
        var unitTestName = shortTestName
            ? className + ': ' + result.description
            : className + ': ' + result.description + ' [' + browser.name + ']';
        var codeBase = unitTestName;

        var unitTest = testDefinitions.ele('UnitTest')
            .att('name', unitTestName)
            .att('id', unitTestId);
        var executionId = newGuid();
        unitTest.ele('Execution')
            .att('id', executionId);
        unitTest.ele('TestMethod')
            .att('codeBase', codeBase)
            .att('name', unitTestName)
            .att('className', className);

        testEntries.ele('TestEntry')
            .att('testId', unitTestId)
            .att('executionId', executionId)
            .att('testListId', testListIdNotInAList);

        var unitTestResult = results.ele('UnitTestResult')
            .att('executionId', executionId)
            .att('testId', unitTestId)
            .att('testName', unitTestName)
            .att('computerName', hostName)
            .att('duration', formatDuration(result.time || 0))
            .att('startTime', getTimestamp())
            .att('endTime', getTimestamp())
            // todo: are there other test types?
            .att('testType', '13cdc9d9-ddb5-4fa4-a97d-d965ccfc6d4b') // that guid seems to represent 'unit test'
            .att('outcome', result.skipped ? 'Skipped' : (result.success ? 'Passed' : 'Failed'))
            .att('testListId', testListIdNotInAList);

        if (result.resultFiles && result.resultFiles.length > 0) {
            var resultFilesElement = unitTestResult.ele('ResultFiles');
            for (var resultFile of result.resultFiles) {
                resultFilesElement.ele('ResultFile').att('path', resultFile);
            }
        }

        if (!result.success) {
            var logMessage = "";
            this.getBrowser(browser).logs.forEach(function (log) {
                logMessage += log + "\n";
            });

            var errorMessage = "";
            result.log.forEach(function (log) {
                errorMessage += formatError(log, '\t') + "\n";
            });

            var outputElement = unitTestResult.ele('Output');
            outputElement.ele('StdOut').dat("\n" + logMessage + "        ");
            outputElement.ele('ErrorInfo').ele('Message', errorMessage);
        }

        // Handling Karma Test Discovery Reporting
        var outcome = TestOutcome.None;
        outcome = result.skipped ? "Skipped" : (result.success ? "Passed" : "Failed");

        var specName = result.suite.slice();
        specName.push(result.description);
        specName = specName.join(':');

       var failedExpectations = [];

       if (!result.log) {
        result.log = [];
       }

       for (let i = 0; i < result.log.length; i++) {
           const expectation = result.log[i];

           var failedExpectation = {
               Message: result.assertionErrors[i].message,
               StackTrace: formatError(expectation)
           };
           failedExpectations.push(failedExpectation);
       }

        var startTime =  result.startTime;
        var endTime =  result.endTime;

        if (discovery) {
            karmaCallbacks.handleSpecFound(specName,
                                           unitTestName,
                                           configFilePath,
                                           undefined,
                                           codeBase,
                                           undefined);
        } else {
            karmaCallbacks.handleSpecResult(specName,
                                            unitTestName,
                                            configFilePath,
                                            outcome,
                                            failedExpectations, //failedExpectations,
                                            new Date(startTime),
                                            new Date(endTime),
                                            codeBase,
                                            undefined); //attachmentId
        }

        this.getBrowser(browser).logs = [];
    };

    this.clear();
};

KarmaReporter.$inject = ['baseReporterDecorator', 'config.karmaReporter', 'emitter', 'logger', 'helper', 'formatError'];

// PUBLISH DI MODULE
module.exports = {
    'reporter:karma': ['type', KarmaReporter],
    initializeKarmaReporter: function(callbacks) {
        KarmaReporter.karmaCallbacks = callbacks;
        return callbacks;
    }
};