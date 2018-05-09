using JSTest.Settings;
using JSTest.RuntimeProviders;
using System.Collections.Generic;
using System.Diagnostics;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.VisualStudio.TestPlatform.ObjectModel;

namespace JSTest
{
    public class TestRunner
    {
        private RuntimeManager runtimeManager;

        public TestRunEvents StartExecution(IEnumerable<string> sources, JSTestSettings settings) {

            var processInfo = RuntimeProviderFactory.Instance.GetRuntimeProcessInfo(settings);
            this.runtimeManager = new RuntimeManager(settings);

            var launchTask = Task.Run(() => this.runtimeManager.LaunchProcessAsync(processInfo, new CancellationToken()));
            launchTask.Wait();

            if(!launchTask.Result)
            {
                EqtTrace.Error("TestRunner.StartExecution: Could not start javascript runtime.");
                return null;
            }

            return this.runtimeManager.TestRunEvents;

        }        
    }
}
