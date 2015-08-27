var fs = require('fs'),
	http = require('http'),
	express = require('express'),
	mongoose = require('mongoose'),
	path = require('path'),
	postalCode = require('./postal-code'),
	schema = require('./schema');


if (process.env.NODE_ENV === 'hosted') {
	var port = process.env.PORT;
	mongoose.connect(process.env.MONGOLAB_URI);	
}
else {
	var port = 8085;
	// TODO: add an error catch for failing to connect
	mongoose.connect('mongodb://localhost/mashiyat', function(err) {
		if (err) {
			console.log('OOPS, someone forgot to turn on the MongoDB', err);			
		}
	});	
}

/* For basic debugging of the server and DB
var kitty = new schema.Cat({ name: 'Zildjian' });
kitty.save(function (err) {
  if (err) {
  	console.log('err');
  }
  else {
  	console.log('meow');
  }
});
*/

var app = express();


// Setting the app to respond to AJAX calls based on the postal code
app.get('/checkPC', function(req, res){
	var code = req.query.code;
	console.log('looking for code ', code);
	postalCode.checkPostalCode(code, function(results) {
		// TODO: robust error handling
		if (results === undefined) {
			res.end('That postal code does not exist');
		}
		else {
			schema.ridingByNum(results, function(ridingPath) {
				res.json(ridingPath);
			});			
		}		
	});
});

// Setting the app router and static folder
app.use(express.static(path.resolve('./public')));


// Start the app by listening on <port>
app.listen(port);

// Logging initialization
console.log('ELECTION application started on port ' + port);