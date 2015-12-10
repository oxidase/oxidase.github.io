/*!
 * Two points helpers
 * (c) Michael Krasnyk
 * License: MIT (http://www.opensource.org/licenses/mit-license.php)
 */

'use strict';

if (typeof define !== 'function') {
    // required to run tests with mocha
    var define = require('amdefine')(module);
}

define(['exports'], function(exports) {

// http://www.abecedarical.com/zenosamples/zs_great_circle_route.html
// distance using Andoyer approximation
// Meeus, J. (1998). Astronomical Algorithms. p.85
exports.wgs84 = function(lat1, lon1, lat2, lon2) {

    var conv = Math.PI / 180.;
    var a = 6378137.0;             // WGS-84 equatorial radius
    var f = 1.0 / 298.257223563;   // WGS-84 ellipsoid flattening factor

    var F = (lat1 + lat2) / 2.0 * conv;
    var G = (lat1 - lat2) / 2.0 * conv;
    var L = (lon1 - lon2) / 2.0 * conv;

    if (G === 0. && L === 0.)
        return 0;

    var sinG = Math.sin(G);
    var sinF = Math.sin(F);
    var sinL = Math.sin(L);

    var sinG2 = sinG * sinG;
    var cosG2 = 1. - sinG2;
    var sinF2 = sinF *sinF;
    var cosF2 = 1. - sinF2;
    var sinL2 = sinL * sinL;
    var cosL2 = 1. - sinL2;

    var S = sinG2 * cosL2 + cosF2 * sinL2;
    var C = cosG2 * cosL2 + sinF2 * sinL2;

    var w = Math.atan(Math.sqrt(S / C));
    var R = Math.sqrt(S * C) / w;

    var D = 2. * w * a;
    var H1 = (3. * R - 1.) / (2. * C);
    var H2 = (3. * R + 1.) / (2. * S);

    return D * (1. + f * H1 *sinF2 * cosG2 - f * H2 * cosF2 * sinG2);
}


// course using spherical trigonometry
// does not work if one latitude is polar!!!
exports.course = function(lat1, lon1, lat2, lon2)
{
    var conv = Math.PI / 180.;
    lat1 *= conv;
    lon1 *= conv;
    lat2 *= conv;
    lon2 *= conv;

    var L = lon2 - lon1;
    var cosD = Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(L);
    var D = Math.acos(cosD);
    var cosC = (Math.sin(lat2) - cosD * Math.sin(lat1)) / (Math.sin(D) * Math.cos(lat1));

    // numerical error can result in |cosC| slightly > 1.0
    if (cosC > 1.0)
        cosC = 1.0
    if (cosC < -1.0)
        cosC = -1.0

    var C = Math.acos(cosC);

    if (Math.sin(L) < 0.0)
        C = 2. * Math.PI - C;

    return C / conv;
}

});