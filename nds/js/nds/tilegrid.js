/*!
 * NDS tile grid
 * (c) Michael Krasnyk
 * License: MIT (http://www.opensource.org/licenses/mit-license.php)
 */

'use strict'

define(['leaflet', 'nds/tileid'],
function (L, tileid) {

function getLevel (bb, size) {
    var dlat = (bb.getNorth() - bb.getSouth()),
        dlon = (bb.getEast() - bb.getWest());
    if (dlon > 720) return 0;
    if (dlon > 360) return 1;
    // TODO: make bb and size dependent
    return Math.max(0, Math.min(15, Math.max(tileid.distance2level(dlon), tileid.distance2level(dlat)) + 2));
}

return L.GeoJSON.extend({

	  includes: L.Mixin.Events,

    initialize: function (options) {
		    this._layers = {};
        L.Util.setOptions(this, options || { style: { color: '#f33', weight: 3 } });
    },

    onAdd: function (map) {
        this._map = map;
        this._rectTile = L.rectangle([[0,0],[0,0]], {className: 'tile'}).addTo(map);

        this._updateGrid();

        map.on('move', this._updateGrid, this);
        map.on('mousemove', function(event) { this._latlng = event.latlng; this._updateRect(); }, this);
    },

    onRemove: function (map) {
        this.clearLayers();
        this._map.removeLayer(this._rectTile);

        map.off('move', this._updateGrid, this);
        map.off('mousemove');
    },

    _updateGrid: function() {
        this.clearLayers();

        var bb = this._map.getBounds(), level = getLevel(bb, this._map.getSize()),
            dist = tileid.level2distance(level),
            tileSW = tileid.wgs2tileid(bb.getWest(), bb.getSouth(), level),
            tileNE = tileid.wgs2tileid(bb.getEast(), bb.getNorth(), level),
            coordSW = tileid.tileid2wgs(tileSW),
            coordNE = tileid.tileid2wgs(tileNE),
            minLat = coordSW[1],
            maxLat = coordNE[1] + dist,
            minLon = bb.getWest() < -180 ? -180 : coordSW[0],
            maxLon = bb.getEast() > 180 ? 180 : coordNE[0] + dist;

        var grid = [];
        for (var lat = minLat; lat <= maxLat; lat += dist) {
            var line = [[bb.getWest(), lat], [bb.getEast(), lat]];
            grid.push({'type': 'Feature', 'geometry': {'type': 'LineString', 'coordinates': line}});
        }
        for (var lon = minLon; lon <= maxLon ; lon += dist) {
            var line = [[lon, bb.getSouth()], [lon, bb.getNorth()]];
            grid.push({'type': 'Feature', 'geometry': {'type': 'LineString', 'coordinates': line}});
        }
        this.addData(grid);

        var markers = [];
        for (var lat = minLat; lat < maxLat; lat += dist) {
            for (var lon = minLon; lon < maxLon ; lon += dist) {
                L.marker([lat + dist, lon], {
                    draggable: false,
                    icon: L.divIcon({
                        className: 'tileid-labels',
                        iconSize: [0, 0], iconAnchor: [-4, -4],
                        html: tileid.wgs2tileid(lon, lat, level)})})
                .addTo(this);
            }
        }

        if (level !== this._level) {
            this._level = level;
            this._updateRect();

            this.fire('level', {'level': level});
        }
    },

    _updateRect: function() {
        if (typeof this._latlng === 'undefined')
            return;

        var tile = tileid.wgs2tileid(this._latlng.lng, this._latlng.lat, this._level);
        if (tile !== this._tileid) {
            var dist = tileid.level2distance(this._level),
                sw = tileid.tileid2wgs(tile);
            this._tileid = tile;
            this._rectTile.setBounds([[sw[1], sw[0]], [sw[1] + dist, sw[0] + dist]]);

		        this.fire('tileid', {'id': tile});
        }
    }});
});