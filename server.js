var fs = require('fs'),
	http = require('http'),
	express = require('express'),
	mongoose = require('mongoose'),
	path = require('path'),
	postalCode = require('./postal-code'),
	schema = require('./schema');

var port = 8085;

// Bootstrap db connection
// var db = mongoose.connect(config.db, function(err) {
// 	if (err) {
// 		console.error(chalk.red('Could not connect to MongoDB!'));
// 		console.log(chalk.red(err));
// 	}
// });

mongoose.connect('mongodb://localhost/mashiyat');


var kitty = new schema.Cat({ name: 'Zildjian' });
kitty.save(function (err) {
  if (err) {
  	console.log('err');
  }
  else {
  	console.log('meow');
  }
});

var app = express();

// Seeting the app to respond to AJAX calls based on the postal code
// app.get('/checkPC', function(req, res){
// 	var code = req.query.code;
// 	console.log('looking for code ', code);
// 	postalCode.checkPostalCode(code, function(results) {
// 		// TODO: need to handle errors, invalid codes
// 		if (results === undefined) {
// 			res.end('That postal code does not exist');
// 		}
// 		else {
// 			res.end('You are looking for riding #' + results);			
// 		}
// 	});
// });


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

// console.log('postalCode', postalCode);