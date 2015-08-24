var map = L.map('map').setView([0, 0], 2);

var layer = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
}).addTo(map);

function onEachFeature(feature, layer) {
  var count =  feature.properties.count.toString();
  layer.bindPopup(count); // popup on the vector style
}


// Create and add a solrHeatmap layer to the map
var solrC = L.solrHeatmap({
  url: null, // don't auto-query

  // Solr field with geospatial data (should be type Spatial Recursive Prefix Tree)
  field: 'geo',

  // Set type of visualization. Allowed types: 'geojsonGrid', 'clusters' Note: 'clusters' requires LeafletMarkerClusterer
  type: 'clusters',

  // don't query on move
  doQuery: false,

  // Inherited from L.GeoJSON
  onEachFeature: onEachFeature
}).addTo(map);


// Create and add a solrHeatmap layer to the map
var solrG = L.solrHeatmap({
  url: null, // don't auto-query

  // Solr field with geospatial data (should be type Spatial Recursive Prefix Tree)
  field: 'geo',

  // Set type of visualization. Allowed types: 'geojsonGrid', 'clusters' Note: 'clusters' requires LeafletMarkerClusterer
  type: 'geojsonGrid',

  // don't query on move
  doQuery: false,

  // Inherited from L.GeoJSON
  onEachFeature: onEachFeature
}).addTo(map);




function getData() {
	var _this = this;
	var startTime = Date.now();
	$.ajax({
	  url: 'http://localhost:8080/solr/usgs/select',
	  dataType: 'JSONP',
	  data: {
	    q: '*:*',
	    wt: 'json',
	    facet: true,
	    'facet.heatmap': solrG.options.field,
	    'facet.heatmap.geom': solrG._mapViewToWkt(),
	    fq: solrG.options.field + solrG._mapViewToEnvelope()
	  },
	  jsonp: 'json.wrf',
	  success: function(data) {
	    var totalTime = 'Solr response time: ' + (Date.now() - startTime) + ' ms';
	    $('#responseTime').html(totalTime);
	    _this.docsCount = data.response.numFound;
	    $('#numDocs').html('Number of docs: ' + _this.docsCount);
	    _this.renderStart = Date.now();
	    
	    solrG.updateHeatmap(data);
	    solrC.updateHeatmap(data);
	  }
	});
}


  getData()
  map.on('moveend', function() {
    solrG._clearLayers();
    solrC._clearLayers();
    getData();
  });



