using Microsoft.VisualStudio.TestPlatform.ObjectModel;
using Newtonsoft.Json.Linq;
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
        public bool DebugLogs { get; set; }

        #endregion

        #region JS Runner Specific Settings

        [XmlIgnore]
        [DataMember]
        public JSTestFramework JavaScriptTestFramework { get; set; }

        [XmlElement("TestFramework")]
        public string JavaScriptTestFrameworkAsString
        {
            get
            {
                switch (this.JavaScriptTestFramework)
                {
                    case JSTestFramework.Jasmine:
                        return Constants.TestFrameworkStrings.Jasmine;

                    case JSTestFramework.Mocha:
                        return Constants.TestFrameworkStrings.Mocha;

                    case JSTestFramework.Jest:
                        return Constants.TestFrameworkStrings.Jest;
                }

                return string.Empty;
            }
            set
            {
                switch (value.ToLower())
                {
                    case Constants.TestFrameworkStrings.Jasmine:
                        this.JavaScriptTestFramework = JSTestFramework.Jasmine;
                        break;

                    case Constants.TestFrameworkStrings.Mocha:
                        this.JavaScriptTestFramework = JSTestFramework.Mocha;
                        break;

                    case Constants.TestFrameworkStrings.Jest:
                        this.JavaScriptTestFramework = JSTestFramework.Jest;
                        break;
                }
            }
        }

        [DataMember]
        public string TestFrameworkConfigJson { get; set; }

        #endregion

        public JSTestSettings()
        {
            this.Runtime = JavaScriptRuntime.NodeJS;
            this.JavaScriptTestFramework = JSTestFramework.Jasmine;
            this.Discovery = false;
            this.RunInParallel = true;
            this.DebugLogs = false;
        }
    }
}