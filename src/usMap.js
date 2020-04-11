import * as d3 from 'd3';
import * as topo from 'topojson'

export default function usMap(){
  var version = "0.1.0",
      margin = { top: 20, bottom: 20, left: 50, right: 30},
      selection,
      svg,
      layerConfig=[],
      dataManager, timer, title;
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

      chart.timeTitle = svg.append('text').attr('id', 'currentTime')
        .attr('font-size','1.2em')
        .attr('font-family','DejaVu Sans Mono, monospace')
        .attr('x', svgWidth - 200)
        .attr('y', 80)
        .attr('text-anchor', 'end')
        .text('Mon Year');

      chart.mainTitle = svg.append('text').attr('id', 'chartTitle')
        .attr('font-size','1.7em')
        .attr('font-family','Trebuchet MS, sans-serif')
        .attr('x', svgWidth/2)
        .attr('y', 10)
        .attr('text-anchor', 'middle')
        .text(title);

      // Our loading indicator
      chart.loading = svg.append('g').attr('id','loadingIndicator')
      chart.loading.append('text').attr('id','loadingText')
        .attr('font-size','.7em')
        .attr('font-family','Trebuchet MS, sans-serif')
        .attr('x', svgWidth/2 - 40)
        .attr('y', 35)
        .attr('text-anchor', 'middle')
        .text('Loading Data...');
      chart.loadRot = chart.loading.append('g').attr('id','loadingWheel')
        .attr('transform', 'translate('+(svgWidth/2 + 20)+', 30)')
        .append('g').attr('id','wheelRotation');

      var wheelRadius = 6;
      [0, 60, 120, 180, 240, 320].forEach(function(d,i){
        chart.loadRot.append('circle').attr('class','loadingCirc')
          .attr('cx', Math.sin(Math.PI*(i/3))*wheelRadius)
          .attr('cy', Math.cos(Math.PI*(i/3))*wheelRadius)
          .attr('r', 2);
      });
      var loadingAngle = 0;
      chart.loadingAnim = setInterval(function(){
        loadingAngle += 8;
        loadingAngle = loadingAngle % 360;
        chart.loadRot.attr('transform','rotate('+loadingAngle+')');
      }, 1000/20);

      // Prep our counties and layer containers
      chart.counties = svg.append('g').attr('id', 'mapArea')
        .attr('transform', 'translate('+margin.right+','+margin.top+')');
      chart.layerContainer = svg.append('g').attr('id', 'layerContainer')
        .attr('transform', 'translate('+margin.right+','+margin.top+')');

      // Prep the legend
      chart.legend = svg.append('g').attr('id','legend')
        .attr('transform','translate('+(svgWidth-margin.right-40)+','+(svgHeight/2 + 50)+')');

      // Replaceable callback for on selection
      // Gets the id of the county selected
      chart.onCountySelection = function(countyID) {
        console.log("Selected county "+countyID);
      };

      // For selecting a county (on click)
      chart.curSelection = null;
      chart.select = function(d) {
        // Set stroke to normal on old selection, if it exists
        if(chart.curSelection) {
          chart.curSelection.attr('stroke','none');
        }

        chart.curSelection = d3.select(this).attr('stroke','cyan');

        chart.onCountySelection(d.id);
      };

      // For selecting a county by id
      chart.selectID = function(countyID) {
        chart.counties.select('[id="'+countyID+'"]')
          .each(chart.select);
      };

      chart.countyBG = "rgb(50, 46, 55)";

      // Draw our geography once we load it
      chart.drawGeo = function(us) {
        //console.log(topo.feature(us, us.objects.counties).features);

        chart.counties.selectAll("path")
          .data(topo.feature(us, us.objects.counties).features)
          .enter().append("path")
            .attr('id', function(d){ return d.id; })
            .attr("fill", chart.countyBG)
            .attr("d", path)
            .attr("class","county")
            .on('click', chart.select);

        chart.layers = [];
        layerConfig.forEach(function(conf,i){
          var layer = chart.layerContainer.append('g').attr('id','layer'+i);
          layer.selectAll("path")
            .data(topo.feature(us, us.objects.counties).features)
            .enter().append("path")
              .attr('id', function(d){ return d.id; })
              .attr("fill", 'none')
              .attr("d", path)
              .attr("class","countyL1")
              .on('click', chart.select);
              //.attr('mask','url(#'+conf.mask+')');
          chart.layers.push(layer);

          // Add a legend bar as well

        });
      };

      // Update the chart with a new timepoint
      chart.update = function(curTime) {
        // Update time title
        chart.timeTitle.text(timer.getTimeStr());

        var allCounties = chart.counties.selectAll('.county');

        // Don't update non-existant things
        if(allCounties.empty()) return;

        // Get the current timepoint's data
        chart.curStorms = dataManager.getStormAtTime(curTime);

        if(!chart.curStorms) return;

        // if(debugCount < 5){
        //   debugCount += 1;
        //
        //   console.log(chart.curStorms);
        // }

        // Show the flooding
        layerConfig.forEach(function(conf,i){
          chart.layers[i].selectAll("path").attr('fill', function(d){
            if(!chart.curStorms[d.id] || ! chart.curStorms[d.id][conf.dataID]) return 'none';
            return conf.scale(chart.curStorms[d.id][conf.dataID]);
          });
        });
        // allCounties.attr('fill', function(d){
        //   if(!chart.curStorms[d.id]) return chart.countyBG;
        //
        //   return d3.rgb(0,30+chart.curStorms[d.id].w,30+chart.curStorms[d.id].f);
        // });
      };

      // Function to end the loading indication
      chart.endLoading = function(){
        clearInterval(chart.loadingAnim);
        chart.loading.attr('display','none');
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

  // chart title
  chart.title = function(_) {
    if (arguments.length == 0) return title;
    title = _;
    return chart;
  }

  // Configure Layers
  // Input should be an array of objects with:
  //  name, colorScale, dataID, mask
  chart.layerConfig = function(_) {
    if (arguments.length == 0) return layerConfig;
    layerConfig = _;
    return chart;
  }

  // Our handy data manager
  chart.dataManager = function(_) {
    if (arguments.length == 0) return dataManager;
    dataManager = _;
    return chart;
  }

  // Our handy timer
  chart.timer = function(_) {
    if (arguments.length == 0) return timer;
    timer = _;
    return chart;
  }

  return chart;
};
