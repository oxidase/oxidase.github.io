/*!
 * NDS tile grid
 * (c) Michael Krasnyk
 * License: MIT (http://www.opensource.org/licenses/mit-license.php)
 */

'use strict'

define(['leaflet', 'nds/tileid', 'nds/distance'],
function (L, tileid, distance) {

function round(x, k) {
    var z = Math.pow(10, k)
    return Math.sign(x) * Math.abs(Math.round(z * x)) / z;
}

function point(lon, lat) {
    lon = tileid.lon2nds(lon);
    lat = tileid.lat2nds(lat);
    lon = lon >= 0x80000000 ? lon - 0x100000000 : lon;
    lat = (lat >= 0x40000000 ? lat - 0x080000000 : lat);
    return round(lon, 6) + ', ' + round(lat, 6);
}

function dist(lon1, lat1, lon2, lat2) {
    var m = distance.wgs84(lat1, lon1, lat2, lon2);
    if (!isFinite(m))
        return m;
    return (m > 1200) ? round(m / 1000., 2).toString() + ' km' : round(m, 2).toString() + ' m';
}


function tileInfo(id) {
    var coord = tileid.tileid2wgs(id),
        level = tileid.tileid2level(id),
        d = tileid.level2distance(level);

    return '<svg width="225" height="240" class="info">'
           + '<rect x="20" y="20" width="200" height="200" style="fill:rgba(0,0,255,0.0);stroke-width:3;stroke:rgb(0,0,0)" />'
           + '<circle cx="220" cy="20" r="4" stroke="black" stroke-width="0" fill="red" /> '
           + '<text x="215" y="35"  text-anchor="end" >' + point(coord[0] + d, coord[1] + d) + '</text>'
           + '<circle cx="120" cy="120" r="4" stroke="black" stroke-width="0" fill="red" />'
           + '<text x="120" y="110" text-anchor="middle">' + point(coord[0] + d/2, coord[1] + d/2) + '</text>'
           + '<circle cx="20" cy="220" r="4" stroke="black" stroke-width="0" fill="red" />'
           + '<text x="25"   y="215" text-anchor="start">' + point(coord[0], coord[1]) + '</text>'
           + '<text x="120"  y="15"  text-anchor="middle">' + dist(coord[0], coord[1]+d, coord[0]+d, coord[1]+d) + '</text>'
           + '<text x="120"  y="235" text-anchor="middle">' + dist(coord[0], coord[1], coord[0]+d, coord[1]) + '</text>'
           + '<text x="20"   y="120"  text-anchor="middle" transform="rotate(-90,20,120) translate(0,-5)">' + dist(coord[0], coord[1], coord[0], coord[1]+d) + '</text>'
           + '<text x="120"  y="160" text-anchor="middle">Tile: ' + id + ', level ' + level + '</text>'
           + '</svg>'
}

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

        var level = Math.max(0, Math.min(15, this._map.getZoom() - 1)),
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

        if ((maxLat - minLat) * (maxLon - minLon) / dist / dist > 1000) {
            console.warn('too many tiles', Math.floor((maxLat - minLat) * (maxLon - minLon) / dist / dist),
                         'for the current bounding box',
                         '['+bb.getSouth()+','+bb.getWest()+ ' '+ bb.getEast()+','+bb.getNorth()+']',
                         'and level ' + level + '; ignoring tiles grid');
            return;
        }

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
                var id = tileid.wgs2tileid(lon, lat, level);
                L.marker([lat + dist, lon], {
                    draggable: false,
                    icon: L.divIcon({
                        className: 'tileid-labels',
                        iconSize: [0, 0], iconAnchor: [-4, -4],
                        html: id})})
                .bindPopup(tileInfo(id), {offset: [50,10]})
                .addTo(this);
            }
        }
    } });
});