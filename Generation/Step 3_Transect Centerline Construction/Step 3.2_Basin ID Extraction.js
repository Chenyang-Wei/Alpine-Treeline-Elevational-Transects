/*******************************************************************************
 * Introduction *
 * 
 *  1) Calculate the geometric centroid of each 
 *     elevational-transect centerline.
 * 
 *  2) Extract the ID of the basin intersected by each centroid of 
 *     transect centerlines and assign the extracted ID to 
 *     the corresponding centroid.
 * 
 *  3) Assign the corresponding basin ID to each transect centerline.
 * 
 * Updated: 4/10/2024
 * 
 * Runtime: Less than 1 minute (for the Olympic Mountains, US)
 * 
 * Author: Chenyang Wei (chenyangwei.cwei@gmail.com)
 ******************************************************************************/


/*******************************************************************************
 * Objects *
 ******************************************************************************/

// Working directory (you can revise this to your GEE Asset path).
var wd_Example = "users/ChenyangWei/ATET_v1/";

// Spatial Filter as geometries that intersect.
var intersect_Filter = ee.Filter.intersects({
  leftField: ".geo",
  rightField: ".geo"
});

// Non-spatial Filter as Features that have the same centerline IDs.
var shareID_Filter = ee.Filter.equals({
  leftField: "CL_ID",
  rightField: "CL_ID"
});

// Save-first Join.
var IDname_Str = "HYBAS_ID";

var saveFirst_Join = ee.Join.saveFirst({
  matchKey: IDname_Str
});


/*******************************************************************************
 * Datasets *
 ******************************************************************************/

// Raw transect centerlines.
var centerlines_FC = ee.FeatureCollection(wd_Example
  + "Raw_Centerlines");

// Selected water basins.
var basins_FC = ee.FeatureCollection(wd_Example 
  + "Selected_Basins");


/*******************************************************************************
 * 1) Calculate the geometric centroid of each 
 *    elevational-transect centerline. *
 ******************************************************************************/

var centroids_FC = centerlines_FC.map(function(centerline_Ftr) {
  var centroid_Ftr = centerline_Ftr.centroid();
  
  return centroid_Ftr;
});


/*******************************************************************************
 * 2) Extract the ID of the basin intersected by each centroid of 
 *    transect centerlines and assign the extracted ID to 
 *    the corresponding centroid. *
 ******************************************************************************/

// Join each centerline centroid with the basin that it intersects.
var centroids_Basins_FC = saveFirst_Join.apply(
  centroids_FC, basins_FC, intersect_Filter
);

// Extract and assign the basin ID from each joined basin
//  to the corresponding centroid.
var centroids_withBasinIDs_FC = centroids_Basins_FC.map(
  function(joined_Ftr) {
    
    // Determine the joined basin.
    var joinedBasin_Ftr = joined_Ftr.get(IDname_Str);
    
    // Get the basin ID from the joined basin.
    var basinID_Num = ee.Feature(joinedBasin_Ftr)
      .get(IDname_Str);
  
    // Replace the property of the joined basin with its basin ID.
    var centroid_withBasinID_Ftr = joined_Ftr
      .set(IDname_Str, basinID_Num);
    
    return centroid_withBasinID_Ftr;
  }
);


/*******************************************************************************
 * 3) Assign the corresponding basin ID to each transect centerline. *
 ******************************************************************************/

// Join each transect centerline with its geometric centroid.
var centerlines_Centroids_FC = saveFirst_Join.apply(
  centerlines_FC, centroids_withBasinIDs_FC, shareID_Filter
);

// Extract and assign the basin ID from each joined centroid
//  to the corresponding centerline.
var centerlines_withBasinIDs_FC = centerlines_Centroids_FC.map(
  function(joined_Ftr) {
    
    // Determine the joined centroid.
    var joinedCentroid_Ftr = joined_Ftr.get(IDname_Str);
    
    // Get the basin ID from the joined centroid.
    var basinID_Num = ee.Feature(joinedCentroid_Ftr)
      .get(IDname_Str);
  
    // Replace the property of the joined centroid with its basin ID.
    var centerline_withBasinID_Ftr = joined_Ftr
      .set(IDname_Str, basinID_Num);
    
    return centerline_withBasinID_Ftr;
  }
);


/*******************************************************************************
 * Results *
 ******************************************************************************/

var output = false; // true OR false.

if (!output) {
  
  // Check some loaded datasets.
  Map.setOptions("Satellite");
  Map.setCenter(-123.4187, 47.7675, 11);
  
  Map.addLayer(basins_FC, 
    {color: "00FFFF"}, 
    "Selected basins");
  
  Map.addLayer(centerlines_FC, 
    {color: "FF0000"}, 
    "Raw transect centerlines");
  
} else {
  
  // Output the result to your GEE Asset.
  var fileName = "RawCenterlines_withBasinIDs";
  
  Export.table.toAsset({
    collection: centerlines_withBasinIDs_FC, 
    description: fileName, 
    assetId: "Your/GEE_Asset/Path/" 
      // Please revise this to your GEE Asset path.
      + fileName
  });
}

