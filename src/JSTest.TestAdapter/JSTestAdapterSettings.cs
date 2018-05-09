//using System;
//using System.Collections.ObjectModel;
//using System.IO;
//using System.Xml;
//using System.Xml.Serialization;
//using Microsoft.VisualStudio.TestPlatform.ObjectModel;

//namespace JSTest.VSAdapter
//{

//    public class JSTestAdapterSettings : TestRunSettings
//    {
//        private static readonly XmlSerializer serializer = new XmlSerializer(typeof(JSTestAdapterSettings));

//        private ChutzpahSettingsFileEnvironments environmentsWrapper = null;

//        public ChutzpahAdapterSettings() : base(AdapterConstants.SettingsName)
//        {
//            MaxDegreeOfParallelism = Environment.ProcessorCount;
//            EnabledTracing = false;
//            ChutzpahSettingsFileEnvironments = new Collection<ChutzpahSettingsFileEnvironment>();
//        }


//        public string JavaScriptRuntime;
//        public string TestFramework;

//        public Collection<ChutzpahSettingsFileEnvironment> ChutzpahSettingsFileEnvironments { get; set; }

//        [XmlIgnore]
//        public ChutzpahSettingsFileEnvironments ChutzpahSettingsFileEnvironmentsWrapper
//        {
//            get
//            {
//                if (environmentsWrapper == null)
//                {
//                    environmentsWrapper = new ChutzpahSettingsFileEnvironments(ChutzpahSettingsFileEnvironments);
//                }

//                return environmentsWrapper;
//            }
//        }

//        public override XmlElement ToXml()
//        {
//            var stringWriter = new StringWriter();
//            serializer.Serialize(stringWriter, this);
//            var xml = stringWriter.ToString();
//            var document = new XmlDocument();
//            document.LoadXml(xml);
//            return document.DocumentElement;
//        }

//    }
//}