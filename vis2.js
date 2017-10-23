var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 1000 - margin.left - margin.right,
    height = 1000 - margin.top - margin.bottom;

var xScale = d3.scaleLinear()
                .range([0, width]);

var yScale = d3.scaleLinear()
                .range([height, 0]);

var xAxis = d3.axisBottom(xScale);

var yAxis = d3.axisLeft(yScale);

var getXValue = function(d) { return d["Schedule Variance (%)"]; };
var getYValue = function(d) { return d["Cost Variance (%)"]; };
//var getXValue = function(d) { return d["Agency Code"]; };
var getCValue = function(d) { return d["Agency Name"]; }
var colour = d3.scaleOrdinal(d3.schemeCategory20);


var chart = d3.select(".chart")
          .attr("width", width)
          .attr("height", height);

var container = chart.append("g")
          .attr("transform", "translate(" + width / 2 + ", " + height / 2 + ")");

var tooltip = d3.select("body").append("div").attr("class", "tooltip");

d3.csv("data.csv", type, function(error, data) {
  if (error) throw error;

  xScale.domain([d3.min(data, getXValue)-1, d3.max(data, getXValue)+1]);
  yScale.domain([d3.min(data, getYValue)-1, d3.max(data, getYValue)+1]);

  chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
        .append("text")
          .attr("class", "label")
          .attr("x", width)
          .attr("y", -6)
          .style("text-anchor", "end")
          .text("Over/Under Schedule");    

  chart.append("g")
            .attr("class", "y axis")
            .call(yAxis)
        .append("text")
          .attr("class", "label")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", ".70em")
          .style("text-anchor", "end")
          .text("Over/Under Budget");    


  chart.selectAll(".dot")
          .data(data)
        .enter().append("circle")
          .attr("class", "dot")
          .attr("r", 3.5)
          .attr("cx", function(d) { return xScale(getXValue(d)); } )
          .attr("cy", function(d) { return yScale(getYValue(d)); } )
          .style("fill", function(d) { return colour(getCValue(d)); })
          .on("mousemove", function(d) {
              tooltip.style("left", d3.event.pageX + 15 + "px");
              tooltip.style("top", d3.event.pageY + "px");
              tooltip.style("display", "inline-block");
              tooltip.html(d["Investment Name"] + "<br/> put details here?");
            })
          .on("mouseout", function(d) {
              tooltip.style("display", "none");
            });
  
  var legend = chart.selectAll(".legend")
      .data(colour.domain())
    .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

  legend.append("rect")
      .attr("x", width - 18)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", colour);

  legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function(d) { return d; });
});

function type(d) {
  d["Schedule Variance (%)"] = +d["Schedule Variance (%)"];
  d["Cost Variance (%)"] = +d["Cost Variance (%)"];
  d["Agency Code"] = +d["Agency Code"];
  d["Lifecycle Cost"] = +d["Lifecycle Cost"];
  return d;
}