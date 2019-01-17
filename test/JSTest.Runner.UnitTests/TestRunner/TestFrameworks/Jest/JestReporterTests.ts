import { JestCallbacks } from '../../../../../src/JSTest.Runner/TestRunner/TestFrameworks/Jest/JestCallbacks';
import { TestUtils } from '../../../TestUtils';
import { } from '../../../../../src/JSTest.Runner/TestRunner/TestFrameworks/Jest/JestReporter';
import * as Assert from 'assert';
import { TestOutcome } from '../../../../../src/JSTest.Runner/ObjectModel/Common';

describe('JestReporter suite', () => {
    const logger = new TestUtils.MockDebugLogger();
    // tslint:disable-next-line:no-require-imports
    const jestReporter = require('../../../../../src/JSTest.Runner/TestRunner/TestFrameworks/Jest/JestReporter');

    it('onRunComplete will call handleRunComplete', (done) => {
        jestReporter.INITIALIZE_REPORTER({
            handleJestRunComplete: () => {
                done();
            }
        });
        
        const reporter = new jestReporter();
        reporter.onRunComplete();
    });

    it('JestReporter will handle error message', (done) => {
        jestReporter.INITIALIZE_REPORTER({
            handleErrorMessage: (msg) => {
                Assert.equal(msg, 'failure');
                done();
            }
        });
        
        const reporter = new jestReporter();
        reporter.onTestResult(null, {
            testResults: [],
            failureMessage: 'failure',
            perfStats: {
                start: null
            }
        });
    });

    it('JestReporter will call handleSpecFound', (done) => {
        jestReporter.INITIALIZE_REPORTER({
            handleSpecFound: (fullName, resultTitle, configFile, _, fqnPostFix) => {
                Assert.equal(fullName, 'fullname');
                Assert.equal(resultTitle, 'suite 1 > suite 2 > title');
                Assert.equal(configFile, 'D:\\a\\b\\package.json');
                Assert.equal(fqnPostFix, '::fullname::c\\somepath');
                done();
            }
        });
        jestReporter.UPDATE_CONFIG('D:\\a\\b\\package.json');
        jestReporter.discovery = true;
        
        const reporter = new jestReporter();
        reporter.onTestResult(
            {
                path: 'D:\\a\\b\\c\\somepath'
            },
            {
                testResults: [
                    {
                        status: 'passed',
                        title: 'title',
                        ancestorTitles: ['suite 1', 'suite 2'],
                        fullName: 'fullname'
                    }
                ],
                failureMessage: 'failure',
                perfStats: {
                    start: new Date()
                }
            }
        );
    });
    
    it('JestReporter will call handleSpecResult', (done) => {
        let specResult = 0;

        jestReporter.INITIALIZE_REPORTER({
            handleSpecResult: (fullName, title, config, outcome, failures, start, end, postfix) => {
                specResult++;

                switch (specResult) {
                    case 1:
                        Assert.equal(fullName, 'fullname');
                        Assert.equal(title, 'suite 1 > suite 2 > title');
                        Assert.equal(config, 'D:\\a\\b\\package.json');
                        Assert.equal(outcome, TestOutcome.Passed);
                        Assert.deepEqual(failures, []);
                        Assert.equal(start.getTime(), new Date(startTime).getTime());
                        Assert.equal(end.getTime(), new Date(startTime + 1000).getTime());
                        Assert.equal(postfix, '::fullname::c\\somepath');
                        break;

                    case 2:
                        Assert.equal(outcome, TestOutcome.Failed);
                        Assert.deepEqual(failures, [
                                {
                                    Message: 'line 1\nline2',
                                    StackTrace: ' at \n at '
                                },
                                {
                                    Message: 'line 1\nline2',
                                    StackTrace: ' at \n at '
                                }
                            ]);
                        break;
                        
                    case 3:
                        Assert.equal(outcome, TestOutcome.Skipped);
                        Assert.deepEqual(failures, []);
                        
                        done();
                        break;
                }
            }
        });
        jestReporter.UPDATE_CONFIG('D:\\a\\b\\package.json');
        jestReporter.discovery = false;
        
        const startTime = new Date().getTime();

        const reporter = new jestReporter();
        reporter.onTestResult(
            {
                path: 'D:\\a\\b\\c\\somepath'
            }, 
            {
                testResults: [
                    {
                        status: 'passed',
                        failureMessages: [],
                        title: 'title',
                        ancestorTitles: ['suite 1', 'suite 2'],
                        fullName: 'fullname',
                        duration: 1000
                    },
                    {
                        status: 'failed',
                        failureMessages: ['line 1\nline2\n at \n at ', 'line 1\nline2\n at \n at '],
                        title: 'title',
                        ancestorTitles: ['suite 1', 'suite 2'],
                        fullName: 'fullname',
                        duration: 1000
                    },
                    {
                        status: 'pending',
                        failureMessages: [],
                        title: 'title',
                        ancestorTitles: ['suite 1', 'suite 2'],
                        fullName: 'fullname',
                        duration: 1000
                    }
                ],
                failureMessage: 'failure',
                perfStats: {
                    start: startTime
                }
            }
        );
    });
});