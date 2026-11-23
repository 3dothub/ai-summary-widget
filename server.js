(function() {


    if (input && (input.aiSummaryOpenRequest || input.action === 'track_ai_summary_open')) {
        var trackingOnly = input.action !== 'summary';
        if (trackingOnly && input.aiSummaryOpenRequest) {
            Object.keys(input).forEach(function (key) {
                if (key !== 'aiSummaryOpenRequest' && key !== 'trackedDay' && key !== '__proto__' &&
                    key !== 'constructor' && key !== 'prototype') data[key] = input[key];
            });
        }
        try {
            data.trackedDay = queueAiSummaryOpen(input.aiSummaryOpenRequest || input);
        } catch (error) {
            gs.warn('BOSS OM AI Summary interaction tracking failed');
        }
        if (trackingOnly) return;
    }

    data.tabUniqueId = options && options.tabUniqueId || input && input.tabContainerId || Math.floor(Math.random() * 9000000000) + 1000000000;
    data.tabContainerId = options && options.tabContainerId || input && input.tabContainerId || Math.floor(Math.random() * 9000000000) + 1000000000;

    if (!input) initializeSummaryTracking();

    function initializeSummaryTracking() {
        try {
            var trackingOrder = findTrackingOrder(options.sys_id, options.order_id);
            if (!trackingOrder) return;
            var orderId = String(trackingOrder.getUniqueValue());
            var key = trackingTabKey(orderId, data.tabContainerId, data.tabUniqueId);
            var session = gs.getSession();
            var token = session.getClientData(key);
            if (!token) {
                token = String(gs.generateGUID());
                session.putClientData(key, token);
            }
            data.aiSummaryTracking = {
                order: orderId,
                container: String(data.tabContainerId),
                tab: String(data.tabUniqueId),
                token: String(token),
                timezone: trackingTimezone()
            };
        } catch (error) {
            gs.warn('BOSS OM AI Summary tracking could not initialize');
        }
    }

    function trackingDigest(parts) {
        return String(new GlideDigest().getSHA256Hex(JSON.stringify(parts)));
    }

    function trackingTabKey(orderId, container, tab) {
        return 'boss_ai_' + trackingDigest([String(gs.getUserID()), String(orderId), String(container), String(tab)]);
    }

    function trackingTimezone() {
        return gs.getProperty('glide.sys.default.tz', 'UTC') || 'UTC';
    }

    function trackingDay(now) {
        return String(now.getLocalDate().getValue());
    }

    function findTrackingOrder(sysId, number) {
        if (!gs.getSession().isLoggedIn() || !gs.getSession().isInteractive()) return null;
		
        var order = new GlideRecordSecure(x_fobr_agent_desk.BOSSConstants.TABLE.CUSTOMER_ORDER);
        if (/^[a-f0-9]{32}$/.test(String(sysId || ''))) return order.get(sysId) ? order : null;
        if (typeof number !== 'string' || !number || number.length > 100) return null;
        order.addQuery('external_id', number);
        order.setLimit(2);
        order.query();
        if (!order.next()) return null;
        var id = order.getUniqueValue();
        return !order.next() && order.get(id) ? order : null;
    }

    function authorizedTrackingBanField(order, field) {
        var element = order.getElement(field);
        if (!element || !element.canRead() || !order.getValue(field)) return '';
        var reference = element.getRefRecord();
        if (!reference || !reference.isValidRecord()) return '';
        var readable = new GlideRecordSecure(reference.getTableName());
        if (!readable.get(order.getValue(field)) || !readable.isValidField('sn_tmt_core_external_id')) return '';
        var identifier = readable.getElement('sn_tmt_core_external_id');
        return identifier && identifier.canRead() && identifier.getValue() ? field : '';
    }

    function queueAiSummaryOpen(request) {
        if (typeof request.token !== 'string' || !/^[a-f0-9]{32}$/.test(request.token) ||
            typeof request.container !== 'string' || !request.container || request.container.length > 200 ||
            typeof request.tab !== 'string' || !request.tab || request.tab.length > 200 ||
            typeof request.order !== 'string' || !/^[a-f0-9]{32}$/.test(request.order)) return '';

        var session = gs.getSession();
        var tabKey = trackingTabKey(request.order, request.container, request.tab);
        if (session.getClientData(tabKey) !== request.token) return '';

        var now = new GlideDateTime();
        var day = trackingDay(now);
        if (request.day && request.day !== day) return '';
        var queuedDayKey = tabKey + '_queued';
        if (session.getClientData(queuedDayKey) === day) return day;

        var order = findTrackingOrder(request.order);
        if (!order) return '';

        var banField = authorizedTrackingBanField(order, 'contact') ||
            authorizedTrackingBanField(order, 'account');
        var context = {
            user: String(gs.getUserID()),
            order: request.order,
            day: day,
            timestamp: String(now.getValue()),
            sessionHash: trackingDigest([request.token]).slice(0, 32),
            banField: banField,
            banReference: banField ? String(order.getValue(banField)) : ''
        };
        gs.eventQueue('x_fobr_boss_om.ai_summary_opened', order, JSON.stringify(context), '');
        session.putClientData(queuedDayKey, day);
        return day;
    }

    data.config = JSON.parse(gs.getProperty("x_fobr_boss_om.ai_summary_panel_property", "{}"));

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
		    force_refresh: !!(input.force_refresh || data.config.forceRefresh)
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
        data.order = parsed.ui_order || {};
        data.cacheHit = !!parsed.cache_hit;
		data.order.on_hold_reason = data.order.on_hold_reason || parsed.summary_details && parsed.summary_details.on_hold_reason;
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