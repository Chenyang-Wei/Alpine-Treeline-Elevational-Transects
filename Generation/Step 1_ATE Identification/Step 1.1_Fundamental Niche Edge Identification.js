/*******************************************************************************
 * Introduction *
 * 
 *  1) Resample the CHELSA climatic treeline distance (Version 1.2) dataset
 *     from 30 arc-second to 30 m.
 * 
 *  2) Calculate the temporal average climatic treeline elevation
 *     from 1979 to 2013 within the "Global Mountain Explorer - K3" 
 *     mountainous areas.
 * 
 *  3) Extract regions vertically and horizontally close to
 *     the long-term climatic treeline.
 * 
 * Updated: 3/28/2024
 * 
 * Runtime: 7 minutes (for the Olympic Mountains, US)
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

// Projection information.
var prj_Info = {
  crs: "EPSG:4326",
  scale: 30
};

// Working directories.
var wd_Global = "users/treeline/Global/";
var wd_Example = "users/ChenyangWei/ATET_v1/";


/*******************************************************************************
 * Datasets *
 ******************************************************************************/

// "Global Mountain Explorer (GME) - K3" binary dataset.  
var k3Binary = ee.Image(wd_Global 
  + "Global_Mountain_Explorer/" 
  + "k3binary")
  .reproject(prj_Info);

// ALOS elevation data (Version 3.2, released in January 2021)
//   in the AOI.
var ALOSelv = ee.ImageCollection("JAXA/ALOS/AW3D30/V3_2")
  .select("DSM")
  .filterBounds(AOI)
  .mosaic()
  .reproject(prj_Info);

// Load the 30-arcsec CHELSA climatic treeline distance dataset.
var chelsa_tlh = ee.Image(wd_Global 
  + "Global_CHELSA_TLH_V1_2/" 
  + "Stacked_CHELSA_v12_TLH_1979to2013_10000pixels_NAinterpolated_"
  + "Predictor2_Zlevel9_DeflateCompressed");

// Read the Global Multi-resolution Terrain Elevation Data (GMTED) product.
var gmted = ee.Image(wd_Global + "GMTED/GMTED2010_30arcsec");

// Load the example study domain: 
//  the "Broad" extent of Olympic Mountains, US
//  from the GMBA Mountain Inventory (Version 2.0) database.
var studyDomain = ee.FeatureCollection(wd_Example
  + "Olympic_Mountains_GMBAv2_Broad");


/*******************************************************************************
 * 1) Resample the CHELSA climatic treeline distance (Version 1.2) dataset
 *    from 30 arc-second to 30 m. *
 ******************************************************************************/

// Reproject the GMTED to 30 arc-second.
gmted = gmted.reproject({
  crs: chelsa_tlh.projection().crs(),
  scale: chelsa_tlh.projection().nominalScale()
});

// Reproject the climatic treeline elevation to 30 m.
var TLHreprj = ee.ImageCollection.fromImages(
  chelsa_tlh.bandNames().map(function(b){
    // Select the CHELSA climatic treeline distance in each year.
    var tlh = chelsa_tlh.select([b]);
    
    // Calculate the absolute climatic treeline elevation at 30 arc-second.
    var height = tlh.add(gmted);
    // add(): Only the intersection of unmasked pixels between the two inputs 
    //  of the operation are considered and returned as unmasked, 
    //  all else are masked.
    
    // Downscale the calculated climatic treeline elevation 
    //  from 30 arc-secoonnd to 30 m by using 
    //  the "bilinear" resampling algorithm.
    var heightReprj = height.resample("bilinear")
      .reproject(prj_Info);
    
    // Rename the reprojected climatic treeline elevation.
    return heightReprj.rename("TLH");
  })
);


/*******************************************************************************
 * 2) Calculate the temporal average climatic treeline elevation
 *    from 1979 to 2013 within the "Global Mountain Explorer - K3" 
 *    mountainous areas. *
 ******************************************************************************/

// Calculate the average climatic treeline elevation from 1979 to 2013
//  at the 30-m level.
var avgTLH = TLHreprj.mean()
  .reproject(prj_Info);

// Extract the average climatic treeline elevation 
//  within the "GME-K3" mountainous areas.
avgTLH = avgTLH.updateMask(k3Binary);


/*******************************************************************************
 * 3) Extract regions vertically and horizontally close to
 *    the long-term climatic treeline. *
 ******************************************************************************/

// Calculate the absolute vertical distance to 
//  the average climatic treeline elevation.
var absTLHdist = avgTLH.subtract(ALOSelv).abs(); 

// Extract regions within a certain vertical distance.
var vertical_Thres = 500; // In meters.

var extracted = absTLHdist.lte(vertical_Thres);

// Determine the size of neighborhood for 
//  the horizontal distance calculation.
var horizontal_Neighborhood = 200; // Number of 30-m pixels.

// Calculate the horizontal distance to the extracted regions 
//  at each pixel in the neighborhood.
var horizontal_Dist = extracted.fastDistanceTransform({
  neighborhood: horizontal_Neighborhood,
  units: "pixels",
  metric: "squared_euclidean"
}).sqrt() // Get the distance in the number of pixels (30 m).
  .reproject(prj_Info);

// Threshold of the horizontal distance for surrounding areas.
var horizontal_Thres = 100; // Number of 30-m pixels.

// Identify the fundamental niche edge of trees.
var fund_Niche_Edge = horizontal_Dist.lte(horizontal_Thres)
  .selfMask();


/*******************************************************************************
 * Results *
 ******************************************************************************/

var output = false; // true OR false.

if (!output) {
  
  // Check the AOI.
  Map.setOptions("Satellite");
  Map.centerObject(AOI, 8);
  
  Map.addLayer(AOI, {color: "FF0000"}, "AOI");
  
} else {
  
  // Output the result to your GEE Asset.
  var fileName = "Fundamental_Niche_Edge";
  
  Export.image.toAsset({
    image: fund_Niche_Edge, 
    description: fileName, 
    assetId: "Your/GEE_Asset/Path/" 
      // Please revise this to your GEE Asset path.
      + fileName, 
    region: AOI, 
    scale: prj_Info.scale,  
    crs: prj_Info.crs,
    maxPixels: 1e13
  });
}

