import * as d3 from 'd3';
import * as topo from 'topojson'

export default function usMap(){
  var version = "0.1.0",
      margin = { top: 40, bottom: 20, left: 50, right: 30},
      selection,
      svg,
      bgColor,
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

      chart.defs = svg.append('defs');

      chart.timeTitle = svg.append('text').attr('id', 'currentTime')
        .attr('font-size','1.2em')
        .attr('font-family','DejaVu Sans Mono, monospace')
        .attr('x', svgWidth - 200)
        .attr('y', 80)
        .attr('text-anchor', 'end')
        .text('Mon Year')
        .attr('fill', bgColor);

      chart.mainTitle = svg.append('text').attr('id', 'chartTitle')
        .attr('font-size','1.7em')
        .attr('font-family','Trebuchet MS, sans-serif')
        .attr('x', svgWidth/2)
        .attr('y', 10)
        .attr('text-anchor', 'middle')
        .text(title)
        .attr('fill', bgColor);

      // Our loading indicator
      chart.loading = svg.append('g').attr('id','loadingIndicator')
      chart.loading.append('text').attr('id','loadingText')
        .attr('font-size','.7em')
        .attr('font-family','Trebuchet MS, sans-serif')
        .attr('x', (svgWidth-margin.left-margin.right)/2 - 25)
        .attr('y', 35)
        .attr('text-anchor', 'right')
        .attr('fill', bgColor)
        .text('Loading Data...');
      chart.loadRot = chart.loading.append('g').attr('id','loadingWheel')
        .attr('transform', 'translate('+(svgWidth/2 + 25)+', 31)')
        .append('g').attr('id','wheelRotation');

      var wheelRadius = 6;
      [0, 60, 120, 180, 240, 320].forEach(function(d,i){
        chart.loadRot.append('circle').attr('class','loadingCirc')
          .attr('cx', Math.sin(Math.PI*(i/3))*wheelRadius)
          .attr('cy', Math.cos(Math.PI*(i/3))*wheelRadius)
          .attr('r', 2)
          .attr('fill', bgColor);
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
        .attr('transform','translate('+(svgWidth-margin.right-150)+','+(svgHeight/2 + 90)+')');

      // Group for our masks
      chart.masks = svg.append('g').attr('id', 'masks');

      // Path for showing selected counties
      chart.highlight = svg.append('path').attr('id','highlighter')
        .attr('transform', 'translate('+margin.right+','+margin.top+')')
        .attr('stroke-width', 2)
        .attr('stroke','rgb(244, 242, 73)')
        .attr('fill','none');

      // Replaceable callback for on selection
      // Gets the id of the county selected
      chart.onCountySelection = function(countyID) {
        console.log("Selected county "+countyID);
      };

      // For selecting a county (on click)
      chart.curSelection = null;
      chart.select = function(d) {
        // Set stroke to normal on old selection, if it exists
        // if(chart.curSelection) {
        //   chart.curSelection.attr('stroke','none');
        // }
        //
        // chart.curSelection = d3.select(this).attr('stroke','cyan');

        // Copy the path data from our selection to the highlight
        chart.highlight.attr('d', d3.select(this).attr('d'));

        chart.onCountySelection(d.id);
      };

      // For selecting a county by id
      chart.selectID = function(countyID) {
        chart.counties.select('[id="'+countyID+'"]')
          .each(chart.select);
      };

      chart.countyBG = bgColor;

      // For adding gradients, based on a d3 color scale
      // First is the color scale, next is the id of the gradient
      // Next is a scale that maps from y values to the width of the rect
      // And finally, the width of the rect
      chart.addGrad = function(color, num, numScale, width) {
        var grad = chart.defs.append('linearGradient').attr('id','grad'+num)
          .attr('x1','0')
          .attr('x2','1')
          .attr('y1','0')
          .attr('y2','0');
        const d = [0, width];
        var x = d[0];
        const dx = (d[1] - d[0])/100;
        for(var i=0; i < 100; i++) {
          var c = color(numScale.invert(x));
          grad.append('stop')
            .attr('offset', i+'%')
            .attr('stop-color', c);

          x += dx;
        }
      };

      // For adding patterns
      // Adds a pattern to our defs with the right id, returns selection
      // So you can actually fill the pattern
      chart.addPattern = function(name) {
        var pat = chart.defs.append('pattern').attr('id', name)
          .attr('patternUnits','userSpaceOnUse')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', 5)
          .attr('height', 5);

        // Add a rectangle
        pat.append('rect').attr('x','0').attr('y','0')
          .attr('width', 5)
          .attr('height',5)
          .attr('fill', 'black');

        return pat;
      };

      // Adds a big mask with a pattern
      chart.addMask = function(maskName, patternName) {
        var m = chart.masks.append('mask').attr('id', maskName);
        m.append('rect').attr('x',0).attr('y',0)
          .attr('width', svgWidth)
          .attr('height',svgHeight)
          .attr('stroke','none')
          .attr('fill','url(#'+patternName+')');
      };

      // Draw our geography once we load it
      chart.drawGeo = function(us) {
        console.log(us);
        console.log(topo.feature(us, us.objects.nation).features);

        chart.counties.selectAll("path")
          //.data(topo.feature(us, us.objects.nation).features)
          .data(topo.feature(us, us.objects.counties).features)
          .enter().append("path")
            .attr('id', function(d){ return d.id; })
            .attr("fill", chart.countyBG)
            .attr("stroke", "rgb(64, 33, 38)")
            .attr("d", path)
            .attr("class","county")
            .on('click', chart.select);

        chart.layers = [];
        var rw = 120, rh = 15, spacing = 70;
        layerConfig.forEach(function(conf,i){
          var layer = chart.layerContainer.append('g').attr('id','layer'+i);
          layer.selectAll("path")
            .data(topo.feature(us, us.objects.counties).features)
            .enter().append("path")
              .attr('id', function(d){ return d.id; })
              .attr("fill", 'none')
              .attr("d", path)
              .attr("class","countyL"+i)
              .on('click', chart.select)
              .attr('mask', conf.mask? 'url(#'+conf.mask+')' : 'none');
          chart.layers.push(layer);

          // Add a legend bar as well

          // First need to make the gradient in our defs
          chart.addGrad(conf.scale, i, conf.numScale, rw);

          chart.legend.append("rect").attr('id','scaleBG'+i)
            .attr("x", 0)
            .attr("y", i*spacing)
            .attr("width", rw)
            .attr("height", rh)
            .attr("fill", chart.countyBG);
          chart.legend.append("rect").attr('id','scale'+i)
            .attr("x", 0)
            .attr("y", i*spacing)
            .attr("width", rw)
            .attr("height", rh)
            .attr('mask', conf.mask? 'url(#'+conf.mask+')' : 'none')
            .attr("fill", 'url(#grad'+i+')');
          chart.legend.append('g').attr('id','scale'+i+'Axis')
            .attr('transform','translate(0,'+(i*spacing)+')')
            .call(d3.axisTop(conf.numScale).tickValues([1,5,10,20,35,65,120]))
            .call(function(g){
              g.select('.domain').attr('stroke','none');
              g.selectAll(".tick line").attr("y1", rh);
            });
          chart.legend.append('text').attr('id','label'+i)
            .attr('text-anchor','middle')
            .attr('font-size', 11)
            .attr('font-family', 'Trebuchet MS, sans-serif')
            .attr('y', i * spacing - 25)
            .attr('x', rw/2)
            .text(conf.name);
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

  // chart title
  chart.bgColor = function(_) {
    if (arguments.length == 0) return bgColor;
    bgColor = _;
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
