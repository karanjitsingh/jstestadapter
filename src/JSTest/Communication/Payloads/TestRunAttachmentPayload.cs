using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.VisualStudio.TestPlatform.ObjectModel;

namespace JSTest.Communication.Payloads
{
    [Serializable]
    public class TestRunAttachmentPayload : EventArgs
    {
        public IList<AttachmentSet> Attachments;
    }
}
