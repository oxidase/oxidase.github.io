/*!
 * NDS tile grid
 * (c) Michael Krasnyk
 * License: MIT (http://www.opensource.org/licenses/mit-license.php)
 */

'use strict'

define(['leaflet', 'nds/tileid'],
function (L, tileid) {

return L.GeoJSON.extend({

	  includes: L.Mixin.Events,

    initialize: function (options) {
		    this._layers = {};
        L.Util.setOptions(this, options || { style: { color: '#f33', weight: 3 } });
    },

    onAdd: function (map) {
        this._map = map;
        this._updateGrid();
        map.on('moveend', this._updateGrid, this);
    },

    onRemove: function (map) {
        this.clearLayers();
        map.off('move', this._updateGrid, this);
    },

    _updateGrid: function() {
        this.clearLayers();

        var level = this._map.ndsLevel(),
            bb = this._map.getBounds(),
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
    } });
});