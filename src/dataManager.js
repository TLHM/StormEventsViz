/*
  Loads and holds on to our data:
    1. JSON holding geographical data for drawing the US
    2. Array of objects representing a month of storm events
*/
import * as df from 'd3-fetch';
import * as dq from 'd3-queue';

export default function dataManager(){
  // The main thing we need is a queue
  var dm = {
    "geoQ" : dq.queue(),
    "stormQ" : dq.queue(),
    "geoLoc" : "https://d3js.org/us-10m.v1.json",
    "stormLoc" : "https://datahub.io/tlhm/countyeventsmin-rare-mole-24/r/0.json",
    "geoReady" : function(d){console.log(d);},
    "stormReady" : function(d){console.log(d);}
  };

  // We've finished setting up the callbacks, time to begin the loading
  dm.start = function(){
    fetch(dm.geoLoc).then(res => res.json())
      .then(dm.geoReady);

    fetch(dm.stormLoc).then(res => res.json())
      .then(dm.stormReady);
  };

  // Functions to set up the callbacks
  dm.setGeo = function(func){
    dm.geoReady = function(data){
      // if (error) throw error;

      dm.geoData = data;
      func(data);
    };
  };
  dm.setStorm = function(func){
    dm.stormReady = function(data){
      // if (error) throw error;

      dm.stormData = data;
      //console.log(dm.stormData);

      func(data);
    };
  };

  // For getting the data
  dm.getGeo = function(){
    return dm.geoData || {};
  };
  dm.getStorm = function(){
    return dm.stormData || {};
  };

  // Get a specific time point from the storm data
  dm.getStormAtTime = function(timept) {
    if (! dm.stormData) return {};

    return dm.stormData[timept];
  }

  // Get the full data for a specific county
  dm.getCountyData = function(countyID, startInd) {
    if (! dm.stormData) return [0];

    var fl =[], wi =[], ic =[];
    dm.stormData.slice(startInd).forEach((d,i) => {
      fl.push((d[countyID] && d[countyID].f) ? d[countyID].f : 0);
      wi.push((d[countyID] && d[countyID].w) ? d[countyID].w : 0);
      ic.push((d[countyID] && d[countyID].i) ? d[countyID].i : 0);
    });

    return [fl, wi, ic];
  };

  return dm;
};
