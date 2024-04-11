/*******************************************************************************
 * Introduction *
 * 
 *  1) Vectorize pixels along the medial axis running 
 *     between ridges and valleys across the broad ATE
 *     to their centroids by water basin.
 * 
 * Updated: 4/3/2024
 * 
 * Runtime: 1 minute (for the Olympic Mountains, US)
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

// Vectorize pixels along the determined medial axis to their centroids 
//  by water basin.
var vectorizeMedialAxis_byBasin = function(medialAxisImg, basinsFtrCol, proj) {
  var vectorization_byBasin = function(basin) {
    var basinGeom = basin.geometry();
    
    var pxCtds_perBasin = medialAxisImg.reduceToVectors({
      geometry: basinGeom, 
      scale: proj.scale, 
      geometryType: "centroid", 
      eightConnected: true, 
      labelProperty: medialAxisImg.bandNames().get(0), 
      crs: proj.crs, 
      maxPixels: 1e13
    });
    
    return pxCtds_perBasin;
  };
  
  var allPxCtds = basinsFtrCol.map(vectorization_byBasin);
  
  return allPxCtds.flatten();
};


/*******************************************************************************
 * Datasets *
 ******************************************************************************/

// Medial axis running between ridges and valleys across the broad ATE.
var medialAxis = ee.Image(wd_Example 
  + "MedialAxis_SquaredDistance");

// Selected water basins.
var selectedBasins = ee.FeatureCollection(wd_Example 
  + "Selected_Basins");


/*******************************************************************************
 * 1) Vectorize pixels along the medial axis running 
 *    between ridges and valleys across the broad ATE
 *    to their centroids by water basin. *
 ******************************************************************************/

var medialAxis_PxCtds = vectorizeMedialAxis_byBasin(
  medialAxis, selectedBasins, prj_Info);


/*******************************************************************************
 * Results *
 ******************************************************************************/

var output = false; // true OR false.

if (!output) {
  
  // Check the selected water basins.
  Map.setOptions("Satellite");
  Map.centerObject(AOI, 9);
  
  Map.addLayer(selectedBasins, 
    {color: "0000FF"}, 
    "Selected water basins");
  
} else {
  
  // Output the result to your GEE Asset.
  var fileName = "MedialAxis_PixelCentroids";
  
  Export.table.toAsset({
    collection: medialAxis_PxCtds, 
    description: fileName, 
    assetId: "Your/GEE_Asset/Path/" 
      // Please revise this to your GEE Asset path.
      + fileName
  });
}

