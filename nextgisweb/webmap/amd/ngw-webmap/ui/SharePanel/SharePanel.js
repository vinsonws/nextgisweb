define([
    "dojo/_base/declare",
    "@nextgisweb/pyramid/i18n!",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "ngw-pyramid/dynamic-panel/DynamicPanel",
    "dijit/layout/BorderContainer",
    "dijit/form/Button",
    "dijit/form/TextBox",
    "dijit/form/CheckBox",
    "dijit/form/SimpleTextarea",
    "dojo/_base/lang",
    "dojo/promise/all",
    "ngw-webmap/Permalink",
    "dojox/dtl/_base",
    "dojox/dtl/Context",
    "@nextgisweb/pyramid/api",
    "@nextgisweb/pyramid/settings!",
    "@nextgisweb/webmap/icon",
    "dojo/text!./SharePanel.hbs",

    //templates
    "xstyle/css!./SharePanel.css",
], function (
    declare,
    i18n,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    DynamicPanel,
    BorderContainer,
    Button,
    TextBox,
    CheckBox,
    SimpleTextarea,
    lang,
    all,
    Permalink,
    dtl,
    dtlContext,
    api,
    settings,
    icon,
    template
) {
    return declare(
        [
            DynamicPanel,
            BorderContainer,
            _TemplatedMixin,
            _WidgetsInTemplateMixin,
        ],
        {
            _iframeTemplate: new dtl.Template(
                '<iframe src="{{ iframeSrc }}" frameborder="0" ' +
                    'style="overflow:hidden;height:{{ height }}px;width:{{ width }}px" height="{{ height }}" width="{{ width }}"></iframe>'
            ),
            constructor: function (options) {
                declare.safeMixin(this, options);

                var widget = this;

                this.contentWidget = new (declare(
                    [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin],
                    {
                        templateString: i18n.renderTemplate(template),
                        region: "top",
                        gutters: false,
                        previewMapUrl: displayConfig.testEmbeddedMapUrl,
                        url: window.location.href,
                        assetUrl: ngwConfig.assetUrl,
                    }
                ))();
            },
            postCreate: function () {
                this.inherited(arguments);

                if (!this.socialNetworks) {
                    this.contentWidget.socialNetworks.style.display = "none";
                }

                this.contentWidget.mapWidthControl.on(
                    "change",
                    lang.hitch(this, function () {
                        this.setEmbedCode();
                    })
                );
                this.contentWidget.mapHeightControl.on(
                    "change",
                    lang.hitch(this, function () {
                        this.setEmbedCode();
                    })
                );
                this.contentWidget.linkCheckbox.on(
                    "change",
                    lang.hitch(this, function () {
                        this.setEmbedCode();
                    })
                );
                this.contentWidget.eventsCheckbox.on(
                    "change",
                    lang.hitch(this, function () {
                        this.setEmbedCode();
                    })
                );
                this.contentWidget.previewMapButton.on(
                    "click",
                    lang.hitch(this, function () {
                        this.contentWidget.previewMapForm.submit();
                    })
                );
                
                if (settings["check_origin"]) {
                    this.contentWidget.checkOriginNote.innerHTML =  i18n.gettext("<a>CORS</a> must be enabled for the target origin when embedding a web map on a different domain.")
                        .replace("<a>", '<a href="' + api.routeURL('pyramid.control_panel.cors') + '" target="_blank">')
                }

            },
            show: function () {
                this.inherited(arguments);
                this.setPermalinkUrl();
                this.setEmbedCode();
            },
            setEmbedCode: function () {
                all({
                    visibleItems: this.display.getVisibleItems(),
                }).then(
                    lang.hitch(this, function (visibleItemsResults) {
                        var iframeSrc = Permalink.getPermalink(
                            this.display,
                            visibleItemsResults.visibleItems,
                            {
                                urlWithoutParams: displayConfig.tinyDisplayUrl,
                                additionalParams: {
                                    linkMainMap: this.contentWidget.linkCheckbox.get(
                                        "checked"
                                    ),
                                    events: this.contentWidget.eventsCheckbox.get(
                                        "checked"
                                    ),
                                },
                            }
                        );

                        var iframeTemplateContext = {
                            iframeSrc: iframeSrc,
                            width: this.contentWidget.mapWidthControl.get(
                                "value"
                            ),
                            height: this.contentWidget.mapHeightControl.get(
                                "value"
                            ),
                        };

                        this.embedCode = this._iframeTemplate.render(
                            new dtlContext(iframeTemplateContext)
                        );
                        this.contentWidget.codeControl.set(
                            "value",
                            this.embedCode
                        );
                        this.contentWidget.previewMapCodeControl.value = encodeURI(
                            this.embedCode
                        );
                    }),
                    function (error) {
                        console.log(error);
                    }
                );
            },
            setPermalinkUrl: function () {
                all({
                    visibleItems: this.display.getVisibleItems(),
                }).then(
                    lang.hitch(this, function (visibleItemsResults) {
                        this.permalinkUrl = Permalink.getPermalink(
                            this.display,
                            visibleItemsResults.visibleItems
                        );
                        this.contentWidget.permalinkControl.set(
                            "value",
                            decodeURIComponent(this.permalinkUrl)
                        );
                    }),
                    function (error) {
                        console.log(error);
                    }
                );
            },
        }
    );
});
