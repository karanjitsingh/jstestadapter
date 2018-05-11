using System;
using System.Collections.Generic;
using System.Runtime.Serialization;
using System.Text;
using System.Xml.Serialization;

namespace JSTest.Settings
{

    [DataContract]
    public class JSTestSettings
    {
        #region Adapter Specific Settings

        public JavaScriptRuntime Runtime { get; set; }

        public bool Discovery { get; set; }

        public bool RunInParallel { get; set; }

        #endregion

        #region JS Runner Specific Settings
        
        [DataMember]
        public JSTestFramework JavaScriptTestFramework { get; set; }

        [XmlIgnore]
        [DataMember]
        public IDictionary<string, string> TestFrameworkOptions { get; set; }

        #endregion
        
        public JSTestSettings()
        {
            this.Runtime = JavaScriptRuntime.NodeJS;
            this.JavaScriptTestFramework = JSTestFramework.Jasmine;
            this.Discovery = false;
            this.RunInParallel = true;
        }
    }
}
