L.SolrHeatmap = L.GeoJSON.extend({
  options: {
    url: 'http://127.0.0.1:8983/solr/gettingstarted',
    field: 'geo',
    type: 'geojsonGrid'
  },

  initialize: function(options) {
    var _this = this;
    options = L.setOptions(_this, options);
    _this._layers = {};

    if(options.url!=null) {
      _this._getData();
      map.on('moveend', function() {
        _this._clearLayers();
        _this._getData();
      });
    }
  },

  updateHeatmap: function(data) {
    var _this = this;
    _this.docsCount = data.response.numFound;
    _this.docs = data.response.docs;
    _this.facetHeatmap = {};

    // Convert array to an object
    facetHeatmapArray = data.facet_counts.facet_heatmaps[this.options.field];
    $.each(facetHeatmapArray, function(index, value) {
      if ((index + 1) % 2 !== 0) {
        // Set object keys for even items
        _this.facetHeatmap[value] = '';
      }else {
        // Set object values for odd items
        _this.facetHeatmap[facetHeatmapArray[index - 1]] = value;
      }
    });

    this._computeIntArrays();
  },

  _clearLayers: function() {
    var _this = this;

    switch (_this.options.type) {
      case 'geojsonGrid':
        _this.clearLayers();
        break;
      case 'clusters':
        _this.clusterMarkers.clearLayers();
        break;
    }
  },

  _createGeojson: function() {
    var _this = this;
    var geojson = {};

    geojson.type = 'FeatureCollection';
    geojson.features = [];

    var min = 100000;
    var max = 0;

    if(_this.facetHeatmap.counts_ints2D) {
      $.each(_this.facetHeatmap.counts_ints2D, function(row, value) {
        if (value === null) {
          return;
        }

        $.each(value, function(column, val) {
          if (val === 0) {
            return;
          }
          if(val>max) {
            max = val;
          }
          if(val<min) {
            min = val;
          }

          var newFeature = {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [_this._minLng(column), _this._minLat(row)],
                  [_this._minLng(column), _this._maxLat(row)],
                  [_this._maxLng(column), _this._maxLat(row)],
                  [_this._maxLng(column), _this._minLat(row)],
                  [_this._minLng(column), _this._minLat(row)]
                ]
              ]
            },
            properties: {
              count: val
            }
          };
          geojson.features.push(newFeature);
        });
      });
    }

    _this.addData(geojson);
    _this._styleByCount(min,max);
    _this._showRenderTime();
  },

  _showRenderTime: function() {
    var _this = this,
      renderTime = 'Render time: ' + (Date.now() - _this.renderStart) + ' ms';
    $('#renderTime').html(renderTime);
  },

  _createClusters: function() {
    var _this = this;

    _this.clusterMarkers = new L.MarkerClusterGroup({
      maxClusterRadius: 140
    });


    if(_this.docs != null && _this.docs.length >= _this.docsCount) {
      console.log('ALLL', _this.docs);


      $.each(_this.docs, function(row, doc) {
        var pt = new L.LatLng(doc.lat, doc.lng)
        if(pt.lat) {
          var name = "DOC:" + doc.id;

          var marker = new L.Marker(pt, {count:1});
          marker.bindPopup(name)
          console.log("ADD", pt, doc, marker);
          _this.clusterMarkers.addLayer(marker); 
        }
        else {
          console.log('HYMMMM', pt, doc);
        }
      });
    }
    else {
      $.each(_this.facetHeatmap.counts_ints2D, function(row, value) {
        if (value === null) {
          return;
        }

        $.each(value, function(column, val) {
          if (val === 0) {
            return;
          }

          var bounds = new L.latLngBounds([
            [_this._minLat(row), _this._minLng(column)],
            [_this._maxLat(row), _this._maxLng(column)]
          ]);
          _this.clusterMarkers.addLayer(new L.Marker(bounds.getCenter(), {
            count: val
          }).bindPopup(val.toString()));  // the popup on the final marker
        });
      });
    }

    map.addLayer(_this.clusterMarkers);
    _this._showRenderTime();
  },

  _computeIntArrays: function() {
    var _this = this;

    _this.lengthX = (_this.facetHeatmap.maxX - _this.facetHeatmap.minX) / _this.facetHeatmap.columns;
    _this.lengthY = (_this.facetHeatmap.maxY - _this.facetHeatmap.minY) / _this.facetHeatmap.rows;

    switch (_this.options.type) {
      case 'geojsonGrid':
        _this._createGeojson();
        break;
      case 'clusters':
        _this._createClusters();
        break;
    }
  },

  _styleByCount: function(min, max) {
    var _this = this;
    var diff = max-min;
    _this.eachLayer(function(layer) {
      var per = (layer.feature.properties.count-min)/diff;
     // var per = (layer.feature.properties.count-min)/Math.log1p(diff);
      //var ratio = ((layer.feature.properties.count) / Math.log1p(_this.docsCount));
      var ratio = .3+(.7*per); /// Math.log(per);
      layer.setStyle({
        fillColor: '#F00',
        fillOpacity: ratio,
        weight: 0
      });
    });
  },

  _minLng: function(column) {
    return this.facetHeatmap.minX + (this.lengthX * column);
  },

  _minLat: function(row) {
    return this.facetHeatmap.maxY - (this.lengthY * row) - this.lengthY;
  },

  _maxLng: function(column) {
    return this.facetHeatmap.minX + (this.lengthX * column) + this.lengthX;
  },

  _maxLat: function(row) {
    return this.facetHeatmap.maxY - (this.lengthY * row);
  },

  _getData: function() {
    var _this = this;
    var startTime = Date.now();
    $.ajax({
      url: _this.options.url,
      dataType: 'JSONP',
      data: {
        q: '*:*',
        wt: 'json',
        facet: true,
        'facet.heatmap': _this.options.field,
        'facet.heatmap.geom': _this._mapViewToWkt(),
        fq: _this.options.field + _this._mapViewToEnvelope()
      },
      jsonp: 'json.wrf',
      success: function(data) {
        var totalTime = 'Solr response time: ' + (Date.now() - startTime) + ' ms';
        $('#responseTime').html(totalTime);
        _this.docsCount = data.response.numFound;
        $('#numDocs').html('Number of docs: ' + _this.docsCount);
        _this.renderStart = Date.now();
        _this.updateHeatmap(data);
      }
    });
  },

  _mapViewToEnvelope: function() {
    var bounds = map.getBounds();
    return ':"Intersects(ENVELOPE(' + bounds.getWest() + ', ' + bounds.getEast() + ', ' + bounds.getNorth() + ', ' + bounds.getSouth() + '))"';
  },

  _mapViewToWkt: function() {
    var bounds = map.getBounds();
    return '["' + bounds.getWest() + ' ' + bounds.getSouth() + '" TO "' + bounds.getEast() + ' ' + bounds.getNorth() + '"]';
  }
});

L.solrHeatmap = function(options) {
  return new L.SolrHeatmap(options);
};

L.LatLngBounds.prototype.getWest = function() {
  var west = this._southWest.lng;
  return west < -180 ? -180 : west;
};

L.LatLngBounds.prototype.getEast = function() {
  var east = this._northEast.lng;
  return east > 180 ? 180 : east;
};

// Check if L.MarkerCluster is included
if (typeof L.MarkerCluster !== 'undefined') {
  L.MarkerCluster.prototype.initialize = function(group, zoom, a, b) {

  	L.Marker.prototype.initialize.call(this, a ? (a._cLatLng || a.getLatLng()) : new L.LatLng(0, 0), { icon: this });

  	this._group = group;
  	this._zoom = zoom;

  	this._markers = [];
  	this._childClusters = [];
  	this._childCount = 0;
  	this._iconNeedsUpdate = true;

  	this._bounds = new L.LatLngBounds();

  	if (a) {
  		this._addChild(a);
  	}
  	if (b) {
  		this._addChild(b);
      this._childCount = b.options.count;
  	}
  };
}