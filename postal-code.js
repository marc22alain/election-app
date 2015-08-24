var request = require('request');

var url1 = 'http://www.elections.ca/results2.asp?mysent=finded&mylang=e&pc=';

// SET UP for asynchronous
exports.checkPostalCode = function(code, callback) {
	request.get(url1 + code).on('response', function (response) {
		var path = response.request.path;
	    console.log(path);
	    var riding = parsePath(path);
	    console.log('riding in checkPostalCode is ', riding);
	    callback(riding);
	});
};

var parsePath = function(path) {
	// EXAMPLE of path to parse:
	//    /Scripts/vis/EDInfo?L=e&ED=35018&EV=41&EV_TYPE=1&PC=m6h2w1&QID=-1&PAGEID=21
	var patternNotFound = /EDNotFound/;
	var pattern = /ED=\d{5}/;
	if (path.match(patternNotFound)) {
		console.log('OOPS, you need to input a valid postal code');
		// TODO: trigger a more formal error and send back an appropriate response
	}
	else {
		var ridingParam = path.match(pattern)[0];
		var riding = ridingParam.slice(3,8);
		console.log('Riding is ', riding);
		return riding;	
	}
};