var test = require('unit.js');
var leche = require('leche');
var tileid = require('../tileid.js');

describe('Basic tests', function() {

    leche.withData({
        level15: [0xf0000000, 15],
        level13: [0x25aaaaaa, 13],
        level5:  [0x002007ff,  5],
        level1:  [0x00020007,  1],
        level0:  [0x00010001,  0],
        error:   [0x00000000,  -Infinity]
    }, function(first, second) {
           it('should return correct level from tile id', function() {
               test.assert.equal(tileid.tileid2level(first), second);
           });
       });

    leche.withData([
        [360., -1], [180., 0], [90., 1], [1., 7], [.02, 13], [.005, 15], [.001, 17]
    ], function(first, second) {
           it('should return correct level from tile id', function() {
               test.assert.equal(tileid.distance2level(first), second);
           });
       });

    leche.withData({ // 1000 0000 1001 1100 1110 1010 1001
        EiffelTower: {lon:2.2945, lat:48.858222, ndslon:0x1a1b373, ndslat:0x22be5e2d,
                      morton_hi:0x809cea9, morton_lo:0x67ad1da7, morton: '579221254078012839',
                      level10:0x20273, level13:0x809cea, tileid10:0x4020273, tileid13:0x20809CEA},
        StatueOfLiberty: {lon:-74.044444, lat:40.689167, ndslon: 0xcb589ece, ndslat:0x1cef3c9f,
                          morton_hi:0x52e5b9ea, morton_lo:0x4bf4d2fe, morton: '5973384896724652798',
                          level10:0x14b96e, level13:0x52e5b9e, tileid10:0x414B96E, tileid13:0x252E5B9E},
        SugarloafMountain: {lon:-43.157444, lat:-22.948658, ndslon:0xe14f6d56, ndslat:0x6fae5306,
                            morton_hi:0x7cab98fd, morton_lo:0x365b113c, morton: '8983442095026671932',
                            level10:0x1f2ae6,level13:0x7cab98f, tileid10:0x41F2AE6, tileid13:0x27CAB98F},
        SydneyOperaHouse: {lon:151.214189, lat:-33.857529, ndslon:0x6b87b3f9, ndslat:0x67ec6cca,
                           morton_hi:0x3c6fe8b5, morton_lo:0x6da5f5c9, morton: '4354955230616876489',
                           level10:0xf1bfa, level13:0x3c6fe8b, tileid10:0x40F1BFA, tileid13:0x23C6FE8B},
        NearTheMilleniumDome: {lon:0.0, lat:51.503, ndslon:0, ndslat:0x249fd5c4,
                               morton_hi:0x82082aa, morton_lo:0xa222a020, morton: '585611620934393888',
                               level10:0x20820, level13:0x82082a, tileid10:0x4020820, tileid13:0x2082082A},
        NearQuito: {lon:-78.45, lat:0.0, ndslon:0xc8369d04, ndslat:0,
                    morton_hi:0x50400514, morton_lo:0x41510010, morton: '5782627506097029136',
                    level10:0x141001, level13:0x5040051, tileid10:0x4141001, tileid13:0x25040051},
        Marienplatz: {lon:11.575506, lat:48.137270, ndslon:138101165, ndslat:574300001,
                    morton_hi:138940367, morton_lo:313224275, morton: '596744332672461907',
                    level10:135683, level13:8683772, tileid10:67244547, tileid13:545554684}
    }, function(d) {
           it('should return correct NDS coordinates from the WGS', function() {
               test.assert.equal(tileid.lon2nds(d.lon), d.ndslon);
               test.assert.equal(tileid.lat2nds(d.lat), d.ndslat);
           });
           it('should return correct Morton code from the WGS', function() {
               test.assert.equal(tileid.wgs2morton(d.lon, d.lat), d.morton_hi);
               test.array(tileid.wgs2morton64(d.lon, d.lat)).is([d.morton_hi, d.morton_lo]);
           });
           it('should return correct tile number from the WGS', function() {
               test.assert.equal(tileid.wgs2tile(d.lon, d.lat, 15), d.morton_hi);
               test.assert.equal(tileid.wgs2tile(d.lon, d.lat, 13), d.level13);
               test.assert.equal(tileid.wgs2tile(d.lon, d.lat, 10), d.level10);
           });
           it('should return correct tile id from the WGS', function() {
               test.assert.equal(tileid.wgs2tileid(d.lon, d.lat, 15), 0x7fffffff-~d.morton_hi);
               test.assert.equal(tileid.wgs2tileid(d.lon, d.lat, 13), d.tileid13);
               test.assert.equal(tileid.wgs2tileid(d.lon, d.lat, 10), d.tileid10);
           });
           it('should return correct level from tile id', function() {
               test.assert.equal(tileid.tileid2level(0x7fffffff-~d.morton_hi), 15);
               test.assert.equal(tileid.tileid2level(d.tileid13), 13);
               test.assert.equal(tileid.tileid2level(d.tileid10), 10);
           });
           it('should return correct tile number from tile id', function() {
               test.assert.equal(tileid.tileid2tile(0x7fffffff-~d.morton_hi), d.morton_hi);
               test.assert.equal(tileid.tileid2tile(d.tileid13), d.level13);
               test.assert.equal(tileid.tileid2tile(d.tileid10), d.level10);
           });
           it('should return correct Morton code from tile id', function() {
               test.assert.equal(tileid.tileid2morton(0x7fffffff-~d.morton_hi), d.morton_hi);
               test.assert.equal(tileid.tileid2morton(d.tileid13), d.morton_hi & 0xfffffff0);
               test.assert.equal(tileid.tileid2morton(d.tileid10), d.morton_hi & 0xfffffc00);
           });
           it('should return south-west point of NDS rectangle from tile id', function() {
               var dist = 1 << (31 - 15), coord = tileid.tileid2nds(0x7fffffff-~d.morton_hi);
               (d.ndslon).must.be.between(coord[0],  coord[0] + dist - 1);
               (d.ndslat).must.be.between(coord[1],  coord[1] + dist - 1);
               var dist = 1 << (31 - 13), coord = tileid.tileid2nds(d.tileid13);
               (d.ndslon).must.be.between(coord[0],  coord[0] + dist - 1);
               (d.ndslat).must.be.between(coord[1],  coord[1] + dist - 1);
               var dist = 1 << (31 - 10), coord = tileid.tileid2nds(d.tileid10);
               (d.ndslon).must.be.between(coord[0],  coord[0] + dist - 1);
               (d.ndslat).must.be.between(coord[1],  coord[1] + dist - 1);
           });
           it('should return south-west point of WGS rectangle from tile id', function() {
               var dist = tileid.level2distance(15), coord = tileid.tileid2wgs(0x7fffffff-~d.morton_hi);
               (d.lon).must.be.between(coord[0],  coord[0] + dist);
               (d.lat).must.be.between(coord[1],  coord[1] + dist);
               var dist = tileid.level2distance(13), coord = tileid.tileid2wgs(d.tileid13);
               (d.lon).must.be.between(coord[0],  coord[0] + dist);
               (d.lat).must.be.between(coord[1],  coord[1] + dist);
               var dist = tileid.level2distance(10), coord = tileid.tileid2wgs(d.tileid10);
               (d.lon).must.be.between(coord[0],  coord[0] + dist);
               (d.lat).must.be.between(coord[1],  coord[1] + dist);
           });
           it('should return Morton code string from WGS coords', function() {
               test.assert.equal(tileid.morton64string(tileid.wgs2morton64(d.lon, d.lat)), d.morton);
           });
           it('should return Morton code string from NDS coords', function() {
               test.assert.equal(tileid.morton64string(tileid.nds2morton64(d.ndslon, d.ndslat)), d.morton);
           });
       });

    leche.withData({
        point0_1: {level:0, lat:23, lng: 28, tileid: 65536, sw: [ 0, -90 ], dist: 180 },
        point0_2: {level:0, lat:37, lng:-82, tileid: 65537, sw: [-180, -90], dist: 180},
        point0_3: {level:0, lat:-45, lng:-68, tileid: 65537, sw: [-180, -90], dist: 180},
        point0_4: {level:0, lat:23, lng: 388, tileid: 65536, sw: [ 0, -90 ], dist: 180 },
        point0_5: {level:0, lat:37, lng:-422, tileid: 65537, sw: [-180, -90], dist: 180},
        point0_6: {level:0, lat:-45, lng:190, tileid: 65537, sw: [-180, -90], dist: 180},
        point1_1: {level:1, lat:20, lng:20, tileid: 0x20000, sw: [ 0, 0 ], dist: 90},
        point1_2: {level:1, lat:45, lng:100, tileid: 0x20001, sw: [ 90, 0 ], dist: 90},
        point1_3: {level:1, lat:20, lng:-100, tileid: 0x20004, sw: [-180, 0 ], dist: 90},
        point1_4: {level:1, lat:45, lng:-20, tileid: 0x20005, sw: [ -90, 0 ], dist: 90},
        point1_5: {level:1, lat:-20, lng:20, tileid: 0x20002, sw: [ 0, -90 ], dist: 90},
        point1_6: {level:1, lat:-45, lng:100, tileid: 0x20003, sw: [ 90, -90 ], dist: 90},
        point1_7: {level:1, lat:-20, lng:-100, tileid: 0x20006, sw: [-180, -90 ], dist: 90},
        point1_8: {level:1, lat:-45, lng:-20, tileid: 0x20007, sw: [ -90, -90 ], dist: 90},
        point2_1: {level:2, lat:0.1, lng:0.1, tileid: 0x40000, sw: [ 0, 0 ], dist: 45},
        point2_2: {level:2, lat:-0.1, lng:-0.1, tileid: 0x4001f, sw: [ -45, -45 ], dist: 45},
        point2_3: {level:2, lat:-60, lng:-179, tileid: 0x40018, sw: [ -180, -90 ], dist: 45},
        point2_4: {level:2, lat:60, lng:-180, tileid: 0x40012, sw: [ -180, 45 ], dist: 45},
        point2_5: {level:2, lat:-60, lng:-200, tileid: 0x4000d, sw: [ 135, -90 ], dist: 45},
        point2_6: {level:2, lat:60, lng:-200, tileid: 0x40007, sw: [ 135, 45 ], dist: 45}
    }, function(d) {
           it('should return correct values from tile id', function() {
               test.assert.equal(tileid.wgs2tileid(d.lng, d.lat, d.level), d.tileid);
               test.array(tileid.tileid2wgs(d.tileid)).is(d.sw);
               test.assert.equal(tileid.level2distance(tileid.tileid2level(d.tileid)), d.dist);
           });
       });

    leche.withData({
        point1: {morton64: [138940367, 313224275], morton: '596744332672461907'},
        point2: {morton64: [1472970910, 4278899788], morton: '6326361890688259148'},
        uint64m1: {morton64: [4294967295., 4294967295.], morton: '18446744073709551615'},
        zero: {morton64: [0, 0], morton: '0'},
        million: {morton64: [0, 1000000], morton: '1000000'},
        billion: {morton64: [0, 1000000000], morton: '1000000000'},
        trillion: {morton64: [232, 3567587328], morton: '1000000000000'},
        quadrillion: {morton64: [232830, 2764472320], morton: '1000000000000000'}
    }, function(d) {
           it('should return correct Morton code as a string from morton64', function() {
               test.assert.equal(tileid.morton64string(d.morton64), d.morton);
           });
       });

    leche.withData({
        point1: {nds: [138101165, 574300001], morton: '596744332672461907'},
        point2: {nds: [-108597014 + 0x100000000, 462156674], morton: '6326361890688259148'}
    }, function(d) {
           it('should return correct Morton code as a string for NDS coordinates', function() {
               test.assert.equal(tileid.morton64string(tileid.nds2morton64(d.nds[0], d.nds[1])), d.morton);
           });
       });

    leche.withData({
        EiffelTower: {lon:2.2945, lat:48.858222, mercatorx:255136, mercatory:6243844, wgsx:2.294493172, wgsy:48.85822065},
        StatueOfLiberty: {lon:-74.044444, lat:40.689167, mercatorx:-8233366, mercatory:4961043, wgsx:-74.04443933, wgsy:40.68916092},
        SugarloafMountain: {lon:-43.157444, lat:-22.948658, mercatorx:-4798888, mercatory:-2622872, wgsx:-43.15743663, wgsy:-22.94865266},
        SydneyOperaHouse: {lon:151.214189, lat:-33.857529, mercatorx:16814250, mercatory:-4005200, wgsx:151.2141831, wgsy:-33.85752227},
        NearTheMilleniumDome: {lon:0.0, lat:51.503, mercatorx:0, mercatory:6703246, wgsx:0, wgsy:51.5029979},
        NearQuito: {lon:-78.45, lat:0.0, mercatorx:-8723241, mercatory:0, wgsx:-78.44999105, wgsy:0},
        Marienplatz: {lon:11.575506, lat:48.137270, mercatorx:1287137, mercatory:6122863, wgsx:11.57550114, wgsy:48.13726939}
    }, function(d) {
           it('should return correct spherical Mercator coordinates (truncated to int) from the WGS', function() {
               test.assert.equal(~~tileid.wgs2mercatorx(d.lon), d.mercatorx);
               test.assert.equal(~~tileid.wgs2mercatory(d.lat), d.mercatory);
               test.number(tileid.mercator2wgsx(d.mercatorx)).isApprox(d.wgsx, 1e-7);
               test.number(tileid.mercator2wgsy(d.mercatory)).isApprox(d.wgsy, 1e-7);
           });
       });


    leche.withData([
        '0', '1', '42', '4294967295', '4294967296', '4294967297', '12345678901234567890', '9223372036854775808', '18446744073709551615'
    ], function(d) {
           it('should correctly convert string to uint64 and back', function() {
               test.assert.equal(tileid.morton64string(tileid.string2morton64(d)), d);
           });
       });

    leche.withData({
        zero: {x: '18446744073709551616', y: [0,0]},
        one: {x: '18446744078004518912', y: [1,0]},
        two80: {x: '1208925819614629174706177', y: [0,1]}
    }, function(d) {
           it('should correctly overflow uint64', function() {
               test.array(tileid.string2morton64(d.x)).is(d.y);
           });
       });

    leche.withData([
        '0', '1', '42', '596744332672461907', '4294967295', '4294967296', '4294967297'
    ], function(d) {
           it('should correctly convert morton64 to wgs84 and back', function() {
               var wgs = tileid.morton64wgs(tileid.string2morton64(d));
               test.object(wgs).hasLength(2);
               test.assert.equal(tileid.morton64string(tileid.wgs2morton64(wgs[0], wgs[1])), d);
           });
       });


});
