var map = L.map('map').setView([0, 0], 2);

var layer = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
}).addTo(map);

var MyControl = L.Control.extend({
    options: {
        position: 'topright'
    },


    onAdd: function (map) {
        // create the control container with a particular class name
        this._container = L.DomUtil.create('div', 'my-custom-control');

        this._container.innerHTML = 'hello';

        return this._container;
    }
});
var ctrl = new MyControl();

map.addControl(ctrl);

function onEachFeature(feature, layer) {
  var count = feature.properties.count.toString();
  
  layer.on('mouseover', function(e){
    console.log('OVER', layer);
    layer.setStyle({weight:3})
    ctrl._container.innerHTML = "OVER> "+count;
  });
  layer.on('mouseout', function(e){
    layer.setStyle({weight:0})
    ctrl._container.innerHTML = "";
  });
  layer.on('click', function(e){
    console.log('CLICK', feature);
    var sw = feature.geometry.coordinates[0][0];
    var ne = feature.geometry.coordinates[0][2];

    console.log('>>>', sw, ne);

    var bounds = L.latLngBounds(
      L.latLng(sw[1], sw[0]),
      L.latLng(ne[1], ne[0]));

    ctrl._container.innerHTML = "CLICK: "+bounds;

    map.fitBounds(bounds);
    console.log('>>>', bounds);
  });
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



