import Message from "CommunicationUtils/Message";

interface PacketData<T> {
    bytes: number;
    data: T;
}

export default class BinaryReader {
    public TryReadMessage(buffer: Buffer): Message {

        let encodedInt: PacketData<number>

        if(this.Read7BitEncodedInt(buffer)) {
            if(buffer.length >= encodedInt.bytes + encodedInt.data) {
                let rawMessage = buffer.toString('utf8', encodedInt.bytes, encodedInt.bytes + encodedInt.data)
                Message.FromJSON(JSON.parse);
            }
        }

        return null;
    }

    // Will return non-negative integer if read was successful
    private Read7BitEncodedInt(buffer: Buffer): PacketData<number> {
        let length:number = 0;

        // max 32bit integer + one extra byte since 32 bit integer encoded in integer can take upto 36 bits
        for(let i=0;i<5;i++) {
            
            if(buffer.length < i+1)
                break;
            
            var byte = buffer.readUInt8(i);

            length += (byte % 128) << 7 * i;

            if(byte < 128) {
                return {
                    bytes: i+1,
                    data: length
                };
            }
        }

        return null;
    }
}