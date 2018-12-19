using System;
using System.Collections.Generic;
using System.Text;

namespace JSTest.Interfaces
{
    internal struct ProcessCallbacks
    {
        public Action<object, string> outputReceived;
        public Action<object, string> errorReceived;
        public Action<object> exitReceived;
    }
}
