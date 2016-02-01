define(['leaflet', 'knockout', 'jquery'], function(L, ko, $) {

    function getColor(id, lightness) {
        var colors = 12;
        return 'hsl(' + 360 * (id % colors) / colors + ', 75%, ' + lightness + '%)';
    }

	  function style(feature) {
		    return {
			      weight: 0,
			      opacity: 1,
			      // color: 'white',
			      // dashArray: '3',
			      fillOpacity: 0.5,
			      fillColor: getColor(feature.properties.ur, 75)
		    };
	  };


   function BordersViewModel(map) {
       var self = this;

       self._map = map
       self._borders = new L.FeatureGroup();
       self._geojson = null
       self._location = 'http://localhost:7777/databases.json'
       self.info = ko.observable()

	     function highlightFeature(e) {
		       var layer = e.target;
		       layer.setStyle({weight: 3, color: getColor(layer.feature.properties.ur, 65), dashArray: '', fillOpacity: 0.7 });
		       if (!L.Browser.ie && !L.Browser.opera) {
			         layer.bringToFront();
		       }
           var props = layer.feature.properties;
           self.info(props ? 'Region ' + props.ur + (props.seq > 1 ? '.' + props.seq : '') + '&nbsp;[' + props.uri + '] </b><br />'
                           + props.countries : '');
	     };

	     function resetHighlight(e) {
		       self._geojson.resetStyle(e.target);
		       self.info('');
	     }

	     function zoomToFeature(e) {
		       self._map.fitBounds(e.target.getBounds());
	     }

	     function onEachFeature(feature, layer) {
		       layer.on({
			         mouseover: highlightFeature,
			         mouseout: resetHighlight,
			         click: zoomToFeature
		       });
	     };

       self.availableDatabases = ko.observableArray()
       self.selectedDatabase = ko.observable()
       self.availableBlocks = ko.observableArray()
       self.selectedBlock = ko.observable()
       self.availableLevels = ko.observableArray()
       self.selectedLevel = ko.observable()

       self.reload = function () {
           $.getJSON(self._location).done(function(data) {
               // console.log(JSON.stringify(data));
               self.availableDatabases(Object.keys(data).map(function(v) { return data[v]; }));
               self.selectedDatabase(0);
           }).fail(function (e) {console.log(e); })
       }

       self.selectedDatabase.subscribe(function(index) {
           if (isNaN(index)) return;
           self._map.attributionControl.removeAttribution(self.availableDatabases()[index].copyright); }, null, "beforeChange");
       self.selectedDatabase.subscribe(function(index) {
           if (isNaN(index)) return;
           var database = self.availableDatabases()[index];
           self._map.attributionControl.addAttribution(self.availableDatabases()[index].copyright);
           self.availableBlocks(Object.keys(database.bb).map(function(v) { return database.bb[v]; }));
           self.selectedBlock(self.availableBlocks()[0]);
       });

       self.selectedBlock.subscribe(function(bb) {
           if (!bb) return;
           self.availableLevels(Object.keys(bb.levels).map(function(v) { return bb.levels[v]; }));
           self.selectedLevel(self.availableLevels()[self.availableLevels().length - 1]);
       });

       self.selectedLevel.subscribe(function() { self._borders.clearLayers(); }, null, "beforeChange");
       self.selectedLevel.subscribe(function(level) {
           if (!level) return;

           // add update regions layer
           self._geojson = L.geoJson(level.borders, {
		 	         style: style,
		 	         onEachFeature: onEachFeature
		       }).addTo(self._borders);

           // add markers and link them to update regions layer
           var markers = level.markers;
           for (var idx in markers) {
               var m = markers[idx];
               L.marker([m.lat, m.lon], {
                   icon: L.divIcon({className: 'text-labels', iconSize: [42, 42],
                                    html: '<span style="color: ' + getColor(m.id, 25) + '">' + m.text + '</span>'}),
                   draggable: false,
                   zIndexOffset: 0
               }).addTo(self._borders);
           }
       });

       this.fitBounds = function () {
           if (!self.selectedLevel() || self._geojson === null) return;
           self._map.fitBounds(self._geojson.getBounds())
       }

       this.activate = function () {
           self._map.addLayer(self._borders);
           self.reload()
       }
       this.deactivate = function () {
           self._map.removeLayer(self._borders);
       }
    }

    return BordersViewModel;
});
