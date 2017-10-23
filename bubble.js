var width = 1500,
  height = 1500,
  radius = Math.min(width, height) / 2,
  center = { x: width / 2, y: height / 2 },
  forceStrength = 0.05;

var budgetSchedulePos = {
  underBaheadS: { x: width / 3, y: height / 3 },
  onBaheadS: { x: width / 2, y: height / 3 },
  overBaheadS: { x: 2 * (width / 3), y: height / 3 },
  underBonS: { x: width / 3, y: height / 2 },
  onBonS: { x: width / 2, y: height / 2 },
  overBonS: { x: 2 * (width / 3), y: height / 2 },
  underBbehindS: { x: width / 3, y: 2 * (height / 3) },
  onBbehindS: { x: width / 2, y: 2 * (height / 3 )},
  overBbehindS: { x: 2 * (width / 3), y: 2 * (height / 3) },
};

var chart = d3.select(".chart2")
          .attr("width", width)
          .attr("height", height);

var bubbles;

var colour2 = d3.scaleOrdinal(d3.schemeCategory20);

var tooltip = d3.select("body").append("div").attr("class", "tooltip");

var simulation = d3.forceSimulation()
                      .velocityDecay(0.2)
                      .force('x', d3.forceX().strength(forceStrength).x(center.x))
                      .force('y', d3.forceY().strength(forceStrength).y(center.y))
                      .force('charge', d3.forceManyBody().strength(charge))
                      .on('tick', tick);
simulation.stop();

var filteredArray = [];

function posByValues(d) {
  if( d.cost > 0 ) { 
    if( d.schedule > 0 ) { 
      return budgetSchedulePos["underBaheadS"];
    }
    if( d.schedule < 0 ) { 
      return budgetSchedulePos["underBbehindS"];
    }
    return budgetSchedulePos["underBonS"];
  }
  if( d.cost < 0 ) {
    if( d.schedule > 0 ) { 
      return budgetSchedulePos["overBaheadS"];
    }
    if( d.schedule < 0 ) { 
      return budgetSchedulePos["overBbehindS"];
    }
    return budgetSchedulePos["overBonS"];
  }
    if( d.schedule > 0 ) { 
      return budgetSchedulePos["onBaheadS"];
    }
    if( d.schedule < 0 ) { 
      return budgetSchedulePos["onBbehindS"];
    }
    return budgetSchedulePos["onBonS"];
}

function posByValuesX(d) {
  return posByValues(d).x;
}

function posByValuesY(d) {
  return posByValues(d).y;
}

var radiusScale;

var orgData;

d3.csv("data.csv", type, function(error, originalData) {
  if (error) throw error;

  orgData = originalData;

  var max = d3.max(originalData, function (d) { return +d["Schedule Variance (%)"]; });


  radiusScale = d3.scalePow()
                      .exponent(0.5)
                      .range([2, 85])
                      .domain([0, max]);

  var newData = processData(originalData);

  changeData2(newData);

});


function processData(data) {

  var filteredData = data.filter(function(d) {
  if (filteredArray.indexOf(d["Agency Name"]) !== -1) {
    return false;
  }
  return true;
});

  var nodes = filteredData.map( function (d) {
    return {
      id: d["Project ID"],
      radius: radiusScale(10),
      schedule: d["Schedule Variance (%)"],
      cost: d["Cost Variance (%)"],
      value: d["Schedule Variance (%)"],
      agency: d["Agency Name"],
      x: Math.random() * 900,
      y: Math.random() * 800,
    };
  });

  nodes.sort(function(a,b) { return b.value - a.value; });

  return nodes;
}

function type(d) {
  d["Schedule Variance (%)"] = +d["Schedule Variance (%)"];
  d["Cost Variance (%)"] = +d["Cost Variance (%)"];
  return d;
}

function changeData2(data) {

  chart.selectAll('.bubble').remove();

  bubbles = chart.selectAll('.bubble')
                  .data(data);

  var bubblesElements = bubbles.enter()
                        .append('circle')
                        .classed('bubble', true)
                        .attr('r', 0)
                        .attr('fill', function (d) { return colour2(d.agency); })
                        .attr('stroke', function (d) { return d3.rgb(colour2(d.agency)).darker(); })
                        .attr('stroke-width', 2)
                        .attr("cx", function(d){ return posByValues(d).x; })
                        .attr("cy", function(d){ return posByValues(d).y; })
                            .on("mousemove", function(d) {
      tooltip.style("left", d3.event.pageX + 15 + "px");
      tooltip.style("top", d3.event.pageY + "px");
      tooltip.style("display", "inline-block");
      tooltip.html("<img src='img/" + d.data.key + ".svg'/> <b>Agency:</b> " + d.data.value.name + "<br/>" + "<b># of Projects:</b> " + d.data.value.count + " <br/> <b>Cost of Projects:</b> " + d.data.value.total + " <br/> <b>Percentage of total:</b> ??%");
    })
    .on("mouseout", function(d) {
      tooltip.style("display", "none");
    })


  bubbles = bubbles.merge(bubblesElements);

  bubbles.transition()
          .duration(0)
          .attr('r', function(d) { return d.radius; });

  simulation.nodes(data);
  splitBubbles();
  showTitles();
  showLegend();
}

function tick() {
    bubbles.attr('cx', function (d) { return d.x; })
            .attr('cy', function (d) { return d.y; });
}

function charge(d) {
  return -Math.pow(d.radius, 2.5) * forceStrength;
}

function splitBubbles() {
  simulation.force('x', d3.forceX().strength(forceStrength).x(posByValuesX))
  simulation.force('y', d3.forceY().strength(forceStrength).y(posByValuesY))
  simulation.alpha(1).restart();
}


var titleData = {
  "Under Budget": { x: width / 3, y: 40},
  "On Budget": { x: width / 2, y: 40 },
  "Over Budget": { x: 2 * (width / 3), y: 40},
  "Ahead of Schedule": { x: 40, y: height / 3 },
  "On Schedule": { x: 40, y: height / 2 },
  "Behind Schedule": { x: 40, y: 2 * (height / 3) },
  };

function showTitles() {
  var data = d3.keys(titleData);
  var titles = chart.selectAll('.title')
                .data(data);

  titles.enter().append('text')
        .attr('class', 'title')
        .attr('x', function (d) { return titleData[d].x; })
        .attr('y', function (d) { return titleData[d].y; })
        .attr('text-anchor', 'middle')
        .text(function (d) { return d; });
}

function showLegend() {
  var legendRectSize = 20;
  var legendSpacing = 5;
  var legend = d3.select('.chart2')
    .append("g")
    .selectAll("g")
    .data(colour2.domain())
    .enter()
    .append('g')
      .attr('class', 'legend')
      .attr('transform', function(d, i) {
        var x = 0;
        var y = i * legendRectSize;
        return 'translate(' + x + ',' + y + ')';
    });

legend.append('rect')
    .attr('width', legendRectSize)
    .attr('height', legendRectSize)
    .style('fill', colour2)
    .style('stroke', colour2)
    .on("click", filter);

legend.append('text')
    .attr('x', legendRectSize + legendSpacing)
    .attr('y', legendRectSize - legendSpacing)
    .text(function(d) { return d; })
    .on("click", filter);
}

function filter(d) { 
  var index = filteredArray.indexOf(d);
  if( index === -1 ) {
    filteredArray.push(d);
  } else {
    filteredArray.splice(index, 1);
  }
  var newData = processData(orgData);
  changeData2(newData);
}