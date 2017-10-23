var width = 1000,
    height = 1000;

var duration = 10;

var colour = d3.scale.category20();

var venn = d3.layout.venn()
                        .size([width, height])
                            .setsSize(x => (Math.log(x) + 1))
                        .padding(0)
                        .packingStragegy(d3.layout.venn.force)

var chart = d3.select(".chart")
          .attr("width", width)
          .attr("height", height);

/*d3.json("venn.json", function(error, data) {
  if (error) throw error;
  console.log(data);

  drawVennDiagram(data);
  
});*/

d3.csv("data.csv", type, function(error, data) {
  if (error) throw error;

  var newData = [];
  for( var key in data ) {
    var d = data[key];
    var newD = {"set": [], "name": d["Project ID"], "r": 4 };

    if( d["Schedule Variance (%)"] > 0 ) {
      newD.set.push( "as" );
    } else if ( d["Schedule Variance (%)"] < 0 ) {
      newD.set.push( "bs" );
    }

    if( d["Cost Variance (%)"] > 0 ) { 
      newD.set.push( "ub" );
    } else if ( d["Cost Variance (%)"] < 0 ) {
      newD.set.push( "ob" );
    } 


    if( newD.set.length > 0 ) {
      newData.push(newD);
    }
  }

  drawVennDiagram(newData);
  
});

function type(d) {
  d["Schedule Variance (%)"] = +d["Schedule Variance (%)"];
  d["Cost Variance (%)"] = +d["Cost Variance (%)"];
  return d;
}

function drawVennDiagram(data) {

 /*var data = [
        {"set":["A"],"name":"node_0"},
        {"set":["B"],"name":"node_1"},
        {"set":["B","A"],"name":"node_2"},
        {"set":["B","A"],"name":"node_3"}
        ];
*/
console.log(data);

  venn.nodes(data);

  var vennArea = chart.selectAll("g.venn-area")
                      .data(venn.sets().values(), function(d) {
                            return d.__key__;
                          });  

  var vennEnter = vennArea.enter()
                          .append('g')
                          .attr('class', function(d) { 
                            return "venn-area venn-" + (d.sets.length == 1 ? "circle" : "intersection");
                          })
                          .attr('fill', function(d, i) { return colour(i); } );

  vennEnter.append('path')
            .attr('class', 'venn-area-path');

  vennEnter.append('circle')
            .attr('class', 'inner')
            .attr('fill', 'grey');

  vennEnter.append('text')
              .attr('class', 'label')
              .attr('text-anchor', 'middle')
              .attr('dy', '.35em'); 

  vennArea.selectAll('path.venn-area-path')
            .transition()
              .duration(duration)
              .attr('opacity', 0.1)
              .style('stroke', 'black')
              .style('stroke-width', '1.8')
              .attrTween('d', function(d) { return d.d } );

  vennArea.selectAll('text.label')
          .data(function(d) { return [d]; } )
          .text(function(d) { return d.__key__; } )
          .attr('x', function(d) { return d.center.x; } )
          .attr('y', function(d) { return d.center.y; } );

  vennArea.selectAll('circle.inner')
          .data(function(d) { return [d]; } )
          .transition()
          .duration(duration)
          .attr('opacity', 0.2)
          .attr('cx', function(d) { return d.center.x; } )
          .attr('cy', function(d) { return d.center.y; } )
          .attr('r', function(d) { return d.innerRadius; } );

  vennArea.exit()
          .transition()
          .duration(duration)
          .attrTween('d', function(d) { return d.d } )
          .remove();

  var circleContainer = chart.selectAll("g.venn-circle-container")
                              .data(venn.sets().values(), function(d) { return d.__key__; });

  circleContainer.enter()
                  .append('g')
                  .attr('class', 'venn-circle-container')
                  .attr('fill', function(d, i) { return colour(i); } );
  circleContainer.exit().remove();

  var points = circleContainer.selectAll("circle.node")
                              .data(function(d) { return d.nodes; }, function (d) { return d.name; } );

  var pointsEnter = points.enter()
                          .append('circle')
                          .attr('r', 0)
                          .attr('class', 'node')
                          .call(venn.packer().drag);

  points.transition()
        .duration(duration)
        .attr('r', function(d) { return d.r; } );

  points.exit()
        .transition()
        .attr('r', 0)
        .remove();

  venn.packingConfig({
    ticker: function() {
      points.attr('cx', function(d) { return d.x; } )
            .attr('cy', function(d) { return d.y; } )
    }
  })


  venn.packer().start();
}