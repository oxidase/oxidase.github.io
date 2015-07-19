'use strict'

function ViewModel() {
    var self = this;
     
    self.tile_id = ko.observable(0);     
    self.zoom_level = ko.observable(11);
    self.lat = ko.observable(0);
    self.lng = ko.observable(0);

    self.setTileID = function(rect) {
        var tile = tileid.wgs2tileid(self.lng(), self.lat(), self.zoom_level()),
            dist = tileid.level2distance(self.zoom_level()),
            sw = tileid.tileid2wgs(tile);
        rect.setBounds([[sw[1], sw[0]], [sw[1] + dist, sw[0] + dist]]);
        //console.log(rect);
        self.tile_id(tile);
    }

    self.setZoomLevel = function(bb, rect) {
        var dlon = (bb.getNorth() - bb.getSouth()) / 2,
            dlat = (bb.getEast() - bb.getWest()) / 2,
            level = Math.max(tileid.distance2level(dlon), tileid.distance2level(dlat));
        self.zoom_level(Math.max(0, Math.min(15, level + 1)));
        self.setTileID(rect);
    }

    self.setPoint = function(point, rect) {
        self.lng(point.lng);
        self.lat(point.lat);
        self.setTileID(rect);
    }
}
 
$(document).ready(function() {
    // initialize a view model
    var vm = new ViewModel();

    // intialize a map
    var tiles = [ {name: 'Mapbox', url: 'https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', id: 'examples.map-20v6611k',
                   attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
                   '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
				   'Imagery © <a href="http://mapbox.com">Mapbox</a>'},
                  {name: 'Mapbox streets', url: 'https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', id: 'examples.map-i875mjb7',
                   attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
                   '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
				   'Imagery © <a href="http://mapbox.com">Mapbox</a>'},
                  {name: 'OSM Mapnik', url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', id: '',
                   attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>'},
                  {name: 'Landscape', url: 'http://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png', id: '',
                   attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>' +
                   ' Contributors <a href="http://thunderforest.com/">Thunderforest</a>'}
                ];

    var baseLayers = {};
    for (var idx in tiles) {
        var t = tiles[idx];
        baseLayers[t.name] = L.tileLayer(t.url, {attribution: t.attribution, id: t.id});
    }

	  var map = L.map('map', {center: [48.858222, 2.2945], zoom: 15, layers: [baseLayers['Mapbox']]});
    L.control.layers(baseLayers, {}, {position: 'topleft'}).addTo(map);

	  // control that shows state info on hover
	  var info = L.control();

    var rectTile = L.rectangle([[0,0],[0,0]], {className: 'tile'}).addTo(map);

    map.on('zoomend', function(ev) {
        vm.setZoomLevel(map.getBounds(), rectTile);
    });

    map.on('mousemove', function(ev) {
        vm.setPoint(ev.latlng, rectTile);
    });

    vm.setZoomLevel(map.getBounds(), rectTile);
    vm.setPoint(map.getCenter(), rectTile);
    ko.applyBindings(vm);
});