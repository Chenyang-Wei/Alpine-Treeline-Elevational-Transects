/*******************************************************************************
 * Introduction *
 * 
 *  1) Exclude the fundamental niche edge below the determined
 *     regional forest elevation.
 * 
 *  2) Identify the remaining fundamental niche edge within 
 *     3 km of upper-montane closed forests.
 * 
 *  3) Exclude in-land water from the defined broad extents of 
 *     alpine treeline ecotones.
 * 
 * Updated: 4/3/2024
 * 
 * Runtime: 12 minutes (for the Olympic Mountains, US)
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

// Visualization parameters.
var elvPalette = ['006600', '002200', 'fff700', 'ab7634', 'c4d0ff', 'ffffff'];
var elvVis = {min: 150, max: 1750, palette: elvPalette};


/*******************************************************************************
 * Datasets *
 ******************************************************************************/

// ALOS elevation (Version 3.2, released in January 2021) in the AOI.
var ALOSelv = ee.ImageCollection('JAXA/ALOS/AW3D30/V3_2').select('DSM')
  .filterBounds(AOI)
  .mosaic()
  .reproject(prj_Info);

// Land surface area based on the Hansen Global Forest Change dataset 
//  (Version 1.7).
var land = ee.Image("UMD/hansen/global_forest_change_2019_v1_7")
  .select("datamask")
  .eq(1) // Select the "Mapped land surface" area in the Hansen dataset.
  .reproject(prj_Info);

// Identified fundamental niche edge of trees.
var fund_Niche_Edge = ee.Image(wd_Example
  + "Fundamental_Niche_Edge");

// Determined regional forest elevation at 10 km.
var smoothed_Elv_10km = ee.Image(wd_Example
  + "Smoothed_Regional_Forest_Elevation");

// Determined local forest elevation at 30 m.
var local_Forest_Elv = ee.Image(wd_Example
  + "Local_Forest_Elevation");


/*******************************************************************************
 * 1) Exclude the fundamental niche edge below the determined
 *    regional forest elevation. *
 ******************************************************************************/

// Determine the elevation of the fundamental niche edge.
var fund_Niche_Edge_Elv = ALOSelv.updateMask(fund_Niche_Edge);

// Identify areas higher than the regional forest elevation.
var remaining_Fund_Niche_Edge = fund_Niche_Edge_Elv.gte(smoothed_Elv_10km);


/*******************************************************************************
 * 2) Identify the remaining fundamental niche edge within 
 *    3 km of upper-montane closed forests. *
 ******************************************************************************/

// Extract the determined closed forests within the fundamental niche edge.
var local_Forests = local_Forest_Elv.mask();

// Determine the size of neighborhood.
var neighborhood = 200; // Number of 30-m pixels.

// Calculate the distance to the determined closed forests 
//  at each pixel in the neighborhood.
var dist_To_Forests = local_Forests.fastDistanceTransform({
  neighborhood: neighborhood,
  units: "pixels",
  metric: "squared_euclidean"
}).sqrt() // Get the distance in the number of 30-m pixels.
  .reproject(prj_Info);

// Generate a 3-km buffer of the determined closed forests.
var dist_Thres = 100; // Number of 30-m pixels.

var forest_Buffer = dist_To_Forests.lte(dist_Thres);

// Identify the remaining fundamental niche edge within the 3-km buffer.
var real_Niche_Edge = remaining_Fund_Niche_Edge.updateMask(forest_Buffer);


/*******************************************************************************
 * 3) Exclude in-land water from the defined broad extents of 
 *    alpine treeline ecotones. *
 ******************************************************************************/

var broad_ATE = real_Niche_Edge.updateMask(land)
  .selfMask()
  .rename("broad_ATE");


/*******************************************************************************
 * Results *
 ******************************************************************************/

var output = false; // true OR false.

if (!output) {
  
  // Check some loaded datasets.
  Map.setOptions("Satellite");
  Map.centerObject(AOI, 8);
  
  Map.addLayer(smoothed_Elv_10km, 
    elvVis, 
    "Regional forest elevation");
  
  Map.addLayer(fund_Niche_Edge, 
    {palette: "FF0000"}, 
    "Fundamental niche edge");
  
  Map.addLayer(local_Forest_Elv, 
    elvVis, 
    "Local forest elevation");
  
} else {
  
  // Output the result to your GEE Asset.
  var fileName = "Broad_Alpine_Treeline_Ecotones";
  
  Export.image.toAsset({
    image: broad_ATE,
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

