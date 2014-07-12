var Fiat = require('./index.js')

var fiat = new Fiat('/dev/ttyUSB0', {debug: true	})

fiat.on('open', function() {
	fiat.accept()
})

fiat.on('escrow', function(amount) {
	console.log('Received bill '+amount)

	if(amount == 5)
		fiat.reject()
	else
		fiat.stack()
})

/*

fiat.on('open', function() {
	fiat.accept()
})

fiat.on('escrow', function(amount) {
	fiat.stack()
	// woo awesome let's get some more
	fiat.accept()
})

fiat.on('error', function(type) {
	console.log(type)
	fiat.refund()
})

*/