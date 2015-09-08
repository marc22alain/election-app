var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var RidingSchema = new Schema({
	name: {
		type: String,
		default: '',
		required: 'Please provide Riding name',
		trim: true
	},
	number: {
		type: Number,
		required: 'Please provide Riding number',
		unique: 'Riding is already in DB'
	},
	province: {
		type: String,
		required: 'Please provide Riding province'
	},
	path: {
		type: String,
		required: 'Please provide path data'
	}
});

var Riding = mongoose.model('Riding', RidingSchema);

exports.createRiding = function(pathFile) {
	var pathObject = JSON.parse(pathFile);
	var riding = new Riding({
		name: pathObject.features[0].properties.ED_NAMEE,
		number: pathObject.features[0].properties.FEDNUM,
		province: pathObject.features[0].properties.PROV,
		path: pathFile
	});
	riding.save(function (err) {
		if (err) {
			console.log('err ', err);
		}
		else {
			console.log('YEAH');
		}
	});
};

exports.ridingByNum = function(ridingNum, callback) {
	Riding.find().where('number').equals(Number(ridingNum)).exec(function(err, result) {
		if (err) {
			// TODO: implement good error notification
			console.log('error is ', err);
		}
		else {
			console.log('riding for ' + result[0].number + ' was found.');
			if (callback) {
				var jsonPath = JSON.parse(result[0].path);
				// console.log('jsonPath is type ', typeof(jsonPath));
				callback(jsonPath);				
			}
		}
	})
};

exports.ridingsList = function(req, callback) {
	var keyName = Object.keys(req.query)[0];
	var val = req.query[keyName];

	var handleResults = function(err, results) {
		if (err) {
			// TODO: implement good error notification
			console.log('error is ', err);			
		}
		else {
			console.log('resuts are ', results);
			var mapsJoin = {
				type: "FeatureCollection",
				features: []
			}
			for (var i=0; i<results.length; i++) {
				var jsonPath = JSON.parse(results[i].path);
				mapsJoin.features.push(jsonPath.features[0]);
			}
			callback(mapsJoin);
			// TODO: turn this into serving all ridings
			console.log("number of ridings in DB is ",results.length);
		}
	};

	switch(keyName){
		case 'number':
		Riding.find({'number':val}).exec(handleResults);
		break;
		case 'province':
		Riding.find({'province':val}).exec(handleResults);
		break;
	}
};


// simple test schema
var CatSchema = new Schema({
    name: String
});

exports.Cat = mongoose.model('Cat', CatSchema);