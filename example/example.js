var map = L.map('map').setView([0, 0], 2);

var layer = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
}).addTo(map);

function onEachFeature(feature, layer) {
  var count = feature.properties.count.toString();
  layer.bindPopup(count);
}

// Create and add a solrHeatmap layer to the map
var solr = L.solrHeatmap('http://127.0.0.1:8983/solr/gettingstarted', {
  // Solr field with geospatial data (should be type Spatial Recursive Prefix Tree)
  field: 'loc_srpt',

  // Set type of visualization. Allowed types: 'geojsonGrid', 'clusters' Note: 'clusters' requires LeafletMarkerClusterer
  type: 'geojsonGrid',

  // Inherited from L.GeoJSON
  onEachFeature: onEachFeature
}).addTo(map);
