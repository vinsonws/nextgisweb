<%inherit file='nextgisweb:templates/base.mako' />
<%!from nextgisweb.pyramid.util import _ %>


<div class="content-box">
    <div class="table-wrapper">
        <table class="pure-table pure-table-horizontal">

            <thead><tr> 
                <th class="sort-default" style="width: 80%; text-align: inherit;">${tr(_("Kind of data"))}</th>
                <th style="width: 20em; text-align: inherit;">${tr(_("Volume"))}</th>
            </tr></thead>

            <tbody id="storage-body"></tbody>
            <tfoot id="storage-foot" style="font-size: larger;"></tfoot>
        </table>

    </div>
</div>

<h3>${tr(_("Estimate time and date"))}:</h3>
<input id="storage-timestamp" style="border: none; background: transparent"></input>


<script>
require([
    "dojo/number",
    "dojo/request/xhr",
    "ngw/route",
], function (
    number,
    xhr,
    route,
) {
    function formatBytes(bytes) {
        var units = ["B", "KB", "MB", "GB"];
        var i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length-1);
        var value = bytes / 1024**i;
        var places = i < 3 ? 0 : 2;
        return number.format(value, {places: places, locale: dojoConfig.locale}) + " " + units[i];
    }

    function formatTimestamp(timestamp) {
        if (timestamp === null) {
            return "-";
        } else {
            var date = new Date(timestamp);
            return date.toLocaleString();
        }
    }

    xhr.get(route.pyramid.storage(), {
        handleAs: "json"
    }).then(function (data) {
        var body = document.getElementById("storage-body");
        var foot = document.getElementById("storage-foot");

        function add_row (parent, kind_of_data, volume) {
            var row = parent.insertRow();
            row.insertCell().innerText = kind_of_data;
            volume_pretty = formatBytes(volume);
            row.insertCell().innerText = volume_pretty;
        }

        var total = 0;
        for (var key in data.storage) {
            var item = data.storage[key];
            add_row(body, item.display_name, item.volume);
            total += item.volume;
        }
        add_row(foot, "Total", total);

        var timestamp = document.getElementById("storage-timestamp");
        timestamp.value = formatTimestamp(data.timestamp);
    });
});
</script>
