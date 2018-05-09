namespace JSTest.Communication
{
    using Newtonsoft.Json;
    using Newtonsoft.Json.Linq;

    public class Message
    {
        /// <summary>
        /// Gets or sets the message type.
        /// </summary>
        public string MessageType { get; set; }

        /// <summary>
        /// Gets or sets the payload.
        /// </summary>
        public JToken Payload { get; set; }

        /// <summary>
        /// To string implementation.
        /// </summary>
        /// <returns> The <see cref="string"/>. </returns>
        public override string ToString()
        {
            return "(" + MessageType + ") -> " + (Payload == null ? "null" : Payload.ToString(Formatting.Indented));
        }

        /// <summary>
        /// Gets or sets the version of the message
        /// </summary>
        public int Version { get; set; }

        public Message(string messageType, JToken payload, int version)
        {
            this.MessageType = messageType;
            this.Payload = payload;
            this.Version = version;
        }

        public Message(string messageType, JToken payload) : base()
        {
            this.MessageType = messageType;
            this.Payload = payload;
        }

        public Message()
        {
            this.Version = Constants.MessageProtocolVersion;
        }

    }
}