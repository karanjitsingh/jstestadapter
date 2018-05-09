using System;
using System.Collections.Generic;
using System.Runtime.Serialization;
using System.Text;

namespace JSTest.Settings
{
    [DataContract]
    public class JSTestSettings
    {
        public JavaScriptRuntime Runtime { get; set; }
        public JSTestFramework JSTestFramework { get; set; }

        [DataMember]
        private string TestFramework
        {
            get
            {
                switch(this.JSTestFramework)
                {
                    case JSTestFramework.Jasmine:
                        return Constants.TestFrameworkStrings.Jasmine;
                    case JSTestFramework.Mocha:
                        return Constants.TestFrameworkStrings.Mocha;
                    case JSTestFramework.Jest:
                        return Constants.TestFrameworkStrings.Jest;
                    default:
                        return string.Empty;
                }
            }
        }

        [DataMember]
        public bool Discovery { get; set; }

        [DataMember]
        public bool Parallel { get; set; }

        // Copy constructor
        public JSTestSettings(JSTestSettings settings)      
        {
            this.Runtime = settings.Runtime;
            this.JSTestFramework = settings.JSTestFramework;
        }

        public JSTestSettings()
        {
            JSTestSettings.SetDefaultSettings(this);
        }

        public static void SetDefaultSettings(JSTestSettings settings)
        {
            settings.Runtime = JavaScriptRuntime.NodeJS;
            settings.JSTestFramework = JSTestFramework.Jasmine;
            settings.Discovery = false;
            settings.Parallel = true;
        }
    }
}
