console.log("working");

import * as d3 from 'd3';
import usMap from './usMap.js';
import dataManager from './dataManager.js'
import timer from './timer.js'
import timeChart from './timeChart.js'

// Create our data manager and timer
var dm = dataManager();
var time = timer();
time.setShift(0);
time.setMax(289);

// Set up our map
var baseMap = usMap()
  .dataManager(dm)
  .timer(time)
  .title("Flooding and Windy Storm Events From 1996 - 2020");

// Create the map svg
var mapDiv = d3.select('body').append('div')
  .attr('id', 'MapBase');
var map = baseMap(mapDiv);

// Create the lower timeChart
var timeDiv = d3.select('body').append('div')
  .attr('id', 'timeChartContainer')
  .attr('width', '75%')
  .attr('height', '150px')
  .attr('margin-left', 'auto');
var chartCreator = timeChart()
  .yRange([0,120])
  .timeRange([new Date("1996"), new Date("1950").setMonth(840)])
  .yLabel('Number of Storm Events')
  .lineStyles([
    'stroke:blue',
    'stroke:green; stroke-dasharray: 2,2',
    'stroke:cyan; stroke-dasharray: 8,4;'
  ]);

var tChart = chartCreator(timeDiv);

// Callback for selecting a single time, need to pass it along to the timer
tChart.onDragCallback = function(curTime) {
  var timerTime = (curTime.getFullYear()-time.baseYear) * 12 + curTime.getMonth();

  time.setTime(timerTime);
};

// Callback for selecting a county
map.onCountySelection = function(countyID) {
  var countyData = dm.getCountyData(countyID, 0);

  tChart.setLines(countyData);
};

// Callback for loading our geography
dm.setGeo(map.drawGeo);

// Callback for loading our storm data
dm.setStorm(function(d){
  time.start();
});

// Have our timer update our map
time.setUpdate(map.update);

// Start loading
dm.start();
