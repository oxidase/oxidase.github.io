'use strict';

var nds = (function ()
{
    var exports = {};

    var nds2morton = new Array(256),
        morton2nds = new Array(256);

    for (var i = 0; i < 256; ++i) {
        var k = 0;
        for (var j = 0; j < 8; ++j) {
            if (i & (1<<j))
                k |= 1<<(2*j);
        }
        nds2morton[i] = k;
    }
    for (var i = 0; i < 16; ++i) {
        var mi = nds2morton[i];
        for (var j = 0; j < 16; ++j) {
            var mj = nds2morton[j];
            morton2nds[mi | (mj<<1)] = [i, j];
        }
    }

    function trunc(x) {
        return x < 0 ? Math.ceil(x) : Math.floor(x);
    }

    function uint32(x) {
        return x < 0 ? x + 0x100000000 : x;
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
     *  * @return {Number}
     */
    exports.nds2morton = function(x, y) {
        return [ uint32( nds2morton[x     & 0xff]       | nds2morton[y     & 0xff] <<  1
                       | nds2morton[x>>8  & 0xff] << 16 | nds2morton[y>>8  & 0xff] << 17),
                 uint32( nds2morton[x>>16 & 0xff]       | nds2morton[y>>16 & 0xff] <<  1
                       | nds2morton[x>>24 & 0xff] << 16 | nds2morton[y>>24 & 0xff] << 17)];
    };

    exports.lonlat2morton = function(x, y) {
        return exports.nds2morton(exports.lon2nds(x), exports.lat2nds(y));
    };

    exports.morton2tile = function(x, level) {
        var lsp = x[0], msp = x[1], shift = 0 <= level && level < 32 ? 2*(31-level) : 42;
        return shift >= 32 ?
                    (msp >>> (shift - 32)) :
                    (lsp >>> shift) + (msp * (1<<(32 - shift)));
    };

    exports.nds2tile = function(x, y, level) {
        return exports.morton2tile(exports.nds2morton(x, y), level);
    };

    exports.lonlat2tile = function(x, y, level) {
        return exports.nds2tile(exports.lon2nds(x), exports.lat2nds(y), level);
    };

    exports.tile2morton = function(x, level) {
        var shift = 0 <= level && level < 32 ? 2*(31-level) : 42;
        return shift >= 32 ?
                    [ 0, (x << (shift - 32))] :
                    [ (x * (1 << shift)) % 0x100000000,  trunc(x / (1 << (32 - shift)))];
    };

    exports.morton2nds = function(x) {
        var lsx = x[0], msx = x[1],
            x0 = morton2nds[ lsx        & 0xff ],
            x1 = morton2nds[ (lsx>>>8)  & 0xff ],
            x2 = morton2nds[ (lsx>>>16) & 0xff ],
            x3 = morton2nds[ (lsx>>>24) & 0xff ],
            x4 = morton2nds[ msx        & 0xff ],
            x5 = morton2nds[ (msx>>>8)  & 0xff ],
            x6 = morton2nds[ (msx>>>16) & 0xff ],
            x7 = morton2nds[ (msx>>>24) & 0xff ];
        return [ uint32(x0[0]|x1[0]<<4|x2[0]<<8|x3[0]<<12|x4[0]<<16|x5[0]<<20|x6[0]<<24|x7[0]<<28),
                 x0[1]|x1[1]<<4|x2[1]<<8|x3[1]<<12|x4[1]<<16|x5[1]<<20|x6[1]<<24|x7[1]<<28 ];
    };

    exports.nds2lon = function(x) {
        if (x > 0x80000000)
            x = x - 0x100000000;
        return 90. * x / 0x40000000;
    };

    exports.nds2lat = function(x) {
        if (x > 0x40000000)
            x = x - 0x80000000;
        return 90. * x / 0x40000000;
    };

    exports.coord2text = function(x) {
        var sign = x >= 0 ? '+' : '-',
            absx = Math.abs(Math.round(1000000. * x)) / 1000000.,
            degrees = Math.floor(absx),
            minutes = Math.floor(   60. * (absx - degrees) ),
            seconds = Math.floor( ( 60. * (absx - degrees) - minutes) * 100000 ) * 60 / 100000;
        return sign + degrees + '° ' + minutes + "' " + seconds + '"';
    };

    return exports;
})();
