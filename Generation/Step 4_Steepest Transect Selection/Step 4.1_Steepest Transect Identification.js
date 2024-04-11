/*******************************************************************************
 * Introduction *
 * 
 *  1) Identify the locally steepest transect centerline within each group.
 * 
 *  2) Select the identified centerlines between 300 m and 3 km.
 * 
 *  3) Create a 45-m buffer around each selected centerline.
 * 
 * Updated: 4/11/2024
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

// Property name of the basin ID.
var basinID_Str = "HYBAS_ID";

// Property name of the centerline ID.
var centerlineID_Str = "CL_ID";

// Property name of the centerline length.
var length_Str = "CL_length";

// Centerline length thresholds (in meters).
var lowerThres_Num = 300;
var upperThres_Num = 3e3;

// Distance of the centerline buffer (in meters).
var bufferDistance_Num = 45;


/*******************************************************************************
 * Datasets *
 ******************************************************************************/

// Raw transect centerlines with basin IDs.
var centerlines_FC = ee.FeatureCollection(wd_Example
  + "RawCenterlines_withBasinIDs");

// Raw transect centerline segments.
var segments_FC = ee.FeatureCollection(wd_Example
  + "Raw_Centerline_Segments");

// Grouped buffers of transect centerline segments.
var groupedBuffers_FC = ee.FeatureCollection(wd_Example
  + "Grouped_Centerline_Segment_Buffers");


/*******************************************************************************
 * 1) Identify the locally steepest transect centerline within each group. *
 ******************************************************************************/

// Spatial Filter as geometries that intersect.
var intersect_Filter = ee.Filter.intersects({
  leftField: ".geo",
  rightField: ".geo"
});

// Save-first Join to pick the steepest centerline.
var matchName_Str = "steepest";

var saveFirst_Join = ee.Join.saveFirst({
  matchKey: matchName_Str, 
  ordering: "elvRange", 
  ascending: false
});

// Create a non-duplicate List of basin IDs.
var basinIDs_List = groupedBuffers_FC.aggregate_array(basinID_Str)
  .distinct();

// Identify the locally steepest centerlines by basin.
var steepestCenterlines_List = basinIDs_List.map(function(basinID_Num) {
  
  // Define a Filter of the basin ID.
  var basinID_Filter = ee.Filter.eq(basinID_Str, basinID_Num);
  
  // Identify the raw centerlines within each basin.
  var centerlines_perBasin_FC = centerlines_FC
    .filter(basinID_Filter);
  
  // Identify the centerline segments within each basin.
  var segments_perBasin_FC = segments_FC
    .filter(basinID_Filter);
  
  // Identify the grouped segment buffers within each basin.
  var groupedBuffers_perBasin_FC = groupedBuffers_FC
    .filter(basinID_Filter);
  
  // Join each grouped segment buffer with the corresponding
  //  centerline segments and identify the steepest segment
  //  within each group.
  var steepestSegments_perBasin_FC = saveFirst_Join.apply({
    primary: groupedBuffers_perBasin_FC, 
    secondary: segments_perBasin_FC, 
    condition: intersect_Filter
  });
  
  // Select the centerline corresponding to each identified 
  //  steepest segment.
  var steepestCenterlines_perBasin_FC = steepestSegments_perBasin_FC.map(
    function(joined_Ftr) {
      
      // Determine the corresponding centerline ID.
      var steepestSegment_perGroup_Ftr = joined_Ftr
        .get(matchName_Str);
      
      var centerlineID_Num = ee.Feature(steepestSegment_perGroup_Ftr)
        .get(centerlineID_Str);
      
      // Identify the centerline with the same ID.
      var steepestCenterline_perGroup_Ftr = centerlines_perBasin_FC
        .filter(ee.Filter.eq(centerlineID_Str, centerlineID_Num))
        .first();
      
      return steepestCenterline_perGroup_Ftr;
    }
  );
  
  return steepestCenterlines_perBasin_FC;
});

var steepestCenterlines_FC = ee.FeatureCollection(steepestCenterlines_List)
  .flatten();


/*******************************************************************************
* 2) Select the identified centerlines between 300 m and 3 km. *
******************************************************************************/

// Centerline length Filter.
var length_Filter = ee.Filter.and(
  ee.Filter.gte(length_Str, lowerThres_Num),
  ee.Filter.lte(length_Str, upperThres_Num)
);

// Filter the identified centerlines.
steepestCenterlines_FC = steepestCenterlines_FC.filter(length_Filter);


/*******************************************************************************
* 3) Create a 45-m buffer around each selected centerline. *
******************************************************************************/

var steepestTransects_FC = steepestCenterlines_FC.map(
  function(steepestCenterline_Ftr) {
    return steepestCenterline_Ftr.buffer(bufferDistance_Num);
  }
);


/*******************************************************************************
 * Results *
 ******************************************************************************/

var output = false; // true OR false.

if (!output) {
  
  // Check the raw centerlines.
  Map.setOptions("Satellite");
  Map.setCenter(-123.4187, 47.7675, 12);
  
  Map.addLayer(centerlines_FC, 
    {color: "FF0000"}, 
    "Raw transect centerlines");

  Map.addLayer(groupedBuffers_FC, 
    {color: "FFFFFF"}, 
    "Grouped segment buffers");

  Map.addLayer(segments_FC, 
    {color: "0000FF"}, 
    "Raw centerline segments");

} else {
  
  // Output the result to your GEE Asset.
  var fileName_Str = "Elevational_Transects";
  
  Export.table.toAsset({
    collection: steepestTransects_FC, 
    description: fileName_Str, 
    assetId: "Your/GEE_Asset/Path/" 
      // Please revise this to your GEE Asset path.
      + fileName_Str
  });
}

