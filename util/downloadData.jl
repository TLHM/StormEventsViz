# Downloads all our data from the NOAA database
# Can be done with whatever language you like (This is Julia)
# This script also grabs the full list of files that we want
# This is saved for your convenience, you don't have to grab this yourself
# Although, if the files are updated (particularly the most recent) you probs should

using HTTP;
using Cascadia;
using Gumbo;

# Grab the list of files
url = "https://www1.ncdc.noaa.gov/pub/data/swdi/stormevents/csvfiles/";
page = HTTP.get(url);
body = String(page.body);
html = parsehtml(body);

# We're interested in the table of files
table = eachmatch(sel"table", html.root)[1];

# Go through all the links
# Grab those for Storm Details, Storm Locations, and Storm Fatalities
details = [];
locations = [];
fatalities = [];

links = eachmatch(sel"a", table);

for link in links
    fileName = getattr(link,"href")
    if occursin("StormEvents_details-", fileName)
        push!(details, joinpath(url,fileName))
    elseif occursin("StormEvents_locations-", fileName)
        push!(locations, joinpath(url,fileName))
    elseif occursin("StormEvents_fatalities-", fileName)
        push!(fatalities, joinpath(url,fileName))
    end
end

# Write out our file lists
fout = open("detailsFileList.txt", "w")
print(fout, join(details,"\n"))
close(fout)

fout = open("fatalitiesFileList.txt", "w")
print(fout, join(fatalities,"\n"))
close(fout)

fout = open("locationsFileList.txt", "w")
print(fout, join(locations,"\n"))
close(fout)

##########

# Now we can download all our csvs and unzip them (and delete the zips)
dataFolder = "../data"

# All the details files (1.26 GB)
fol = joinpath(dataFolder,"details")
if !isdir(fol)
    mkdir(fol)
end
for file in details
    outPath = joinpath(fol,basename(file));
    download(file, outPath);
    run(`gunzip $outPath`)
end

# All the fatalities files (1.5 MB)
fol = joinpath(dataFolder,"fatalities")
if !isdir(fol)
    mkdir(fol)
end
for file in fatalities
    outPath = joinpath(fol,basename(file));
    download(file, outPath);
    run(`gunzip $outPath`)
end

# All the location files (83.1 MB)
fol = joinpath(dataFolder,"locations")
if !isdir(fol)
    mkdir(fol)
end
for file in locations
    outPath = joinpath(fol,basename(file));
    download(file, outPath);
    run(`gunzip $outPath`)
end

# Grab the file format pdf as well
download(jionppath(url,"Storm-Data-Export-Format.pdf"), joinpath(dataFolder, "Storm-Data-Export-Format.pdf"))
