var width = 500,
	height = 500,
	radius = Math.min(width, height) / 2;

/*var zoom = d3.zoom()
				.on("zoom", function() {
					
	//					container.attr("transform", d3.event.transform);
				});*/

var hasZoomed = false;
var newGraph = false;

var zoom = d3.zoom()
    .scaleExtent([1, 10])
    .on("zoom", function() {
    			donutCentre.style("display", "none");
    	  container.attr("transform", function() { 
    	  	console.log(hasZoomed); 
    	  	if( !hasZoomed) { 
    	  		hasZoomed = true; 
    	  		d3.event.transform.x = d3.event.transform.x + width/2; 
    	  		d3.event.transform.y = d3.event.transform.y + height/2; 
    	  	} 
	   	  	if( newGraph) { 
    	  		console.log(newGraph)
    	  		newGraph = false; 
    	  		d3.event.transform.x = d3.event.transform.x - width/2; 
    	  		d3.event.transform.y = d3.event.transform.y - height/2; 
    	  	} 
    	  	console.log(d3.event.transform);
    	  	return d3.event.transform;
    	  } );


    });


var chart = d3.select(".chart1")
					.attr("width", width)
					.attr("height", height);

var container = chart.append("g")
					.attr("transform", "translate(" + width / 2 + ", " + height / 2 + ")")
					.call(zoom);

var colour = d3.scaleOrdinal(d3.schemeCategory20);

var pie = d3.pie()
			.value(function(d) { return d.value.total; })
			

var path = d3.arc()
			 	.outerRadius(radius - 10)
				.innerRadius(0);

var donutPath = d3.arc()
					.outerRadius(radius - 10)
					.innerRadius(radius - 100);

var label = d3.arc()
				.outerRadius(radius - 40)
				.innerRadius(radius - 40);

var tooltip = d3.select("body").append("div").attr("class", "tooltip");
var backButton = d3.select(".backArrow");
var zoomReset = d3.select(".zoomReset")
					.on("click", resetZoom);

function resetZoom() {
	container.attr("transform", "translate(" + width / 2 + ", " + height / 2 + ")")
				.call(zoom);
				hasZoomed = false;

		};

var zoomLevel = 0;

var totalsForAgencies, investmentsByAgencies, projectByUII, total, orgTotal = null;

var currentAgency = null;

//var donutText = container.append("g");
var donutCentre = d3.select(".donutCentre");


d3.csv("data.csv", type, function(error, data) {
	if (error) throw error;

	total = d3.sum(data, function(d) { 
            			return d["Lifecycle Cost"]; 
       				});

	orgTotal = total;

	totalsForAgencies = d3.nest()
							.key(function(d) { return d["Agency Code"]; } )
							.rollup(function(d) { return {
								name: d[0]["Agency Name"],
								total: d3.sum(d, function(g) { return g["Lifecycle Cost"]; }),
								count: d.length,
							}; })
							.entries(data);

	investmentsByAgencies = d3.nest()
								.key(function(d) { return d["Agency Code"]; } )
								.key(function(d) { return d["Unique Investment Identifier"]; })
								.rollup(function(d) { return {
									name: d[0]["Investment Title"],
									total: d3.sum(d, function(g) { return g["Lifecycle Cost"]; }),
									count: d.length
								}; })
								.entries(data);

	projectByUII = d3.nest()
						.key(function(d) { return d["Unique Investment Identifier"]; })
						.key(function(d) { return d["Project ID"]})
						.rollup(function(d) { return {
							name: d[0]["Project Name"],
							total: d3.sum(d, function(g) { return g["Lifecycle Cost"]; }),
						}; })
						.entries(data);
	changeData(totalsForAgencies);

});

function type(d) {
	d["Lifecycle Cost"] = +d["Lifecycle Cost"];
	d["Agency Code"] = +d["Agency Code"];
	return d;
}

function changeData(data) {
	resetZoom();
	changeGraphData(data);
	changeTableData(data);
}

function changeGraphData(data) {
	container.selectAll(".arc").remove();

	var arc = container.selectAll(".arc")
				.data(pie(data))
				.enter().append("g")
						.attr("class", "arc");

	var currentPath = donutPath;
	if( zoomLevel == 0 ) {
		currentPath = path;
	}

	arc.append("path")
		.attr("d", currentPath)
		.attr("fill", function(d) { return colour(d.value) })
		.on("mousemove", function(d) {
			tooltip.style("left", d3.event.pageX + 15 + "px");
			tooltip.style("top", d3.event.pageY + "px");
			tooltip.style("display", "inline-block");
			if( zoomLevel === 0 ) {
		   		tooltip.html("<img src='img/" + d.data.key + ".svg'/> <b>Agency:</b> " + d.data.value.name + 
		   			"<br/>" + "<b># of Projects:</b> " + d.data.value.count + 
		   			" <br/> <b>Cost of Projects:</b> $" + parseFloat(Math.round(d.data.value.total)).toLocaleString() + 
		   			"m <br/> <b>Percentage of total:</b> " + parseFloat(Math.round(d.data.value.total / total * 100)) + "%");
			} else if( zoomLevel === 1) {
				tooltip.html("<b>Unique Investment Identifier:</b> " + d.data.key + "<br/>" + 
					"<b># of Investments:</b> " + d.data.value.count + " <br/> <b>Cost of Investment:</b> $" 
					+ parseFloat(Math.round(d.data.value.total)).toLocaleString() +
					"m <br/> <b>Percentage of total:</b> " + parseFloat(Math.round(d.data.value.total / total * 100)) + "%");
;
			}
		})
		.on("mouseout", function(d) {
			tooltip.style("display", "none");
		})
		.on("click", function(d) {
			if( zoomLevel === 2 ) {
				return;
			}
			var data;
			if( zoomLevel === 0 ) {
		 		data = filterData(investmentsByAgencies, d.data.key);
		 		zoomLevel = 1;
		 		currentAgency = d.data.key;
			} else if ( zoomLevel === 1 ) {
				total = d.data.value.total;
				data = filterData(projectByUII, d.data.key);
				zoomLevel = 2;
			}

			changeData(data);
			newGraph = true;

		})
		.transition()
			.duration(1000)
			.attrTween("d", function(a) {
				var interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, a);
				return function(d) {
					if( zoomLevel == 0 ) {
						return path(interpolate(d));
					}
					return donutPath(interpolate(d));
				}
			});


/*	arc.append("text")
		.attr("transform", function(d) { return "translate(" + label.centroid(d) + ")"; })
		.attr("dy", "0.35em")
		.text(function(d) { return d.key; });*/

	if( zoomLevel === 2 ) {
		backButton.style("display", "inline-block");
		backButton.on("click", function(d) {
			var data = filterData(investmentsByAgencies, currentAgency);
			zoomLevel = 1;
			changeData(data);
		})
	} else if ( zoomLevel === 1 ) {
		backButton.style("display", "inline-block");
		backButton.on("click", function(d) {
			zoomLevel = 0;
			currentAgency = null;
			changeData(totalsForAgencies);
			total = orgTotal;
		})
	} else {
		backButton.style("display", "none");
	}

	//donutText.selectAll().remove();
	if( zoomLevel === 1 ) {
		var data = filterAgencyData(totalsForAgencies, currentAgency);
		total = data.value.total;
		donutCentre.style("display", "inline-block");
		donutCentre.style("postion", "absolute");
					donutCentre.style("left", "150px");

			donutCentre.style("top", "150px");

		donutCentre.html("<img src='img/" + data.key + ".svg' width='175px'/> <br/><b>Agency:</b> " + data.value.name + 
		   			"<br/>" + "<b># of Projects:</b> " + data.value.count + 
		   			" <br/> <b>Cost of Projects:</b> $" + parseFloat(Math.round(data.value.total)).toLocaleString() + 
		   			"m <br/> <b>Percentage of total:</b> " + parseFloat(Math.round(data.value.total / total * 100)) + "%");

		/*donutText.append("svg:image")
					.attr("xlink:href", "img/" + data.key + ".svg")				
		donutText.append("text")
					.attr("text-anchor", "middle")
					.attr('font-size', '4em')
					.attr('y', 20)
					.text(data.value.name);*/
	}


}

function filterData(data, filter) {
	for(var key in data) {
		if( data[key].key === filter ) {
			return data[key].values;
		}
	}
	return null;
}

function filterAgencyData(data, filter) {
	for(var key in data) {
		if( data[key].key === filter ) {
			return data[key];
		}
	}
	return null;
}
function changeTableData(data) {
	tooltip.style("display", "none");
	d3.select('#table').selectAll('table').remove();

	var sortAscending = true;
	var currentSortedColumn = null;

	var table = d3.select('#table').append('table');
	var titles = d3.keys(data[0].value);
	
	var headers = table.append('thead').append('tr')
					.selectAll('th')
					.data(titles).enter()
					.append('th')
					.text(function (d) {
						if( d == "name" ) { 
							if( zoomLevel == 0) {
								return "Agency Name";
							} else if ( zoomLevel == 1 ) {
								return "Investment Name";
							}
							return "Project Name"
						}
						if( d == "total" ) {
							return "Total Cost ($m)";
						}
						if( d == "count" ) {
							if( zoomLevel == 0) {
								return "Number of Investments";
							} else if ( zoomLevel == 1 ) {
								return "Number of Projects";
							} 
						}
						return d;
					})
					.on('click', function (d) {
						headers.attr('class', 'header');
						
						if (currentSortedColumn !== d || (sortAscending && currentSortedColumn === d) ) {
							rows.sort(function(a, b) { return d3.ascending(a.value[d], b.value[d]) });
							sortAscending = false;
							this.className = 'header asc';
							pie.sort(function(a, b) { return d3.ascending(a.value[d], b.value[d]); });
						} else {
							rows.sort(function(a, b) { return d3.descending(a.value[d], b.value[d]) });
							sortAscending = true;
							this.className = 'header dsc';
							pie.sort(function(a, b) { return d3.descending(a.value[d], b.value[d]); });	
						}
						changeGraphData(data);
						currentSortedColumn = d;							   
					});

	headers.attr('class', 'header');
		  
	var rows = table.append('tbody').selectAll('tr')
					.data(data).enter()
					.append('tr');

	rows.selectAll('td')
		.data(function (d) {

			d.value.total = parseFloat(Math.round(d.value.total)).toLocaleString();
			return titles.map(function (k) {
				return { 'value': d.value[k], 'name': k};
			});
		}).enter()
		.append('td')
		//.attr('data-th', function (d) {
		//	return d.name;
		//})
		.text(function (d) {
			return d.value;
		});
}
