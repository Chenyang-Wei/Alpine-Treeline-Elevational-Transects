/*******************************************************************************
 * Introduction *
 * 
 *  1) Determine the 30-m elevation of upper-montane closed forests 
 *     from 2015 to 2019 within the fundamental niche edge of trees.
 * 
 * Updated: 3/28/2024
 * 
 * Runtime: 14 minutes (for the Olympic Mountains, US)
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
var wd_Example = "users/ChenyangWei/ATET_v1/";

// File path and band name of land cover data.
var lcPath = "COPERNICUS/Landcover/100m/Proba-V-C3/Global/";

var lcName = "discrete_classification";


/*******************************************************************************
 * Functions *
 ******************************************************************************/

// Function to read the annual land cover datasets.
function readAnnualLC(year) {
  return ee.Image(lcPath + year).select(lcName);
}

// Function to extract the annual closed forests.
function extractCF(lcImg) {
  return lcImg.gte(111).and(lcImg.lte(116));
}


/*******************************************************************************
 * Datasets *
 ******************************************************************************/

// ALOS elevation data (Version 3.2, released in January 2021)
//   in the AOI.
var ALOSelv = ee.ImageCollection("JAXA/ALOS/AW3D30/V3_2")
  .select("DSM")
  .filterBounds(AOI)
  .mosaic()
  .reproject(prj_Info);

// Fundamental niche edge of trees.
var fund_Niche_Edge = ee.Image(wd_Example
  + "Fundamental_Niche_Edge");

// Copernicus Global Land Cover datasets (Version 3.0.1) from 2015 to 2019.
var landCover = ee.ImageCollection.fromImages([
  readAnnualLC(2015),
  readAnnualLC(2016),
  readAnnualLC(2017),
  readAnnualLC(2018),
  readAnnualLC(2019),
]);


/*******************************************************************************
 * 1) Determine the 30-m elevation of upper-montane closed forests 
 *    from 2015 to 2019 within the fundamental niche edge of trees. *
 ******************************************************************************/

// Extract the annual closed forests from 2015 to 2019.
var annualCF = landCover.map(extractCF);

// Determine and reproject areas classified as closed forests 
//  in ALL the five years.
var CF_5yr = annualCF.min()
  .reproject(prj_Info);

// Collect the elevation of the extracted closed forests 
//  within the fundamental niche edge of trees.
var local_Forest_Elv = ALOSelv.updateMask(fund_Niche_Edge)
  .updateMask(CF_5yr);


/*******************************************************************************
 * Results *
 ******************************************************************************/

var output = false; // true OR false.

if (!output) {
  
  // Check the fundamental niche edge of trees.
  Map.setOptions("Satellite");
  Map.centerObject(AOI, 8);
  
  Map.addLayer(fund_Niche_Edge, 
    {palette: "228B22"}, 
    "Fundamental niche edge");
  
} else {
  
  // Output the result to your GEE Asset.
  var fileName = "Local_Forest_Elevation";
  
  // Image.
  Export.image.toAsset({
    image: local_Forest_Elv, 
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

