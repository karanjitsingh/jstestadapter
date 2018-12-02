using System.Xml;
using System.Xml.Serialization;

using JSTest.Settings;

using Microsoft.VisualStudio.TestPlatform.ObjectModel;
using Microsoft.VisualStudio.TestPlatform.ObjectModel.Adapter;

namespace JSTest.TestAdapter
{
    [SettingsName(JSTestAdapterConstants.SettingsName)]
    public class JavaScriptSettingsProvider : ISettingsProvider
    {
        public JSTestSettings Settings { get; private set; }

        public JavaScriptSettingsProvider()
        {
            this.Settings = new JSTestSettings();
        }

        public void Load(XmlReader reader)
        {
            ValidateArg.NotNull(reader, "reader");
            var serializer = new XmlSerializer(typeof(JSTestSettings), new XmlRootAttribute(JSTestAdapterConstants.SettingsName));

            if (reader.Read() && reader.Name.Equals(JSTestAdapterConstants.SettingsName))
            {
                this.Settings = serializer.Deserialize(reader) as JSTestSettings;
            }
        }

        protected static readonly XmlSerializer serializer = new XmlSerializer(typeof(JSTestSettings));
    }
}
