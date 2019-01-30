using System;
using System.Collections.Generic;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.VisualStudio.TestPlatform.ObjectModel;

namespace JSTest.Interfaces
{
    public interface IRuntimeManager
    {
        int GetProcessId();

        Task CleanProcessAsync();

        Task<bool> LaunchProcessAsync(TestProcessStartInfo runtimeProcessStartInfo, CancellationToken cancellationToken);

        void SendStartExecution(IEnumerable<string> sources);

        void SendStartExecution(IEnumerable<TestCase> tests);

        void SendStartDiscovery(IEnumerable<string> sources);
    }
}
