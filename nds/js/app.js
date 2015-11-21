// Configure loading modules from the lib directory
requirejs.config({
    baseUrl: 'lib',

    paths: {
        app: '../js/app',
        nds: '../js/nds',
        leaflet: 'leaflet/leaflet'
    },

    packages: [
        { name: 'sidebar',
          location: '../js/app/sidebar',
          main: 'sidebar' }
    ]
});

// Start loading the main app file.
requirejs(['app/main']);
