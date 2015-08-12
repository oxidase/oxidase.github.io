'use strict'

function getLevel (bb) {
    var dlat = (bb.getNorth() - bb.getSouth()),
        dlon = (bb.getEast() - bb.getWest());
    if (dlon > 720) return 0;
    if (dlon > 360) return 1;
    return Math.max(0, Math.min(15, Math.max(tileid.distance2level(dlon), tileid.distance2level(dlat)) + 2));
}

function getGridLine (bb, coord, isHorizontal) {
    var line;
    if (isHorizontal) {
        line = [[bb.getWest(), coord], [bb.getEast(), coord]];
    } else {
        line = [[coord, bb.getSouth()], [coord, bb.getNorth()]];
    }
    return { "type": "Feature", "geometry": { "type": "LineString", "coordinates": line } }
}

function getTileId (lat, lon) {
    var line;
    if (isHorizontal) {
        line = [[bb.getWest(), coord], [bb.getEast(), coord]];
    } else {
        line = [[coord, bb.getSouth()], [coord, bb.getNorth()]];
    }
    return { "type": "Feature", "geometry": { "type": "LineString", "coordinates": line } }
}

function getFeatures (bb) {
    var level = getLevel(bb), dist = tileid.level2distance(level),
        tileSW = tileid.wgs2tileid(bb.getWest(), bb.getSouth(), level),
        tileNE = tileid.wgs2tileid(bb.getEast(), bb.getNorth(), level),
        coordSW = tileid.tileid2wgs(tileSW),
        coordNE = tileid.tileid2wgs(tileNE),
        minLat = coordSW[1],
        maxLat = coordNE[1] + dist,
        minLon = bb.getWest() < -180 ? -180 : coordSW[0],
        maxLon = bb.getEast() > 180 ? 180 : coordNE[0] + dist;

    var grid = [];
    for (var lat = minLat; lat <= maxLat; lat += dist)
        grid.push(getGridLine(bb, lat, true));
    for (var lon = minLon; lon <= maxLon ; lon += dist)
        grid.push(getGridLine(bb, lon, false));

    var markers = [];
    for (var lat = minLat; lat < maxLat; lat += dist)
        for (var lon = minLon; lon < maxLon ; lon += dist)
            markers.push(L.marker([lat + dist, lon], {
                icon: L.divIcon({className: 'tileid-labels', iconSize: [0, 0], iconAnchor: [-4, -4], html: tileid.wgs2tileid(lon, lat, level)}),
                draggable: false}));
    return {'grid':grid, 'markers':markers};
}

function updateLayer (layer, bb) {
    var features = getFeatures(bb);
    layer.clearLayers();
    layer.addData(features.grid);
    for (var idx in features.markers)
        features.markers[idx].addTo(layer);
}

function ViewModel(map, rectTile) {
    var self = this;

    self.map = map;
    self.rectTile = rectTile;

    self.tile_id = ko.observable(0);
    self.tile_id_input = ko.observable();
    self.zoom_level = ko.observable(11);
    self.lat = ko.observable(0);
    self.lng = ko.observable(0);

    self.tile_id_input.subscribe(function(tile_id) {
        var level = tileid.tileid2level(tile_id);
        if (isNaN(parseFloat(level)) || !isFinite(level) || level < 0 || level > 15)
            return;
        var coordSW = tileid.tileid2wgs(tile_id),
            dist = tileid.level2distance(level),
            rect = [[coordSW[1], coordSW[0]], [coordSW[1] + dist, coordSW[0] + dist]];
        console.log(tile_id, level, coordSW);
        map.fitBounds(rect);
        self.rectTile.setBounds(rect);
        self.tile_id(tile_id);
    });

    self.setTileID = function() {
        var tile = tileid.wgs2tileid(self.lng(), self.lat(), self.zoom_level()),
            dist = tileid.level2distance(self.zoom_level()),
            sw = tileid.tileid2wgs(tile);
        self.rectTile.setBounds([[sw[1], sw[0]], [sw[1] + dist, sw[0] + dist]]);
        self.tile_id(tile);
    }

    self.setZoomLevel = function(bb) {
        self.zoom_level(getLevel(bb));
        self.setTileID();
    }

    self.setPoint = function(point) {
        self.lng(point.lng);
        self.lat(point.lat);
        self.setTileID();
    }
}
 
$(document).ready(function() {
    // intialize a map
    var tiles = [ {name: 'OSM', url: 'http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', id: '',
                   attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
                   '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
				           'Imagery © <a href="http://mapbox.com">Mapbox</a>'},
                  {name: 'Mapbox', url: 'https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', id: 'examples.map-i86nkdio',
                   attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
                   '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
				           'Imagery © <a href="http://mapbox.com">Mapbox</a>'},
                  {name: 'Mapbox streets', url: 'https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', id: 'examples.map-zr0njcqy',
                   attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
                   '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
				           'Imagery © <a href="http://mapbox.com">Mapbox</a>'},
                  {name: 'OSM Toner', url: 'http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', id: '',
                   attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>'},
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

	  var map = L.map('map', {center: [48.858222, 2.2945], zoom: 15, layers: [baseLayers['OSM']]});
    L.control.layers(baseLayers, {}, {position: 'topleft'}).addTo(map);

	  // control that shows state info on hover
	  var info = L.control();

    var rectTile = L.rectangle([[0,0],[0,0]], {className: 'tile'}).addTo(map);

    // initialize a view model
    var vm = new ViewModel(map, rectTile);

    // set event handlers
    map.on('zoomend', function(ev) {
        vm.setZoomLevel(map.getBounds());
    });

    map.on('mousemove', function(ev) {
        vm.setPoint(ev.latlng);
    });

    // add NDS tiles grid
    var gridOprtions = { style: { color: '#f33', weight: 3 } };
    var gridLayer = L.geoJson().addTo(map);
    L.Util.setOptions(gridLayer, gridOprtions);
    updateLayer(gridLayer, map.getBounds());
    map.on('move', function(ev) {
        updateLayer(gridLayer, map.getBounds());
    });

    vm.setZoomLevel(map.getBounds(), rectTile);
    vm.setPoint(map.getCenter(), rectTile);
    ko.applyBindings(vm);
});