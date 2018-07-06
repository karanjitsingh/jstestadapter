namespace JSTest.RuntimeProviders
{
    using System.Diagnostics;
    using Microsoft.VisualStudio.TestPlatform.PlatformAbstractions.Interfaces;
    using JSTest.Settings;
    using Microsoft.VisualStudio.TestPlatform.ObjectModel;
    using System.Collections.Generic;

    internal interface IRuntimeProvider
    {
        TestProcessStartInfo GetRuntimeProcessInfo(bool debugEnabled, bool enableDebugLog, IEnumerable<string> sources);
    }
}
