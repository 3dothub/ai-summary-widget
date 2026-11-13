(function() {

    data.config = JSON.parse(gs.getProperty("x_fobr_boss_om.ai_summary_panel_property", "{}"));
	data.user = gs.getUserDisplayName();

    var onHoldFlags = {};
    try {
        onHoldFlags = JSON.parse(gs.getProperty("x_fobr_agent_desk.customer_order_onhold_status_messages", "{}"));
        if (onHoldFlags && typeof onHoldFlags === "object" && !Array.isArray(onHoldFlags)) {
            for (var key in onHoldFlags) {
                if (!Object.prototype.hasOwnProperty.call(onHoldFlags, key)) continue;
                var flag = onHoldFlags[key];
                if (flag && flag.message) {
                    data.config.onHoldFlags.push({key: key, label: flag.message});
                }
            }
        }
    } catch (configError) {
        gs.error("AI Summary on-hold configuration error: " + configError.message);
    }

    data.order_id =(input && input.order_id) ||
        options.order_id ||
        $sp.getParameter("order_id") ||
        $sp.getParameter("number") ||
        "";
    data.sys_id = (input && input.sys_id) || options.sys_id || $sp.getParameter("sys_id") || "";
    data.tabUniqueId = (input && input.tabUniqueId) || options.tabUniqueId;
    data.tabContainerId = (input && input.tabContainerId) || options.tabContainerId;

    if (!input || input.action !== "summary") {
        return;
    }

    data.apiFailed = false;
    data.errorMessage = "";
    try {
        if (!data.order_id) {
            throw new Error("Missing order_id");
        }
        var request = new sn_ws.RESTMessageV2(data.config.restMessage, data.config.restMethod);
        var payload = {
            order_id: input.order_id || data.order_id,
		    force_refresh: data.config.forceRefresh
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
        data.order.configuredOnHoldReason = "";
        var scenario = data.order.scenario || {};
        for (var f = 0; f < data.config.onHoldFlags.length; f++) {
            var configuredFlag = data.config.onHoldFlags[f];
            var acceptedValues = onHoldFlags[configuredFlag.key].values;
            if (!Array.isArray(acceptedValues)) continue;
            var value = data.order[configuredFlag.key] !== undefined ? data.order[configuredFlag.key] : scenario[configuredFlag.key];
            if (value === undefined || value === null) continue;
            var normalizedValue = String(value).trim().toLowerCase();
            for (var v = 0; v < acceptedValues.length; v++) {
                if (acceptedValues[v] !== undefined && acceptedValues[v] !== null &&
                    normalizedValue === String(acceptedValues[v]).trim().toLowerCase()) {
                    data.order.configuredOnHoldReason = configuredFlag.label;
                    break;
                }
            }
            if (data.order.configuredOnHoldReason) break;
        }
    } catch (apiError) {
        gs.error("AI Summary API error: " + apiError.message);
        data.order = null;
        data.apiFailed = true;
        data.errorMessage = "We couldn't retrieve the order summary at this time. Please try again.";
    }
})();