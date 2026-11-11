api.controller = function($scope, spUtil, $rootScope, $sce) {
    var c = this;
    // ---------------- General UI Icons ----------------
    var ICON_PATHS = {
        sparkles: '<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/><path d="M5 15l.6 1.4L7 17l-1.4.6L5 19l-.6-1.4L3 17l1.4-.6z"/>',
        refresh: '<path d="M21 12a9 9 0 0 1-15.5 6.2"/><path d="M3 12a9 9 0 0 1 15.5-6.2"/><path d="M18.5 2v4h-4"/><path d="M5.5 22v-4h4"/>',
        "alert-circle": '<circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12.5"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
        "check-circle": '<circle cx="12" cy="12" r="9"/><path d="M8.3 12.5l2.5 2.5 5-5.2"/>',
        clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>',
        "alert-triangle": '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9.5" x2="12" y2="13.5"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
        info: '<circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
        check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
        user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
        cancel: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
        truck: '<rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle>',
        box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>',
        default: '<circle cx="12" cy="12" r="9"/>',
    };
    var iconCache = {};
    c.icon = function(name) {
        var key = ICON_PATHS[name] ? name : "default";
        if (!iconCache[key]) {
            iconCache[key] = $sce.trustAsHtml(
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
                'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                ICON_PATHS[key] +
                "</svg>",
            );
        }
        return iconCache[key];
    };
    // ---------------- Product SVGs ----------------
    var PRODUCT_SVGS = {
        voice: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
        wifi: '<path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>',
        tv: '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',
        wireless: '<path d="M12 20h.01M18 10a7 7 0 0 1 0 10M6 10a7 7 0 0 0 0 10M21 7a11 11 0 0 1 0 16M3 7a11 11 0 0 0 0 16M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>',
        default: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    };
    var prodSvgCache = {};

    c.productIcon = function(key) {
        if (!prodSvgCache[key]) {
            prodSvgCache[key] = $sce.trustAsHtml(
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
                'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                (PRODUCT_SVGS[key] || PRODUCT_SVGS["default"]) +
                "</svg>",
            );
        }
        return prodSvgCache[key];
    };
    var INSTALL_TYPE_SVGS = {
        // Isometric 3D solid package (matching the design screenshot)
        self_install: '<path d="M3 7l8.445-4.645a1 1 0 0 1 .91 0L21 7l-9 5-9-5zm-1 3.208V17a1 1 0 0 0 .555.894L11 22.18V12l-9-5-1 3.208zM13 22.18l8.445-4.286A1 1 0 0 0 22 17v-6.792l-9 5v6.972z"/>',
        // Angled solid technician tool
        tech_install: '<path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>'
    };
    var installSvgCache = {};
    c.installTypeIcon = function(type) {
        var t = String(type || "").toLowerCase();
        var key = t.indexOf("tech") > -1 ? "tech_install" : "self_install";
        if (!installSvgCache[key]) {
            installSvgCache[key] = $sce.trustAsHtml(
                '<svg viewBox="0 0 24 24" fill="#1d4ed8" aria-hidden="true">' +
                INSTALL_TYPE_SVGS[key] +
                "</svg>"
            );
        }
        return installSvgCache[key];
    };
    c.formatDate = function(val) {
        if (!val) return "";
        var s = String(val).trim();
        var m = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
        if (m) {
            var yyyy = m[1];
            var mm = m[2].length === 1 ? "0" + m[2] : m[2];
            var dd = m[3].length === 1 ? "0" + m[3] : m[3];
            return mm + "/" + dd + "/" + yyyy;
        }
        var m2 = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
        if (m2) {
            var mm2 = m2[1].length === 1 ? "0" + m2[1] : m2[1];
            var dd2 = m2[2].length === 1 ? "0" + m2[2] : m2[2];
            return mm2 + "/" + dd2 + "/" + m2[3];
        }
        return s;
    };

    c.actionKey = function() {
        return (c.data.order && c.data.order.actionKey) || "DEFAULT";
    };
    // ---------------- Scenario helpers ----------------
    c.isMove = function() {
        var o = c.data.order;
        if (!o) return false;
        var scType = (o.scenarioType || (o.scenario && o.scenario.scenario_type) || "").toUpperCase();
        var act = (o.orderAction || (o.scenario && o.scenario.order_action) || "").toLowerCase();
        return scType === "MOVE" || act === "move" || /move/i.test(act);
    };

    c.moveFromAddress = function() {
        var o = c.data.order || {};
        var sc = o.scenario || {};
        return o.fromServiceAddress || o.from_service_address || sc.from_service_address || sc.from_address || (c.actionKey() === "FROM" ? o.serviceAddress : "") || "";
    };
    c.moveToAddress = function() {
        var o = c.data.order || {};
        var sc = o.scenario || {};
        return o.toServiceAddress || o.to_service_address || sc.to_service_address || sc.to_address || (c.actionKey() === "TO" ? o.serviceAddress : "") || o.serviceAddress || "";
    };
    // ---------------- Order state ----------------
    c.isCompleted = function() {
        var o = c.data.order;
        if (!o) return false;
        var st = (o.u_state || o.state || o.order_status || o.orderStatus || "").toLowerCase();
        return o.phase === "success" || /\b(completed?|closed)\b/.test(st);
    };

    c.isPastDue = function() {
        var o = c.data.order;
        if (!o) return false;
        var st = (o.u_state || o.state || o.order_status || o.orderStatus || "").toLowerCase();
        var hs = (o.healthStatus || "").toLowerCase();
        if (/complete|close|cancel|void|reject/.test(st + " " + hs)) return false;
        if (o.isPastDue !== undefined) return !!o.isPastDue;
        var dueStr = o.dueDate || o.due_date;
        if (!dueStr) return false;
        var formatted = c.formatDate(dueStr);
        var parts = formatted.split("/");
        if (parts.length === 3) {
            var dueObj = new Date(parseInt(parts[2], 10), parseInt(parts[0], 10) - 1, parseInt(parts[1], 10));
            var today = new Date();
            today.setHours(0, 0, 0, 0);
            return dueObj < today;
        }
        return false;
    };

    c.healthBadge = function() {
        var o = c.data.order;
        if (!o) return {
            text: "In Progress",
            tone: "info"
        };
        var hs = (o.healthStatus || "").toLowerCase();
        var st = (o.u_state || o.state || o.order_status || o.orderStatus || "").toLowerCase();
        if (/cancel|void/.test(hs + " " + st)) {
            return {
                text: o.u_state || o.state || "Canceled",
                tone: "canceled"
            };
        }
        if (c.isPastDue() || st.indexOf("hold") > -1 || hs === "risk" || c.isOnHold()) {
            return {
                text: "Risk",
                tone: "warning"
            };
        }
        if (c.isCompleted() || hs === "good") return {
            text: "Good",
            tone: "success"
        };
        if (o.phase === "error" || hs === "critical" || o.falloutRecordCount > 0) {
            return {
                text: "Critical",
                tone: "danger"
            };
        }
        if (/block|hold|risk|jeopardy|warn/.test(hs)) {
            return {
                text: o.healthStatus,
                tone: "warning"
            };
        }
        return {
            text: "In Progress",
            tone: "info"
        };
    };
    // ---------------- Next Action ----------------
    c.responsibleParty = function(act) {
        return (
            (act && act.responsible_party) ||
            (c.data.order && c.data.order.actionOwner) ||
            "Unassigned"
        );
    };
    c.isActionCompleted = function(act) {
        if (!act) return false;
        if (act.action_required === true) return false;
        if (act.action_required === false) return true;
        return c.isCompleted();
    };

    function isHighPriority(act) {
        var pr = ((act && act.priority) || "").toLowerCase();
        return pr === "high" || pr === "critical";
    }
    // ---- Presentation (next_action.presentation: { icon_type, color_theme }) ----
    var THEMES = ["danger", "warning", "info", "success", "neutral"];
    var THEME_ALIAS = {
        error: "danger",
        critical: "danger",
        red: "danger",
        warn: "warning",
        amber: "warning",
        orange: "warning",
        yellow: "warning",
        blue: "info",
        primary: "info",
        green: "success",
        ok: "success",
        good: "success",
        gray: "neutral",
        grey: "neutral",
        default: "neutral",
        muted: "neutral",
    };
    var ICON_ALIAS = {
        alert: "alert-triangle",
        warning: "alert-triangle",
        warn: "alert-triangle",
        danger: "alert-triangle",
        error: "alert-circle",
        critical: "alert-triangle",
        clock: "clock",
        wait: "clock",
        waiting: "clock",
        pending: "clock",
        time: "clock",
        schedule: "clock",
        hourglass: "clock",
        check: "check",
        success: "check",
        complete: "check",
        completed: "check",
        done: "check",
        tick: "check",
        info: "info",
        information: "info",
        monitor: "info",
        user: "user",
        person: "user",
        manual: "user",
        owner: "user",
        sync: "refresh",
        refresh: "refresh",
        progress: "refresh",
        processing: "refresh",
    };

    function presentation(act) {
        return (act && act.presentation) || {};
    }
    // Colour theme: API first, otherwise derived from the action state
    c.actionTheme = function(act) {
        var t = String(presentation(act).color_theme || "").toLowerCase();
        t = THEME_ALIAS[t] || t;
        if (THEMES.indexOf(t) > -1) return t;
        if (c.isCompleted()) return "success";
        if (act && act.action_required === true) return isHighPriority(act) ? "danger" : "warning";
        return "info";
    };
    c.actionIcon = function(act) {
        var t = String(presentation(act).icon_type || "").toLowerCase();
        var name = ICON_ALIAS[t] || (ICON_PATHS[t] ? t : "");
        if (!name) {
            var theme = c.actionTheme(act);
            name =
                theme === "success" ? "check" :
                theme === "danger" ? "alert-triangle" :
                theme === "warning" ? "alert-triangle" :
                "clock";
        }
        return c.icon(name);
    };
    // Pill text = next_action.display_status from the API (e.g. "Awaiting Installation").
    // Colour = presentation.color_theme.
    c.actionPill = function(act) {
        var shown = ((act && act.display_status) || "").trim();
        var cls = "directive-pill-" + c.actionTheme(act);
        if (shown) return {
            text: shown,
            cls: cls
        };
        if (c.isCompleted()) return {
            text: "Completed · Closed",
            cls: cls
        };
        if (c.isActionCompleted(act)) return {
            text: "Completed",
            cls: cls
        };
        var pr = ((act && act.priority) || "").toLowerCase();
        pr = pr ? pr.charAt(0).toUpperCase() + pr.slice(1) : "";
        return {
            text: "Action required" + (pr ? " · " + pr : ""),
            cls: cls
        };
    };
    // Status chip text for actions that need no manual work
    c.nextActionHeading = function() {
        if (c.isCompleted()) return "Order Fulfillment Status";
        var o = c.data.order || {};
        var acts = o.criticalNextActions || [];
        var anyRequired = acts.some(function(a) {
            return a && a.action_required;
        });
        if (!anyRequired) return "Next action";
        var critical =
            o.phase === "error" ||
            (o.healthStatus || "").toLowerCase() === "critical" ||
            acts.some(isHighPriority);
        return critical ? "Critical next actions" : "Recommended next action";
    };
    // ---------------- Summary narrative ----------------
    function escapeHtml(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    c.formattedSummary = function() {
        var s = (c.data.order && c.data.order.summary) || "";
        if (!s) return "";
        if (s.indexOf("<em") > -1 || s.indexOf("<i") > -1) {
            return $sce.trustAsHtml(s);
        }
        var match = s.match(
            /^(.*?\b(?:failed with an error|failed with error|with an error|with error|due to an error|due to error|error message|error code|error)\s*:\s*)("[^"]+"|'[^']+'|.+)$/i,
        );
        if (match) {
            return $sce.trustAsHtml(
                escapeHtml(match[1]) + '<em class="aisw-error-text">' + escapeHtml(match[2]) + "</em>",
            );
        }
        return $sce.trustAsHtml(escapeHtml(s));
    };
    // ---------------- Panel state & data ----------------
    var ON_HOLD_FLAGS = [
        { key: "u_bsw_delayed", label: "BSW Delayed" },
        { key: "u_ows_hold", label: "OWS(Other Working Service)" },
        { key: "u_vmdu", label: "VMDU" },
        { key: "u_lnp_port_fallout", label: "LNP Porting Failure" },
        { key: "u_pre_provisioning_fallout", label: "Pre-Provisioning Fallout" },
        { key: "u_bsw_delay_predicted", label: "BSW Delay Predicted" }
    ];
    c.getOnHoldReason = function() {
        var order = c.data.order;
        if (!order) return "";
        var sc = order.scenario || {};
        for (var i = 0; i < ON_HOLD_FLAGS.length; i++) {
            var k = ON_HOLD_FLAGS[i].key;
            var val = order[k] !== undefined ? order[k] : sc[k];
            if (val === true || val === 1 || String(val).toLowerCase() === "true" || String(val).toLowerCase() === "yes" || String(val) === "1") {
                return ON_HOLD_FLAGS[i].label;
            }
        }
        return order.onHoldReason || order.on_hold_reason || sc.onHoldReason || sc.on_hold_reason || order.u_reason_for_jeopardy || sc.u_reason_for_jeopardy || "";
    };
    c.isOnHold = function() {
        var order = c.data.order;
        if (!order) return false;
        var st = (order.u_state || order.state || order.order_status || order.orderStatus || "").toLowerCase();
        return st.indexOf("hold") > -1 || !!c.getOnHoldReason();
    };
    c.isCanceled = function() {
        var order = c.data.order;
        if (!order) return false;
        var st = (order.u_state || "").toLowerCase();
        var hs = (order.healthStatus || "").toLowerCase();
        return (
            st.indexOf("cancel") > -1 ||
            st.indexOf("void") > -1 ||
            st.indexOf("reject") > -1 ||
            hs.indexOf("cancel") > -1 ||
            c.hasCancellationDetails()
        );
    };
    c.hasCancellationDetails = function() {
        var order = c.data.order;
        if (!order) return false;
        var cd = order.cancellationDetails || (order.scenario && order.scenario.cancellation_details);
        if (!cd) {
            return !!(order.canceledOn || order.canceledBy || order.cancellationReason || order.channel);
        }
        return !!(
            (cd.canceled_on && String(cd.canceled_on).trim()) ||
            (cd.canceled_by && String(cd.canceled_by).trim()) ||
            (cd.cancellation_reason && String(cd.cancellation_reason).trim()) ||
            (cd.channel && String(cd.channel).trim()) ||
            (cd.u_sales_channel && String(cd.u_sales_channel).trim()) ||
            (order.canceledOn && String(order.canceledOn).trim()) ||
            (order.canceledBy && String(order.canceledBy).trim()) ||
            (order.cancellationReason && String(order.cancellationReason).trim()) ||
            (order.channel && String(order.channel).trim())
        );
    };
    c.getCancellationDetail = function(key) {
        var order = c.data.order;
        if (!order) return "";
        var cd = order.cancellationDetails || (order.scenario && order.scenario.cancellation_details) || {};
        if (key === "canceled_on" || key === "canceledOn") {
            return cd.canceled_on || cd.canceledOn || order.canceledOn || "";
        }
        if (key === "canceled_by" || key === "canceledBy") {
            return cd.canceled_by || cd.canceledBy || order.canceledBy || "";
        }
        if (key === "cancellation_reason" || key === "cancellationReason") {
            return cd.cancellation_reason || cd.cancellationReason || order.cancellationReason || "";
        }
        if (key === "channel" || key === "sales_channel" || key === "u_sales_channel") {
            return cd.channel || cd.sales_channel || cd.u_sales_channel || order.channel || "";
        }
        return cd[key] || "";
    };
    // ---------------- Brightspeed Voice+ Helpers ----------------
    c.isVoicePlus = function() {
        var o = c.data.order;
        if (!o) return false;
        var st = (o.serviceType || o.service_type || "").toLowerCase();
        return !!(o.isVoicePlus || (o.scenario && o.scenario.is_voice_plus) || st.indexOf("voice+") > -1 || st.indexOf("brightspeedvoice+") > -1);
    };

    c.getVoicePlus = function() {
        var o = c.data.order || {};
        return o.voicePlusDetails || (o.scenario && o.scenario.voice_plus_details) || {};
    };

    c.isVoicePlusInstall = function() {
        return c.isVoicePlus() && !c.isVoicePlusChange() && !c.isVoicePlusDisconnect();
    };

    c.isVoicePlusDisconnect = function() {
        if (!c.isVoicePlus()) return false;
        var o = c.data.order || {};
        var act = (o.actionSubtype || o.orderAction || (o.scenario && o.scenario.order_action) || "").toLowerCase();
        var scType = (o.scenarioType || (o.scenario && o.scenario.scenario_type) || "").toUpperCase();
        return scType === "DISCONNECT" || act.indexOf("disco") > -1 || act.indexOf("cancel") > -1;
    };

    c.isVoicePlusChange = function() {
        if (!c.isVoicePlus()) return false;
        var o = c.data.order || {};
        var act = (o.actionSubtype || o.orderAction || (o.scenario && o.scenario.order_action) || "").toLowerCase();
        var scType = (o.scenarioType || (o.scenario && o.scenario.scenario_type) || "").toUpperCase();
        return scType === "VOICE_PLUS_CHANGE" || act.indexOf("change") > -1 || act.indexOf("modify") > -1;
    };

    c.getShipmentStatus = function() {
        var o = c.data.order || {};
        var vp = c.getVoicePlus();
        return o.shipmentStatus || vp.shipment_status || "";
    };

    c.getCarrier = function() {
        var o = c.data.order || {};
        var vp = c.getVoicePlus();
        return o.carrier || vp.carrier || "";
    };

    c.getTrackingNumber = function() {
        var o = c.data.order || {};
        var vp = c.getVoicePlus();
        return o.trackingNumber || vp.tracking_number || "";
    };

    c.getTrackingUrl = function() {
        var o = c.data.order || {};
        var vp = c.getVoicePlus();
        if (o.trackingUrl) return o.trackingUrl;
        if (vp.tracking_url) return vp.tracking_url;
        var tn = c.getTrackingNumber();
        if (!tn) return "";
        var carr = (c.getCarrier() || "").toLowerCase();
        if (carr.indexOf("ups") > -1) {
            return "https://www.ups.com/track?tracknum=" + encodeURIComponent(tn);
        }
        return "https://www.fedex.com/fedextrack/?tracknumbers=" + encodeURIComponent(tn);
    };

    c.hasShipment = function() {
        return !!(c.getShipmentStatus() || c.getTrackingNumber());
    };

    c.toggleVoicePlusProducts = function() {
        c.state.showAllVoicePlusProducts = !c.state.showAllVoicePlusProducts;
    };

    c.getVoicePlusProducts = function() {
        var o = c.data.order || {};
        var vp = c.getVoicePlus();
        var list = o.productsList || vp.clean_products || [];
        if (c.state.showAllVoicePlusProducts) {
            return list;
        }
        return list.slice(0, 2);
    };

    c.getTotalVoicePlusProductCount = function() {
        var o = c.data.order || {};
        var vp = c.getVoicePlus();
        var list = o.productsList || vp.clean_products || [];
        return list.length;
    };

    c.state = {
        collapsed: true,
        loading: false,
        loaded: false,
        apiFailed: false,
        errorMessage: "",
        casePage: 0,
        falloutPage: 0,
        showAllVoicePlusProducts: false,
    };

    function fetchSummary(force) {
        if (c.state.loading) return;
        if (c.state.loaded && !force) return;

        c.data.action = "summary";

        c.state.loading = true;
        c.state.apiFailed = false;
        c.state.errorMessage = "";
        c.state.casePage = 0;
        c.state.falloutPage = 0;

        c.server.update().then(
            function() {
                c.state.loading = false;

                // API returned an error or no usable order data
                if (c.data.apiFailed ||
                    c.data.errorMessage ||
                    !c.data.order) {

                    showSummaryError(
                        c.data.errorMessage ||
                        "We couldn't retrieve the order summary at this time."
                    );
                    return;
                }

                // Successful response
                c.state.loaded = true;
                c.state.apiFailed = false;
                c.state.errorMessage = "";
            },
            function() {
                showSummaryError(
                    "Unable to connect to the AI Summary service. Please try again."
                );
            }
        );
    }

    function showSummaryError(message) {
        c.state.loading = false;
        c.state.loaded = false;
        c.state.apiFailed = true;
        c.state.errorMessage = message;

        // Keep the panel visible
        c.state.collapsed = false;

        // Do not display outdated summary cards
        c.data.order = null;
    }


    // Skeleton shows while a request is in flight (incl. refresh) or before the first response
    c.isLoadingView = function() {
        return c.state.loading;
    };

    c.togglePanel = function() {
        c.state.collapsed = !c.state.collapsed;
        if (!c.state.collapsed) {
            fetchSummary(false);
        }
    };
    c.refreshSummary = function() {
        fetchSummary(true);
    };

    c.retrySummary = function() {
        fetchSummary(true);
    };


    function openRecord(table, sys_id, title) {
        if (!sys_id) return;
        $scope.$emit("data_table.click" + c.data.tabContainerId, {
            table: table,
            sys_id: sys_id,
            title: title,
            tabUniqueId: c.data.tabUniqueId,
        });
    }
    c.openCase = function(caseItem) {
        if (!caseItem || !caseItem.case_sys_id) return;
        if (caseItem.isFallout) {
            openRecord(
                "sn_fallout_mgmt_fallout",
                caseItem.case_sys_id,
                caseItem.case_number || caseItem.task_name,
            );
        } else {
            openRecord("sn_customerservice_case", caseItem.case_sys_id, caseItem.case_number);
        }
    };

};