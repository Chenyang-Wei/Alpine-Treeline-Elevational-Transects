/*******************************************************************************
 * Introduction *
 * 
 *  1) Aggregate the determined elevation of upper-montane closed forests
 *     from 30 m to 500 m.
 *     (Due to the computational limitation of Google Earth Engine, 500 m
 *     is chosen as an intermediate level between 30 m and 10 km.)
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

// Original resolution.
var oldScale = 30;

// New resolution.
var newScale = 500;

// Coordinate reference system.
var CRS = "EPSG:4326";

// "Mean" reducer.
var meanRd = ee.Reducer.mean();

// Visualization parameters.
var elvPalette = ['006600', '002200', 'fff700', 'ab7634', 'c4d0ff', 'ffffff'];
var elvVis = {min: 150, max: 1750, palette: elvPalette};


/*******************************************************************************
 * Datasets *
 ******************************************************************************/

// Determined elevation of upper-montane closed forests at 30 m.
var local_Forest_Elv = ee.Image(wd_Example
  + "Local_Forest_Elevation");


/*******************************************************************************
 * 1) Aggregate the determined elevation of upper-montane closed forests
 *    from 30 m to 500 m. *
 ******************************************************************************/

// Calculate the factor of the resolution scaling of each axis.
var factor = Math.ceil(newScale / oldScale);

// Elevation aggregation.
var forest_Elv_500m = local_Forest_Elv.reduceResolution({ 
  reducer: meanRd,
  maxPixels: factor * factor
}).reproject({ 
  crs: CRS,
  scale: newScale
});

// Set the mask of each valid pixel to 1.
forest_Elv_500m = forest_Elv_500m.updateMask(
  forest_Elv_500m.gte(-1e18));

// Set the dataset to the float type.
forest_Elv_500m = forest_Elv_500m.float();


/*******************************************************************************
 * Results *
 ******************************************************************************/

var output = false; // true OR false.

if (!output) {
  
  // Check the 30-m closed-forest elevation.
  Map.setOptions("Satellite");
  Map.centerObject(AOI, 8);
  
  Map.addLayer(local_Forest_Elv, 
    elvVis, 
    "30-m closed-forest elevation");
  
} else {
  
  // Output the result to your GEE Asset.
  var fileName = "Regional_Forest_Elevation_500m";
  
  Export.image.toAsset({
    image: forest_Elv_500m,
    description: fileName, 
    assetId: "Your/GEE_Asset/Path/" 
      // Please revise this to your GEE Asset path.
      + fileName, 
    crs: CRS,
    scale: newScale,
    region: AOI,
    maxPixels: 1e13
  }); 
}

