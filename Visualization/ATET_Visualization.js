/*******************************************************************************
 * Introduction *
 * 
 *  This script creates a Google Earth Engine App to visualize
 *    the datasets of Alpine Treeline Elevational Transects v1.0 (ATETs_v1.0)
 *    and Alpine Treeline Elevational Transect Centroids v1.0 (ATECs_v1.0)
 *    as well as their pertinent information.
 * 
 * Note: 
 *  The UI Pattern Template was provided by Tyler Erickson (tylere@google.com)
 *    and Justin Braaten (braaten@google.com) at Google.
 * 
 * Updated: 12/2/2023.
 * 
 * Author: Chenyang Wei (cwei5@buffalo.edu)
 ******************************************************************************/


/*******************************************************************************
 * Model *
 ******************************************************************************/

// Define a JSON object for storing the data model.
var m = {};

// Define an empty image of the "double" type.
m.emptyImg = ee.Image().double();

// Define the major file path.
m.filePath = "users/treeline/Global/Elevational_Transects/";

// Define an object for storing the FeatureCollections.
m.FtrCols = {};

// Define the transects.
m.FtrCols.ATETs = 
  ee.FeatureCollection(
    m.filePath
      + "Alpine_Treeline_Elevational_"
      + "Transects_v1_0")
  .map(function(transect_Ftr) {
    // Calculate the transect-level differences.
    var CHdiff = ee.Number(transect_Ftr.get("U_CanopyHt"))
      .subtract(transect_Ftr.get("L_CanopyHt"));
    var NDVIdiff = ee.Number(transect_Ftr.get("U_NDVI"))
      .subtract(transect_Ftr.get("L_NDVI"));
    
    return transect_Ftr.set({
      CHdiff: CHdiff,
      NDVIdiff: NDVIdiff
    });
  });
m.FtrCols.ATECs = 
  ee.FeatureCollection(
    m.filePath
      + "Alpine_Treeline_Elevational_"
      + "Transect_Centroids_v1_0");

// Define the GMBA mountains.
m.FtrCols.gmbaVCH = 
  ee.FeatureCollection(
    m.filePath
      + "Aggregation/"
      + "GMBAmeans_VCHdiff");
m.FtrCols.gmbaNDVI = 
  ee.FeatureCollection(
    m.filePath
      + "Aggregation/"
      + "GMBAmeans_NDVIdiff");

// Define the HYBAS watersheds.
m.FtrCols.hybasVCH = 
  ee.FeatureCollection(
    m.filePath
      + "Aggregation/"
      + "HYBASmeans_VCHdiff");
m.FtrCols.hybasNDVI = 
  ee.FeatureCollection(
    m.filePath
      + "Aggregation/"
      + "HYBASmeans_NDVIdiff");

// Define info about ATETs.
m.ATETinfo = {};
m.ATETinfo.regions = 
  m.FtrCols.gmbaVCH.aggregate_array("Regn_GMBA")
    .distinct().getInfo();
m.ATETinfo.mountains = 
  m.FtrCols.gmbaVCH.filter(
    ee.Filter.eq("Regn_GMBA", "North America"))
    .aggregate_array("Name_GMBA")
    .distinct().getInfo(); // Default value.

// Define the types of vegetation differences.
m.diffTypes = {
  'Canopy Height Difference (m)': {
    gmba: {
      data: m.FtrCols.gmbaVCH,
      varName: "Avg_CHdiff"
    },
    hybas: {
      data: m.FtrCols.hybasVCH,
      varName: "Avg_CHdiff"
    },
    ATET: {
      data: m.FtrCols.ATETs,
      varName: "CHdiff"
    },
    varName: "canopy height (m)",
    suffix: "CanopyHt",
    color: '#08306b',
    vis: {
      min: 0,
      max: -12,
      palette: ['#f7fbff','#deebf7','#c6dbef',
        '#9ecae1','#6baed6','#4292c6','#2171b5',
        '#08519c','#08306b']
    }
  },
  'NDVI Difference': {
    gmba: {
      data: m.FtrCols.gmbaNDVI,
      varName: "Avg_VIdiff"
    },
    hybas: {
      data: m.FtrCols.hybasNDVI,
      varName: "Avg_VIdiff"
    },
    ATET: {
      data: m.FtrCols.ATETs,
      varName: "NDVIdiff"
    },
    varName: "NDVI",
    suffix: "NDVI",
    color: '#00441b',
    vis: {
      min: 0,
      max: -0.3,
      palette: ['#f7fcf5','#e5f5e0','#c7e9c0',
        '#a1d99b','#74c476','#41ab5d','#238b45',
        '#006d2c','#00441b']
    }
  }
};


/*******************************************************************************
 * Components *
 ******************************************************************************/

// Define a JSON object for storing UI components.
var c = {};

// Define a control panel for user input.
c.controlPanel = ui.Panel();

// Define a series of panel widgets to be used as horizontal dividers.
c.dividers = {};
c.dividers.divider1 = ui.Panel();
c.dividers.divider2 = ui.Panel();
c.dividers.divider3 = ui.Panel();
c.dividers.divider4 = ui.Panel();

// Define the main interactive map.
c.map = ui.Map();

// Define an app info widget group.
c.info = {};
c.info.titleLabel = 
  ui.Label(
    'Alpine Treeline Elevational Transects (ATETs)');

// Brief introduction.
c.info.introTitles = {};
c.info.introLabels = {};
c.info.introLabels.label_1 = 
  ui.Label(
    'Delve into the intricate world of alpine treeline ecotones '
      + 'through our comprehensive Elevational Transects. '
      + 'Embark on a data-driven exploration journey by:');
c.info.introTitles.title_2 = 
  ui.Label(
    '1. Selecting Your Mountain Range:');
c.info.introLabels.label_2 = 
  ui.Label(
    'Begin by choosing from a diverse array of mountain ranges '
      + 'across the globe.');
c.info.introTitles.title_3 = 
  ui.Label(
    '2. Transect and Centroid Analysis:');
c.info.introLabels.label_3 = 
  ui.Label(
    'Engage with detailed elevational transects, '
      + 'or focus on their central points, '
      + 'to gain unique insights.');
c.info.introTitles.title_4 = 
  ui.Label(
    '3. Multiscale Elevational Differences:');
c.info.introLabels.label_4 = 
  ui.Label(
    'Discover the elevational variance in canopy height '
      + 'and Normalized Difference Vegetation Index (NDVI) '
      + 'across different scales for a thorough understanding.');
c.info.introTitles.title_5 = 
  ui.Label(
    '4. Interactive Transect Details:');
c.info.introLabels.label_5 = 
  ui.Label(
    'Click on any transect to uncover a wealth of '
      + 'relevant information, offering a deeper dive into '
      + 'its specific characteristics.');
c.info.introPanel = 
  ui.Panel({
    widgets: [
      c.info.introLabels.label_1,
      c.info.introTitles.title_2,
      c.info.introLabels.label_2,
      c.info.introTitles.title_3,
      c.info.introLabels.label_3,
      c.info.introTitles.title_4,
      c.info.introLabels.label_4,
      c.info.introTitles.title_5,
      c.info.introLabels.label_5
    ]
  });

// Web links.
c.info.webLinks = {};
c.info.webLinks.link_1 = 
  ui.Label({
    value: 'Check the Code',
    targetUrl: 'https://raw.githubusercontent.com/'
      + 'Chenyang-Wei/GEE_Modules/main/Public/'
      + 'Apps/Treeline/ATET_Visualization'
  });
c.info.webLinks.link_2 = ui.Label({
  value: 'Download the Data',
  targetUrl: 'https://zenodo.org/records/10047965'
});
c.info.linkPanel = 
  ui.Panel({
    widgets: [
      c.info.webLinks.link_1,
      c.info.webLinks.link_2
    ],
    layout: ui.Panel.Layout.flow('horizontal')
  });

// Combine all the info widgets.
c.info.panel = 
  ui.Panel([
    c.info.titleLabel, 
    c.info.introPanel,
    c.info.linkPanel
  ]);

// Define a mountain zoom-in widget group.
c.zoomInMountain = {};
c.zoomInMountain.label = 
  ui.Label(
    '1. Selecting Your Mountain Range:');
c.zoomInMountain.regionSelector = 
  ui.Select({
    items: m.ATETinfo.regions, 
    placeholder: "Select a region...",
    value: "North America"
  });
c.zoomInMountain.mountainSelector = 
  ui.Select({
    items: m.ATETinfo.mountains, 
    placeholder: "Select a mountain...",
    value: "Olympic Mountains"
  });
c.zoomInMountain.selectors = 
  ui.Panel({
    widgets: [
      c.zoomInMountain.regionSelector,
      c.zoomInMountain.mountainSelector
    ],
    layout: ui.Panel.Layout.flow('horizontal')
  });
c.zoomInMountain.panel = 
  ui.Panel([
    c.zoomInMountain.label, 
    c.zoomInMountain.selectors
  ]);

// Define a transect display widget group.
c.displayTransects = {};
c.displayTransects.label = 
  ui.Label(
    '2. Transect and Centroid Analysis:');
c.displayTransects.transectCheckbox = 
  ui.Checkbox({
    label: "Transects (ATETs)", 
    value: true
  });
c.displayTransects.centroidCheckbox = 
  ui.Checkbox({
    label: "Centroids (ATECs)", 
    value: false
  });
c.displayTransects.checkboxes = 
  ui.Panel({
    widgets: [
      c.displayTransects.transectCheckbox,
      c.displayTransects.centroidCheckbox
    ],
    layout: ui.Panel.Layout.flow('horizontal')
  });
c.displayTransects.panel = 
  ui.Panel([
    c.displayTransects.label, 
    c.displayTransects.checkboxes
  ]);

// Define a vegetation difference visualization widget group.
c.visualizeVegeDiff = {};
c.visualizeVegeDiff.label = 
  ui.Label(
    '3. Multiscale Elevational Differences:');
c.visualizeVegeDiff.diffSelector = 
  ui.Select({
    items: Object.keys(m.diffTypes), 
    placeholder: "Select a difference...",
    value: "Canopy Height Difference (m)"
  });
c.visualizeVegeDiff.diffPanel = 
  ui.Panel([
    c.visualizeVegeDiff.label, 
    c.visualizeVegeDiff.diffSelector
  ]);
c.visualizeVegeDiff.levelLabel = 
  ui.Label(
    'Select the spatial scale(s) for display:');
c.visualizeVegeDiff.levelCheckboxes = {};
c.visualizeVegeDiff.levelCheckboxes.mountain = 
  ui.Checkbox({
    label: "GMBA Mountain Ranges", 
    value: false
  });
c.visualizeVegeDiff.levelCheckboxes.watershed = 
  ui.Checkbox({
    label: "HydroSHEDS Watersheds", 
    value: true
  });
c.visualizeVegeDiff.levelCheckboxes.transect = 
  ui.Checkbox({
    label: "Elevational Transects", 
    value: false
  });
c.visualizeVegeDiff.levelPanel = 
  ui.Panel([
    c.visualizeVegeDiff.levelLabel, 
    c.visualizeVegeDiff.levelCheckboxes.mountain,
    c.visualizeVegeDiff.levelCheckboxes.watershed,
    c.visualizeVegeDiff.levelCheckboxes.transect,
  ]);
c.visualizeVegeDiff.panel = 
  ui.Panel([
    c.visualizeVegeDiff.diffPanel,
    c.visualizeVegeDiff.levelPanel
  ]);

// Define a legend widget group.
c.legend = {};
c.legend.title = 
  ui.Label();
c.legend.colorbar = 
  ui.Thumbnail(ee.Image.pixelLonLat().select(0));
c.legend.leftLabel = 
  ui.Label('[min]');
c.legend.centerLabel = 
  ui.Label();
c.legend.rightLabel = 
  ui.Label('[max]');
c.legend.labelPanel = 
  ui.Panel({
    widgets: [
      c.legend.leftLabel,
      c.legend.centerLabel,
      c.legend.rightLabel,
    ],
    layout: ui.Panel.Layout.flow('horizontal')
  });
c.legend.panel = 
  ui.Panel([
    c.legend.title,
    c.legend.colorbar,
    c.legend.labelPanel
  ]);

// Define a panel for inspecting a transect.
c.inspector = {};
c.inspector.shownButton = 
  ui.Button('Hide information');
c.inspector.chartPanel = 
  ui.Panel();  // To hold the dynamically generated chart. 
c.inspectorLabels = {};
c.inspectorValues = {};

// Transect information.
c.inspectorLabels.ID = 
  ui.Label('Transect ID:');
c.inspectorValues.ID = 
  ui.Label();
c.inspector.IDpanel = 
  ui.Panel({
    widgets: [
      c.inspectorLabels.ID,
      c.inspectorValues.ID
    ],
    layout: ui.Panel.Layout.flow('horizontal')
  });
c.inspectorLabels.range = 
  ui.Label('Elevational range (m):');
c.inspectorValues.range = 
  ui.Label();
c.inspector.rangePanel = 
  ui.Panel({
    widgets: [
      c.inspectorLabels.range,
      c.inspectorValues.range
    ],
    layout: ui.Panel.Layout.flow('horizontal')
  });
c.inspectorLabels.length = 
  ui.Label('Horizontal length (m):');
c.inspectorValues.length = 
  ui.Label();
c.inspector.lengthPanel = 
  ui.Panel({
    widgets: [
      c.inspectorLabels.length,
      c.inspectorValues.length
    ],
    layout: ui.Panel.Layout.flow('horizontal')
  });
c.inspectorLabels.slope = 
  ui.Label('Average slope (°):');
c.inspectorValues.slope = 
  ui.Label();
c.inspector.slopePanel = 
  ui.Panel({
    widgets: [
      c.inspectorLabels.slope,
      c.inspectorValues.slope
    ],
    layout: ui.Panel.Layout.flow('horizontal')
  });

// Other information.
c.inspectorLabels.region = 
  ui.Label('Region:');
c.inspectorValues.region = 
  ui.Label();
c.inspector.regionPanel = 
  ui.Panel({
    widgets: [
      c.inspectorLabels.region,
      c.inspectorValues.region
    ],
    layout: ui.Panel.Layout.flow('horizontal')
  });
c.inspectorLabels.mountain = 
  ui.Label('Mountain range:');
c.inspectorValues.mountain = 
  ui.Label();
c.inspector.mountainPanel = 
  ui.Panel({
    widgets: [
      c.inspectorLabels.mountain,
      c.inspectorValues.mountain
    ],
    layout: ui.Panel.Layout.flow('horizontal')
  });

// Combine the inspector widgets.
c.inspector.infoPanel = 
  ui.Panel([
    c.inspector.IDpanel, 
    c.inspector.rangePanel,
    c.inspector.lengthPanel,
    c.inspector.slopePanel,
    c.inspector.regionPanel,
    c.inspector.mountainPanel
  ]);
c.inspector.inspectorContainer = 
  ui.Panel({
    widgets: [
      c.inspector.infoPanel,
      c.inspector.chartPanel
    ],
    layout: ui.Panel.Layout.flow('horizontal')
  });
c.inspector.inspectorPanel = 
  ui.Panel([
    c.inspector.shownButton, 
    c.inspector.inspectorContainer
  ]);


/*******************************************************************************
 * Composition *
 ******************************************************************************/

// Control panel.
c.controlPanel.add(c.info.panel);
c.controlPanel.add(c.dividers.divider1);
c.controlPanel.add(c.zoomInMountain.panel);
c.controlPanel.add(c.dividers.divider2);
c.controlPanel.add(c.displayTransects.panel);
c.controlPanel.add(c.dividers.divider3);
c.controlPanel.add(c.visualizeVegeDiff.panel);
c.controlPanel.add(c.dividers.divider4);

// Map panel.
c.map.add(c.legend.panel);
c.map.add(c.inspector.inspectorPanel);

ui.root.clear();
ui.root.add(c.controlPanel);
ui.root.add(c.map);



/*******************************************************************************
 * Styling *
 ******************************************************************************/

// Define CSS-like class style properties for widgets; reusable styles.
var s = {};

s.opacityWhiteMed = {
  backgroundColor: 'rgba(255, 255, 255, 0.5)'
};
s.opacityWhiteNone = {
  backgroundColor: 'rgba(255, 255, 255, 0)'
};
s.aboutText = {
  fontSize: '13px',
  color: '505050'
};
s.widgetTitle = {
  fontSize: '15px',
  fontWeight: 'bold',
  margin: '8px 8px 4px 8px',
  color: '383838'
};
s.legendTitle = {
  fontWeight: 'bold',
  fontSize: '12px',
  color: '383838'
};
s.stretchHorizontal = {
  stretch: 'horizontal'
};
s.noMargin = {
  margin: '0px'
};
s.smallTopBottomMargin = {
  margin: '4px 8px'
};
s.bigTopMargin = {
  margin: '24px 8px 8px 8px'
};
s.divider = {
  backgroundColor: 'F0F0F0',
  height: '4px',
  margin: '20px 0px'
};

// Set the styles of widgets in the control panel.
c.controlPanel.style()
  .set({
    width: '300px',
    padding: '0px'
  });

// Information panel.
c.info.titleLabel.style()
  .set({
    fontSize: '20px',
    fontWeight: 'bold'
  })
  .set(s.bigTopMargin);
c.info.linkPanel.style()
  .set(s.aboutText);

// Loop through setting the styles of 
//  introduction texts and web links.
Object.keys(c.info.introTitles)
  .forEach(function(key) {
    c.info.introTitles[key].style()
      .set({
        fontWeight: 'bold'
      })
      .set(s.aboutText)
      .set(s.smallTopBottomMargin);
  });
Object.keys(c.info.introLabels)
  .forEach(function(key) {
    c.info.introLabels[key].style()
      .set(s.aboutText)
      .set(s.smallTopBottomMargin);
  });
Object.keys(c.info.webLinks)
  .forEach(function(key) {
    c.info.webLinks[key].style()
      .set(s.stretchHorizontal);
  });

// Zoom-in panel.
c.zoomInMountain.label.style()
  .set(s.widgetTitle);
c.zoomInMountain.regionSelector.style()
  .set(s.stretchHorizontal)
  .set(s.aboutText);
c.zoomInMountain.mountainSelector.style()
  .set(s.stretchHorizontal)
  .set(s.aboutText);

// Transects/centroids panel.
c.displayTransects.label.style()
  .set(s.widgetTitle);
c.displayTransects.transectCheckbox.style()
  .set(s.stretchHorizontal)
  .set(s.aboutText);
c.displayTransects.centroidCheckbox.style()
  .set(s.stretchHorizontal)
  .set(s.aboutText);

// Vegetation difference panel.
c.visualizeVegeDiff.label.style()
  .set(s.widgetTitle);
c.visualizeVegeDiff.diffSelector.style()
  .set(s.stretchHorizontal)
  .set(s.aboutText);
c.visualizeVegeDiff.levelLabel.style()
  .set(s.aboutText)
  .set({
    fontWeight: 'bold'
  });

// Loop through setting the style of 
//  the difference-level checkboxes.
Object.keys(c.visualizeVegeDiff.levelCheckboxes)
  .forEach(function(key) {
    c.visualizeVegeDiff.levelCheckboxes[key].style()
      .set(s.aboutText);
  });

// Loop through setting divider style.
Object.keys(c.dividers).forEach(function(key) {
  c.dividers[key].style()
    .set(s.divider);
});

// Set the styles of widgets in the map panel.
c.map.style()
  .set({
    cursor: 'crosshair'
  });
c.map.setOptions("hybrid");
c.map.setControlVisibility({
  layerList: false,
  zoomControl: false,
  mapTypeControl: false, 
  fullscreenControl: false
});

// Map legend.
c.legend.title.style()
  .set(s.legendTitle)
  .set(s.opacityWhiteNone);
c.legend.colorbar.style()
  .set({
    stretch: 'horizontal',
    margin: '0px 8px',
    maxHeight: '20px'
  });
c.legend.leftLabel.style()
  .set({
    margin: '4px 8px',
    fontSize: '12px'
  })
  .set(s.opacityWhiteNone);
c.legend.centerLabel.style()
  .set({
    margin: '4px 8px',
    fontSize: '12px',
    textAlign: 'center',
    stretch: 'horizontal'
  })
  .set(s.opacityWhiteNone);
c.legend.rightLabel.style()
  .set({
    margin: '4px 8px',
    fontSize: '12px'
  })
  .set(s.opacityWhiteNone);
c.legend.panel.style()
  .set({
    position: 'bottom-right',
    width: '200px',
    padding: '0px'
  })
  .set(s.opacityWhiteMed);
c.legend.labelPanel.style()
  .set(s.opacityWhiteNone);

// Transect inspector.
c.inspector.inspectorPanel.style()
  .set({
    position: 'top-right',
    shown: false
  })
  .set(s.opacityWhiteMed);
Object.keys(c.inspector)
  .forEach(function(key) {
    if (key != "inspectorPanel") {
      c.inspector[key].style()
      .set(s.opacityWhiteNone);
    }
  });
c.inspector.shownButton.style()
  .set(s.noMargin);
c.inspector.infoPanel.style()
  .set({
    width: '300px',
    height: '200px'
  });

// Loop through setting the styles of 
//  inspector labels and values.
Object.keys(c.inspectorLabels)
  .forEach(function(key) {
    c.inspectorLabels[key].style()
      .set(s.stretchHorizontal)
      .set(s.opacityWhiteNone)
      .set(s.legendTitle);
  });
Object.keys(c.inspectorValues)
  .forEach(function(key) {
    c.inspectorValues[key].style()
      .set(s.stretchHorizontal)
      .set(s.opacityWhiteNone)
      .set({
        fontSize: '12px',
        color: '383838'
      });
  });


/*******************************************************************************
 * Behaviors *
 ******************************************************************************/

// Handles updating the mountain selector 
//  when region selector changes.
function updateMountainSelector() {
  var regionName = c.zoomInMountain.regionSelector
    .getValue();

  var mountains = m.FtrCols.gmbaVCH
    .filter(ee.Filter.eq("Regn_GMBA", regionName))
    .aggregate_array("Name_GMBA")
    .distinct().getInfo();

  c.zoomInMountain.mountainSelector
    .items().reset(mountains);
}

// Handles zooming in the selected mountain.
function zoomInMountain() {
  // Get the name of the selected mountain.
  var mountainName = c.zoomInMountain.mountainSelector
    .getValue();
  
  // Locate the selected ATETs.
  var selectedATETs = 
    m.FtrCols.ATETs.filter(
      ee.Filter.eq("GMBA_Name", mountainName));
  
  // Center the map.
  c.map.centerObject(
    ee.FeatureCollection(selectedATETs).first(), 8);
}

// Handles updating the display of transects.
function updateTransectDisplay() {
  // Get the state of the raw transect checkbox.
  var transectChecked = c.displayTransects.transectCheckbox
    .getValue();

  // Create a layer of transects.
  var globalATETs_Layer = ui.Map.Layer(
    m.FtrCols.ATETs, {color: "ff0000"}, 
    "Global ATETs")
    .setShown(transectChecked);

  // Update the map layer.
  c.map.layers().set(3, globalATETs_Layer);
}

// Handles updating the checkbox of 
//  transect-level difference.
function updateTransectDiffCheckbox() {
  // Get the state of the raw transect checkbox.
  var transectChecked = 
    c.displayTransects.transectCheckbox
      .getValue();

  // Get the original state of the difference checkbox.
  var originalState = 
    c.visualizeVegeDiff.levelCheckboxes.transect
      .getValue();

  // Update the state of the difference checkbox.
  c.visualizeVegeDiff.levelCheckboxes.transect
    .setValue(ee.Algorithms.If({
      condition: transectChecked, 
      trueCase: false, 
      falseCase: originalState
    }).getInfo());
}

// Handles updating the display of centroids.
function updateCentroidDisplay() {
  // Get the state of the raw centroid checkbox.
  var centroidChecked = c.displayTransects.centroidCheckbox
    .getValue();

  // Create a layer of centroids.
  var globalATECs_Layer = ui.Map.Layer(
    m.FtrCols.ATECs, {color: "00ffff"}, 
    "Global ATECs")
    .setShown(centroidChecked);

  // Update the map layer.
  c.map.layers().set(4, globalATECs_Layer);
}

// Handles updating the display of mountain-level difference.
function updateMountainDifference() {
  // Get the selected difference type.
  var differenceType = 
    c.visualizeVegeDiff.diffSelector
      .getValue();
  
  // Determine the difference dataset.
  var differenceDataset = 
    m.diffTypes[differenceType].gmba.data;

  // Determine the difference variable.
  var differenceVariable = 
    m.diffTypes[differenceType].gmba.varName;
  
  // Get the state of the checkbox.
  var differenceChecked = 
    c.visualizeVegeDiff.levelCheckboxes.mountain
      .getValue();

  // Create a layer of the difference.
  var difference_Img = m.emptyImg
    .paint(differenceDataset, 
      differenceVariable);
  var difference_Layer = 
    ui.Map.Layer(difference_Img, 
      m.diffTypes[differenceType].vis, 
      differenceType + " (mountain level)")
      .setShown(differenceChecked);

  // Update the map layer.
  c.map.layers().set(0, difference_Layer);
}

// Handles updating the display of watershed-level difference.
function updateWatershedDifference() {
  // Get the selected difference type.
  var differenceType = 
    c.visualizeVegeDiff.diffSelector
      .getValue();
  
  // Determine the difference dataset.
  var differenceDataset = 
    m.diffTypes[differenceType].hybas.data;

  // Determine the difference variable.
  var differenceVariable = 
    m.diffTypes[differenceType].hybas.varName;
  
  // Get the state of the checkbox.
  var differenceChecked = 
    c.visualizeVegeDiff.levelCheckboxes.watershed
      .getValue();

  // Create a layer of the difference.
  var difference_Img = m.emptyImg
    .paint(differenceDataset, 
      differenceVariable);
  var difference_Layer = 
    ui.Map.Layer(difference_Img, 
      m.diffTypes[differenceType].vis, 
      differenceType + " (watershed level)")
      .setShown(differenceChecked);

  // Update the map layer.
  c.map.layers().set(1, difference_Layer);
}

// Handles updating the display of transect-level difference.
function updateTransectDifference() {
  // Get the selected difference type.
  var differenceType = 
    c.visualizeVegeDiff.diffSelector
      .getValue();
  
  // Determine the difference dataset.
  var differenceDataset = 
    m.diffTypes[differenceType].ATET.data;

  // Determine the difference variable.
  var differenceVariable = 
    m.diffTypes[differenceType].ATET.varName;
  
  // Get the state of the checkbox.
  var differenceChecked = 
    c.visualizeVegeDiff.levelCheckboxes.transect
      .getValue();

  // Create a layer of the difference.
  var difference_Img = m.emptyImg
    .paint(differenceDataset, differenceVariable)
    .paint(differenceDataset, differenceVariable, 1);
  var difference_Layer = 
    ui.Map.Layer(difference_Img, 
      m.diffTypes[differenceType].vis, 
      differenceType + " (transect level)")
      .setShown(differenceChecked);

  // Update the map layer.
  c.map.layers().set(2, difference_Layer);
}

// Handles updating the checkbox of 
//  the raw transects.
function updateRawTransectCheckbox() {
  // Get the state of the transect-level 
  //  difference checkbox.
  var differenceChecked = 
    c.visualizeVegeDiff.levelCheckboxes.transect
      .getValue();

  // Get the original state of the raw transect checkbox.
  var originalState = 
    c.displayTransects.transectCheckbox
      .getValue();

  // Update the state of the raw transect checkbox.
  c.displayTransects.transectCheckbox
    .setValue(ee.Algorithms.If({
      condition: differenceChecked, 
      trueCase: false, 
      falseCase: originalState
    }).getInfo());
}

// Handles drawing the legend 
//  when difference selector changes.
function updateLegend() {
  c.legend.title.setValue(
    c.visualizeVegeDiff.diffSelector.getValue());
  c.legend.colorbar.setParams({
    bbox: [0, 0, 1, 0.1],
    dimensions: '100x10',
    format: 'png',
    min: 1,
    max: 0,
    palette: m.diffTypes[
      c.visualizeVegeDiff.diffSelector.getValue()]
      .vis.palette
  });
  c.legend.leftLabel.setValue(
    m.diffTypes[
      c.visualizeVegeDiff.diffSelector.getValue()]
      .vis.max);
  c.legend.centerLabel.setValue(
    m.diffTypes[
      c.visualizeVegeDiff.diffSelector.getValue()]
      .vis.max / 2);
  c.legend.rightLabel.setValue(
    m.diffTypes[
      c.visualizeVegeDiff.diffSelector.getValue()]
      .vis.min);
}

// Handles map clicks for inspecting.
function inspectTransect(coords) {
  // Get out if call to inspectTransect did not come from map click 
  //  and the inspector has not been created previously.
  if (!coords.lon) {
    return null;
  }
  
  // Buffer the clicked point by 90 m (the transect width).
  var point = ee.Geometry.Point([coords.lon, coords.lat])
    .buffer(90);
  var clicked = m.FtrCols.ATETs.filterBounds(point);
  
  // Get out if the clicked point intersects any transect.
  if (clicked.size().getInfo() === 0) {
    return null;
  }
  
  // Show the inspector panel if this is the first time 
  //  a point is clicked.
  if (!c.inspector.inspectorPanel.style().get('shown')) {
    c.inspector.inspectorPanel.style()
      .set('shown', true);
  }
  
  // Show information if hidden; assuming user wants to 
  //  update the inspector container.
  if (c.inspector.shownButton.getLabel() == 'Show information') {
    c.inspector.inspectorContainer.style()
      .set({shown: true});
    c.inspector.shownButton.setLabel('Hide information');
  }

  // Add the clicked point to map.
  var layer = ui.Map.Layer(
    point, {color: "ffff00"}, 'Clicked point');
  c.map.layers().set(5, layer);

  // Select the first clicked transect.
  var clickedTransect = clicked
    .first();

  // Update the infomation panel with
  //  transect properties.
  c.inspectorValues.ID.setValue(
    clickedTransect.get("ET_ID").getInfo());
  c.inspectorValues.range.setValue(
    ee.Number(clickedTransect.get("Elv_Range"))
      .round().getInfo());
  c.inspectorValues.length.setValue(
    ee.Number(clickedTransect.get("H_Length"))
      .round().getInfo());
  c.inspectorValues.slope.setValue(
    ee.Number(clickedTransect.get("Avg_Slope"))
      .round().getInfo());
  c.inspectorValues.region.setValue(
    clickedTransect.get("GMBA_Regn").getInfo());
  c.inspectorValues.mountain.setValue(
    clickedTransect.get("GMBA_Name").getInfo());

  // Derive the variable name, suffix, and color.
  var differenceType = 
    c.visualizeVegeDiff.diffSelector
    .getValue();
  var varName = 
    m.diffTypes[differenceType].varName;
  var suffix = 
    m.diffTypes[differenceType].suffix;
  var color = 
    m.diffTypes[differenceType].color;
  
  // Get elevation and vegetation variable lists; 
  //  to be plotted along x and y axes, respectively.
  var x = ee.List([
    clickedTransect.get("LEnd_Elv"),
    clickedTransect.get("UEnd_Elv")
  ]);
  var y = ee.List([
    clickedTransect.get("L_" + suffix),
    clickedTransect.get("U_" + suffix)
  ]);

  // Generate a chart.
  var styleChartAxis = {
    italic: false,
    bold: true
  };
  var styleChartArea = {
    width: '400px',
    height: '200px',
    margin: '0px',
    padding: '0px'
  }; 
  var chart = ui.Chart.array.values({
    array: y, 
    axis: 0, 
    xLabels: x
  }).setOptions({
    titlePosition: 'none',
    colors: [color],
    hAxis: {
      title: 'Transect endpoint elevation (m)',
      titleTextStyle: styleChartAxis
    },
    vAxis: {
      title: 'Segment average ' + varName,
      titleTextStyle: styleChartAxis
    },
    lineSize: 5,
    pointSize: 8,
    legend: {position: 'none'},
  });
  chart.style().set(styleChartArea);
  
  // Draw the chart.
  c.inspector.chartPanel.widgets().reset([chart]);
}

// Handles showing/hiding the chart panel.
function showHideChart() {
  var shown = true;
  var label = 'Hide information';
  if (c.inspector.shownButton.getLabel() == 'Hide information') {
    shown = false;
    label = 'Show information';
  }
  c.inspector.inspectorContainer.style()
    .set({shown: shown});
  c.inspector.shownButton.setLabel(label);
}

// Handles updating the clicked point coordinates
//  in the page's URL fragment.
function updateUrlParamClick(newClickParams) {
  ui.url.set('click_lon', newClickParams.lon);
  ui.url.set('click_lat', newClickParams.lat);
}

// Zoom-in panel.
c.zoomInMountain.regionSelector
  .onChange(updateMountainSelector);
c.zoomInMountain.mountainSelector
  .onChange(zoomInMountain);

// Transect/centroid panel.
c.displayTransects.transectCheckbox
  .onChange(updateTransectDisplay);
c.displayTransects.transectCheckbox
  .onChange(updateTransectDiffCheckbox);
c.displayTransects.centroidCheckbox
  .onChange(updateCentroidDisplay);

// Difference-type panel
c.visualizeVegeDiff.diffSelector
  .onChange(updateMountainDifference);
c.visualizeVegeDiff.diffSelector
  .onChange(updateWatershedDifference);
c.visualizeVegeDiff.diffSelector
  .onChange(updateTransectDifference);
c.visualizeVegeDiff.diffSelector
  .onChange(updateLegend);
c.visualizeVegeDiff.diffSelector
  .onChange(function(value) {
    // Update inspector if shown; assuming user wants to 
    //  see updates to inspector.
    if (c.inspector.shownButton.getLabel() == 'Hide information') {
      inspectTransect({
        lon: ui.url.get('click_lon'), 
        lat: ui.url.get('click_lat')
      });
    }
  });

// Difference-level panel.
c.visualizeVegeDiff.levelCheckboxes.mountain
  .onChange(updateMountainDifference);
c.visualizeVegeDiff.levelCheckboxes.watershed
  .onChange(updateWatershedDifference);
c.visualizeVegeDiff.levelCheckboxes.transect
  .onChange(updateTransectDifference);
c.visualizeVegeDiff.levelCheckboxes.transect
  .onChange(updateRawTransectCheckbox);

// Map panel.
c.map.onClick(inspectTransect);
c.map.onClick(updateUrlParamClick);
c.inspector.shownButton.onClick(showHideChart);


/*******************************************************************************
 * Initialize *
 ******************************************************************************/

// Vegetation differences.
updateMountainDifference();
updateWatershedDifference();
updateTransectDifference();
updateRawTransectCheckbox();
updateLegend();

// Raw datasets/centroids.
updateTransectDisplay();
updateTransectDiffCheckbox();
updateCentroidDisplay();

// Map center.
zoomInMountain();

// Inspect a transect if applicable 
//  (coordinates exist as URL parameters).
inspectTransect({
  lon: ui.url.get('click_lon'), 
  lat: ui.url.get('click_lat')
});
