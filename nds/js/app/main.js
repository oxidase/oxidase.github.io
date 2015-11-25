define(['leaflet', 'jquery', 'knockout', 'sidebar', 'nds/tileid', 'nds/tilegrid', 'require', 'domReady!'],
function (L, $, ko, sidebar, tileid, TileGrid, require) {

    // intialize a map
    var freepik = 'Icon made by <a href="http://www.freepik.com" title="Freepik">Freepik</a> from \
<a href="http://www.flaticon.com" title="Flaticon">www.flaticon.com</a> is licensed under \
<a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0">CC BY 3.0</a>';

    var tiles = [
        {name: 'Mapquest OSM', url: 'http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', id: '', subdomains: '1234',
         attribution: 'Map data &copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap contributors</a>' +
         ' | Tiles courtesy of <a href="http://www.mapquest.com">MapQuest</a>'},
        {name: 'Wikimedia', url: 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png', id: '', subdomains: 'abc',
         attribution: 'Wikimedia maps beta | Map data &copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap contributors</a>'},
        {name: 'OSM', url: 'http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', id: '', subdomains: 'abc',
         attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
         '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
				 'Imagery © <a href="http://mapbox.com">Mapbox</a>'},
        {name: 'Mapbox', url: 'https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', id: 'examples.map-zr0njcqy', subdomains: 'abc',
         attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
         '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
				 'Imagery © <a href="http://mapbox.com">Mapbox</a>'},
        {name: 'OSM Toner', url: 'http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', id: '', subdomains: 'abc',
         attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>'},
        {name: 'OSM Mapnik', url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', id: '', subdomains: 'abc',
         attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>'},
        {name: 'Landscape', url: 'http://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png', id: '', subdomains: 'abc',
         attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>' +
         ' Contributors <a href="http://thunderforest.com/">Thunderforest</a>'}
    ];


    var baseLayers = {};
    for (var idx in tiles) {
        var t = tiles[idx];
        baseLayers[t.name] = L.tileLayer(t.url, {attribution: t.attribution + ' | ' + freepik, id: t.id, subdomains: t.subdomains});
    }

	  var map = L.map('map', {center: [48.137270, 11.575506], zoom: 15, layers: [baseLayers['Mapquest OSM']], attributionControl: false});

    // NDS level
    function getLevel () {
        var bb = map.getBounds(),
            dlat = (bb.getNorth() - bb.getSouth()),
            dlon = (bb.getEast() - bb.getWest());
        if (dlon > 720) return 0;
        if (dlon > 360) return 1;
        // TODO: make bb and size dependent
        return Math.max(0, Math.min(15, Math.max(tileid.distance2level(dlon), tileid.distance2level(dlat)) + 2));
    }

    map.ndsLevel = ko.observable(getLevel());
    map.on('zoomend', function(e) { map.ndsLevel(getLevel()); });

    // Tiles grid
    var tilesGrid = new TileGrid();
    tilesGrid.addTo(map);

    L.control.layers(baseLayers, {'NDS tiles': tilesGrid}, {position: 'topleft'}).addTo(map);
    L.control.attribution({position: 'bottomleft'}).addTo(map);

    // Sidebar
    sidebar(map);
});
