var Fiat = require('./index.js')

var fiat = new Fiat('/dev/ttyUSB0', 'pti')

fiat.on('open', function() {
	fiat.acceptBill([1, 2, 5, 10, 20, 50, 100])
})

/*
fiat.on('billAccepted', function() {
	console.log('Bill Accepted!')
	fiat.stackBill()
})
*/
