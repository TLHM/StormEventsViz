console.log("working");

import * as d3 from 'd3';
import usMap from './usMap.js';
import dataManager from './dataManager.js'
import timer from './timer.js'

d3.json("https://d3js.org/us-10m.v1.json", function(e,d){throw "asdlkj";})

// Create our data manager and timer
var dm = dataManager();
var time = timer();
time.setShift(60);
time.setMax(840);

// Set up our map
var baseMap = usMap()
  .dataManager(dm);

// Create the map svg
var chartDiv = d3.select('body').append('div')
  .attr('id', 'MapBase');
var map = baseMap(chartDiv);

console.log(map);

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
