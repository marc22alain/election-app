var fs = require('fs'),
	http = require('http'),
	express = require('express'),
	mongoose = require('mongoose'),
	schema = require('./schema');


var localDB = 'mongodb://localhost/mashiyat';
var hostedDB = 'mongodb://heroku_pfgs482g:oru1ndak8cke7sl335s2ginheu@ds061148.mongolab.com:61148/heroku_pfgs482g';

mongoose.connect(hostedDB);


/*Initial code to test the database
var pathFile = fs.readFileSync('data/10003.json');
schema.createRiding(pathFile);
schema.ridingByNum(10003);
*/

var files = fs.readdirSync('data');
// console.log(files);

for (var i=0; i < files.length; i++) {
	var fileName = 'data/' + files[i];
	var pathFile = fs.readFileSync(fileName);
	schema.createRiding(pathFile);
}

console.log('Done saving riding path files');


setTimeout(function() {
	// At time of writing, this line will print the number of documents in the Riding collection
	schema.ridingsList();

	// wait 15 seconds for all database saves to complete
}, 15000);




