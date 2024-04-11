/*******************************************************************************
 * Introduction *
 * 
 *  1) Segment the mid-quarter around the centroid of 
 *     each transect centerline.
 * 
 *  2) Buffer each centerline segment.
 * 
 *  3) Merge the centerline segment buffers within each basin 
 *     into a single MultiPolygon.
 * 
 *  4) Convert each basin's MultiPolygon into a set of 
 *     individual Polygons.
 * 
 * Updated: 4/10/2024
 * 
 * Runtime: 1 minute (for the Olympic Mountains, US)
 * 
 * Author: Chenyang Wei (chenyangwei.cwei@gmail.com)
 ******************************************************************************/


/*******************************************************************************
 * Objects *
 ******************************************************************************/

// Working directory (you can revise this to your GEE Asset path).
var wd_Example = "users/ChenyangWei/ATET_v1/";

// Distance for grouping raw transect centerlines.
var groupingDistance_Num = 90;

// Property name of the basin ID.
var IDname_Str = "HYBAS_ID";


/*******************************************************************************
 * Datasets *
 ******************************************************************************/

// Raw transect centerlines with basin IDs.
var centerlines_FC = ee.FeatureCollection(wd_Example
  + "RawCenterlines_withBasinIDs");


/*******************************************************************************
 * 1) Segment the mid-quarter around the centroid of 
 *    each transect centerline. *
 ******************************************************************************/

var segments_FC = centerlines_FC.map(
  function(centerline_Ftr) {
    
    // Calculate the radius of the segmenting circle.
    var centerlineLength_Num = centerline_Ftr.get("CL_length");
    
    var segmentingRadius_Num = ee.Number(centerlineLength_Num)
      .divide(8);
    
    // Segment the mid-quarter around the centroid.
    var segmentingCircle_Ftr = centerline_Ftr.centroid()
      .buffer(segmentingRadius_Num);
    
    var segment_Ftr = centerline_Ftr.intersection(segmentingCircle_Ftr);
    
    return segment_Ftr;
  }
);


/*******************************************************************************
 * 2) Buffer each centerline segment. *
 ******************************************************************************/

var segmentBuffers_FC = segments_FC.map(function(segment_Ftr) {
  return segment_Ftr.buffer(groupingDistance_Num);
});


/*******************************************************************************
 * 3) Merge the centerline segment buffers within each basin 
 *    into a single MultiPolygon. *
 ******************************************************************************/

// Create a non-duplicate List of basin IDs.
var basinIDs_List = segmentBuffers_FC.aggregate_array(IDname_Str)
  .distinct();

// Merge the centerline segment buffers within each basin.
var mergedBuffers_FC = ee.FeatureCollection(
  basinIDs_List.map(function(basinID_Num) {
    
    // Identify the buffers within each basin.
    var buffers_perBasin_FC = segmentBuffers_FC.filter(
      ee.Filter.eq(IDname_Str, basinID_Num)
    );
    
    // Merge the identified buffers.
    var merged_perBasin_FC = buffers_perBasin_FC.union();
    
    // Assign the corresponding basin ID to each merged Feature.
    var merged_perBasin_Ftr = merged_perBasin_FC.first()
      .set(IDname_Str, basinID_Num);
    
    return merged_perBasin_Ftr;
  })
);


/*******************************************************************************
 * 4) Convert each basin's MultiPolygon into a set of 
 *    individual Polygons. *
 ******************************************************************************/

var groupedBuffers_FC = mergedBuffers_FC.map(
  function(merged_perBasin_Ftr) {
    
    // Get the basin ID of each merged buffer.
    var basinID_Num = merged_perBasin_Ftr.get(IDname_Str);
    
    // Obtain the List of coordinates for each MultiPolygon.
    var coordinates_List = merged_perBasin_Ftr.geometry()
      .coordinates();
    
    // Construct a set of individual Polygons based on 
    //  the obtained coordinate List.
    var individualPolygons_List = coordinates_List.map(function(coordinates) {
      
      // Create a Polygon Feature for each element of the coordinate List.
      var individualPolygon_Geom = ee.Geometry.Polygon(coordinates);
      
      var individualPolygon_Ftr = ee.Feature(individualPolygon_Geom);
      
      // Add the basin ID.
      individualPolygon_Ftr = individualPolygon_Ftr
        .set(IDname_Str, basinID_Num);
      
      return individualPolygon_Ftr;
    });
    
    return ee.FeatureCollection(individualPolygons_List);
  }
).flatten();


/*******************************************************************************
 * Results *
 ******************************************************************************/

var output = false; // true OR false.

if (!output) {
  
  // Check the raw centerlines.
  Map.setOptions("Satellite");
  Map.setCenter(-123.4187, 47.7675, 11);
  
  Map.addLayer(centerlines_FC, 
    {color: "FF0000"}, 
    "Raw transect centerlines");

} else {
  
  // Output the results to your GEE Asset.
  var segments_FileName_Str = "Raw_Centerline_Segments";
  
  Export.table.toAsset({
    collection: segments_FC, 
    description: segments_FileName_Str, 
    assetId: "Your/GEE_Asset/Path/" 
      // Please revise this to your GEE Asset path.
      + segments_FileName_Str
  });
  
  var groupedBuffers_FileName_Str = "Grouped_Centerline_Segment_Buffers";
  
  Export.table.toAsset({
    collection: groupedBuffers_FC, 
    description: groupedBuffers_FileName_Str, 
    assetId: "Your/GEE_Asset/Path/" 
      // Please revise this to your GEE Asset path.
      + groupedBuffers_FileName_Str
  });
}

