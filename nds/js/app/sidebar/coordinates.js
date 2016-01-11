define(['leaflet', 'knockout', 'nds/tileid', 'nds/distance'], function(L, ko, tileid, distance) {

    var colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'cyan', 'magenta', 'lime', 'olive', 'maroon', 'purple'];

    function pickColor() {
        return colors[Math.floor((Math.random() * colors.length))];
    }

    function round6(x) {
        return Math.sign(x) * Math.abs(Math.round(1000000. * x)) / 1000000.;
    }

    function Coordinate(layer, lat, lng, color) {
        var self = this;

        self.lat = ko.observable(lat).extend({trackChildChanges: true});
        self.lng = ko.observable(lng).extend({trackChildChanges: true});
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

    function interpGreatCircle(p1, p2, n) {
        // http://williams.best.vwh.net/avform.htm#Intermediate
        var conv = Math.PI / 180.,
            lat1 = p1[0] * conv, lon1 = p1[1] * conv,
            lat2 = p2[0] * conv, lon2 = p2[1] * conv,
            d=2*Math.asin(Math.sqrt(Math.pow(Math.sin((lat1-lat2)/2), 2) + Math.cos(lat1)*Math.cos(lat2)*Math.pow(Math.sin((lon1-lon2)/2), 2)));

        var p = [p1];
        for (var i = 1; i < n - 1; ++i) {
            var f = i / (n - 1),
                A=Math.sin((1-f)*d)/Math.sin(d),
                B=Math.sin(f*d)/Math.sin(d),
                x = A*Math.cos(lat1)*Math.cos(lon1) +  B*Math.cos(lat2)*Math.cos(lon2),
                y = A*Math.cos(lat1)*Math.sin(lon1) +  B*Math.cos(lat2)*Math.sin(lon2),
                z = A*Math.sin(lat1)                +  B*Math.sin(lat2),
                lat=Math.atan2(z,Math.sqrt(x*x+y*y)),
                lon=Math.atan2(y,x);
            p.push([lat / conv, lon / conv]);
        }
        p.push(p2);
        return p;
    }

    function interpCoordinates(coords, npoints) {
        npoints = npoints || 100;
        var r = [];
        for (var i = 1; i < coords.length; ++i) {
            r = r.concat(interpGreatCircle([coords[i-1].lat(), coords[i-1].lng()], [coords[i].lat(), coords[i].lng()], npoints));
        }
        return r;
    }

    function CoordinatesViewModel(map) {
        var self = this;

        self._map = map;
        self._markers = new L.FeatureGroup();
        self._line = null;

        // poly line udpdater
        self.polyline = function () {
            var p = interpCoordinates(self.coordinates(), 100);
            if (p.length < 2)
                return;
            if (self._line === null) {
                self._line = L.polyline(p).addTo(self._markers);
            } else {
                self._line.setLatLngs(p);
            }
        }

        // register an extender for poly line updater
        ko.extenders.trackChildChanges = function (target, value) {
            target.subscribe(self.polyline);
            return target;
        };

        self.coordinates = ko.observableArray([new Coordinate(self._markers, 48.137270, 11.575506, pickColor())]);
        self.coordinates.subscribe(self.polyline);

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

        self.distance = function (index) {
            var p1 = self.coordinates()[index],
                p2 = self.coordinates()[(index + 1) % self.coordinates().length],
                d = distance.wgs84(p1.lat(), p1.lng(), p2.lat(), p2.lng());
            return Math.round(1000 * d) / 1000;
        }
    }

    return CoordinatesViewModel;

});
