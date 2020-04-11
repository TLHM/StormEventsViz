/*
  A line plot that also displays the current time, and allows
  You to select a specific time
*/

import * as d3 from 'd3';

export default function timeChart() {
  var timeRange = [new Date("1950"), new Date("2020")],
    timeTicks,
    yRange,
    yLabel,
    lineLabels,
    lineStyles,
    onPlay,
    onSelectTime;

  // Create our plot
  var plot = function(sel) {
    if (sel == undefined) {
        console.error("selection is undefined");
        return;
    };

    // Set our margins
    plot.margin = {top: 10, right: 90, bottom: 20, left: 50};

    // Get our selection
    plot.selection = sel;
    plot.size = {width: 880, height: 150};

    // Create header div for play button
    plot.controls = plot.selection.append('div').attr('id', 'timeController')
      .attr('style','width:150px; margin:0 auto');
    plot.controls.append('button').attr('type','button')
      .text('Play')
      .on('click', onPlay);

    // Create the base svg
    plot.svg = plot.selection.append('svg').attr('id', 'timePlot')
      .attr('width', plot.size.width+'px')
      .attr('height', plot.size.height+'px');
    plot.body = plot.svg.append("g")
      .attr('transform','translate('+plot.margin.left+','+plot.margin.top+')')
      .attr('id','plotBody');
    plot.body.append('rect').attr('id','bg')
      .attr('width',(plot.size.width-plot.margin.left-plot.margin.right)+'px')
      .attr('height',(plot.size.height-plot.margin.top-plot.margin.bottom)+'px')
      .attr('fill-opacity','.001');

    // Group for lines
    plot.lineG = plot.body.append('g').attr('id', 'lineG');

    // Add legend
    plot.legend = plot.svg.append('g').attr('id', 'timeChartLegend')
      .attr('transform','translate('+(plot.size.width - plot.margin.right)+
        ','+(plot.size.height / 2)+')');
    plot.leglabels = plot.legend.selectAll('g')
      .data(lineLabels)
      .join('g')
        .attr('id','chanLabel');
    plot.leglabels.append('line')
      .attr('x1', function(d,i){ return 10; })
      .attr('x2', function(d,i){ return 30; })
      .attr('y1', function(d,i){ return 20*i; })
      .attr('y2', function(d,i){ return 20*i; })
      .attr('style', function(d,i){ return lineStyles ? lineStyles[i] : 'stroke-width=2'; });
    plot.leglabels.append('text')
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "left")
      .attr("y", function(d,i){ return 20*i + 4; })
      .attr("x", function(d,i){ return 35; })
      .text(function(d){ return d; });

    // Create our xAxis
    plot.xScale = d3.scaleTime()
      .domain(timeRange)
      .range([0, plot.size.width-plot.margin.left-plot.margin.right])
      .clamp(true);
    plot.xAxis = plot.body.append('g')
        .attr('id', 'xAxis')
        .attr('transform','translate(0,'+(plot.size.height-plot.margin.bottom-plot.margin.top)+')')
        .call(d3.axisBottom(plot.xScale));

    // Create our y Axis
    plot.yScale = d3.scaleSymlog()
      .domain(yRange)
      .range([plot.size.height-plot.margin.bottom-plot.margin.top,0]);
    plot.yAxis = plot.yAxis = plot.body.append("g")
        .attr('id', 'yAxis')
        .call(d3.axisLeft(plot.yScale).tickValues([1,5,10,20,40,80,120]));
    plot.yAxis.append('text').attr('id','yLabel')
      .attr('font-family','Trebuchet MS, sans-serif')
      .attr('font-size', '10')
      .attr("transform", "rotate(-90)")
      .attr('y', -30)
      .attr('x', 20-plot.size.height/2)
      .attr('fill','currentColor')
      .attr('text-anchor','middle')
      .text(yLabel);

    // Create an indicator of the currentTime
    plot.curTime = plot.body.append('rect').attr('id', 'curTimeLine')
      .attr('width', '1')
      .attr('height', (plot.size.height-plot.margin.bottom-plot.margin.top)+'')
      .attr('y', '0')
      .attr('x', plot.xScale(timeRange[0]))
      .attr('stroke-width','2')
      .attr('stroke','rgb(86, 110, 213)')
      .attr('fill','none');

    // function to get line data for this plot
    // Datum is expected to be an array of y values starting from xmin
    plot.getLine = function() {
      return d3.line()
        .x(function(d,i){
          var t = new Date(timeRange[0].getTime());
          return plot.xScale(t.setMonth(t.getMonth() + i));
        })
        .y(function(d,i){ return plot.yScale(d); });
    };

    // Updates our time indicator
    plot.setTime = function(curTime) {
      plot.curTime.attr('x', plot.xScale(curTime));
    }

    // Function to plot lines in this
    // d should be an array of arrays of y values
    plot.setLines = function(d) {
      //console.log(d);
      plot.lineG.selectAll('path')
        .data(d)
        .join('path')
          .attr('d', plot.getLine())
          .attr('fill','none')
          .attr('style', function(d,i){ return lineStyles ? lineStyles[i] : 'stroke-width=2'; });
    };

    // Set function to call on drag, along with auto updates
    plot.onDragCallback = function(t) {
      console.log(t);
    };

    // Put the time at the right spot and call the callback when we drag around
    plot.dragUpdate = function() {
      // get the x from the mouse
      var x = d3.mouse(this)[0];

      // Update our time line
      // Seems dumb, but it clamps it into the bounds of the plot
      plot.curTime.attr('x', plot.xScale(plot.xScale.invert(x)));

      // Call the callback
      plot.onDragCallback(plot.xScale.invert(x));
    }
    plot.dragHandler = d3.drag()
      .on("start", plot.dragUpdate)
      .on("drag", plot.dragUpdate);

    // Set the drag handler on our body
    plot.body.call(plot.dragHandler);

    return plot;
  };


  // timeRange
  plot.timeRange = function(_) {
    if (arguments.length == 0) return timeRange;
    timeRange = _;
    return plot;
  }

  // timeTicks
  plot.timeTicks = function(_) {
    if (arguments.length == 0) return timeTicks;
    timeTicks = _;
    return plot;
  }

  // yRange
  plot.yRange = function(_) {
    if (arguments.length == 0) return yRange;
    yRange = _;
    return plot;
  }

  // yLabel
  plot.yLabel = function(_) {
    if (arguments.length == 0) return yLabel;
    yLabel = _;
    return plot;
  }

  // lineStyles
  plot.lineStyles = function(_) {
    if (arguments.length == 0) return lineStyles;
    lineStyles = _;
    return plot;
  }

  // line labels
  plot.lineLabels = function(_) {
    if (arguments.length == 0) return lineLabels;
    lineLabels = _;
    return plot;
  }

  // onPlay
  plot.onPlay = function(_) {
    if (arguments.length == 0) return onPlay;
    onPlay = _;
    return plot;
  }

  // onSelectTime
  plot.onSelectTime = function(_) {
    if (arguments.length == 0) return onSelectTime;
    onSelectTime = _;
    return plot;
  }

  return plot;
};
