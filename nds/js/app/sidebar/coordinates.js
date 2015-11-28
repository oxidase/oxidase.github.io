define(['leaflet', 'knockout', 'nds/tileid'], function(L, ko, tileid) {

    var colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'cyan', 'magenta', 'lime', 'olive', 'maroon', 'purple'];

    function pickColor() {
        return colors[Math.floor((Math.random() * colors.length))];
    }

    function round6(x) {
        return Math.sign(x) * Math.abs(Math.round(1000000. * x)) / 1000000.;
    }

    function Coordinate(layer, lat, lng, color) {
        var self = this;

        self.lat = ko.observable(lat);
        self.lng = ko.observable(lng);
        self.color = color;

        self.lnglat = function (x, type) {
            if (typeof x !== 'object' || x.length !== 2)
                return;
            var lng = parseFloat(x[0]), lat = parseFloat(x[1]);
            if (isNaN(lng) || isNaN(lat))
                return;
            if (type === 'nds') {
                lng = tileid.nds2lon(lng);
                lat = tileid.nds2lat(lat);
            } else if (type === 'mercator') {
                lng = tileid.mercator2wgsx(lng);
                lat = tileid.mercator2wgsy(lat);
            }
            self.lng(lng);
            self.lat(lat);
            self._marker.setLatLng([lat, lng]);
        }

        self.text = ko.pureComputed({owner: self,
            read: function () { return tileid.coord2text(self.lat(), ['N ','S ']) + ", " + tileid.coord2text(self.lng(), ['E ','W ']); }
        });

        self.wgs = ko.pureComputed({owner: self,
            read: function () { return round6(self.lng()) + ", " + round6(self.lat()); },
            write: function (v) { self.lnglat(v.match(/[-+]?[0-9]*\.?[0-9]+/g)); }
        });

        self.nds = ko.pureComputed({owner: self,
            read: function () { return ~~(self.lng() / 90. * 0x40000000) + ", " + ~~(self.lat() / 90. * 0x40000000); },
            write: function (v) { self.lnglat(v.match(/[-+]?[0-9]*\.?[0-9]+/g), 'nds'); }
        });

        self.mercator = ko.pureComputed({owner: self,
            read: function () { return ~~tileid.wgs2mercatorx(self.lng()) + ", " + ~~tileid.wgs2mercatory(self.lat()); },
            write: function (v) { self.lnglat(v.match(/[-+]?[0-9]*\.?[0-9]+/g), 'mercator'); }
        });

        self.morton = ko.pureComputed({owner: self,
            read: function () { return tileid.morton64string(tileid.wgs2morton64(self.lng(), self.lat())); },
            write: function (v) { return self.lnglat(tileid.morton64wgs(tileid.string2morton64(v))); }
        });

        self.remove = function (layer) {
            layer.removeLayer(self._marker);
        }

        self._icon = L.divIcon({className: 'marker-icon icon-' + self.color, iconSize: [32, 32], iconAnchor: [16, 32]});
        self._marker = L.marker([lat, lng], { icon: self._icon, draggable: true }).addTo(layer);
        self._marker.on('drag', function (e) { var ll = e.target.getLatLng(); self.lat(ll.lat); self.lng(ll.lng); });
    }

    function CoordinatesViewModel(map) {
        var self = this;

        self._map = map;
        self._markers = new L.FeatureGroup();

        self.coordinates = ko.observableArray([new Coordinate(self._markers, 48.137270, 11.575506, pickColor())]);

        self.add = function(e) {
            var coordinate = new Coordinate(self._markers, e.latlng.lat, e.latlng.lng, pickColor());
            self.coordinates.push(coordinate);
        }

        self.remove = function(coordinate) {
            coordinate.remove(self._markers);
            self.coordinates.remove(coordinate);
        };

        self.panTo = function(coordinate) {
            self._map.panTo([coordinate.lat(), coordinate.lng()]);
        };

        self.activate = function () {
            self._map.on('dblclick', self.add);
            self._map.addLayer(self._markers);
            self._map.doubleClickZoom.disable();
        }

        self.deactivate = function () {
            self._map.off('dblclick', self.add);
            self._map.removeLayer(self._markers);
            self._map.doubleClickZoom.enable();
        }
    }

    return CoordinatesViewModel;

});
