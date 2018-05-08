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
        TestProcessStartInfo GetRuntimeProcessInfo();

        void Initialize(JSTestSettings settings);

    }
}
