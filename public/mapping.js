// 'use strict';
// GLOBALS
// initialized by the media query
var width, height;

// for mapping
var mapSvg, superGroup, ridingGroup, textGroup, path, centered;

// for user controls
var zoomPanGroup, viewScale, viewCenterX, viewCenterY, zoomFactor, panFactor;



/*********************************************************************************/
/************************          document.ready           **********************/
/*********************************************************************************/

$(document).ready(function() {
	// perform the media query
	setViewSize();
	// attach the event handlers
	$('#search-postal-code').on('click', searchPostalCode);
	// AJAX: get map data and use it to draw the map
	getMainMap(createMap);
	// console.log('createMap is a ', typeof(createMap));
	// make user zoom and pan controls
	
});


/*********************************************************************************/
/************************  functions for updating the view  **********************/
/*********************************************************************************/

var setViewSize = function() {
	width = $(window).width();
	// not going full height in order to leave room for the search bar
	height = $(window).height() - 50;

	viewCenterX = width / 2;

	viewCenterY = height / 2;

	viewScale = 1;
	// TODO: feature to make fit in portrait orientation

	// TODO: make two factors below responsive
	zoomFactor = 3;
	panFactor = 200;
};


var setProjection = function() {
  // MERCATOR  -- super flat, Nunavut looks huge
  // var projection = d3.geo.mercator()
  //   .scale(300)
  //   .translate([width * 1.1, height * 1.5 ]);

  // ALBERS  -- Nunavut much smaller but squirts to the right
  // var projection = d3.geo.albers()
  //   .scale(600)
  //   .translate([width * .4, height * .8 ]);

  // CONICCONFORMAL  -- preferred
  // var projection = d3.geo.conicConformal()
  //   .rotate([98, 0])
  //   .scale(500)
  //   .translate([width / 3, height * 1.5 ]);

  // ORTHOGRAPHIC  -- BEST; this seems like the conventional view of Canada
  var projection = d3.geo.orthographic()
    // .rotate([198, 0])
		.scale(600)
		.translate([width * .4, height * .95 ]);
		projection.rotate([98,-40,0]);

	path = d3.geo.path()
		.projection(projection);
};

// TODO: ANY linear scale that relates to path area must have the domain set by the media query
var provinceColor = d3.scale.linear().domain([40,16000]).range(['red',
     'yellow']);

var ridingColor = d3.scale.linear().domain([0,10]).range(['blue',
     'green']);


var createMap = function(canada) {
	setProjection();
	    // selecting <div id='map'>
    mapSvg = d3.select('#map')
		// appending a new HTML entity: SVG
		.append('svg')
		// setting the SVG's attributes
		.attr('width', width)
		.attr('height', height);

	// now appending a drawing element to the SVG
	mapSvg.append('rect')
		// now setting attributes for the RECT
		.attr('class', 'background')
		.attr('width', width)
		.attr('height', height)
		// now attaching an event handler to the RECT ... clicking on the sea also has a result
		.on('click', clicked);

	// <g> is a group
	superGroup = mapSvg.append('g');


    // are we now nesting another group within this group 'g'?
    superGroup.append('g')
		// setting inner group's id='provinces' 
		.attr('id', 'provinces')
		// <g> selectAll method providing an array for <path>
		.selectAll('path')
		// now populating this <path> with data; a join that returns a selection of all elements
		.data(topojson.feature(canada, canada.objects.provinces).features)
		// ?
		.enter().append('path')
		// d is the data attribute, and assigning it a what ?
		.attr('d', path)
		.attr('fill', function(d) {return provinceColor(path.area(d))})
		// giving each province an event handler
		.on('click', clicked);

    superGroup.append('path')
        .datum(topojson.mesh(canada, canada.objects.provinces, function(a, b) { return a !== b; }))
        .attr('id', 'province-borders')
        .attr('d', path);

	ridingGroup = superGroup.append('g').attr('id', 'riding');
	textGroup = superGroup.append('g').attr('id', 'riding_names');

	
	makeZoomPanGroup();

	// NAMING the provinces
	// var names = textGroup.selectAll('text').data(topojson.feature(canada, canada.objects.provinces).features);

	// names.exit().remove();

	// names.enter()
	// 	.append('text')
	// 	.attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
	// 	.text(function(d) { return path.area(d); });
};

var makeZoomPanGroup = function() {
	zoomPanGroup = mapSvg.append('g').attr('id', 'zoom_pan');

	// TODO: make this responsive to media queries
	zoomPanGroup.attr('transform', 'translate(30, 10)');

	var zoomGroup = zoomPanGroup.append('g');

	var plusIcon = zoomGroup.append('svg');

	plusIcon.on('click', zoomIn);

	plusIcon.append('rect')
		.attr('class', 'icon-background')
		.attr('x', '0')
		.attr('y', '0')
		.attr('rx', '5')
		.attr('ry', '5')
		.attr('width', '30')
		.attr('height', '30');

	plusIcon.append('line')
		.attr('class', 'symbol')
		.attr('x1', '6')
		.attr('x2', '25')
		.attr('y1', '15')
		.attr('y2', '15')

	plusIcon.append('line')
		.attr('class', 'symbol')
		.attr('y1', '6')
		.attr('y2', '25')
		.attr('x1', '15')
		.attr('x2', '15')


	var minusIcon = zoomGroup.append('svg');

	minusIcon.on('click', zoomOut);

	minusIcon.append('rect')
		.attr('class', 'icon-background')
		.attr('x', '0')
		.attr('y', '31')
		.attr('rx', '5')
		.attr('ry', '5')
		.attr('width', '30')
		.attr('height', '30');

	minusIcon.append('line')
		.attr('class', 'symbol')
		.attr('x1', '6')
		.attr('x2', '25')
		.attr('y1', '46')
		.attr('y2', '46')

	var panGroup = zoomPanGroup.append('g');

	panGroup.attr('transform', 'translate(15, 81)');

	var rightArrow = panGroup.append('g');
	arrowSVG(rightArrow);
	rightArrow.on('click', panRight);

	var leftArrow = panGroup.append('g');
	arrowSVG(leftArrow);
	leftArrow.attr('transform', 'rotate(180) translate(0, -30)')
		.on('click', panLeft);

	var upArrow = panGroup.append('g');
	arrowSVG(upArrow);
	upArrow.attr('transform', 'rotate(270) translate(-15, -15) ')
		.on('click', panUp);

	var downArrow = panGroup.append('g');
	arrowSVG(downArrow);
	downArrow.attr('transform', 'rotate(90) translate(15, -15) ')
		.on('click', panDown);


	// VERSION USING bitmap images:
	// var plusIcon = zoomPanGroup.append('image');
	// plusIcon.attr('xlink:href', 'images/plus.png')
	// 	.attr('width', 24)
	// 	.attr('height', 24)
	// 	.attr('x', 20)
	// 	.attr('y', 20)
	// 	.on('click', zoomIn);

	// var minusIcon = zoomPanGroup.append('image');
	// minusIcon.attr('xlink:href', 'images/minus.png')
	// 	.attr('width', 24)
	// 	.attr('height', 24)
	// 	.attr('x', 20)
	// 	.attr('y', 60)
	// 	.on('click', zoomOut);
};

var arrowSVG = function(g) {
	var svg = g.append('svg');

	// This is the ouline polygon
	svg.append('polygon')
		.attr('class', 'icon-background')
		.attr('points', '1,15 16,30 35,30 35,0 16,0 1,15');

	// This is the point of the arrow 
	svg.append('polygon')
		.attr('class', 'symbol')
		.attr('points', '18,8 18,23 29,15 18,8');

	// This is the arrow's tail
	svg.append('line')
		.attr('class', 'symbol')
		.attr('x1', '7')
		.attr('x2', '22')
		.attr('y1', '15')
		.attr('y2', '15')
};


// PROVINCE scale zooming only !
var zoomTransition = function(d) {
	var centroid, b;
	if (d === undefined) {
		// Zoom out
		viewCenterX = width / 2;
		viewCenterY = height / 2;
		viewScale = 1;
		centered = null;	
	}
	else {
		centroid = path.centroid(d);
		viewCenterX = centroid[0];
		viewCenterY = centroid[1];

		b = path.bounds(d);
		// console.log('bounds: ' + b[0][0] + ' ' + b[0][1]);
		viewScale = 0.9 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height);
		centered = d;
	}

	superGroup.transition()
		.duration(750)
		.attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')scale(' + viewScale + ')translate(' + -viewCenterX + ',' + -viewCenterY + ')');
};


var drawRiding = function(data) {
	var ridingNames = new Array();
	ridingNames.push(data.features[0].properties.ED_NAMEE)
	console.log(ridingNames);
		
	// adding the <path> element here; only updating afterwards
	var paths = ridingGroup.selectAll('path').data(data.features).attr('d', path);

	paths.exit().remove();

	paths.enter()
		.append('path')
		.attr('d', path)
		.attr('class', 'riding');

	// transition to the new riding
	var d = ridingGroup.select('path');
	var centroid = path.centroid(d.datum());
	var x = centroid[0];
	var y = centroid[1];

	var b = path.bounds(data);
	// console.log('bounds: ' + b[0][0] + ' ' + b[0][1]);
	zoomScale = 0.9 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height);
	// k = 20

	var fontSize = 24 / zoomScale;

	var names = textGroup.selectAll('text').data(ridingNames);

	names.exit().remove();

	names.enter()
		.append('text');

	names.text(function(d) { return d; })
		.attr('x', x)
		.attr('y', y)
		.attr('style', 'font-size:' + fontSize + 'pt');

	d.style('stroke-width', 1 / k + 'px');


	superGroup.transition()
		.duration(750)
		.attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')scale(' + zoomScale + ')translate(' + -x + ',' + -y + ')');
};


var drawProvinceRidings = function(province, data) {
	var b = path.bounds(province);
	// console.log('bounds: ' + b[0][0] + ' ' + b[0][1]);
	var k = 0.9 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height);
	var q = Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height);


	// Adding the RIDING boundaries
	var paths = ridingGroup.selectAll('path').data(data.features).attr('d', path);
	// This changes with each province, so must also affect the 'update' selection
	paths.style('stroke-width', function(d) {
			var b_riding = path.bounds(d);
			var q_riding = Math.max((b_riding[1][0] - b_riding[0][0]) / width, (b_riding[1][1] - b_riding[0][1]) / height);
			return Math.min((q_riding / q), 3 / k) + 'px';
		})
		.attr('fill', function(d, i) {
			var number = ((i * 7000) % 65535) + 1;
			var hexColorString = ('000' + number.toString(16)).slice(-4).toUpperCase();
			// console.log(hexColorString);
			return '#FF' + hexColorString;
		})
		.on('click', showCandidates);


	paths.exit().remove();

	paths.enter()
		.append('path')
		.attr('d', path)
		.attr('class', 'riding')
		.style('stroke-width', function(d) {
			var b_riding = path.bounds(d);
			var q_riding = Math.max((b_riding[1][0] - b_riding[0][0]) / width, (b_riding[1][1] - b_riding[0][1]) / height);
			return Math.min((q_riding / q), 3 / k) + 'px';
		})
		.attr('fill', function(d, i) {
			var number = ((i * 7000) % 65535) + 1;
			var hexColorString = ('000' + number.toString(16)).slice(-4).toUpperCase();
			// console.log(hexColorString);
			return '#FF' + hexColorString;
		})
		.on('click', showCandidates);


	// Adding the RIDING names
	var names = textGroup.selectAll('text').data(data.features);
	// other update procedures:
	names
		.attr('transform', function(d) { 
			return 'translate(' + path.centroid(d) + ')'; })
		.text(function(d) { 
			return d.properties.ED_NAMEE; })
		.attr('style', function(d) { 
			var b_riding = path.bounds(d);
			var q_riding = Math.max((b_riding[1][0] - b_riding[0][0]) / width, (b_riding[1][1] - b_riding[0][1]) / height);
			return 'font-size:'  + Math.min((8 * q_riding / q), 24 / k) + 'pt'; 
		})
		.on('click', showCandidates);

	names.exit().remove();

	names.enter()
		.append('text')
		.attr('transform', function(d) { 
			return 'translate(' + path.centroid(d) + ')'; })
		.text(function(d) { 
			return d.properties.ED_NAMEE; })
		.attr('style', function(d) { 
			var b_riding = path.bounds(d);
			var q_riding = Math.max((b_riding[1][0] - b_riding[0][0]) / width, (b_riding[1][1] - b_riding[0][1]) / height);
			return 'font-size:'  + Math.min((8 * q_riding / q), 24 / k) + 'pt'; 
		})
		.on('click', showCandidates);

};


var zoomIn = function() {
	// console.log('zoomIn ', viewScale);
	viewScale = viewScale * zoomFactor;
	superGroup.transition()
		.duration(750)
		// .attr('transform', 'scale(' + viewScale + ')');
		// .attr('transform', 'translate(300,0)');
		// .attr('transform', 'translate(-' + width / viewScale + ',-' + height / viewScale + ')scale(' + viewScale + ')');
		.attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')scale(' + viewScale + ')translate(' + -viewCenterX + ',' + -viewCenterY + ')');
};

var zoomOut = function() {
	// console.log('zoomOut ', viewScale);
	viewScale = viewScale / zoomFactor;
	superGroup.transition()
		.duration(750)
		// .attr('transform', 'scale(' + viewScale + ')');
		// .attr('transform', 'translate(300,0)');
		// .attr('transform', 'translate(-' + width / viewScale + ',-' + height / viewScale + ')scale(' + viewScale + ')');
		.attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')scale(' + viewScale + ')translate(' + -viewCenterX + ',' + -viewCenterY + ')');
};

var panRight = function() {
	// console.log('RIGHT ');
	viewCenterX = viewCenterX + (panFactor / viewScale);

	superGroup.transition()
		.duration(750)
		.attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')scale(' + viewScale + ')translate(' + -viewCenterX + ',' + -viewCenterY + ')');
};

var panLeft = function() {
	// console.log('LEFT ');
	viewCenterX = viewCenterX - (panFactor / viewScale);

	superGroup.transition()
		.duration(750)
		.attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')scale(' + viewScale + ')translate(' + -viewCenterX + ',' + -viewCenterY + ')');
};

var panUp = function() {
	viewCenterY = viewCenterY - (panFactor / viewScale);

	superGroup.transition()
		.duration(750)
		.attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')scale(' + viewScale + ')translate(' + -viewCenterX + ',' + -viewCenterY + ')');
};

var panDown = function() {
	viewCenterY = viewCenterY + (panFactor / viewScale);

	superGroup.transition()
		.duration(750)
		.attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')scale(' + viewScale + ')translate(' + -viewCenterX + ',' + -viewCenterY + ')');
};

var showRidingCandidates = function(data) {
	console.log(data);
	for (var i = 0; i < data.objects.length; i++) {
		console.log(data.objects[i].name);
	}
};
/*********************************************************************************/
/************************** functions for reading the DBs ************************/
/*********************************************************************************/

var getMainMap = function(callback) {
	var mapURL = 'topojson/CAN_provinces.json';

	// using d3's AJAX function
	d3.json(mapURL, function(error, result) {
		// TODO: probably need to review best way to handle errors for the user
		if (error) {
			throw error;
		}
		else {
			callback(result);
		}
	});
};

var getRidingFromPC = function(postalCode, callback) {
	// this function uses the OWN MongoDB
	var options = {
		url: '/checkPC',
		data: {
			code:postalCode
		}
	};

	// Could use d3.json() if you supplied the full query as in URL: '/checkPC?code=A9A9A9'
	$.ajax(options).success(function(data) {
		var ridingName = data.features[0].properties.ED_NAMEE;
		console.log('success gives ' + ridingName);
		// alert(data.features[0].properties.ED_NAMEE);
		callback(data);
	});
};

var getRidingsForProvince = function(province, callback) {
	var provinceID = province.id;
	var options = {
		url: '/boundaries',
		data: {
			province:provinceID
		}
	}
	$.ajax(options).success(function(data) {
		callback(province, data);
	});
};

var getRidingCandidates = function(riding, callback) {
	var options = {
		url: 'http://represent.opennorth.ca/candidates/house-of-commons',
		data: {
			district_name:riding,
			callback:'showRidingCandidates'
		},
		dataType: 'jsonp'
	}
	$.ajax(options).success(function(data) {
		data;
	});
};

/*********************************************************************************/
/************************ functions for handling user input **********************/
/*********************************************************************************/

var searchPostalCode = function() {
	var postalCode = $("#postal-code-input").val();
	// TODO: validate the user's input
	console.log('clicked ', postalCode);

	// this function uses the OWN MongoDB
	getRidingFromPC(postalCode, drawRiding);

	// TODO: alternate AJAX call for using a different DB for riding boundaries
};


var clicked = function(d) {
	// When unmapped areas are clicked
	if (d === undefined) {
		zoomTransition(undefined);
	}
	// When an actual province is targeted
	else {
		getRidingsForProvince(d, drawProvinceRidings);
		// TODO: put this back into correct order for asynchronous call above ?
		// This does make visual action without waiting for the DB query to return.
		zoomTransition(d);
	}
};


var showCandidates = function(riding) {
	console.log('You have clicked on riding ', riding.properties.ED_NAMEE);

	// AJAX call for riding candidates
	// http://represent.opennorth.ca/candidates/house-of-commons/?district_name=Davenport
	getRidingCandidates(riding.properties.ED_NAMEE, showRidingCandidates);
	zoomTransition(riding);

};