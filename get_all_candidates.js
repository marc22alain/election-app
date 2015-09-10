var request = require('request');

var fs = require('fs');
	// http = require('http'),
	// express = require('express'),		// ?
	// mongoose = require('mongoose'),		// ?
	// schema = require('./schema'); 		// ?


var url1 = 'http://represent.opennorth.ca/candidates/house-of-commons/';

// OPTION limit=1000, offset=1000 (for the second set)
// data is a json object containing an 'objects' array of candidates
// ... object.objects[i].party_name

var options1 = '?limit=1000&offset=0';
var options2 = '?limit=1000&offset=1000';

var parties = {};

request((url1 + options1), function (error, response, body) {
	var object = JSON.parse(response.body);
	parseParties(object);
	// console.log(partiesTest);

	console.log(parties);
	request((url1 + options2), function (error, response, body) {
		var object = JSON.parse(response.body);
		parseParties(object);
		console.log(parties);

		var stringJSON = JSON.stringify(parties);

		var newFileName = 'candidates_per_party.json';
		var newFile = fs.openSync(newFileName, 'w');
		fs.writeSync(newFile, stringJSON);

	});
});

var parseParties = function(object) {
	for (var i = 0; i < object.objects.length; i++) {
		var partyName = object.objects[i].party_name;
		// console.log(partyName);
		if (parties[partyName]) {
			var current = parties[partyName];
			parties[partyName] = current + 1;
		}
		else {
			parties[partyName] = 1;
		}
	}
};