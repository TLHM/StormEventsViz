/*
  Simple timer - loops through a range of values, calling an update on each tick
  Can be paused, started again
*/

export default function timer(){
  var t = {};

  t.currentTime = 0;
  t.maxTime = 0;
  t.shift = 0;
  t.updateInterval = 1000/12.0;
  t.ticking = true;

  // On update gets called each tick with the current time
  t.onUpdate = function(time){
    console.log(time);
  };
  t.setUpdate = function(f) {
    t.onUpdate = f;
  };

  // Change the update speed
  t.setFPS = function(fps) {
    t.updateInterval = 1000 / fps;
  }

  // Set max Time
  // Parameter should not include the shift
  t.setMax = function(m) {
    t.maxTime = m - t.shift;
  };

  // Set shift ( essentially min time )
  t.setShift = function(s) {
    t.maxTime = t.maxTime + t.shift - s;
    t.shift = s;
  };

  // Set current time; also stops the timer
  t.setTime = function(time) {
    t.currentTime = time - t.shift;

    t.onUpdate(t.getTime());

    // Stop the ticks
    t.ticking = false;
  };

  // Get current time
  t.getTime = function() {
    return t.currentTime + t.shift;
  };

  // Main function, increments time, and calls onUpdate
  t.tick = function() {
    if(!t.ticking) return;

    t.currentTime += 1;
    if (t.currentTime > t.maxTime) {
      t.currentTime = 0;
    }

    t.onUpdate(t.getTime());

    // Queue next tick
    setInterval(t.tick, t.updateInterval);
  };

  // Starts the ticking
  t.start = function() {
    t.ticking = true;
    t.tick();
  };

  return t;
};
