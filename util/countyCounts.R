# Merge storm data, counting ocurrances of certain categories in counties per month
# Flooding : flood, storm surge, debris flow, or flood_cause is not null
# Winds: magnitude_type is not null (has a wind magnitude reported)
# Ice: snow, blizzard, cold, freez, hail, sleet ; has reported injuries or deaths or damage

library(data.table)
library(rjson)

# Get list of our files
dataDir <- "../data/details"
details <- list.files(dataDir)

# Empty output to start, we'll add rows to this
output = data.table()

# Loop through files
for(file in details) {
  # Read in the file
  data <- fread(file.path(dataDir,file))
  
  print(data[1,YEAR])
  
  # Create a month number
  data[, monthNum := BEGIN_YEARMONTH - YEAR*100]
  
  # Get consolidated FIPS number
  data[, FIPS := paste(sprintf("%02i",STATE_FIPS), sprintf("%03i",CZ_FIPS),sep='')]
  
  # Only interested in events with recorded damage / injuries
  strong <- data[(INJURIES_DIRECT + INJURIES_INDIRECT + DEATHS_DIRECT + DEATHS_INDIRECT > 0) |
      !is.na(DAMAGE_PROPERTY) | !is.na(DAMAGE_CROPS)]
  
  ## Column for each category, just T or F
  
  # Flooding : flood, storm surge, debris flow, or flood_cause is not null
  strong[, isFlood := FALSE]
  for(floodType in c("flood", "surge","flow")) {
    strong[grepl(floodType, EVENT_TYPE, ignore.case = T), isFlood := TRUE]
  }
  strong[!is.na(FLOOD_CAUSE), isFlood:= TRUE]
  
  # Winds: wind, storm,
  strong[, isWind := FALSE]
  for(windType in c("wind", "storm","tornado", "hurricane", "devil", "spout")) {
    strong[grepl(windType, EVENT_TYPE, ignore.case = T) & !is.na(MAGNITUDE_TYPE), isWind := TRUE]
  }
  
  # Ice: snow, blizzard, cold, freez, hail, sleet ; has reported injuries or deaths or damage
  strong[, isIce := FALSE]
  for(icyType in c("snow", "blizzard", "cold", "freez", "hail", "sleet", "ice")) {
    strong[grepl(icyType, EVENT_TYPE, ignore.case = T), isIce := TRUE]
  }
  
  ## Summarize by county, month
  summary <- strong[,list(FloodCount=sum(isFlood), WindCount=sum(isWind), IceCount=sum(isIce)), by=list(FIPS, monthNum)]
  
  # Add summary to the output
  summary[,Year := strong[1,YEAR]]
  setnames(summary,"monthNum","Month")
  summary[,Time := (Year-1950)*12 + Month] # Months since 1950
  
  if(nrow(output) == 0) {
    output = summary
  } else {
    output <- rbind(output, summary)
  }
}

# Save output
notNothing <- output[FloodCount + WindCount + IceCount > 0]
write.csv(notNothing, file.path(dataDir,"../countyStormsPerMonth.csv"), row.names = F)

# Switch to a wide format
# Due to the sparseness of the data, this was too bloated
# keyCols <- notNothing[,list(FIPS,Time,FloodCount,WindCount,IceCount)]
# melted <- melt(keyCols, measure.vars = c("FloodCount", "WindCount", "IceCount"), variable.name = "StormType", value.name = "StormCount")
# wideData <- dcast(melted, FIPS ~ Time + StormType, value.var = "StormCount")
# write.csv(wideData, file.path(dataDir,"../countyStormsPerMonth_Wide.csv"), row.names = F)

# Create a JSON output
# Our final object will be an array of timepoints
# Each timepoint will have counties with 1+ events, and those values
# This is a slow loop, but only needs to be done once, so...
timeMin = min(notNothing[,Time])
timeMax = max(notNothing[,Time])

jsonOut = list()
for(timept in timeMin:timeMax) {
  # Create a list, populate it with counties
  tpList = list()
  
  tpData = notNothing[Time==timept]
  
  if(nrow(tpData) == 0) {
    next
  }
  
  print(c(timept, nrow(tpData)))
  
  # Go through each row, add it to our list
  for(row in 1:nrow(tpData)) {
    countyList = list()
    
    # Add floods if there are any
    if(tpData[row, FloodCount] > 0) {
      countyList[["floods"]] <- tpData[row, FloodCount]
    }
    
    # Add winds if there are any
    if(tpData[row, WindCount] > 0) {
      countyList[["winds"]] <- tpData[row, WindCount]
    }
    
    # Add ice if there are any
    if(tpData[row, IceCount] > 0) {
      countyList[["ice"]] <- tpData[row, IceCount]
    }
    
    tpList[[tpData[row,FIPS]]] <- countyList
  }
  
  # Add our timepoint to the jsonList
  jsonOut[[timept]] <- tpList
}

cat(toJSON(jsonOut), file=file.path(dataDir,"../countyEvents.json"))
