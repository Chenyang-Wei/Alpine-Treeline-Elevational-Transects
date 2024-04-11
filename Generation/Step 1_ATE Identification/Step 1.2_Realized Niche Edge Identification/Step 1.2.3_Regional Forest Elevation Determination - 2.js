/*******************************************************************************
 * Introduction *
 * 
 *  1) Aggregate the determined elevation of upper-montane closed forests
 *     from 500 m to 10 km.
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
var oldScale = 500;

// New resolution.
var newScale = 1e4;

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

// Determined elevation of upper-montane closed forests at 500 m.
var forest_Elv_500m = ee.Image(wd_Example
  + "Regional_Forest_Elevation_500m");


/*******************************************************************************
 * 1) Aggregate the determined elevation of upper-montane closed forests
 *    from 500 m to 10 km. *
 ******************************************************************************/

// Calculate the factor of the resolution scaling of each axis.
var factor = Math.ceil(newScale / oldScale);

// Elevation aggregation.
var forest_Elv_10km = forest_Elv_500m.reduceResolution({ 
  reducer: meanRd,
  maxPixels: factor * factor
}).reproject({ 
  crs: CRS,
  scale: newScale
});

// Set the mask of each valid pixel to 1.
forest_Elv_10km = forest_Elv_10km.updateMask(
  forest_Elv_10km.gte(-1e18));

// Set the dataset to the float type.
forest_Elv_10km = forest_Elv_10km.float();


/*******************************************************************************
 * Results *
 ******************************************************************************/

var output = false; // true OR false.

if (!output) {
  
  // Check the 500-m closed-forest elevation.
  Map.setOptions("Satellite");
  Map.centerObject(AOI, 8);
  
  Map.addLayer(forest_Elv_500m, 
    elvVis, 
    "500-m closed-forest elevation");
  
} else {
  
  // Output the result to your GEE Asset.
  var fileName = "Regional_Forest_Elevation_10km";
  
  Export.image.toAsset({
    image: forest_Elv_10km,
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

