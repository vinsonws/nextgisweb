define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/request/xhr",
    "dojo/json",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/number",
    "dijit/_WidgetBase",
    "dijit/form/Button",
    "dijit/form/TextBox",
    "dijit/form/NumberTextBox",
    "dijit/form/DateTextBox",
    "dijit/form/TimeTextBox",
    "dijit/layout/ContentPane",
    "dijit/layout/BorderContainer",
    "dijit/layout/TabContainer",
    "dojox/layout/TableContainer",
    "ngw/route",
    "ngw-pyramid/ErrorDialog/ErrorDialog",
    "@nextgisweb/pyramid/i18n!",   
    "./loader!",
    "xstyle/css!./resource/FeatureEditorWidget.css"
], function (
    declare,
    lang,
    array,
    xhr,
    json,
    domClass,
    domConstruct,
    number,
    _WidgetBase,
    Button,
    TextBox,
    NumberTextBox,
    DateTextBox,
    TimeTextBox,
    ContentPane,
    BorderContainer,
    TabContainer,
    TableContainer,
    route,
    ErrorDialog,
    i18n,
    loader
) {
    var MultiBox = declare([_WidgetBase], {
        datatype: "STRING",

        isNull: false,

        style: "display: flex; align-items: center",

        buildRendering: function () {
            this.domNode = domConstruct.create("div");
            this.buildWidget();
        },

        buildWidget: function() {
            if ((this.datatype == "INTEGER") ||
                (this.datatype == "BIGINT")) {
                this.children = [
                    (new NumberTextBox({
                        constraints: {fractional: false},
                        style: "width: 12em;"
                    })).placeAt(this)
                ];
            } else if (this.datatype == "REAL") {
                this.children = [
                    (new NumberTextBox({
                        constraints: {places: "0,20"},
                        style: "width: 12em;"
                    })).placeAt(this)
                ];
            } else if (this.datatype == "STRING") {
                this.children = [
                    (new TextBox({
                        style: "width: calc(100% - 20px - 1ex)"
                    })).placeAt(this)
                ];
            } else if (this.datatype == "DATE") {
                this.children = [
                    (new DateTextBox({
                        style: "width: 12em;"
                    })).placeAt(this)
                ];
            } else if (this.datatype == "TIME") {
                this.children = [
                    (new TimeTextBox({
                        style: "width:12em;",
                        constraints: {
                            timePattern: "HH:mm:ss",
                            clickableIncrement: "T01:00:00"
                        }
                    })).placeAt(this)
                ];
            } else if (this.datatype == "DATETIME") {
                this.children = [
                    (new DateTextBox({
                        style: "width: 12em;"
                    })).placeAt(this),

                    (new TimeTextBox({
                        style: "width:12em; margin-left: 1em;",
                        constraints: {
                            timePattern: "HH:mm:ss",
                            clickableIncrement: "T01:00:00"
                        }
                    })).placeAt(this)
                ];
            }

            var widget = this;
            array.forEach(this.children, function (c) {
                c.onFocus = function () {
                    widget.set("isNull", false);
                };
            });

            this.nullbtn = new Button({
                style: "margin-left: 1ex;",
                label: i18n.gettext("Set NULL"),
                title: i18n.gettext("Set field value to NULL (No data)"),
                onClick: function () {
                    widget.set("isNull", true);
                }
            }).placeAt(this);

            this.watch("isNull", function (attr, oval, nval) {
                array.forEach(widget.children, function (c) {
                    if (nval) {
                        c.set("value", null);
                    }
                    c.set("placeHolder", nval ? i18n.gettext("NULL") : "");
                });
            });
        },

        _setValueAttr: function (value) {
            this._set("value", value);
            this.set("isNull", value === null);

            if (this.datatype == "INTEGER" || this.datatype == "BIGINT" ||
                this.datatype == "REAL") {
                this.children[0].set("value", value);
            } else if (this.datatype == "STRING") {
                this.children[0].set("value", value);
            } else if (this.datatype == "DATE") {
                var fp = function (v, p) { return number.format(v, {pattern: p}); };
                this.children[0].set("value", value === null ? null : new Date(value.year, value.month - 1, value.day));
            } else if (this.datatype == "TIME") {
                this.children[0].set("value", value === null ? null : new Date(0, 0, 0, value.hour, value.minute, value.second));
            } else if (this.datatype == "DATETIME") {
                this.children[0].set("value", value === null ? null : new Date(value.year, value.month - 1, value.day));
                this.children[1].set("value", value === null ? null : new Date(0, 0, 0, value.hour, value.minute, value.second));
            }
        },

        _getValueAttr: function () {
            if (this.isNull) { return null; }

            if (this.datatype == "DATE") {
                var v = this.children[0].get("value");
                return {
                    year: v.getFullYear(),
                    month: v.getMonth() + 1,
                    day: v.getDate() };
            } else if (this.datatype == "TIME") {
                var v = this.children[0].get("value");
                return {
                    hour: v.getHours(),
                    minute: v.getMinutes(),
                    second: v.getSeconds() };
            } else if (this.datatype == "DATETIME") {
                var d = this.children[0].get("value") || new Date();
                var t = this.children[1].get("value") || new Date();
                return {
                    year: d.getFullYear(),
                    month: d.getMonth() + 1,
                    day: d.getDate(),
                    hour: t.getHours(),
                    minute: t.getMinutes(),
                    second: t.getSeconds() };
            } else {
                return this.children[0].get("value");
            }
        }
    });

    var FieldsWidget = declare([TableContainer], {
        title: i18n.gettext("Attributes"),
        style: "padding: 16px; box-sizing: border-box; height: 100%; overflow: auto;",
        labelWidth: "20%",

        buildRendering: function () {
            this.inherited(arguments);

            this._fmap = {};

            array.forEach(this.fields, function (f) {
                this._fmap[f.keyname] = new MultiBox({
                    label: f.display_name,
                    datatype: f.datatype
                });
                this._fmap[f.keyname].placeAt(this);
            }, this);
        },

        _setValueAttr: function (data) {
            array.forEach(this.fields, function (f) {
                this._fmap[f.keyname].set("value", data[f.keyname]);
            }, this);
        },

        _getValueAttr: function () {
            var data = {};

            array.forEach(this.fields, function (f) {
                data[f.keyname] = this._fmap[f.keyname].get("value");
            }, this);

            return data;
        }
    });


    return declare([BorderContainer], {
        gutters: false,

        buildRendering: function () {
            this.inherited(arguments);

            this._tabContainer = new TabContainer({region: "center"});
            this._tabContainer.placeAt(this);

            this._lockContainer = new ContentPane({
                region: "center",
                style: "display: none; border: 1px solid silver; background-color: #fff",
                content: i18n.gettext("Please wait. Processing request...")
            }).placeAt(this);

            this._fwidget = new FieldsWidget({fields: this.fields}).placeAt(this._tabContainer);

            this._ext = {};
            for (var k in loader) {
                var widget = new loader[k]({
                    resource: this.resource,
                    feature: this.feature
                });
                widget.placeAt(this._tabContainer);
                this._ext[k] = widget;
            }

            this._btnPane = new ContentPane({
                region: "bottom",
                style: "padding-left: 0; padding-right: 0"
            });

            this._btnPane.placeAt(this);
            domClass.add(this._btnPane.domNode, "ngwButtonStrip");

            this.btn = new Button({
                label: i18n.gettext("Save"),
                onClick: lang.hitch(this, this.save)
            }).placeAt(this._btnPane);

            domClass.add(this.btn.domNode, "dijitButton--primary");
        },

        lock: function () {
            this._tabContainer.domNode.style.display = "none";
            this._lockContainer.domNode.style.display = "block";
            this.btn.set("disabled", true);
        },

        unlock: function () {
            this._lockContainer.domNode.style.display = "none";
            this._tabContainer.domNode.style.display = "block";
            this.btn.set("disabled", false);
        },

        iurl: function () {
            return route.feature_layer.feature.item({
                id: this.resource,
                fid: this.feature
            });
        },

        load: function () {
            var widget = this;

            xhr(this.iurl(), {
                method: "GET",
                handleAs: "json",
                preventCache: true,
            }).then(function (data) {
                widget._fwidget.set("value", data.fields);
                for (var k in loader) {
                    widget._ext[k].set("value", data.extensions[k]);
                };

                widget.resize();
            });
        },

        save: function () {
            this.lock();

            var data = {
                fields: this._fwidget.get("value"),
                extensions: {}
            };

            for (var k in loader) {
                data.extensions[k] = this._ext[k].get("value");
            }

            xhr(this.iurl(), {
                method: "PUT",
                handleAs: "json",
                data: json.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(
                this.load.bind(this), ErrorDialog.xhrError
            ).finally(this.unlock.bind(this));
        }
    });
});
