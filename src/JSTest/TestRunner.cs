

namespace JSTest
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Threading;
    using System.Threading.Tasks;

    using JSTest.Interfaces;
    using JSTest.RuntimeProviders;
    using JSTest.Settings;

    using Microsoft.VisualStudio.TestPlatform.ObjectModel;


    public class TestRunner : IDisposable
    {
        private TestRuntimeManager runtimeManager;
        private readonly ManualResetEventSlim executionComplete;
        private readonly TestRunEvents testRunEvents;

        public ITestRunEvents TestRunEvents => this.testRunEvents;

        public TestRunner()
        {
            this.executionComplete = new ManualResetEventSlim(false);
            this.testRunEvents = new TestRunEvents();

            var hostDebug = Environment.GetEnvironmentVariable("JSTEST_HOST_DEBUG");

            if (!string.IsNullOrEmpty(hostDebug) && hostDebug == "1")
            {
                Debugger.Launch();
            }
        }

        private void StartExecution(JSTestSettings settings, IEnumerable<string> sources)
        {
            var processInfo = RuntimeProviderFactory.Instance.GetRuntimeProcessInfo(settings, sources);
            this.runtimeManager = new TestRuntimeManager(settings, this.testRunEvents);
            Task<bool> launchTask = null;
            JSTestException exception = null;

            try
            {
                var launchStopWatch = Stopwatch.StartNew();
                launchTask = Task.Run(() => this.runtimeManager.LaunchProcessAsync(processInfo, new CancellationToken()));
                int launchTimeoutInMilliseconds = GetProcessLaunchTimeout();

                if (!launchTask.Wait(launchTimeoutInMilliseconds))
                {
                    throw new TimeoutException($"Process launch timeout after {launchTimeoutInMilliseconds} ms");
                }
                else
                {
                    launchStopWatch.Stop();
                    Console.WriteLine($"JSTest.TestRunner.StartExecution: Process Launched in {launchStopWatch.ElapsedMilliseconds} ms");
                }
            }
            catch (Exception ex)
            {
                this.testRunEvents.DisableInvoke = true;

                EqtTrace.Error(ex);
                exception = new JSTestException($"JSTest.TestRunner.StartExecution: Could not start javascript runtime : {ex}");
            }
            finally
            {
                if (exception == null && launchTask.Exception != null)
                {
                    EqtTrace.Error(launchTask.Exception);
                    exception = new JSTestException($"JSTest.TestRunner.StartExecution: Could not start javascript runtime. {launchTask.Exception}");
                }
            }

            if (exception != null)
            {
                throw exception;
            }
        }

        private static int GetProcessLaunchTimeout()
        {
            var startTimeoutString = Environment.GetEnvironmentVariable(Constants.VsTestNodeStartTimeout);
            if (!int.TryParse(startTimeoutString, out int startTimeout))
            {
                startTimeout = Constants.DefaultVsTestNodeStartTimeout;
            }

            return RuntimeProviderFactory.Instance.IsRuntimeDebuggingEnabled
                                                ? Constants.VsTestNodeStartInfiniteTimout
                                                : startTimeout;
        }

        public void StartExecution(IEnumerable<string> sources, JSTestSettings settings, CancellationToken? cancellationToken)
        {
            this.StartExecution(settings, sources);
            if (settings.Discovery)
            {
                this.runtimeManager.SendStartDiscovery(sources);
            }
            else
            {
                this.runtimeManager.SendStartExecution(sources);
            }
        }

        public void StartExecution(IEnumerable<TestCase> tests, JSTestSettings settings, CancellationToken? cancellationToken)
        {
            var list = new List<string>();

            foreach (var test in tests)
            {
                if (!string.IsNullOrEmpty(test.Source))
                {
                    list.Add(test.Source);
                }
            }

            this.StartExecution(settings, list);
            this.runtimeManager.SendStartExecution(tests);
        }

        public void Dispose()
        {
            this.runtimeManager.CleanProcessAsync().Wait();
        }
    }
}
