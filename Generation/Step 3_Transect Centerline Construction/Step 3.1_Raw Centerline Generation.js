/*******************************************************************************
 * Introduction *
 * 
 *  1) Within each selected basin, buffer each vectorized medial-axis 
 *     pixel centroid by the corresponding distance to 
 *     the nearest ridges / valleys.
 * 
 *  2) Construct an elevational-transect centerline between the highest non-forested area 
 *     of the ridge landforms and the lowest closed forest of the non-ridge 
 *     landforms within each qualified buffer.
 * 
 * Updated: 4/3/2024
 * 
 * Runtime: 2 minutes (for the Olympic Mountains, US)
 * 
 * Author: Chenyang Wei (chenyangwei.cwei@gmail.com)
 ******************************************************************************/


/*******************************************************************************
 * Objects *
 ******************************************************************************/

// Example area of interest: 
//  Based on the "Broad" extent of Olympic Mountains, US
//  from the GMBA Mountain Inventory (Version 2.0) database.
var AOI = ee.Geometry.Rectangle({
  coords: [[-124.82185448800108, 46.978114448441836],
    [-122.68335433442881,48.43864840733896]],
  geodesic: false
});

// Working directories.
var wd_Example = "users/ChenyangWei/ATET_v1/";

// Projection information.
var prj_Info = {
  crs: "EPSG:4326",
  scale: 30
};


/*******************************************************************************
 * Functions *
 ******************************************************************************/

// Load the ALOS elevation in the area of interest.
var load_ALOSelevation = function(geometry, proj) {
  var ALOSelevation = ee.ImageCollection('JAXA/ALOS/AW3D30/V3_2').select('DSM')
    .filterBounds(geometry)
    .mosaic()
    .reproject(proj);
  
  return ALOSelevation;
};

// Load and reproject the ALOS landforms dataset.
var loadReproject_ALOSlandforms = function(proj) {
  // The landform dataset is based on the 30m "AVE" band of JAXA's ALOS DEM 
  //  (available in GEE as JAXA/ALOS/AW3D30_V1_1).
  //  There are stripes of invalid data in areas over 60 degrees in latitude.
  var rawLF = ee.Image('CSP/ERGo/1_0/Global/ALOS_landforms').select('constant')
    .reproject(proj);
  
  // Remove the high-latitude stripes of invalid landforms  
  //  in the landform dataset (based on the ALOS DEM V1.1).
  var ALOSv11 = ee.Image("JAXA/ALOS/AW3D30_V1_1").select("AVE")
    .reproject(proj);
  
  var Landforms_noInvaid = rawLF.updateMask(ALOSv11.mask());
  
  return Landforms_noInvaid;
};

// Extract the landforms of ridges.
var extractRidgeLandforms = function(landforms) {
  var ridges = landforms.lte(14);
  
  return ridges;
};

// Read the land cover datasets of 2015-2019.
var readCoperLandCover15to19 = function() {
  var readAnnualLC = function(year) {
    // Set the file path and band name of land cover data.
    var lcPath = "COPERNICUS/Landcover/100m/Proba-V-C3/Global/";
    
    var lcName = "discrete_classification";
  
    return ee.Image(lcPath + year).select(lcName);
  };
  
  var landCover15to19 = ee.ImageCollection.fromImages([
    readAnnualLC(2015),
    readAnnualLC(2016),
    readAnnualLC(2017),
    readAnnualLC(2018),
    readAnnualLC(2019),
  ]);

  return landCover15to19;
};

// Extract and reproject areas classified as closed forests 
//  (tree canopy > 70 %) in ALL the five years from 2015 to 2019.
var extractClosedForests_inAllYears = function(landCoverImgCol, proj) {
  // Function to extract the annual closed forests.
  var extractAnnualClosedForests = function(lcImg) {
    return lcImg.gte(111).and(lcImg.lte(116));
  };

  // Annual closed forests from 2015 to 2019.
  var annualClosedForests = landCoverImgCol.map(extractAnnualClosedForests);
  
  // Extract and reproject areas classified as closed forests 
  //  in ALL the five years.
  var ClosedForests_inAllYears = annualClosedForests.min()
    .reproject(proj);
  
  return ClosedForests_inAllYears;
};

// Extract and reproject non-forested areas (from "Shrubs" to "Moss and lichen") 
//  in ALL the five years from 2015 to 2019.
var extractNonForested_inAllYears = function(landCoverImgCol, proj) {
  // Function to extract the annual non-forested areas.
  var extractAnnualNonForested = function(lcImg) {
    return lcImg.gte(20).and(lcImg.lte(100));
  };

  // Annual non-forested areas from 2015 to 2019.
  var annualNonForested = landCoverImgCol.map(extractAnnualNonForested);
  
  // Extract and reproject areas classified as non-forested areas 
  //  in ALL the five years.
  var NonForested_inAllYears = annualNonForested.min()
    .reproject(proj);
  
  return NonForested_inAllYears;
};

// Create an image of elevation and pixel coordinates 
//  for the closed-forest areas.
var create_CF_elvCoords = function(elevation, CF_img, proj) {
  // Get the elevation for each type of area.
  var closedForestsElv = elevation.updateMask(CF_img)
    .rename("CF_elv");
  
  // Determine and rename the pixel coordinates 
  //  for each type of area.
  var rawCoords = ee.Image.pixelLonLat()
    .reproject(proj);
  
  var closedForestsCoords = rawCoords.updateMask(CF_img)
    .select(["latitude", "longitude"], 
      ["CF_lat", "CF_long"]);
  
  // Combine the elevation and pixel coordinates 
  //  for each type of area.
  var CF_elvCoords = closedForestsElv
    .addBands(closedForestsCoords);
  
  return CF_elvCoords;
};

// Create an image of elevation and pixel coordinates 
//  for the non-forested areas.
var create_nonF_elvCoords = function(elevation, nonF_img, proj) {
  // Get the elevation for each type of area.
  var nonForestedElv = elevation.updateMask(nonF_img)
    .rename("nonF_elv");

  // Determine and rename the pixel coordinates 
  //  for each type of area.
  var rawCoords = ee.Image.pixelLonLat()
    .reproject(proj);
  
  var nonForestedCoords = rawCoords.updateMask(nonF_img)
    .select(["latitude", "longitude"], 
      ["nonF_lat", "nonF_long"]);

  // Combine the elevation and pixel coordinates for each type of area.
  var nonF_elvCoords = nonForestedElv
    .addBands(nonForestedCoords);
  
  return nonF_elvCoords;
};

// Generate a combined reducer for extracting the elevational extremes.
var generateCombinedReducer = function(CF_elvCoords, nonF_elvCoords) {
  // Create a reducer to extract the elevation and corresponding coordinates 
  //  for the lowest pixel of closed forests.
  var minReducer_CFelv_Coords = ee.Reducer.min({
    numInputs: 3
  }).setOutputs(CF_elvCoords.bandNames());
  // Note: this reducer outputs the minimum value of its first input 
  //  (i.e., "elevation"). 
  //  As the "numInputs" (3) is greater than one 
  //  (i.e., "elevation" followed by "coordinates"), 
  //  it also outputs the corresponding values of the additional inputs 
  //  (i.e., "coordinates").
  
  // Create a reducer to extract the elevation and corresponding coordinates 
  //  for the highest non-forested pixel.
  var maxReducer_nonFelv_Coords = ee.Reducer.max({
    numInputs: 3
  }).setOutputs(nonF_elvCoords.bandNames());
  
  // Combine the two reducers of elevational extremes.
  //  (Note: the order of reducers here should be consistent with 
  //  the order of the combined bands in the previously generated 
  //  "CF_nonF_elvCoords" image.)
  var combinedReducer = minReducer_CFelv_Coords.combine({
    reducer2: maxReducer_nonFelv_Coords, 
    sharedInputs: false
  });
  // (Note: if "sharedInputs" is false, 
  //  the inputs of the combined reducer will be 
  //  those of "reducer 1" followed by those of "reducer 2".)

  return combinedReducer;
};

// Construct transect centerlines by basin.
var constructTransectCLs_byBasin = function(allBasins, allPxCtds, 
  CF_nonF_elvCoords, combinedReducer, proj) {
    var allTransectCLs = allBasins.map(function(basin) {
      // Get the geometry of each basin.
      var basinGeom = basin.geometry();
      
      // Get the medial-axis pixel centroids in each basin.
      var pxCtds_perBasin = allPxCtds.filterBounds(basinGeom);
      
      // Buffer each selected pixel centroid
      //  by the corresponding distance to 
      //  the nearest ridges / valleys.
      var pxCtd_Buffers = pxCtds_perBasin.map(function(pxCtd) {
        // Extract the square distance.
        var sqDist = ee.Number(pxCtd.get("medialAxis_sqDist_inPixels"));
        
        // Calculate the buffer distance in meters.
        var bufferDist = sqDist.sqrt().multiply(30);
        
        return pxCtd.buffer(bufferDist);
      });
      
      // Extract the elevational extremes and corresponding pixel coordinates 
      //  within each buffer of the selected medial-axis pixel centroids.
      var elvMinMax_perBuffer = CF_nonF_elvCoords.reduceRegions({
        collection: pxCtd_Buffers, 
        reducer: combinedReducer, 
        scale: proj.scale, 
        crs: proj.crs
      });
      
      // Select buffers with both the minimum closed-forest elevation and 
      //  the maximum non-forested elevation.
      //  Also, the latter one should be greater than the former one.
      var selectedBuffers = elvMinMax_perBuffer.filter(ee.Filter.and(
        ee.Filter.notNull(["nonF_elv", "CF_elv"]),
        ee.Filter.greaterThan({
          leftField: "nonF_elv", 
          rightField: "CF_elv"
        })));
    
      // Construct an elevational-transect centerline 
      //  between the upper and lower endpoints 
      //  in each selected buffer.
      var transectCLs_perBasin = selectedBuffers.map(function(buffer) {
        // Extract the coordinates of the two endpoints.
        var CF_long = buffer.get("CF_long");
        var CF_lat = buffer.get("CF_lat");
        
        var nonF_long = buffer.get("nonF_long");
        var nonF_lat = buffer.get("nonF_lat");
      
        // Construct a LineString between the two endpoints.
        var lineString = ee.Geometry.LineString(
          [[CF_long, CF_lat],
           [nonF_long, nonF_lat]]);
    
        // Get the length of the constructed LineString.
        var CL_length = lineString.length();
        
        // Calculate the elevational range.
        var nonF_elv = buffer.get("nonF_elv");
        var CF_elv = buffer.get("CF_elv");
    
        var elvRange = ee.Number(nonF_elv).subtract(CF_elv);
        
        // Create a feature with the LineString length 
        //  and the elevational range.
        var CL = ee.Feature(lineString).set({
          CL_length: CL_length,
          elvRange: elvRange
        });
        
        // Copy the properties of interest from the buffer feature.
        var CL_propertiesCopied = CL.copyProperties({
          source: buffer, 
          exclude: ["count", "medialAxis_sqDist_inPixels"]
        });
        
        return CL_propertiesCopied;
      });
      
      // Return the constructed centerlines of each basin.
      return transectCLs_perBasin;
    });
  
    // Flatten the obtained FeatureCollection.
    var allTransectCLs_flattened = allTransectCLs.flatten();
    
    // Add a random column as IDs.
    return allTransectCLs_flattened.randomColumn("CL_ID");
  };


/*******************************************************************************
 * Datasets *
 ******************************************************************************/

// ALOS elevation (Version 3.2, released in January 2021) in the AOI.
var ALOSelv = load_ALOSelevation(AOI, prj_Info);

// "Broad" alpine treeline ecotones at 30 m.
var broad_ATE = ee.Image(wd_Example
  + "Broad_Alpine_Treeline_Ecotones");

// Selected water basins.
var selectedBasins = ee.FeatureCollection(wd_Example 
  + "Selected_Basins");

// Vectorized medial-axis pixel centroids.
var medialAxis_PxCtds = ee.FeatureCollection(wd_Example 
  + "MedialAxis_PixelCentroids");

// ALOS landforms dataset within the broad ATE.
var LF_noInvaid_ATE = loadReproject_ALOSlandforms(prj_Info)
  .updateMask(broad_ATE);

// Land Cover datasets of 2015-2019.
var landCover = readCoperLandCover15to19();


/*******************************************************************************
 * Major Operations *
 ******************************************************************************/

// Extract ridges and non-ridge landforms within the broad ATE.
var ridges = extractRidgeLandforms(LF_noInvaid_ATE);

var nonRidges = ridges.not();

// Extract and reproject the elevation of closed forests 
//   (tree canopy > 70 %) in 2015-2019.
var CF_inAllYrs = extractClosedForests_inAllYears(landCover, prj_Info);

// Extract and reproject the non-forested areas in 2015-2019.
var nonF_inAllYrs = extractNonForested_inAllYears(landCover, prj_Info);

// Closed forests of the non-ridge landforms.
var CF_nonRidges = CF_inAllYrs.updateMask(nonRidges)
  .selfMask();

// Non-forested areas of the ridge landforms.
var nonF_ridges = nonF_inAllYrs.updateMask(ridges)
  .selfMask();

// Create the images of elevation and pixel coordinates 
//  for the closed-forest and non-forested areas, respectively.
var CF_elvCoords_Img = create_CF_elvCoords(
  ALOSelv, CF_nonRidges, prj_Info);

var nonF_elvCoords_Img = create_nonF_elvCoords(
  ALOSelv, nonF_ridges, prj_Info);

// Combine the elevation and coordinate datasets of the two types of areas 
//  for further extracting the elevational extremes by buffer.
//  (Note: the order of bands here should be consistent with 
//  the order of the following combined reducers.)
var CF_nonF_elvCoords_Img = CF_elvCoords_Img
  .addBands(nonF_elvCoords_Img)
  .reproject(prj_Info);

// Generate a combined reducer for extracting the elevational extremes.
var combinedElvReducer = generateCombinedReducer(
  CF_elvCoords_Img, nonF_elvCoords_Img);

// Transect centerline construction.
var transectCLs = constructTransectCLs_byBasin(
  selectedBasins, medialAxis_PxCtds, 
  CF_nonF_elvCoords_Img, combinedElvReducer, 
  prj_Info);


/*******************************************************************************
 * Results *
 ******************************************************************************/

var output = false; // true OR false.

if (!output) {
  
  // Check some loaded datasets.
  Map.setOptions("Satellite");
  Map.centerObject(AOI, 12);
  
  Map.addLayer(selectedBasins, 
    {color: "0000FF"}, 
    "Selected water basins");
  
  Map.addLayer(broad_ATE, 
    {palette: "00FFFF"}, 
    "Broad ATE");
  
  Map.addLayer(medialAxis_PxCtds, 
    {color: "FF0000"}, 
    "Medial-axis pixel centroids");
  
} else {
  
  // Output the result to your GEE Asset.
  var fileName = "Raw_Centerlines";
  
  Export.table.toAsset({
    collection: transectCLs, 
    description: fileName, 
    assetId: "Your/GEE_Asset/Path/" 
      // Please revise this to your GEE Asset path.
      + fileName
  });
}

