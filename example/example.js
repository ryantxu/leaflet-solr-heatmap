var map = L.map('map').setView([0, 0], 2);

var layer = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
}).addTo(map);

function onEachFeature(feature, layer) {
  var count = feature.properties.count.toString();
  layer.bindPopup(count);
}

// Create and add a solrHeatmap layer to the map
var solr = L.solrHeatmap({
  url: 'http://localhost:8080/solr/usgs/select',
 
  // Solr field with geospatial data (should be type Spatial Recursive Prefix Tree)
  field: 'geo',

  // Set type of visualization. Allowed types: 'geojsonGrid', 'clusters' Note: 'clusters' requires LeafletMarkerClusterer
  type: 'clusters',

  // Inherited from L.GeoJSON
  onEachFeature: onEachFeature
}).addTo(map);
