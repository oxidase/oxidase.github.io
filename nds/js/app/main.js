define(['leaflet', 'jquery', 'knockout', 'sidebar', 'nds/tileid', 'nds/tilegrid', 'require', 'domReady!'],
function (L, $, ko, sidebar, tileid, TileGrid, require) {

    // intialize a map
    var freepik = 'Icon made by <a href="http://www.freepik.com" title="Freepik">Freepik</a> from \
<a href="http://www.flaticon.com" title="Flaticon">www.flaticon.com</a> is licensed under \
<a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0">CC BY 3.0</a>';

    var tiles = [
        {name: 'Wikimedia', url: 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png', id: '',
         attribution: 'Wikimedia maps beta | Map data &copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap contributors</a>'},
        {name: 'OSM', url: 'http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', id: '',
         attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
         '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
				 'Imagery © <a href="http://mapbox.com">Mapbox</a>'},
        {name: 'Mapbox', url: 'https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', id: 'examples.map-zr0njcqy',
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
        baseLayers[t.name] = L.tileLayer(t.url, {attribution: t.attribution + ' | ' + freepik, id: t.id});
    }

	  var map = L.map('map', {center: [48.137270, 11.575506], zoom: 15, layers: [baseLayers['Wikimedia']], attributionControl: false});

    var tilesGrid = new TileGrid();
    tilesGrid.addTo(map);

    L.control.layers(baseLayers, {'NDS tiles': tilesGrid}, {position: 'topleft'}).addTo(map);
    L.control.attribution({position: 'bottomleft'}).addTo(map);

    sidebar(map);


    // TODO: find better place
    // tilesGrid.on('tileid', function (event) {console.log('tileid', event.id);});
    // tilesGrid.on('level', function (event) {console.log('level', event.level);});

    function getLevel (bb, size) {
        var dlat = (bb.getNorth() - bb.getSouth()),
            dlon = (bb.getEast() - bb.getWest());
        if (dlon > 720) return 0;
        if (dlon > 360) return 1;
        // TODO: make bb and size dependent
        return Math.max(0, Math.min(15, Math.max(tileid.distance2level(dlon), tileid.distance2level(dlat)) + 2));
    }

    function ViewModel(map) {
        var self = this;

        self.map = map;

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
                rect = [[coordSW[1] - 0.5 * dist, coordSW[0] - 0.5 * dist], [coordSW[1] + 1.5 * dist, coordSW[0] + 1.5 * dist]];
            map.fitBounds(rect);
            self.tile_id(tile_id);
        });

        self.setTileID = function() {
            var tile = tileid.wgs2tileid(self.lng(), self.lat(), self.zoom_level()),
                dist = tileid.level2distance(self.zoom_level()),
                sw = tileid.tileid2wgs(tile);
            self.tile_id(tile);
        }

        self.setZoomLevel = function(bb) {
            self.zoom_level(getLevel(bb));
            self.setTileID();
        }

        self.setPoint = function(point, bb) {
            self.zoom_level(getLevel(bb));
            self.lng(point.lng);
            self.lat(point.lat);
            self.setTileID();
        }
    }

    // initialize a view model
    var vm = new ViewModel(map);

    // set event handlers
    map.on('zoomend', function(ev) {
        vm.setZoomLevel(map.getBounds());
    });

    map.on('mousemove', function(ev) {
        vm.setPoint(ev.latlng, map.getBounds());
    });

    vm.setPoint(map.getCenter(), map.getBounds());
    ko.applyBindings(vm);
});
