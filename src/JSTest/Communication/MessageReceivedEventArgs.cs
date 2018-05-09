using System;
using System.Collections.Generic;
using System.Text;

namespace JSTest.Communication
{
    public class MessageReceivedEventArgs : EventArgs
    {
        /// <summary>
        /// Gets or sets the data contained in message frame.
        /// </summary>
        public string Data { get; set; }
    }
}
