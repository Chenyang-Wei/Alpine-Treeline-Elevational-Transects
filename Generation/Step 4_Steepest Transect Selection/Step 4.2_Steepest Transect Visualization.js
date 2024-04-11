/*******************************************************************************
 * Introduction *
 * 
 *  1) Visualize the constructed elevational transects within the study area.
 * 
 * Updated: 4/11/2024
 * 
 * Runtime: N/A
 * 
 * Author: Chenyang Wei (chenyangwei.cwei@gmail.com)
 ******************************************************************************/

/*******************************************************************************
 * Objects *
 ******************************************************************************/

// Working directory (you can revise this to your GEE Asset path).
var wd_Example = "users/ChenyangWei/ATET_v1/";


/*******************************************************************************
 * Datasets *
 ******************************************************************************/

// Constructed elevational transects.
var transects_FC = ee.FeatureCollection(wd_Example
  + "Elevational_Transects");


/*******************************************************************************
 * 1) Visualize the constructed elevational transects within the study area. *
 ******************************************************************************/

// Check the basic information of transects.
print("Elevational transect number:", transects_FC.size());
print("Elevational transect example:", transects_FC.first());

// Visualize the elevational transects.
Map.setOptions("Satellite");
Map.setCenter(-123.4187, 47.7675, 12);

Map.addLayer(transects_FC,
  {color: "FF0000"},
  "Elevational transects");

