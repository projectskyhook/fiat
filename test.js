var Fiat = require('./index.js')

var fiat = new Fiat('/dev/ttyUSB0', {debug: false})

fiat.on('open', function() {
  fiat.accept()
})

fiat.on('escrow', function(billType) {
  var amount = Fiat.utils.billTypeToUSD(billType)

  if(amount == 5) {
    console.log("Sorry, we don't accept $5 bills!")
    fiat.reject()
  } else
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