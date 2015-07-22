"use strict";

var canvas, gl;
var vScale, vTheta;

ko.bindingHandlers.slider = {
    init: function (element, valueAccessor, allBindingsAccessor) {
        var options = allBindingsAccessor().sliderOptions || {};
        $(element).slider(options);
        ko.utils.registerEventHandler(element, "slidechange", function (event, ui) {
            var observable = valueAccessor();
            observable(ui.value);
        });
        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            $(element).slider("destroy");
        });
        ko.utils.registerEventHandler(element, "slide", function (event, ui) {
            var observable = valueAccessor();
            observable(ui.value);
        });
    },
    update: function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        if (isNaN(value)) value = 0;
        $(element).slider("value", value);
    }
};

function gentri(a, b, c, level, frac)
{
    var points = [];
    var frac = frac || false;
    function rec(a, b, c, level)
    {
        // check for end of recursion
        if (level === 0) {
            points.push(a, b, c);
        } else {
            //bisect the sides
            var ab = mix(a, b, 0.5);
            var ac = mix(a, c, 0.5);
            var bc = mix(b, c, 0.5);
            
            // sub-triangles
            rec(a, ab, ac, level-1);
            rec(c, ac, bc, level-1);
            rec(b, bc, ab, level-1);
            if (!frac) rec(ab, bc, ac, level-1);
        }
    }
    rec(a, b, c, level);
    return points;
}

var ViewModel = function() {
    var self = this;

    self.points = [];
    self.scale = ko.observable(0.5);
    self.theta = ko.observable(0);
    self.levels = ko.observable(5);
    self.fractal = ko.observable(false);
    self.wireframe = ko.observable(false);
    self.triangles = ko.observable(0);
    self.theta_deg = ko.computed(function(value) { return Math.trunc(180 * self.theta() / Math.PI); });
    self.scale.subscribe(function(value) { self.render(); });
    self.theta.subscribe(function(value) { self.render(); });
    self.wireframe.subscribe(function(value) { self.render() });
    self.levels.subscribe(function(value) { self.generate() });
    self.fractal.subscribe(function(value) { self.generate() });

    self.render = function() {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(vScale, self.scale());
        gl.uniform1f(vTheta, self.theta());
        if (self.wireframe()) {
            for (var i = 0; i < self.points.length / 3; ++i) {
                gl.drawArrays(gl.LINE_LOOP, 3 * i, 3);
            }
        } else {
            gl.drawArrays(gl.TRIANGLES, 0, self.points.length);
        }
    }
    self.generate = function() {
        self.points = gentri(vec2(-1, -1), vec2(0,  1), vec2(1, -1), self.levels(), self.fractal());
        self.triangles(self.points.length / 3);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(self.points), gl.STATIC_DRAW);
        self.render();
    }

    self.generate();
}

window.onload = function init()
{
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert( "WebGL isn't available" ); }

    // Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    // Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    vScale = gl.getUniformLocation(program, "vScale");
    vTheta = gl.getUniformLocation(program, "vTheta");

    ko.applyBindings(new ViewModel());
};
