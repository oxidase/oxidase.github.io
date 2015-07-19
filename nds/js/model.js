
// This is a coordinates *viewmodel*
function ViewModel() {
    var self = this;
     
    self.tile_id = ko.observable(0);     
    self.zoom_level = ko.observable(11);     
}
 
$(document).ready(function() {
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

	  var map = L.map('map', {center: [39.73, -104.99], zoom: 4, layers: [baseLayers['Mapbox']]});
    L.control.layers(baseLayers, {}, {position: 'topleft'}).addTo(map);

	  // control that shows state info on hover
	  var info = L.control();

    map.on('zoomend', function() {
        console.log('zoomend ('
              + map.getBounds().getSouth() + ',' + map.getBounds().getWest()+'), ('
              + map.getBounds().getNorth() + ',' + map.getBounds().getEast()+')  '
              + '[' + (map.getBounds().getNorth() - map.getBounds().getSouth()) + ', '
              + (map.getBounds().getEast() - map.getBounds().getWest()) + ']');
    });

    map.on('mousemove', function(ev) {
        console.log('mousemove (' + ev.latlng.lat + ',' + ev.latlng.lng+')');
    });

    ko.applyBindings(new ViewModel());
});