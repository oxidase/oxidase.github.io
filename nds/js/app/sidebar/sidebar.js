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
        if ($(this).hasClass('visible')) {
            // hide the info page
            $(this).removeClass('visible');
            $('#sidebar').width($(this).width());
            self.visiblePage('');
        } else {
            var id = $(this).attr('id');

            // hide all info pages
            $('#sidebar .button').removeClass('visible');
            $('#sidebar #info').children().hide();

            // show the info page with the id
            $(this).addClass('visible');
            $('#sidebar').animate({width: $(this).width() + $('#sidebar #info').width()}, 100);

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
    });
}

});