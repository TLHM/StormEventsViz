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
    "stormLoc" : "countyEvents.json",
    "geoReady" : function(d){console.log(d);},
    "stormReady" : function(d){console.log(d);}
  };

  // We've finished setting up the callbacks, time to being the loading
  dm.start = function(){
    fetch(dm.geoLoc).then(res => res.json())
      .then(dm.geoReady);

    fetch(dm.stormLoc).then(res => res.json())
      .then(dm.stormReady);

    // dm.geoQ.defer(df.json, dm.geoLoc)
    //   .await(dm.geoReady);
    //
    // dm.stormQ.defer(df.json, dm.stormLoc)
    //   .await(dm.stormReady);
    //
    //  var xhr = new XMLHttpRequest();
    //  var myProgress=0;
    //
    //  xhr.open('GET', dm.geoLoc, true);
    //  xhr.responseType = 'json';
    //  console.log("Fetching "+dm.geoLoc);
    //  //Call callback when loaded
    //  xhr.addEventListener('load', function () {
    //     console.log("Loaded file.");
    //     dm.geoReady(xhr);
    //  });
    //  //Update progress bar as we load
    //  // xhr.addEventListener('progress', function(oEvent){
    //  //    myProgress = ( oEvent.loaded / oEvent.total ) * 60;
    //  // });
    //
    //  xhr.send();
    //
    //  //Make the loading bar keep track of progress
    //  // load.set("expr", function(emit){
    //  //    emit(-30,-8);
    //  //    emit(-30+myProgress,-8);
    //  // });
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

  return dm;
};
