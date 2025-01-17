<%inherit file='nextgisweb:pyramid/template/base.mako' />

<%def name="title()"><% return str(obj) %></%def>

<%def name="head()">
    <script type="text/javascript">
        var displayConfig = ${json_js(display_config)};

        require([
            "dojo/parser", "dojo/ready", "ngw-webmap/Display"
        ], function (
            parser, ready
        ) {
            ready(function() {
                parser.parse();
            });
        });
    </script>
</%def>

<%include file="nextgisweb:pyramid/template/header.mako" args="title=display_config['webmapTitle'],
    hide_resource_filter=True"/>

<div id="webmap-wrapper" class="webmap-wrapper">

    <div id="display"
         class="webmap-display"
        data-dojo-type="ngw-webmap/Display"
        data-dojo-props="config: displayConfig"
        style="width: 100%; height: 100%">
    </div>

</div>

<script type="text/javascript">
    require(["dojo/dom", "dojo/dom-style", "dojo/dom-geometry", "dojo/on", "dojo/domReady!"],
    function (dom, domStyle, domGeom, on) {
        var webmapWrapper = dom.byId("webmap-wrapper"),
            header = dom.byId("header");

        function resize() {
            var height = domGeom.getMarginBox(header, domStyle.getComputedStyle(header)).h;
            domStyle.set(webmapWrapper, "top", height + "px");
        }
        resize();
        on(window, 'resize', resize);
    });

</script>
