// 'use strict';
// GLOBALS
// initialized by the media query
var width, height;

// for mapping
var mapSvg, superGroup, ridingGroup = 0, path, centered;
var svg, g, g2 = 0, path, centered;

// document.ready
$(document).ready(function() {
	// perform the media query
	setViewSize();
	// attach the event handlers
	$("#search-postal-code").on('click', searchPostalCode);
	// get map data and use it to draw the map
	getMainMap(createMap);
	// console.log('createMap is a ', typeof(createMap));
});

// functions for updating the view
var setViewSize = function() {
	width = $(window).width();
	// not going full height in order to leave room for the search bar
	height = $(window).height() - 50;

	// TODO: feature to make fit in portrait orientation
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

var createMap = function(canada) {
	setProjection();
	    // selecting <div id='map'>
    svg = d3.select('#map')
		// appending a new HTML entity: SVG
		.append("svg")
		// setting the SVG's attributes
		.attr("width", width)
		.attr("height", height);

	// now appending a drawing element to the SVG
	svg.append("rect")
		// now setting attributes for the RECT
		.attr("class", "background")
		.attr("width", width)
		.attr("height", height)
		// now attaching an event handler to the RECT ... clicking on the sea also has a result
		.on("click", clicked);

	// what is a G ? ... <g> is a group
	g = svg.append("g");

    // are we now nesting another group within this group 'g'?
    g.append("g")
		// setting inner group's id='provinces' 
		.attr("id", "provinces")
		// <g> selectAll method providing an array for <path>
		.selectAll("path")
		// now populating this <path> with data; a join that returns a selection of all elements
		.data(topojson.feature(canada, canada.objects.provinces).features)
		// ?
		.enter().append("path")
		// d is the data attribute, and assigning it a what ?
		.attr("d", path)
		// giving each province an event handler
		.on("click", clicked);

    g.append("path")
        .datum(topojson.mesh(canada, canada.objects.provinces, function(a, b) { return a !== b; }))
        .attr("id", "province-borders")
        .attr("d", path);
};

var clicked = function(d) {
	console.log('d is ',d);
	var x, y, k;

	if (d && centered !== d) {
		var centroid = path.centroid(d);
		x = centroid[0];
		y = centroid[1];
		k = 4;
		centered = d;
	} else {
		x = width / 2;
		y = height / 2;
		k = 1;
		centered = null;
	}

	g.selectAll("path")
		.classed("active", centered && function(d) { return d === centered; });

	g.transition()
		.duration(750)
		.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
		.style("stroke-width", 1.5 / k + "px");
};

var drawRiding = function(data) {
	var ridingName = data.features[0].properties.ED_NAMEE
	if (g2 === 0) {
		// attach a new group to the map; for the searched ridding
		g2 = g.append("g").attr('id', 'riding');

		// adding the <path> element here; only updating afterwards
		g2.selectAll('path').data(data.features)
		.enter()
		.append('path')
		.attr('d', path)
		.attr('class', 'riding');

		// adding the <text> element here; only updating afterwards
		g2.append('text');
	}

	g2.selectAll('path').data(data.features)
	// sufficient for the data update
		.attr('d', path);

	// transition to the new riding
	d = g2.select("path");
	var centroid = path.centroid(d.datum());
	x = centroid[0];
	y = centroid[1];

	var b = path.bounds(data);
	// console.log('bounds: ' + b[0][0] + ' ' + b[0][1]);
	k = .9 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height);

	var fontSize = 24 / k;

	g2.selectAll('text')
		.text(ridingName)
		.attr('x', x)
		.attr('y', y)
		.attr('style', 'font-size:' + fontSize + 'pt');

	g.transition()
		.duration(750)
		.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
		.style("stroke-width", 1.5 / k + "px");
};


// functions for reading the DBs
var getMainMap = function(callback) {
	var mapURL = "topojson/CAN_provinces.json";

	// using d3's AJAX function
	d3.json(mapURL, function(error, result) {
		// TODO: probably need to review best way to handle this for the user
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
		var ridingName = data.features[0].properties.ED_NAMEE
		console.log('success gives ' + ridingName);
		// alert(data.features[0].properties.ED_NAMEE);
		callback(data);
	});
};

// functions for handling user input
var searchPostalCode = function() {
	var postalCode = $("#postal-code-input").val();
	// TODO: validate the user's input
	console.log('clicked ', postalCode);

	// this function uses the OWN MongoDB
	getRidingFromPC(postalCode, drawRiding);

	// TODO: alternate AJAX call for using a different DB for riding boundaries
};