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
  .title("Flooding and Windy Storm Events From 1996 - 2020")
  .layerConfig([
    { name:'Flooding',
    scale:d3.scaleSequential([0,120], d3.interpolateViridis),
    dataID: 'f',
    mask: 'vert' },
    { name:'Windy',
    scale:d3.scaleSequential([0,120], d3.interpolateCool),
    dataID: 'w',
    mask: 'vert'}
  ]);

// Create the map svg
var mapDiv = d3.select('body').append('div')
  .attr('id', 'MapBase')
  .attr('style','width:1020px; height:700px; margin:0 auto');
var map = baseMap(mapDiv);

// Create the lower timeChart
var timeDiv = d3.select('body').append('div')
  .attr('id', 'timeChartContainer')
  .attr('style', 'width:880px; margin:0 auto');
var chartCreator = timeChart()
  .yRange([0,120])
  .timeRange([new Date("1996"), new Date("01/01/1950").setMonth(840)])
  .yLabel('Number of Storm Events')
  .lineLabels(["Flooding", "High Winds"])
  .lineStyles([
    'stroke:blue',
    'stroke:green; stroke-dasharray: 2,2',
    'stroke:cyan; stroke-dasharray: 8,4;'
  ])
  .onPlay(time.start);

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
  map.endLoading();

  map.selectID('08013');
});

// Have our timer update our map
var onTick = function(curTime) {
  map.update(curTime);

  // curTime is the # of months since time.baseYear
  var curTimeD = new Date('01/01/'+time.baseYear);
  curTimeD.setMonth(curTime);
  tChart.setTime(curTimeD);
};
time.setUpdate(onTick);

// Start loading
dm.start();
