using System;
using System.Collections.Generic;
using System.Text;

namespace JSTest
{
    public class JSTestException : Exception
    {
        public JSTestException(String message)
            : base(message)
        {
        }

        public JSTestException(string message, Exception innerException)
            : base(message, innerException)
        {
        }
    }
}
