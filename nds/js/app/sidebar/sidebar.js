define(['knockout', 'jquery', 'require', 'text', 'domReady!'], function(ko, $, require) {

return function (map) {
    var self = this;

    self._map = map;
    self._models = {};
    self.visiblePage = ko.observable();
    self.visiblePage.subscribe(function(v) { if (self._models.hasOwnProperty(v)) self._models[v].activate(); });
    self.visiblePage.subscribe(function(v) { if (self._models.hasOwnProperty(v)) self._models[v].deactivate(); }, null, "beforeChange");

    // setup sidebar buttons click handler
    $('#sidebar .button').click(function() {
        var panelWidth = 0;
        if ($(this).hasClass('visible')) {
            // hide the info page
            panelWidth = $(this).width();
            $('#sidebar').width(panelWidth);
            $(this).removeClass('visible');
            self.visiblePage('');
        } else {
            var id = $(this).attr('id');

            // show info page
            panelWidth = $(this).width() + $('#sidebar #info').width();
            $('#sidebar').animate({width: panelWidth}, 100);
            $(this).addClass('visible').siblings().removeClass('visible');

            // hide the current page
            $('#sidebar #info').children().hide();

            // load #sidebar-id or show already loaded page
            var panel = $("#sidebar #info #sidebar-" + id);
            if (!panel.length) {
                require(['./' + id, 'text!./' + id + '.html'], function (model, html) {
                    $("#sidebar #info").append('<div id="sidebar-' + id + '">' + html + '</div>');
                    self._models[id] = new model(self._map);
                    ko.applyBindings(self._models[id], document.getElementById('sidebar-' + id));
                    self.visiblePage(id);
                });
            } else {
                panel.show();
                self.visiblePage(id);
            }
        }
        // resize map
        $("#map").width($(window).width() - panelWidth);
        self._map.invalidateSize();
    });
}

});