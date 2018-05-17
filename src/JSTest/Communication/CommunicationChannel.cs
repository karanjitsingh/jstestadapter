// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

namespace JSTest.Communication
{
    using Microsoft.VisualStudio.TestPlatform.ObjectModel;
    using Microsoft.VisualStudio.TestPlatform.PlatformAbstractions;
    using Microsoft.VisualStudio.TestPlatform.Utilities;
    using System;
    using System.Diagnostics;
    using System.IO;
    using System.Net;
    using System.Net.Sockets;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;

    /// <summary>
    /// A communication channel using a length prefix packet frame for communication.
    /// </summary>
    public class CommunicationChannel 
    {
        /// <summary>
        /// The server stream read timeout constant (in microseconds).
        /// </summary>
        private const int STREAMREADTIMEOUT = 1000 * 1000;

        /// <summary>
        /// TCP Listener to host TCP channel and listen
        /// </summary>
        private TcpListener tcpListener;

        /// <summary>
        /// Binary Writer to write to channel stream
        /// </summary>
        private BinaryWriter binaryWriter;

        /// <summary>
        /// Binary reader to read from channel stream
        /// </summary>
        private BinaryReader binaryReader;

        /// <summary>
        /// Serializer for the data objects
        /// </summary>
        private JsonDataSerializer dataSerializer;

        /// <summary>
        /// Event used to maintain client connection state
        /// </summary>
        private ManualResetEvent clientConnectedEvent = new ManualResetEvent(false);

        /// <summary>
        /// Sync object for sending messages
        /// SendMessage over socket channel is NOT thread-safe
        /// </summary>
        private object sendSyncObject = new object();

        private Socket socket;

        /// <summary>
        /// Initializes a new instance of the <see cref="SocketCommunicationManager"/> class.
        /// </summary>
        public CommunicationChannel()
            : this(JsonDataSerializer.Instance)
        {
        }

        internal CommunicationChannel(JsonDataSerializer dataSerializer)
        {
            this.dataSerializer = dataSerializer;
        }

        #region ServerMethods

        /// <summary>
        /// Host TCP Socket Server and start listening
        /// </summary>
        /// <param name="endpoint">End point where server is hosted</param>
        /// <returns>Port of the listener</returns>
        public IPEndPoint HostServer()
        {
            this.tcpListener = new TcpListener(new IPEndPoint(IPAddress.Loopback, 0));
            this.tcpListener.Start();
            EqtTrace.Info("Listening on Endpoint : {0}", (IPEndPoint)this.tcpListener.LocalEndpoint);

            return (IPEndPoint)this.tcpListener.LocalEndpoint;
        }

        /// <summary>
        /// Accepts client async
        /// </summary>
        /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
        public async Task AcceptClientAsync()
        {
            if (this.tcpListener != null)
            {
                this.clientConnectedEvent.Reset();

                var client = await this.tcpListener.AcceptTcpClientAsync();
                this.socket = client.Client;
                this.socket.NoDelay = true;

                // Using Buffered stream only in case of write, and Network stream in case of read.
                var bufferedStream = new PlatformStream().CreateBufferedStream(client.GetStream(), JSTest.Constants.StreamBufferSize);
                var networkStream = client.GetStream();
                this.binaryReader = new BinaryReader(networkStream);
                this.binaryWriter = new BinaryWriter(bufferedStream);

                this.clientConnectedEvent.Set();
                if (EqtTrace.IsInfoEnabled)
                {
                    EqtTrace.Info("Using the buffer size of {0} bytes", JSTest.Constants.StreamBufferSize);
                    EqtTrace.Info("Accepted Client request and set the flag");
                }
            }
        }

        /// <summary>
        /// Waits for Client Connection
        /// </summary>
        /// <param name="clientConnectionTimeout">Time to Wait for the connection</param>
        /// <returns>True if Client is connected, false otherwise</returns>
        public bool WaitForClientConnection(int clientConnectionTimeout)
        {
            return this.clientConnectedEvent.WaitOne(clientConnectionTimeout);
        }

        /// <summary>
        /// Stop Listener
        /// </summary>
        public void StopServer()
        {
            this.tcpListener?.Stop();
            this.tcpListener = null;
            this.binaryReader?.Dispose();
            this.binaryWriter?.Dispose();
        }

        #endregion
        
        /// <summary>
        /// Writes message to the binary writer.
        /// </summary>
        /// <param name="messageType">Type of Message to be sent, for instance TestSessionStart</param>
        public void SendMessage(string messageType )
        {
            var serializedObject = this.dataSerializer.SerializePayload(messageType, null, JSTest.Constants.MessageProtocolVersion);
            this.WriteAndFlushToChannel(serializedObject);

            var ph = new ProcessHelper();
            EqtTrace.Info("PROTOCOL    {0} Send: {1}", ph.GetProcessName(ph.GetCurrentProcessId()), serializedObject);
        }

        /// <summary>
        ///  Writes message to the binary writer with payload
        /// </summary>
        /// <param name="messageType">Type of Message to be sent, for instance TestSessionStart</param>
        /// <param name="payload">payload to be sent</param>
        public void SendMessage(string messageType, object payload)
        {
            var rawMessage = this.dataSerializer.SerializePayload(messageType, payload, JSTest.Constants.MessageProtocolVersion);
            this.WriteAndFlushToChannel(rawMessage);

            var ph = new ProcessHelper();
            EqtTrace.Info("PROTOCOL    {0} Send: {1}", ph.GetProcessName(ph.GetCurrentProcessId()), rawMessage);
        }


        /// <summary>
        /// Reads message from the binary reader
        /// </summary>
        /// <returns>Returns message read from the binary reader</returns>
        public Message ReceiveMessage()
        {
            var rawMessage = this.ReceiveRawMessage();

            var ph = new ProcessHelper();
            EqtTrace.Info("PROTOCOL    {0} Receive: {1}", ph.GetProcessName(ph.GetCurrentProcessId()), rawMessage);

            return this.dataSerializer.DeserializeMessage(rawMessage);
        }

        /// <summary>
        /// Reads message from the binary reader using read timeout
        /// </summary>
        /// <param name="cancellationToken">
        /// The cancellation Token.
        /// </param>
        /// <returns>
        /// Returns message read from the binary reader
        /// </returns>
        public async Task<Message> ReceiveMessageAsync(CancellationToken cancellationToken)
        {
            var rawMessage = await this.ReceiveRawMessageAsync(cancellationToken);
            if (!string.IsNullOrEmpty(rawMessage))
            {
                return this.dataSerializer.DeserializeMessage(rawMessage);
            }

            return null;
        }

        /// <summary>
        /// Reads message from the binary reader
        /// </summary>
        /// <returns> Raw message string </returns>
        public string ReceiveRawMessage()
        {
            return this.binaryReader.ReadString();
        }

        /// <summary>
        /// Reads message from the binary reader using read timeout
        /// </summary>
        /// <param name="cancellationToken">
        /// The cancellation Token.
        /// </param>
        /// <returns>
        /// Raw message string
        /// </returns>
        public async Task<string> ReceiveRawMessageAsync(CancellationToken cancellationToken)
        {
            var str = await Task.Run(() => this.TryReceiveRawMessage(cancellationToken));
            return str;
        }

        private string TryReceiveRawMessage(CancellationToken cancellationToken)
        {
            string str = null;
            bool success = false;

            // Set read timeout to avoid blocking receive raw message
            while (!cancellationToken.IsCancellationRequested && !success)
            {
                try
                {
                    if (this.socket.Poll(STREAMREADTIMEOUT, SelectMode.SelectRead))
                    {
                        str = this.ReceiveRawMessage();
                        success = true;
                    }
                }
                catch (IOException ioException)
                {
                    var socketException = ioException.InnerException as SocketException;
                    if (socketException != null
                        && socketException.SocketErrorCode == SocketError.TimedOut)
                    {
                        EqtTrace.Info(
                            "SocketCommunicationManager ReceiveMessage: failed to receive message because read timeout {0}",
                            ioException);
                    }
                    else
                    {
                        EqtTrace.Error(
                            "SocketCommunicationManager ReceiveMessage: failed to receive message {0}",
                            ioException);
                        break;
                    }
                }
                catch (Exception exception)
                {
                    EqtTrace.Error(
                        "SocketCommunicationManager ReceiveMessage: failed to receive message {0}",
                        exception);
                    break;
                }
            }

            return str;
        }

        /// <summary>
        /// Writes the data on socket and flushes the buffer
        /// </summary>
        /// <param name="rawMessage">message to write</param>
        private void WriteAndFlushToChannel(string rawMessage)
        {
            // Writing Message on binarywriter is not Thread-Safe
            // Need to sync one by one to avoid buffer corruption
            lock (this.sendSyncObject)
            {
                this.binaryWriter?.Write(rawMessage);
                this.binaryWriter?.Flush();
            }
        }
    }
}