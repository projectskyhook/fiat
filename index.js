var events     = require('events')
var util       = require('util')
var SerialPort = require('serialport').SerialPort

function Fiat(path, opts) {
  this.opts = opts || { debug: false }
  this.serial = new SerialPort(path, this.config.serial)

  // This flips for each new message.
  this.ack = 0x1

  var self = this
  this.bytes = []

  this.serial.on('open', function() {
    self.emit('open')
  })

  this.serial.on('data', function(byte) {
    self.bytes.push(byte)
    if(self.bytes.length == self.config.receiveBufferSize) {
      var buffer = Buffer.concat(self.bytes)
      self.bytes = []

      if(self.opts.debug)
        console.log("<< "+buffer.toString('hex'))

      self.processReceived(buffer)
    }
  })

  events.EventEmitter.call(this)
}

util.inherits(Fiat, events.EventEmitter)

Fiat.prototype.processReceived = function(buffer) {
  if(buffer[3] & 2) {
    this.setStatus('accepting')
    this.emit('accepting')
  } else if(buffer[3] & 4) {
    if(this.status != 'escrowed') {
      var billType = undefined
      if(buffer[5] == 0x08) // $1
        billType = 1
      if(buffer[5] == 0x10) // $2
        billType = 2
      if(buffer[5] == 0x18) // $5
        billType = 3
      if(buffer[5] == 0x20) // $10
        billType = 4
      if(buffer[5] == 0x28) // $20
        billType = 5
      if(buffer[5] == 0x30) // $50
        billType = 6
      if(buffer[5] == 0x38) // $100
        billType = 7

      this.emit('escrow', billType)
    }

    this.setStatus('escrowed')
  } else if(buffer[3] & 8) {
    this.setStatus('stacking')
  } else {
    this.setStatus('idling')
  }
}

Fiat.prototype.stack = function() {
  var msg = this.msg('stack')
  this.serial.write(msg)
}

Fiat.prototype.reject = function() {
  this.serial.write(this.msg('reject'))
}

Fiat.prototype.setStatus = function(status) {
  if(this.status == status)
    return

  this.status = status

  if(this.opts.debug)
    console.log('status: '+status)
}

Fiat.prototype.accept = function() {
  var self = this
  var msg = this.msg('escrow')

  if(this.opts.debug) {
    console.log('>> '+msg.toString('hex'))
  }

  this.serial.write(msg)

  this.loop = setTimeout(function() {
    self.accept()
  }, 100)
}

Fiat.prototype.config = {
  acceptedBills: ['all of them'],
  receiveBufferSize: 11,
  serial: {
    baudrate: 9600,
    databits: 7,
    stopbits: 1,
    parity: 'even',
    bufferSize: 1
  },
  msg: {
    stx: 0x02,
    etx: 0x03,
    msgType: 0x10,
    data: {
      escrow: 0x10,
      stack: 0x20,
      reject: 0x40
    }
  }
}

Fiat.prototype.flipMsgAck = function() {
  this.ack = (this.ack == 0x0) ? 0x1 : 0x0
  return this.ack
}

Fiat.prototype.checksum = function(msg) {
  var checksum = 0x00

  for(var i=1; i<msg.length-1; i++)
    checksum = checksum ^ msg[i]

  return checksum
}

Fiat.prototype.acceptedBillsByte = function() {
  // hardcoded to everything for now
  return 0x7F
}

Fiat.prototype.msg = function(data) {
  var dataHex = this.config.msg.data[data]

  var msgType = this.config.msg.msgType

  var msg = [
    this.config.msg.stx,
    0x08, // length
    msgType | this.flipMsgAck(),
    this.acceptedBillsByte(),
    dataHex,
    0x00,
    this.config.msg.etx
  ]

  msg.push(this.checksum(msg))

  return new Buffer(msg)
}

Fiat.utils = {
  billTypeToUSD: function(type) {
    if(type == 1)
      return 1
    if(type == 2)
      return 2
    if(type == 3)
      return 5
    if(type == 4)
      return 10
    if(type == 5)
      return 20
    if(type == 6)
      return 50
    if(type == 7)
      return 100

    throw new Error('invalid type')
  }
}


module.exports = Fiat
