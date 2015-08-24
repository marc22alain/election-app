var g, g2 = 0, svg, path, width, height, centered;

var drawMap = function() {

mapDiv = $('#map');

  width = $(window).width();
  height = $(window).height() * .75;

    // TODO: consider setting the scale and translation later
  var projection = d3.geo.mercator()
    .scale(400)
    .translate([width * 1.1, height * 1.5 ]);

  path = d3.geo.path()
    .projection(projection);

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

  var mapURL = "topojson/CAN_provinces.json";

  d3.json(mapURL, function(error, canada) {
    if (error) throw error;

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
  });

  function clicked(d) {
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
  }
};

$(window).resize(function() {
  // TODO: figure out how to redraw the map 
});

$(document).ready(function() {
  // Run the main script to draw the map of Canada
  drawMap();

  // Make the postal code submission active, and define its function
  $("#search-postal-code").on('click', function(){
    var postalCode = $("#postal-code-input").val();
    console.log('clicked ', postalCode);

    var options =  {
      url: '/checkPC',
      data: {
        code:postalCode
      }
    }
    // $.ajax('/checkPC', options).success(function(data) {
    $.ajax(options).success(function(data) {
      var ridingName = data.features[0].properties.ED_NAMEE
      console.log('success gives ' + ridingName);
      // alert(data.features[0].properties.ED_NAMEE);


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
    });
  });

});