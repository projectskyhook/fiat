var config = {
	serial: {
		baudrate: 9600,
		databits: 7,
		stopbits: 1,
		parity: 'even',
		buffersize: 6 // TODO: This may not be needed, or it may be the wrong size.
	},
	msg: {
		stx: 0x02,
		etx: 0x03,
		msgType: 0x10,
		data: {
			escrow: 0x10,
			stack: 0x20,
			returnBill: 0x40
		}
	}
}

// This flips for each new message.
var ack = 0x1

function flipMsgAck() {
	ack = (ack == 0x0) ? 0x1 : 0x0
	return ack
}

function checksum(msg) {
	var checksum = 0x00

	for(var i=1; i<msg.length-1; i++)
		checksum = checksum ^ msg[i]

	return checksum
}

function acceptedBillsByte(billsArray) {
	// hardcoded to everything for now
	return 0x7F
}

function msg(billsArray, data) {
	var dataHex = config.msg.data[data]

	var msgType = config.msg.msgType

	var msg = [
		config.msg.stx,
		0x08, // length
		msgType | flipMsgAck(),
		acceptedBillsByte(billsArray),
		dataHex,
		0x00,
		config.msg.etx
	]

	msg.push(checksum(msg))

	return new Buffer(msg)
}

module.exports = {
	config: config,
	msg: msg
}
