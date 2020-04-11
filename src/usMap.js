import * as d3 from 'd3';
import * as topo from 'topojson'

export default function usMap(){
  var version = "0.1.0",
      margin = { top: 20, bottom: 20, left: 50, right: 30},
      dimension = {  },
      selection,
      x, y,
      width, height,
      svg,
      dataManager;
  var svgWidth = 975+margin.top+margin.bottom,
    svgHeight = 610+margin.right+margin.left;

  var path = d3.geoPath();

  var chart = function(sel){
      selection = sel;
      if (selection == undefined) {
          console.error("selection is undefined");
          return;
      };

      var debugCount = 0;

      svg = selection.append('svg')
        .attr('width', svgWidth)
        .attr('height', svgHeight)
        .attr('viewBox',[0, 0, 975, 610]);

      chart.counties = svg.append('g').attr('id', 'mapArea')
        .attr('x', margin.right)
        .attr('y', margin.top);

      chart.drawGeo = function(us) {
        chart.counties.selectAll("path")
          .data(topo.feature(us, us.objects.counties).features)
          .enter().append("path")
            .attr("fill", "black")
            .attr("d", path)
            .attr("class","county");
      };

      chart.update = function(curTime) {
        var allCounties = chart.counties.selectAll('.county');

        // Don't update non-existant things
        if(allCounties.empty()) return;

        // Get the current timepoint's data
        chart.curStorms = dataManager.getStormAtTime(curTime);

        if(!chart.curStorms) return;

        if(debugCount < 5){
          debugCount += 1;

          console.log(chart.curStorms);
        }

        // Show the flooding
        allCounties.attr('fill', function(d){
          if(!chart.curStorms[d.id]) return 'black';

          return d3.rgb(0,30+chart.curStorms[d.id].winds,30+chart.curStorms[d.id].floods);
        });
      };

      return chart;
  }

  // svg width
  chart.width = function(_) {
    if (arguments.length == 0) return svgWidth;
    svgWidth = _;
    return chart;
  }

  // svg height
  chart.height = function(_) {
    if (arguments.length == 0) return svgHeight;
    svgHeight = _;
    return chart;
  }

  // Our handy data manager
  chart.dataManager = function(_) {
    if (arguments.length == 0) return dataManager;
    dataManager = _;
    return chart;
  }

  return chart;
};
