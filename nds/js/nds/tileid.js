/*!
 * NDS tile helpers
 * (c) Michael Krasnyk
 * License: MIT (http://www.opensource.org/licenses/mit-license.php)
 */

'use strict';

if (typeof define !== 'function') {
    // required to run tests with mocha
    var define = require('amdefine')(module);
}

define(['exports'], function(exports) {
/**
 Packed Tile IDs
  level
   15     1xxx xxxx xxxx xxxx  xxxx xxxx xxxx xxxx
   14     010x xxxx xxxx xxxx  xxxx xxxx xxxx xxxx
   13     0010 0xxx xxxx xxxx  xxxx xxxx xxxx xxxx
    5     0000 0000 0010 0000  0000 0xxx xxxx xxxx
    1     0000 0000 0000 0010  0000 0000 0000 0xxx
    0     0000 0000 0000 0001  0000 0000 0000 000x
*/

var MortonTable256 = [
    0x0000, 0x0001, 0x0004, 0x0005, 0x0010, 0x0011, 0x0014, 0x0015,
    0x0040, 0x0041, 0x0044, 0x0045, 0x0050, 0x0051, 0x0054, 0x0055,
    0x0100, 0x0101, 0x0104, 0x0105, 0x0110, 0x0111, 0x0114, 0x0115,
    0x0140, 0x0141, 0x0144, 0x0145, 0x0150, 0x0151, 0x0154, 0x0155,
    0x0400, 0x0401, 0x0404, 0x0405, 0x0410, 0x0411, 0x0414, 0x0415,
    0x0440, 0x0441, 0x0444, 0x0445, 0x0450, 0x0451, 0x0454, 0x0455,
    0x0500, 0x0501, 0x0504, 0x0505, 0x0510, 0x0511, 0x0514, 0x0515,
    0x0540, 0x0541, 0x0544, 0x0545, 0x0550, 0x0551, 0x0554, 0x0555,
    0x1000, 0x1001, 0x1004, 0x1005, 0x1010, 0x1011, 0x1014, 0x1015,
    0x1040, 0x1041, 0x1044, 0x1045, 0x1050, 0x1051, 0x1054, 0x1055,
    0x1100, 0x1101, 0x1104, 0x1105, 0x1110, 0x1111, 0x1114, 0x1115,
    0x1140, 0x1141, 0x1144, 0x1145, 0x1150, 0x1151, 0x1154, 0x1155,
    0x1400, 0x1401, 0x1404, 0x1405, 0x1410, 0x1411, 0x1414, 0x1415,
    0x1440, 0x1441, 0x1444, 0x1445, 0x1450, 0x1451, 0x1454, 0x1455,
    0x1500, 0x1501, 0x1504, 0x1505, 0x1510, 0x1511, 0x1514, 0x1515,
    0x1540, 0x1541, 0x1544, 0x1545, 0x1550, 0x1551, 0x1554, 0x1555,
    0x4000, 0x4001, 0x4004, 0x4005, 0x4010, 0x4011, 0x4014, 0x4015,
    0x4040, 0x4041, 0x4044, 0x4045, 0x4050, 0x4051, 0x4054, 0x4055,
    0x4100, 0x4101, 0x4104, 0x4105, 0x4110, 0x4111, 0x4114, 0x4115,
    0x4140, 0x4141, 0x4144, 0x4145, 0x4150, 0x4151, 0x4154, 0x4155,
    0x4400, 0x4401, 0x4404, 0x4405, 0x4410, 0x4411, 0x4414, 0x4415,
    0x4440, 0x4441, 0x4444, 0x4445, 0x4450, 0x4451, 0x4454, 0x4455,
    0x4500, 0x4501, 0x4504, 0x4505, 0x4510, 0x4511, 0x4514, 0x4515,
    0x4540, 0x4541, 0x4544, 0x4545, 0x4550, 0x4551, 0x4554, 0x4555,
    0x5000, 0x5001, 0x5004, 0x5005, 0x5010, 0x5011, 0x5014, 0x5015,
    0x5040, 0x5041, 0x5044, 0x5045, 0x5050, 0x5051, 0x5054, 0x5055,
    0x5100, 0x5101, 0x5104, 0x5105, 0x5110, 0x5111, 0x5114, 0x5115,
    0x5140, 0x5141, 0x5144, 0x5145, 0x5150, 0x5151, 0x5154, 0x5155,
    0x5400, 0x5401, 0x5404, 0x5405, 0x5410, 0x5411, 0x5414, 0x5415,
    0x5440, 0x5441, 0x5444, 0x5445, 0x5450, 0x5451, 0x5454, 0x5455,
    0x5500, 0x5501, 0x5504, 0x5505, 0x5510, 0x5511, 0x5514, 0x5515,
    0x5540, 0x5541, 0x5544, 0x5545, 0x5550, 0x5551, 0x5554, 0x5555 ];

var MortonTable16 = [
    [0, 0], [1, 0], [0, 1], [1, 1],
    [2, 0], [3, 0], [2, 1], [3, 1],
    [0, 2], [1, 2], [0, 3], [1, 3],
    [2, 2], [3, 2], [2, 3], [3, 3] ];

function trunc(x) {
    return x < 0 ? Math.ceil(x) : Math.floor(x);
}

function uint32(x) {
    return x < 0 ? x + 0x100000000 : x;
}

exports.tileid2level = function(x) {
    return Math.floor(Math.log(x) * Math.LOG2E) - 16;
}

exports.distance2level = function(x) {
    return Math.floor(Math.log(180. / x) * Math.LOG2E);
}

exports.level2distance = function(x) {
    return 180. / (1 << x);
}

/**
 * Coding of NDS longitude
 * For coding coordinates, a scaling factor is applied so that 360° correspond to 2^32, to exhaust the
 * full range of 32 bit signed integers. In NDS, a coordinate unit corresponds to 90/2^30 degrees of
 * longitude or latitude. Longitudes range between –180° and +180°. Hence, coordinate values are in the
 * range of –2^31 ≤ x < 2^31 for longitudes.
 *
 * @param {Number} x
 * @return {Number}
 */
exports.lon2nds = function(x) {
    var y = trunc( x / 90. * 0x40000000 );
    return y >= 0 ? y : y + 0x100000000;
};

/**
 * Coding of NDS latitude
 * For coding coordinates, a scaling factor is applied so that 360° correspond to 2^32, to exhaust the
 * full range of 32 bit signed integers. In NDS, a coordinate unit corresponds to 90/2^30 degrees of
 * longitude or latitude. Longitudes range between –180° and +180° and latitudes between –90°
 * and +90°. Hence, coordinate values are in the range of –2^30 ≤ y < 2^30 for latitudes.
 *
 * @param {Number} x
 * @return {Number}
 */
exports.lat2nds = function(x) {
    var y = trunc( x / 90. * 0x40000000 );
    return y >= 0 ? y : y + 0x80000000;
};

exports.nds2lon = function(x) {
    if (x >= 0x80000000)
        x = x - 0x100000000;
    return 90. * x / 0x40000000;
};

exports.nds2lat = function(x) {
    if (x >= 0x40000000)
        x = x - 0x80000000;
    return 90. * x / 0x40000000;
};

/**
 * From a coordinate, which is defined by two integer values for longitude (x) and latitude (y), the
 * Morton code can be derived, which is a single number. Thus, two dimensions are mapped into
 *  one dimension. To be more precise, for a given coordinate with
 * x = x31 x30...x1 x0 and y = y30...y1 y0 the Morton code c is given by the 63-bit integer
 * c = x31 y30 x30...y1 x1 y0 x0
 * that results from interleaving the bits of the x- and y-coordinate, hence, 0 ≤ c < 263. If stored
 * in a 64-bit integer, the Morton code c is prefixed with a 0 bit, thus always positive.
 *
 * @param {Number} x
 * @param {Number} y
 * @return {Number} only high word x31 y30 x30...y16 x16
 */
exports.nds2morton = function(x, y) {
    return uint32( MortonTable256[x    & 0xff]       | MortonTable256[y    & 0xff] <<  1
                 | MortonTable256[x>>8 & 0xff] << 16 | MortonTable256[y>>8 & 0xff] << 17);
};

exports.nds2morton64 = function(x, y) {
    return [exports.nds2morton(x >> 16, y >> 16), exports.nds2morton(x, y)];
};

exports.wgs2morton = function(x, y) {
    return exports.nds2morton(exports.lon2nds(x) >> 16, exports.lat2nds(y) >> 16);
};

exports.wgs2morton64 = function(x, y) {
    return exports.nds2morton64(exports.lon2nds(x), exports.lat2nds(y));
};

exports.morton2tile = function(x, level) {
    var shift = 2*(15-level);
    return 0 <= shift && shift < 32 ? x >>> shift : x;
};

exports.nds2tile = function(x, y, level) {
    return exports.morton2tile(exports.nds2morton(x >> 16, y >> 16), level);
};

exports.wgs2tile = function(x, y, level) {
    return exports.nds2tile(exports.lon2nds(x), exports.lat2nds(y), level);
};

exports.wgs2tileid = function(x, y, level) {
    return uint32((1 << (level + 16)) | exports.nds2tile(exports.lon2nds(x), exports.lat2nds(y), level));
};

exports.tileid2tile = function(tileid) {
    var level = exports.tileid2level(tileid);
    return tileid & ((1<<(2 * level + 1)) - 1);
};

exports.tileid2morton = function(tileid) {
    var level = exports.tileid2level(tileid);
    return (tileid & ((1<<(2 * level + 1)) - 1)) << (2 * (15 - level));
};

exports.tileid2nds = function(tileid) {
    var morton = exports.tileid2morton(tileid), lon = 0, lat = 0;
    for (var i = 0; i < 8; ++i) {
        var split = MortonTable16[morton & 0xf];
        lon = lon | (split[0] << (2 * i));
        lat = lat | (split[1] << (2 * i));
        morton = morton >> 4;
    }
    return [uint32(lon << 16), uint32(lat << 16)];
};

exports.tileid2wgs = function(tileid) {
    var coord = exports.tileid2nds(tileid), level = exports.tileid2level(tileid);
    return [exports.nds2lon(coord[0]), level === 0 ? -90. : exports.nds2lat(coord[1])];
};

exports.coord2text = function(x, prefix) {
    prefix = prefix || '+-';
    var sign = prefix[x >= 0 ? 0 : 1],
        absx = Math.abs(x),
        degrees = Math.floor(Math.abs(absx)),
        minutes = Math.floor(60. * (absx - degrees)),
        seconds = Math.floor((60. * (absx - degrees) - minutes) * 60);
    return sign + degrees + '° ' + minutes + "' " + seconds + '"';
};

function divideBy(x, divisor) {
    var r = 0, d;
    for (var i = 0; i < x.length; ++i) {
        d = x[i] + r * 0x100000000;
        r = d % divisor;
        x[i] = Math.floor(d / divisor);
    }
    return r;
}

exports.morton64string = function(x) {
    // use 1000000 because divisor must be less 2^(53-32)
    // and 4 reminders because ⌈64/log2(1000000)⌉ = 4
    var s = '', pad = '000000', z = [x[0], x[1]], r = divideBy(z, 1000000);
    while (!isNaN(z[0]) && !isNaN(z[0]) && (z[0] !== 0 || z[1] !== 0)) {
        s = (pad + r.toString()).slice(-pad.length) + s;
        r = divideBy(z, 1000000);
    }
    return r.toString() + s;
};

// http://wiki.openstreetmap.org/wiki/Mercator
var earthEquatorRadius = 6371000.; // 6378137.

exports.wgs2mercatorx = function(x) {
    return earthEquatorRadius * (x * Math.PI / 180.);
}

exports.wgs2mercatory = function(y) {
    return earthEquatorRadius * Math.log(Math.tan(Math.PI / 4. + (y * Math.PI / 180.) / 2.));
}

exports.mercator2wgsx = function(x) {
    return 180.0 / Math.PI * (x / earthEquatorRadius);
}

exports.mercator2wgsy = function(y) {
    return 180.0 / Math.PI * (2. * (Math.atan(Math.exp(y / earthEquatorRadius)) - Math.PI / 4.));
}


});