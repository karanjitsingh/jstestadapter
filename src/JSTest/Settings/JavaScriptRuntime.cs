using System;
using System.Collections.Generic;
using System.Text;
using System.Xml.Serialization;

namespace JSTest.Settings
{
    public enum JavaScriptRuntime
    {
        [XmlEnum(Constants.JavaScriptRuntimeStrings.NodeJS)]
        NodeJS
    }
}
