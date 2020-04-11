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
const logScale = d3.scaleSymlog()
      .domain([120, 0]);

var baseMap = usMap()
  .dataManager(dm)
  .timer(time)
  .bgColor("rgb(51, 27, 40)")
  .title("Storm Events 1996 - 2020")
  .layerConfig([
    {
      name:'Flooding',
      scale: d3.scaleSequential((d) => d3.interpolatePuBu(logScale(d))),
      numScale: d3.scaleSymlog().domain([0,120]).range([0,120]),
      dataID: 'f',
      //mask: 'diagMask'
    },

    {
      name:'Windy',
      scale: d3.scaleSequential((d) => d3.interpolateBuGn(logScale(d))),
      numScale: d3.scaleSymlog().domain([0,120]).range([0,120]),
      dataID: 'w',
      mask: 'diagMask',//'dotMask'
    }
  ]);

// Create the map svg
var mapDiv = d3.select('body').append('div')
  .attr('id', 'MapBase')
  .attr('style','width:1020px; height:700px; margin:0 auto');
var map = baseMap(mapDiv);

// Add patterns and masks
// Diagonal pattern
var pat = map.addPattern('patDiag');
pat.append('path')
  .attr('fill','none')
  .attr('stroke','white')
  .attr('stroke-linecap','square')
  .attr('d','M 0,2 L 3,5');
pat.append('path')
  .attr('fill','none')
  .attr('stroke','white')
  .attr('stroke-linecap','square')
  .attr('d','M 3,0 L 5,2');

// Dot pattern
// var pat = map.addPattern('patDot');
// pat.attr('width',3).attr('height',3);
// pat.append('rect')
//   .attr('fill','white')
//   .attr('x',2)
//   .attr('y',2)
//   .attr('width','1')
//   .attr('height','1');

// Create mask with each pattern
map.addMask('diagMask', 'patDiag');
// map.addMask('dotMask', 'patDot');

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
    'stroke:rgb(56, 143, 192); stroke-width:1.5',
    'stroke:rgb(66, 171, 117); stroke-dasharray: 2,2; stroke-width:1.5',
    'stroke:rgb(137, 78, 213); stroke-dasharray: 8,4; stroke-width:1'
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

// Set callback for loading our geography
dm.setGeo(map.drawGeo);

// Set callback for loading our storm data
dm.setStorm(function(d){
  time.start();
  map.endLoading();

  setTimeout(function(){map.selectID('08013');}, 1000);
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


// Add some description to the bottom
var desc = d3.select('body').append('div').attr('id','description')
  .attr('style', "width:900px; margin: 0 auto; font-family: Trebuchet MS, sans-serif;text-align: center;");
desc.append('p').text("Helllooooo");
desc.append('a').attr('href','https://github.com/TLHM/StormEventsViz').text('View on Github');
