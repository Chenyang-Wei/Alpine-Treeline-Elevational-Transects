/*******************************************************************************
 * Introduction *
 * 
 *  1) Select water basins ("hybas_12") intersecting the study domain 
 *     and the medial axis running between ridges and valleys 
 *     across the broad ATE.
 * 
 * Updated: 4/3/2024
 * 
 * Runtime: Less than 1 minute (for the Olympic Mountains, US)
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

// Extract the most detailed ("level 12") HydroSHEDS water basins 
//  intersecting the study domain.
var extractBasins_StudyDomain = function(studyDomain_FtrCol) {
  var studyDomain_Geom = ee.Feature(studyDomain_FtrCol.first())
    .geometry();
  
  var extractedBasins = ee.FeatureCollection("WWF/HydroSHEDS/v1/Basins/hybas_12")
    .filterBounds(studyDomain_Geom);

  return extractedBasins;
};

// Select the HydroSHEDS water basins ("hybas_12") intersecting
//  the medial axis running between ridges and valleys.
var selectBasins_MedialAxis = function(medialAxis_Img, rawBasins, proj) {
  var basins_withInfo = medialAxis_Img.reduceRegions({
    collection: rawBasins,
    reducer: ee.Reducer.firstNonNull(), 
    scale: proj.scale,
    crs: proj.crs
  });

  var selectedBasins = basins_withInfo
    .filter(ee.Filter.notNull(["first"]));
  
  return selectedBasins;
};


/*******************************************************************************
 * Datasets *
 ******************************************************************************/

// Load the example study domain: 
//  the "Broad" extent of Olympic Mountains, US
//  from the GMBA Mountain Inventory (Version 2.0) database.
var studyDomain = ee.FeatureCollection(wd_Example
  + "Olympic_Mountains_GMBAv2_Broad");

// Medial axis running between ridges and valleys across the broad ATE.
var medialAxis = ee.Image(wd_Example 
  + "MedialAxis_SquaredDistance");


/*******************************************************************************
 * 1) Select water basins ("hybas_12") intersecting the study domain 
 *    and the determined medial axis across the broad ATE. *
 ******************************************************************************/

// Collect the most detailed ("level 12") HydroSHEDS water basins 
//  intersecting the study domain.

var basins_StudyDomain = extractBasins_StudyDomain(studyDomain);

// Select water basins intersecting the determined medial axis.
var selectedBasins_MedialAxis = selectBasins_MedialAxis(
  medialAxis, basins_StudyDomain, prj_Info);


/*******************************************************************************
 * Results *
 ******************************************************************************/

var output = false; // true OR false.

if (!output) {
  
  // Check the determined medial axis.
  Map.setOptions("Satellite");
  Map.centerObject(AOI, 13);
  
  Map.addLayer(medialAxis, 
    {palette: "FF0000"}, 
    "Medial axis");
  
} else {
  
  // Output the result to your GEE Asset.
  var fileName = "Selected_Basins";
  
  Export.table.toAsset({
    collection: selectedBasins_MedialAxis, 
    description: fileName, 
    assetId: "Your/GEE_Asset/Path/" 
      // Please revise this to your GEE Asset path.
      + fileName
  });
}

