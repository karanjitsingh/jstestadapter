using System;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using JSTest.Settings;
using Microsoft.VisualStudio.TestPlatform.ObjectModel;
using Microsoft.VisualStudio.TestPlatform.ObjectModel.Host;

namespace JSTest.RuntimeProviders
{
    internal interface IRuntimeProvider
    {
        //bool Shared { get; }

        event EventHandler<HostProviderEventArgs> HostExited;
        event EventHandler<HostProviderEventArgs> HostLaunched;

        Task CleanTestHostAsync(CancellationToken cancellationToken);

        ProcessStartInfo GetRuntimeProcessInfo();

        Task<bool> LaunchTestHostAsync(TestProcessStartInfo testHostStartInfo, CancellationToken cancellationToken);

        void Initialize(JSTestSettings settings);

    }
}
