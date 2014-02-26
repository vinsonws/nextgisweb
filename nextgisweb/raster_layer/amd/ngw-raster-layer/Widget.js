/* globals define */
define([
    "dojo/_base/declare",
    "dojo/Deferred",
    "dojo/when",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "ngw-resource/serialize",
    // resource
    "dojo/text!./template/Widget.html",
    // template
    "dojox/layout/TableContainer",
    "ngw/form/SpatialRefSysSelect",
    "ngw/form/Uploader"
], function (
    declare,
    Deferred,
    when,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    serialize,
    template
) {
    return declare("ngw.raster.layer.Widget", [_WidgetBase, serialize.Mixin, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        title: "Растровый слой",

        serializeInMixin: function (data) {
            if (data.raster_layer === undefined) { data.raster_layer = {}; }
            var value = data.raster_layer;
            
            value.srs = { id: this.wSrs.get("value") };
            value.source = this.wFile.data;
        }
    });
});