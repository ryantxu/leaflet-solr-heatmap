L.SolrHeatmapGL = L.TileLayer.WebGLHeatMap.extend({
  options: {
    url: 'http://127.0.0.1:8983/solr/gettingstarted',
    field: 'geo'
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

  _clearLayers: function() {
    //clear();
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

    _this.lengthX = (_this.facetHeatmap.maxX - _this.facetHeatmap.minX) / _this.facetHeatmap.columns;
    _this.lengthY = (_this.facetHeatmap.maxY - _this.facetHeatmap.minY) / _this.facetHeatmap.rows;

    $.each(_this.facetHeatmap.counts_ints2D, function(row, value) {
      if (value === null) {
        return;
      }

      $.each(value, function(column, val) {
        if (val === 0) {
          return;
        }

        var pt = new L.latLngBounds([
          [_this._minLat(row), _this._minLng(column)],
          [_this._maxLat(row), _this._maxLng(column)]
        ]).getCenter();

        addDataPoint(pt.lat, pt.lng, val);
      });
    });

    _this._showRenderTime();
  },


  _showRenderTime: function() {
    var _this = this,
      renderTime = 'Render time: ' + (Date.now() - _this.renderStart) + ' ms';
    $('#renderTime').html(renderTime);
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
