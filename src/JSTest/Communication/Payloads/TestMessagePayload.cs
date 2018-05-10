using Microsoft.VisualStudio.TestPlatform.ObjectModel.Logging;
using System;
using System.Collections.Generic;
using System.Text;

namespace JSTest.Communication.Payloads
{
    [Serializable]
    public class TestMessagePayload : EventArgs
    {
        public TestMessageLevel MessageLevel;
        public string Message;
    }
}
