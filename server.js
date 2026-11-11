(function() {
    var record = options.data || {};

    var pick = function(source, keys) {
        for (var i = 0; i < keys.length; i++) {
            var value = source[keys[i]];
            if (value !== undefined && value !== null && String(value).trim() !== "") {
                return String(value).trim();
            }
        }
        return "";
    };

    data.order_id =(input && input.order_id) ||
        options.order_id ||
        $sp.getParameter("order_id") ||
        $sp.getParameter("number") ||
        pick(record, ["Order ID", "order_id", "u_order_id", "Number", "number", "order_number", "u_order_number", "External Order ID", "external_id", "u_external_id"]);
    data.sys_id = (input && input.sys_id) || options.sys_id || $sp.getParameter("sys_id") || pick(record, ["sys_id", "sysId", "u_sys_id"]);
    data.tabUniqueId = options.tabUniqueId;
    data.tabContainerId = options.tabContainerId;

    if (!input || input.action !== "summary") {
        return;
    }

    data.apiFailed = false;
    data.errorMessage = "";
    try {
        var request = new sn_ws.RESTMessageV2("x_fobr_boss_om.BOSS OM API", "GET - AI Summary");
        var payload = {
            order_id: input.order_id || data.order_id
        };
        var sysId = input.sys_id || data.sys_id;
        if (sysId) {
            payload._resolved_sys_id = sysId;
        }

        request.setHttpMethod("POST");
        request.setStringParameterNoEscape("request", JSON.stringify(payload));
        request.setRequestBody(JSON.stringify(payload));
        request.setRequestHeader("Content-Type", "application/json");

        var response = request.execute();
        var status = response.getStatusCode();
        if (status < 200 || status >= 300) {
            throw new Error("AI Summary API HTTP status: " + status);
        }

        var parsed = JSON.parse(response.getBody());
        if (!parsed || !parsed.ui_order) {
            throw new Error("AI Summary API returned no ui_order");
        }
        data.order = parsed.ui_order;
    } catch (apiError) {
        gs.error("AI Summary API error: " + apiError.message);
        data.order = null;
        data.apiFailed = true;
        data.errorMessage = "We couldn't retrieve the order summary at this time. Please try again.";
    }
})();