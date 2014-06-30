var events 		 = require('events')
var util       = require('util')
var SerialPort = require('serialport').SerialPort

var drivers = {
	pti: require('./drivers/pti')
}

function Fiat(path, driver) {
	if(!drivers[driver])
		throw new Error('invalid driver')

	this.driver = drivers[driver]
	this.serial = new SerialPort(path, this.driver.config.serial)

	var self = this

	this.serial.on('open', function() {
		self.emit('open')
	})

	self.serial.on('data', function(data) {
	  console.log('data received: ' + data)
	})

	events.EventEmitter.call(this)
}

util.inherits(Fiat, events.EventEmitter)

Fiat.prototype.acceptBill = function(billsArray, callback) {
	var self = this

	var msg = self.driver.msg(billsArray, 'stack')

	this.acceptLoop = setInterval(function() {
		self.serial.write(msg)
		console.log(msg)
	}, 100)
}

Fiat.prototype.stopAcceptingBill = function() {
	clearInterval(this.acceptLoop)
}

module.exports = Fiat
