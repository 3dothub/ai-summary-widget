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
        fiber: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3m-3.5-6.5l-2.1 2.1m-8.8 8.8l-2.1 2.1m0-13l2.1 2.1m8.8 8.8l2.1 2.1"/>',
        voice: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
        wifi: '<path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>',
        tv: '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',
        dsl: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="7" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="17" cy="12" r="1.5"/><path d="M7 18v2m10-2v2"/>',
        wireless: '<path d="M12 20h.01M18 10a7 7 0 0 1 0 10M6 10a7 7 0 0 0 0 10M21 7a11 11 0 0 1 0 16M3 7a11 11 0 0 0 0 16M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>',
        default: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    };
    var prodSvgCache = {};

    function getProdKey(name) {
        var n = (name || "").toString().toLowerCase();
        if (/voice|phone|line|pots|metro-cat|residence|voip/.test(n)) return "voice";
        if (/fiber|gpon|xgs|gig|500m|2g|1g/.test(n)) return "wifi";
        if (/wifi|wi-fi|router|modem|gateway/.test(n)) return "wifi";
        if (/\btv\b|video|stream/.test(n)) return "tv";
        if (/wireless|cellular|lte|5g|mobile/.test(n)) return "wireless";
        if (/dsl|copper|broadband|internet|high speed/.test(n)) return "wifi";
        return "default";
    }
    c.productBadgeClass = function(name) {
        return "badge-icon-" + getProdKey(name);
    };
    c.productIcon = function(name) {
        var key = getProdKey(name);
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

    c.isChildFeatureOrFee = function(name) {
        if (!name) return true;
        var n = String(name).toLowerCase().trim();
        if (!n) return true;
        if (
            /tech install|technician|installation|install waiver|waiver|install fee|one time charge|one-time charge|activation fee|dispatch fee|setup fee|shipping|discount|promotional credit|facility relocation|subscriber line|access recovery|charge|surcharge|fee|rebate|recovery|request technician/.test(n)
        ) {
            return true;
        }
        var callingFeatures = [
            "call forwarding", "caller id", "call waiting", "3-way calling", "three-way calling", "3 way calling",
            "speed call", "call return", "selective call", "anonymous call", "call trace", "call reject",
            "distinctive ring", "hunting service", "voicemail", "voice mail", "non-published",
            "unpublished number", "unlisted number", "inside wire", "wire maintenance", "long distance",
            "data calls", "blocking", "features pack"
        ];
        for (var i = 0; i < callingFeatures.length; i++) {
            if (n.indexOf(callingFeatures[i]) > -1) return true;
        }
        if (/^(?:up\s*to\s*)?\d+(?:\.\d+)?\s*(?:m|mbps|g|gig|gbps|k|kbps)?(?:[\/_]\s*\d+(?:\.\d+)?\s*(?:m|mbps|k|kbps)?)?$/i.test(n)) {
            return true;
        }
        if (
            n.indexOf("wifi pod") > -1 ||
            n.indexOf("wi-fi pod") > -1 ||
            n.indexOf("extender") > -1 ||
            n.indexOf("battery backup") > -1 ||
            n.indexOf("power supply") > -1 ||
            n.indexOf("optical network terminal") > -1 ||
            n.indexOf("modem lease") > -1 ||
            n.indexOf("modem purchase") > -1
        ) {
            return true;
        }
        return false;
    };
    c.isInstallOrFee = function(name) {
        return c.isChildFeatureOrFee(name);
    };
    c.actionKey = function() {
        return (c.data.order && c.data.order.actionKey) || "DEFAULT";
    };
    // ---------------- Badge helpers ----------------
    function statusTone(text) {
        var s = (text || "").toLowerCase();
        if (/requested|billing update/.test(s)) return "info";
        if (/suspend|paus/.test(s)) return "warning";
        if (/disconnect|ported out|moved out|fallout|error|fail|critical|cease/.test(s)) return "danger";
        if (/cancel|void|reject|existing/.test(s)) return "canceled";
        if (/hold|block|pend|jeopardy|wait|risk/.test(s)) return "warning";
        if (/restor|resum|active|complet|closed|fulfil|updated|good/.test(s)) return "success";
        return "info";
    }
    // Badge text comes ONLY from the API: display_status → status.
    // Nothing from the API → no badge.
    function groupBadge(group) {
        var g = group || {};
        var text =
            String(g.display_status || "").trim() ||
            String(g.status || "").trim();
        return {
            text: text,
            tone: text ? statusTone(text) : ""
        };
    }

    function groups() {
        return (c.data.order && c.data.order.productGroups) || null;
    }
    // ---------------- Products ----------------
    function uniqueProducts(list) {
        var seen = {};
        return (list || []).filter(function(p) {
            if (p === null || p === undefined) return false;
            var name = typeof p === "object" ? (p.name || p.product_name || p.productName || "") : String(p);
            var key = String(name).trim();
            if (!key || c.isChildFeatureOrFee(key) || seen[key]) return false;
            seen[key] = true;
            return true;
        }).map(function(p) {
            return typeof p === "object" ? (p.name || p.product_name || p.productName || "") : p;
        });
    }
    c.existingProducts = function() {
        var g = groups();
        var rawList = (g && g.existing && g.existing.items) || [];
        if (!rawList.length) {
            var sc = (c.data.order && c.data.order.scenario) || {};
            rawList = sc.existing_products && sc.existing_products.length ?
                sc.existing_products :
                sc.disconnected_services;
        }
        return uniqueProducts(rawList);
    };
    c.requestedProducts = function() {
        var g = groups();
        var rawList = (g && g.requested && g.requested.items) || [];
        if (!rawList.length) {
            var sc = (c.data.order && c.data.order.scenario) || {};
            rawList = sc.requested_products && sc.requested_products.length ?
                sc.requested_products :
                sc.added_services;
        }
        return uniqueProducts(rawList);
    };
    c.otherOrderProducts = function() {
        // API product groups present → show only those, never the generic list
        if (groups()) return [];
        var o = c.data.order || {};
        var sc = o.scenario || {};
        return uniqueProducts(
            sc.order_products && sc.order_products.length ? sc.order_products : o.productsList,
        );
    };
    c.hasProducts = function() {
        return (
            c.existingProducts().length > 0 ||
            c.requestedProducts().length > 0 ||
            c.otherOrderProducts().length > 0
        );
    };
    c.requestedTitle = function() {
        return (c.data.order && c.data.order.requestedTitle) || "Requested Services";
    };
    c.existingTitle = function() {
        return (c.data.order && c.data.order.existingTitle) || "Existing Services";
    };
    c.requestedBadge = function() {
        var b = groupBadge((groups() || {}).requested);
        if (!b.text && c.isMove()) return { text: 'Installing', tone: 'info' };
        return b;
    };
    c.existingBadge = function() {
        if (c.isMove() && c.isCanceled()) {
            return { text: "Active", tone: "success" };
        }
        var b = groupBadge((groups() || {}).existing);
        if (!b.text && c.isMove()) return { text: "Active", tone: "success" };
        return b;
    };
    // ---------------- Scenario helpers ----------------
    c.isDisconnect = function() {
        var o = c.data.order;
        if (!o) return false;
        var scType = (o.scenarioType || (o.scenario && o.scenario.scenario_type) || "").toUpperCase();
        if (scType === "DISCONNECT") return true;
        return (o.actionSubtype || "").toUpperCase() === "PORT_OUT";
    };
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
        var st = (o.u_state || o.state || "").toLowerCase();
        return o.phase === "success" || /\b(completed?|closed)\b/.test(st);
    };
    c.healthBadge = function() {
        var o = c.data.order;
        if (!o) return {
            text: "In Progress",
            tone: "info"
        };
        var hs = (o.healthStatus || "").toLowerCase();
        var st = (o.u_state || o.state || o.order_status || o.orderStatus || "").toLowerCase();
        if (st.indexOf("hold") > -1 || hs === "risk" || c.isOnHold()) {
            return {
                text: "Risk",
                tone: "warning"
            };
        }
        if (/cancel|void/.test(hs + " " + st)) {
            return {
                text: o.u_state || o.state || "Canceled",
                tone: "canceled"
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
    c.actionStatusText = function(act) {
        if (act && act.status_label) return act.status_label;
        return c.isCompleted() ? "All fulfillment tasks closed complete" : "No manual action needed";
    };
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
    c.actionDirectiveIcon = function(act) {
        return c.actionIcon(act);
    };
    c.actionDirectiveKicker = function(act) {
        if (c.isCompleted()) return "Order fulfillment completed";
        if (c.isActionCompleted(act)) return "Operational execution directive";
        var o = c.data.order || {};
        if (o.phase === "error" || o.falloutRecordCount > 0) {
            return "Critical fallout recovery directive";
        }
        if (act && act.action_type === "resolve_dependency") {
            return "Dependency resolution directive";
        }
        return "Operational action directive";
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
            c.healthBadge().tone === "canceled" ||
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
    c.state = {
        collapsed: true,
        loading: false,
        loaded: false,
        apiFailed: false,
        errorMessage: "",
        casePage: 0,
        falloutPage: 0,
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

    function clampPage(page, length) {
        if (length <= 0) return 0;
        if (page < 0) return 0;
        if (page > length - 1) return length - 1;
        return page;
    }
    c.currentFalloutTask = function() {
        var records = (c.data.order && c.data.order.falloutRecords) || [];
        return records[c.state.falloutPage] || {};
    };
    c.prevFalloutTask = function() {
        var length = ((c.data.order && c.data.order.falloutRecords) || []).length;
        c.state.falloutPage = clampPage(c.state.falloutPage - 1, length);
    };
    c.nextFalloutTask = function() {
        var length = ((c.data.order && c.data.order.falloutRecords) || []).length;
        c.state.falloutPage = clampPage(c.state.falloutPage + 1, length);
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
    c.openCurrentFalloutTask = function() {
        var record = c.currentFalloutTask();
        openRecord("sn_fallout_mgmt_fallout", record.fallout_sys_id, record.task_name);
    };

};