/*******************************************************************************
 * Introduction *
 * 
 *  1) Calculate the focal mean of the aggregated 10-km elevations 
 *     within each ten-pixel circular kernel.
 * 
 * Updated: 3/29/2024
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
  scale: 1e4
};

// "Mean" reducer.
var meanRd = ee.Reducer.mean();

// Visualization parameters.
var elvPalette = ['006600', '002200', 'fff700', 'ab7634', 'c4d0ff', 'ffffff'];
var elvVis = {min: 150, max: 1750, palette: elvPalette};


/*******************************************************************************
 * Datasets *
 ******************************************************************************/

// Determined elevation of upper-montane closed forests at 10 km.
var forest_Elv_10km = ee.Image(wd_Example
  + "Regional_Forest_Elevation_10km");


/*******************************************************************************
 * 1) Calculate the focal mean of the aggregated 10-km elevations 
 *    within each ten-pixel circular kernel. *
 ******************************************************************************/

// Smooth the 10-km elevation.
var smoothed_Elv_10km = forest_Elv_10km.reduceNeighborhood({
  reducer: meanRd,
  kernel: ee.Kernel.circle(10), // Default unit: "pixels".
  skipMasked: false 
  // Do NOT mask output pixels if the corresponding input pixel is masked.
}).reproject(prj_Info);


/*******************************************************************************
 * Results *
 ******************************************************************************/

var output = false; // true OR false.

if (!output) {
  
  // Check the 10-km closed-forest elevation.
  Map.setOptions("Satellite");
  Map.centerObject(AOI, 8);
  
  Map.addLayer(forest_Elv_10km, 
    elvVis, 
    "10-km closed-forest elevation");
  
} else {
  
  // Output the result to your GEE Asset.
  var fileName = "Smoothed_Regional_Forest_Elevation";
  
  Export.image.toAsset({
    image: smoothed_Elv_10km,
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

