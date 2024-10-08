import './style.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import LayerGroup from 'ol/layer/Group';
import BingMaps from 'ol/source/BingMaps';
import {getRenderPixel} from 'ol/render.js';
// new attempt
// import vector features
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import {Style, Circle, Fill, Stroke} from 'ol/style';

// for coordinates
import {fromLonLat, toLonLat} from 'ol/proj';

// // Create two base maps
// Create orthophoto base layer
const orthophotoLayer = new TileLayer({
  source: new XYZ({
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attributions: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  }),
  zIndex: 0
});

const hotOsmLayer = new TileLayer({
  source: new XYZ({
    url: 'https://{a-c}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attributions: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>'
  }),
  zIndex: 1
});

// Create a layer group for base layers
const baseLayerGroup = new LayerGroup({
  layers: [orthophotoLayer, hotOsmLayer]
});

// create vector source for pin points
const vectorSource = new VectorSource();
const vectorLayer = new VectorLayer({
  source: vectorSource,
  zIndex: 3
});

// create map
const lundCoordinates = fromLonLat([13.1950, 55.7042])

const map = new Map({
  target: 'map',
  layers: [
    baseLayerGroup, 
    vectorLayer
  ],
  view: new View({
    center: lundCoordinates,
    zoom: 13
  })
});


// // Swipe control
// let swipe = document.getElementById('swipe');

// function updateLayers() {
//   let swipeValue = parseInt(swipe.value) / 100;
//   hotOsmLayer.setOpacity(swipeValue);
// }

// // Update map when slider changes
// swipe.addEventListener('input', updateLayers);

// // Initial update
// updateLayers();

// sets if we are in add pin mode
let addPinMode = false;  // Add this line outside the function
// determines the current feature that is being added
let currentFeature = null;


const addButton = document.getElementById('addButton');

// update add button when clicked
function updateAddButton() {
  if (addPinMode) {
    addButton.textContent = 'Choose a location on the map';
    addButton.style.backgroundColor = 'red';
  } else {
    addButton.textContent = 'Add Pin';
    addButton.style.backgroundColor = '';
  }
}

// Add button 
function onAddButtonClick() {
  if (currentFeature || document.getElementById('attributeForm').style.display === 'block') {
    return; // The if-statement checks if any of the two statements are true above. If true, don't allow adding new pin if form is open or currentFeature exists
    }
  console.log("Add button clicked");
  addPinMode = true;  // Toggle the mode
  updateAddButton();
  if (addPinMode) {
    map.once('click', addPin);  // Add click listener
    console.log("Pin adding mode enabled");
  } else {
    map.un('click', addPin);  // Remove click listener
    console.log("Pin adding mode disabled");
  }
}

// add pin to vector source
function addPin(event) {
  const coordinate = event.coordinate;
  currentFeature = new Feature({
    geometry: new Point(coordinate)
  });

  currentFeature.setStyle(new Style({
    image: new Circle({
      radius: 6,
      fill: new Fill({color: 'red'}),
      stroke: new Stroke({color: 'white', width: 2})
    })
  }));

  vectorSource.addFeature(currentFeature);
  
  // Show the attribute form of pin
  showAttributeForm();
  addPinMode = false;
  updateAddButton();
}

// attribute form
function showAttributeForm() {
  const form = document.getElementById('attributeForm');
  form.style.display = 'block';
  addButton.disabled = true;
}

function hideAttributeForm() {
  const form = document.getElementById('attributeForm');
  form.style.display = 'none';
  addButton.disabled = false;
}

function handleOkClick() {
  if (currentFeature) {
    const species = document.getElementById('speciesInput').value;
    const year = document.getElementById('yearInput').value;
    
    currentFeature.set('species', species);
    currentFeature.set('year', year);
    
    console.log('Attributes saved:', currentFeature.getProperties());
    
    hideAttributeForm();
    currentFeature = null;
    updateAddButton();
  }
}


// coordinates display
function displayCoordinates() {
  const coordinatesElement = document.getElementById('coordinates');
  
  map.on('pointermove', function(event) {
      const lonLat = toLonLat(event.coordinate);
      const lon = lonLat[0].toFixed(4);
      const lat = lonLat[1].toFixed(4);
      coordinatesElement.innerHTML = `Longitude: ${lon}, Latitude: ${lat}`;
  });
}


// scans through HTML document to find 'addButton'. Attaches an event listener for event type 'click' and triggers function when clicked
// document.getElementById('addButton').addEventListener('click', onAddButtonClick);
addButton.addEventListener('click', onAddButtonClick);
document.getElementById('okButton').addEventListener('click', handleOkClick);

// Call the function to activate it
displayCoordinates();

// Swipe control
const swipe = document.getElementById('swipe');

hotOsmLayer.on('prerender', function (event) {
  const ctx = event.context;
  const mapSize = map.getSize();
  const width = mapSize[0] * (swipe.value / 100);
  const tl = getRenderPixel(event, [width, 0]);
  const tr = getRenderPixel(event, [mapSize[0], 0]);
  const bl = getRenderPixel(event, [width, mapSize[1]]);
  const br = getRenderPixel(event, mapSize);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(tl[0], tl[1]);
  ctx.lineTo(bl[0], bl[1]);
  ctx.lineTo(br[0], br[1]);
  ctx.lineTo(tr[0], tr[1]);
  ctx.closePath();
  ctx.clip();
});

hotOsmLayer.on('postrender', function (event) {
  const ctx = event.context;
  ctx.restore();
});

// Update swipe divider
function updateSwipeDivider() {
  const swipeValue = parseInt(swipe.value);
  const swipeDivider = document.getElementById('swipeDivider');
  swipeDivider.style.left = `${swipeValue}%`;
  map.render();
}

// Update map when slider changes
swipe.addEventListener('input', updateSwipeDivider);

// Initial update
updateSwipeDivider();
