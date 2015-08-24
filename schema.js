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
	path: {
		type: String,
		required: 'Please provide path data'
	}
})

var Riding = mongoose.model('Riding', RidingSchema);

exports.createRiding = function(pathFile) {
	var pathObject = JSON.parse(pathFile);
	var riding = new Riding({
		name: pathObject.features[0].properties.ED_NAMEE,
		number: pathObject.features[0].properties.FEDNUM,
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
}

exports.ridingByNum = function(ridingNum, callback) {
	Riding.find().where('number').equals(Number(ridingNum)).exec(function(err, result) {
		if (err) {
			// TODO: implement good error notification
			console.log('error is ', err);
		}
		else {
			console.log('riding for ' + result[0] + ' was found.');
			if (callback) {
				var jsonPath = JSON.parse(result[0].path);
				console.log('jsonPath is type ', typeof(jsonPath));
				callback(jsonPath);				
			}
		}
	})
}

exports.ridingsList = function() {
	Riding.find().exec(function(err, results) {
		if (err) {
			// TODO: implement good error notification
			console.log('error is ', err);			
		}
		else {
			console.log("number of ridings in DB is ",results.length);
		}
	});
}


// simple test schema
var CatSchema = new Schema({
    name: String
});

exports.Cat = mongoose.model('Cat', CatSchema);