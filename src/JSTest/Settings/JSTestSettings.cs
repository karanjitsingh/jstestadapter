using System;
using System.Collections.Generic;
using System.Text;

namespace JSTest.Settings
{
    public class JSTestSettings
    {
        public JavaScriptRuntime Runtime { get; set; }
        public JSTestFramework TestFramework { get; set; }
        public bool Discovery { get; set; }
        public bool Parallel { get; set; }

        // Copy constructor
        public JSTestSettings(JSTestSettings settings)      
        {
            this.Runtime = settings.Runtime;
            this.TestFramework = settings.TestFramework;
        }

        public JSTestSettings()
        {
            JSTestSettings.SetDefaultSettings(this);
        }

        public static void SetDefaultSettings(JSTestSettings settings)
        {
            settings.Runtime = JavaScriptRuntime.NodeJS;
            settings.TestFramework = JSTestFramework.Jasmine;
            settings.Discovery = false;
            settings.Parallel = true;
        }
    }
}
