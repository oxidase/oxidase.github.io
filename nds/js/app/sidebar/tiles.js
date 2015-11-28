define(['leaflet', 'knockout', 'jquery', 'nds/tileid'], function(L, ko, $, tileid) {

    function TilesViewModel(map) {
        var self = this;

        self.selectLevel = function () {
            $('#tileids tbody').find(':nth-child('+(this._map.getZoom())+')').addClass("selected").siblings().removeClass("selected");
        }

        self.getPackedTileId = function (row) {
            return row.find(':nth-child(3)').text();
        }

        self.fitTile = function (v, level) {
            if (typeof v === 'undefined' || v === '' || isNaN(v))
                return;
            level = level || tileid.tileid2level(v);
            var dist = tileid.level2distance(level),
                lnglat = tileid.tileid2wgs(v),
                latlng = [lnglat[1] + 0.5 * dist, lnglat[0] + 0.5 * dist];
            self._marker.setLatLng(latlng);
            self._map.setView([latlng[0], latlng[1]], level + 1);
        }

        self._map = map;
        self._markers = new L.FeatureGroup();
        self._icon = L.divIcon({className: 'marker-icon icon-red', iconSize: [32, 32], iconAnchor: [16, 32]});
        self._marker = L.marker(map.getCenter(), { icon: self._icon, draggable: true }).addTo(self._markers);
        self._marker.on('drag', function (e) { var ll = e.target.getLatLng(); self.lat(ll.lat); self.lng(ll.lng); });

        // setup observables
        self.lat = ko.observable();
        self.lng = ko.observable();
        self.ids = ko.observableArray();
        self.morton = ko.pureComputed({owner: self,
            read: function () { return tileid.wgs2morton(self.lng(), self.lat()); }
        }).subscribe(function (v) {
            var ids = [];
            for (var i = 0; i <= 15; ++i) {
                ids.push({'tileid': tileid.morton2tile(v, i), 'packed': tileid.morton2tileid(v, i)});
            }
            self.ids(ids);
            self.selectLevel();
            $('#tileids tbody tr').click(function(v) { self.fitTile(self.getPackedTileId($(this))); })
        });
        self.findTileId = ko.observable();
        self.findTileId.subscribe(function(v) {
            if (isNaN(parseFloat(v)))
                return;
            var level = tileid.tileid2level(v);
            if (!isFinite(level) || level < 0 || level > 15)
                 return;
            self.fitTile(v, level);
        });

        self._map.on('zoomend', function(e) { self.selectLevel(); });

        // update initial values
        self.lat(self._map.getCenter().lat);
        self.lng(self._map.getCenter().lng);

        this.activate = function () {
            self._map.addLayer(self._markers);
            $('#tileids').on('keypress', this.keypress);
            $('#tileids').focus();
        }
        this.deactivate = function () {
            self._map.removeLayer(self._markers);
            $('#tileids').off('keypress', this.keypress);
        }
        this.keypress = function (event) {
            if (event.keyCode === 38) {
                self.fitTile(self.getPackedTileId($('#tileids tbody tr.selected').prev('tr')));
            } else if(event.keyCode === 40) {
                self.fitTile(self.getPackedTileId($('#tileids tbody tr.selected').next('tr')));            }
        }

        ko.bindingHandlers.selectTilesLevel = {
            update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
                viewModel.selectLevel()
                $('#tileids tbody tr').click(function(v) { self.fitTile(self.getPackedTileId($(this))); })
            }};

    }

    return TilesViewModel;
});
