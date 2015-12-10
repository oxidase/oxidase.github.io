var test = require('unit.js');
var leche = require('leche');
var distance = require('../distance.js');

describe('Distance for WGS84', function() {


    var coords = {
        Sydney: [-33.883333333333, 151.216666666667],
        London: [ 51.5, -0.116666666667],
        Boston: [ 42.35, -71.0666666666667],
        Tokyo:  [ 35.683333333333, 139.75] };

    leche.withData({
        Sydney2London: {from: coords.Sydney, to: coords.London, distance: 16990669.043, bearing: 319.14 },
        London2Boston: {from: coords.London, to: coords.Boston, distance: 5280975.789, bearing: 288.27 },
        Boston2Tokyo: {from: coords.Boston, to: coords.Tokyo, distance: 10814785.936, bearing: 335.21 },
        Tokyo2Sydney:  {from: coords.Tokyo, to: coords.Sydney, distance: 7793033.491, bearing: 169.91 }
    }, function(d) {
           it('must return correct distance between two points', function() {
               test.number(distance.wgs84(d.from[0], d.from[1], d.to[0], d.to[1]))
                   .isApprox(d.distance, 1e-2);
           });
           it('must return correct course for two points', function() {
               test.number(distance.course(d.from[0], d.from[1], d.to[0], d.to[1]))
                   .isApprox(d.bearing, 1e-2);
           });
       });

    it('must satisfy separation axiom (non-negativity)', function() {
        test.number(distance.wgs84(coords.Sydney[0], coords.Sydney[1], coords.Boston[0], coords.Boston[1]))
            .isGreaterThan(0.);
        test.number(distance.wgs84(coords.Sydney[0], coords.Sydney[1], coords.Sydney[0] + 1e-10, coords.Sydney[1]))
            .isGreaterThan(0.);
    });


    it('must satisfy coincidence axiom (one way)', function() {
        test.number(distance.wgs84(coords.Sydney[0], coords.Sydney[1], coords.Sydney[0], coords.Sydney[1]), 0.)
            .isEqualTo(0.);
    });

    it('must satisfy symmetry', function() {
        test.number(distance.wgs84(coords.Sydney[0], coords.Sydney[1], coords.Boston[0], coords.Boston[1]))
            .isEqualTo(distance.wgs84(coords.Boston[0], coords.Boston[1], coords.Sydney[0], coords.Sydney[1]));
    });

    it('must satisfy triangle inequality (check only less than)', function() {
        test.number(distance.wgs84(coords.Sydney[0], coords.Sydney[1], coords.London[0], coords.London[1]))
            .isLessThan(distance.wgs84(coords.Sydney[0], coords.Sydney[1], coords.Boston[0], coords.Boston[1]) +
                    distance.wgs84(coords.Boston[0], coords.Boston[1], coords.London[0], coords.London[1]));
    });

});
