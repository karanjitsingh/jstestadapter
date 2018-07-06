using System;
using System.Xml;
using Microsoft.VisualStudio.TestPlatform.ObjectModel;
using Microsoft.VisualStudio.TestPlatform.ObjectModel.Adapter;
using System.Xml.Serialization;
using JSTest.Settings;
using JSTest.TestAdapter;
using System.Diagnostics;
using System.Xml.Linq;
using System.Linq;
using System.Collections;
using System.Collections.Generic;
using System.Reflection;

namespace JSTest.TestAdapter
{
    [SettingsName(AdapterConstants.SettingsName)]
    public class JavaScriptSettingsProvider : ISettingsProvider
    {
        protected readonly XmlSerializer serializer;

        public const string Name = AdapterConstants.SettingsName;

        // Locally remmember settings
        public JSTestSettings Settings { get; private set; }

        public JavaScriptSettingsProvider()
        {
            this.Settings = new JSTestSettings();
            this.serializer = new XmlSerializer(typeof(JSTestSettings));
        }

        public void Load(XmlReader reader)
        {
            ValidateArg.NotNull(reader, "reader");

            var serializer = new XmlSerializer(typeof(JSTestSettings), new XmlRootAttribute(AdapterConstants.SettingsName));

            if (reader.Read() && reader.Name.Equals(AdapterConstants.SettingsName))
            {
                var x = serializer.Deserialize(reader);
                this.Settings = x as JSTestSettings;
                //var other = xml.Descendants().Where(attr => !attr.Name.ToString().Equals(AdapterConstants.RunSettingsXml.TestFrameworkOptions, StringComparison.OrdinalIgnoreCase));
            }
        }

    }
}
