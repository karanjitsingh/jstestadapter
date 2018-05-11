using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using System;
using System.Collections.Generic;
using System.Runtime.Serialization;
using System.Text;
using System.Xml.Serialization;

namespace JSTest.Settings
{
    [JsonConverter(typeof(Newtonsoft.Json.Converters.StringEnumConverter))]
    public enum JSTestFramework
    {
        [XmlEnum(Constants.TestFrameworkStrings.Jasmine)]
        Jasmine,

        [XmlEnum(Constants.TestFrameworkStrings.Mocha)]
        Mocha,

        [XmlEnum(Constants.TestFrameworkStrings.Jest)]
        Jest
    }
}
