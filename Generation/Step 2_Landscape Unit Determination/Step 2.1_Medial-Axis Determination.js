/*******************************************************************************
 * Introduction *
 * 
 *  1) Extract the landforms of ridges and valleys.
 * 
 *  2) Segment the entire study domain (not just the broad ATE) based on 
 *     the distances to ridges / valleys / ridges + valleys.
 * 
 *  3) Determine the medial axis between ridges and valleys.
 * 
 *  4) Derive the squared distance to the nearest ridges / valleys 
 *     at each pixel along the determined medial axis within the broad ATE.
 * 
 * Updated: 4/3/2024
 * 
 * Runtime: 15 minutes (for the Olympic Mountains, US)
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

// Extract the landforms of valleys.
var extractValleyLandforms = function(landforms) {
  var valleys = landforms.gte(41);
  
  return valleys;
};

// Segment the study area based on the distance to a type of landform.
var landformsDistance_Segmentation = function(landforms, proj) {
  // Distance calculation.
  var distParams = {
    neighborhood: 1e3,
    units: "pixels",
    metric: "squared_euclidean"
  };

  var LF_dist = landforms.fastDistanceTransform(distParams)
    .sqrt() // Get the distance in the number of pixels.
    .reproject(proj);

  // Define a Laplacian, or isotropic-edge-detection kernel.
  var laplacian = ee.Kernel.laplacian8({ 
    normalize: false 
  });

  // Apply the Laplacian edge-detection kernel to 
  //  detect boundaries in the distance image.
  var edgy = LF_dist.convolve(laplacian)
    .reproject(proj);

  var segmented = edgy.gte(0);
  
  return segmented;
};

// Derive the square distance to the nearest ridges/valleys 
//  at each pixel along the medial axis within the broad ATE.
var extractMedialAxis_sqDist = function(
  ridgesORvalleys_Img, proj, medialAxis_Mask, ATE_mask) {
    var sqDist = ridgesORvalleys_Img.medialAxis({
      neighborhood: 1e3, 
      units: "pixels"
    }).select("medial")
      .reproject(proj);
    
    var medialAxis_sqDist = sqDist.updateMask(medialAxis_Mask)
      .updateMask(ATE_mask)
      .rename("medialAxis_sqDist_inPixels");
  
    return medialAxis_sqDist;
  };


/*******************************************************************************
 * Datasets *
 ******************************************************************************/

// "Broad" alpine treeline ecotones at 30 m.
var broad_ATE = ee.Image(wd_Example
  + "Broad_Alpine_Treeline_Ecotones");

// ALOS landforms dataset.
var LF_noInvaid = loadReproject_ALOSlandforms(prj_Info);


/*******************************************************************************
 * 1) Extract the landforms of ridges and valleys. *
 ******************************************************************************/

// Ridges.
var ridges = extractRidgeLandforms(LF_noInvaid);

// Valleys.
var valleys = extractValleyLandforms(LF_noInvaid);

// Ridges or valleys.
var ridges_OR_valleys = ridges.or(valleys); 


/*******************************************************************************
 * 2) Segment the entire study domain (not just the broad ATE) based on 
 *    the distances to ridges / valleys / ridges + valleys. *
 ******************************************************************************/

var segmented_Ridges = landformsDistance_Segmentation(
  ridges, prj_Info);

var segmented_Valleys = landformsDistance_Segmentation(
  valleys, prj_Info);

var segmented_ridgesORvalleys = landformsDistance_Segmentation(
  ridges_OR_valleys, prj_Info);


/*******************************************************************************
 * 3) Determine the medial axis between ridges and valleys. *
 ******************************************************************************/

var medial_Axis = segmented_Ridges
  .and(segmented_Valleys)
  .and(segmented_ridgesORvalleys.not());


/*******************************************************************************
 * 4) Derive the squared distance to the nearest ridges / valleys 
 *    at each pixel along the determined medial axis within the broad ATE. *
 ******************************************************************************/

var sqDist_MedialAxis = extractMedialAxis_sqDist(
  ridges_OR_valleys, prj_Info, 
  medial_Axis, broad_ATE);


/*******************************************************************************
 * Results *
 ******************************************************************************/

var output = false; // true OR false.

if (!output) {
  
  // Check the broad ATE.
  Map.setOptions("Satellite");
  Map.centerObject(AOI, 8);
  
  Map.addLayer(broad_ATE, 
    {palette: "FF0000"}, 
    "Broad ATE");
  
} else {
  
  // Output the result to your GEE Asset.
  var fileName = "MedialAxis_SquaredDistance";
  
  Export.image.toAsset({
    image: sqDist_MedialAxis,
    description: fileName, 
    assetId: "Your/GEE_Asset/Path/" 
      // Please revise this to your GEE Asset path.
      + fileName, 
    crs: prj_Info.crs,
    scale: prj_Info.scale,
    region: AOI,
    maxPixels: 1e13
  }); 
}

