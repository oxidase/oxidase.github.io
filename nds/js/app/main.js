define(['leaflet', 'jquery', 'knockout', 'sidebar', 'nds/tileid', 'nds/tilegrid', 'require', 'domReady!'],
function (L, $, ko, sidebar, tileid, TileGrid, require) {

    // intialize a map
    var freepik = 'Icon made by <a href="http://www.freepik.com" title="Freepik">Freepik</a> from \
<a href="http://www.flaticon.com" title="Flaticon">www.flaticon.com</a> is licensed under \
<a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0">CC BY 3.0</a>';

    var tiles = [
        {name: 'OSM', url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', id: '', subdomains: 'abc',
         attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>'},
        {name: 'Wikimedia', url: 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png', id: '', subdomains: 'abc',
         attribution: 'Wikimedia maps beta, Map data &copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap contributors</a>'},
        {name: 'OSM BW', url: 'http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', id: '', subdomains: 'abc',
         attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
         '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
				 'Imagery © <a href="http://mapbox.com">Mapbox</a>'},
        {name: 'OSM Toner', url: 'http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', id: '', subdomains: 'abc',
         attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>'},
        {name: 'Landscape', url: 'http://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png', id: '', subdomains: 'abc',
         attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>' +
         ' Contributors <a href="http://thunderforest.com/">Thunderforest</a>'}
    ];


    var baseLayers = {};
    for (var idx in tiles) {
        var t = tiles[idx];
        baseLayers[t.name] = L.tileLayer(t.url, {attribution: t.attribution + ', ' + freepik, id: t.id, subdomains: t.subdomains});
    }

	  var map = L.map('map', {center: [48.137270, 11.575506], zoom: 15, layers: [baseLayers['OSM']], attributionControl: true});
    map.attributionControl.setPosition('bottomleft');

    // Tiles grid
    var tilesGrid = new TileGrid();
    tilesGrid.addTo(map);
    L.control.layers(baseLayers, {'NDS tiles': tilesGrid}, {position: 'topleft'}).addTo(map);

    // Sidebar
    sidebar(map);
});
