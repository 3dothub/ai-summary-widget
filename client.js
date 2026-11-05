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
    c.formatTN = function(raw) {
        if (!raw) return "";
        var s = (raw + "").replace(/\D/g, "");
        if (s.length === 11 && s.charAt(0) === "1") s = s.substring(1);
        if (s.length === 10) {
            return s.substring(0, 3) + "-" + s.substring(3, 6) + "-" + s.substring(6);
        }
        return raw;
    };
    c.isChildFeatureOrFee = function(name) {
        if (!name) return true;
        var n = String(name).toLowerCase().trim();
        if (!n) return true;
        if (
            /tech install|technician|installation|install waiver|waiver|install fee|one time charge|one-time charge|activation fee|dispatch fee|setup fee|shipping|discount|promotional credit/.test(n)
        ) {
            return true;
        }
        var callingFeatures = [
            "call forwarding", "caller id", "call waiting", "3-way calling", "three-way calling",
            "speed call", "call return", "selective call", "anonymous call", "call trace",
            "distinctive ring", "hunting service", "voicemail", "voice mail", "non-published",
            "unpublished number", "unlisted number", "inside wire", "wire maintenance"
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
    // ---------------- Order Action Profiles (display ruleset) ----------------
    // One entry per order action. Each profile defines:
    //   title          Products card title. Badge text always comes from the API.
    //   cards          The tiles under the scenario title.
    //   fallBackCards  Shown instead of `cards` when any required card has no value.
    //   compare        true -> the tiles are an Existing -> Requested pair, drawn with the
    //                  arrow. Only MIGRATION, SPEED_CHANGE and TN_CHANGE use it; every
    //                  other profile shows plain info tiles.
    //
    // Card: { label, value, sub, tone, font, optional } or { label, lines, ... }
    //   value / sub    "field"          -> order.scenario.field, then order.field
    //                  "@name"          -> derived value from CARD_FIELDS
    //                  ["a", "b"]       -> first one that has a value
    //                  { text: "..." }  -> fixed text
    //                  { from: <any of the above>, format: "tn" | "list", prefix: "..." }
    //   lines          Several values in one card, e.g. speed and TN changing together:
    //                  [{ label, value, font, optional, when: "<CARD_PREDICATES name>" }]
    //                  A line is shown when its `when` passes. One line -> rendered like a
    //                  plain value under `label`; several -> each line under its own label,
    //                  all the same size, and the card label becomes `multiLabel`.
    //   labelFrom      Spec appended to the label in brackets, e.g. "Existing (Copper)"
    //   tone           from | to | disco | amber | slate (default from)
    //   font           compact | tn
    //   optional       true -> an empty value shows a dash instead of triggering fallBackCards
    //
    // Which profile is used: PROFILE_RULES first, then c.actionKey().
    var NO_CARDS = [];
    var REQUESTED_DETAIL = ["to_speed", "requested_speed", { from: ["to_tn", "requested_tn"], format: "tn" }];
    var SPEED_FROM = ["from_speed", "existing_speed"];
    var SPEED_TO = ["to_speed", "requested_speed"];
    var TN_FROM = { from: ["from_tn", "existing_tn"], format: "tn" };
    var TN_TO = { from: ["to_tn", "requested_tn"], format: "tn" };
    var CURRENT_SERVICE_CARDS = [
        {
            label: "Current Service",
            lines: [
                { label: "Speed", value: SPEED_FROM.concat(SPEED_TO), optional: true, hideEmpty: true },
                { label: "TN", value: { from: ["from_tn", "existing_tn", "to_tn", "requested_tn"], format: "tn" }, optional: true, hideEmpty: true },
            ],
            singleLineLabel: true,
            stack: true,
            font: "tn",
            tone: "to",
        },
        { label: "Service ID", value: "service_instance_id", font: "tn", tone: "to", optional: true, hideEmpty: true },
    ];

    function currentServiceProfile() {
        return { title: "Requested Services", cards: CURRENT_SERVICE_CARDS, minCards: 2 };
    }

    // Disconnects: one full-width card naming the service being removed.
    function disconnectProfile(title, label) {
        return {
            title: title,
            single: true,
            cards: [{
                label: label,
                value: { from: ["disconnected_services", "@existingProducts", "productsList"], format: "list" },
                tone: "disco",
            }],
            // Two-card version, to add later:
            // cards: [
            //     { label: "Order Action", value: "@orderAction", tone: "slate", font: "compact" },
            //     { label: "Disconnect Date", value: "dueDate", tone: "disco", font: "compact" },
            // ],
        };
    }

    function serviceStatusProfile(title, tone) {
        return {
            title: title,
            cards: [
                { label: "Requested TN", value: TN_TO, font: "tn", tone: tone, optional: true, hideEmpty: true },
                { label: "Requested Speed", value: SPEED_TO, font: "tn", tone: tone, optional: true, hideEmpty: true },
                { label: "Service ID", value: "service_instance_id", font: "tn", tone: tone, optional: true, hideEmpty: true, extra: true },
            ],
            minCards: 2,
        };
    }

    function moveProfile(title) {
        return {
            title: title,
            cards: [
                { label: "Moving From", value: "@moveFromAddress", font: "compact" },
                { label: "Moving To", value: "@moveToAddress", tone: "to", font: "compact" },
            ],
        };
    }

    // New install: what is being installed + when the technician comes
    var ORDERED_SERVICE_CARD = {
        label: "Ordered Service",
        value: REQUESTED_DETAIL.concat(["productsDisplay", "@orderAction"]),
        font: "compact",
    };

    var ACTION_PROFILES = {
        CANCELLATION: {
            title: "Requested Services",
            cards: NO_CARDS,
        },
        MIGRATION: {
            title: "Requested Services",
            compare: true,
            cards: [{
                    label: "Existing",
                    labelFrom: ["from_technology", { text: "Copper" }],
                    lines: [
                        { label: "Speed", value: SPEED_FROM, optional: true },
                        { label: "TN", value: TN_FROM, font: "tn", optional: true, when: "tnChanged" },
                    ],
                },
                {
                    label: "Requested",
                    labelFrom: ["to_technology", { text: "Fiber" }],
                    lines: [
                        { label: "Speed", value: SPEED_TO, optional: true },
                        { label: "TN", value: TN_TO, font: "tn", optional: true, when: "tnChanged" },
                    ],
                    tone: "to",
                },
            ],
        },
        SPEED_CHANGE: {
            title: "Requested Services",
            compare: true,
            cards: [{
                    label: "Existing Speed",
                    multiLabel: "Existing",
                    lines: [
                        { label: "Speed", value: SPEED_FROM, optional: true },
                        { label: "TN", value: TN_FROM, font: "tn", optional: true, when: "tnSwapped" },
                    ],
                },
                {
                    label: "Requested Speed",
                    multiLabel: "Requested",
                    lines: [
                        { label: "Speed", value: SPEED_TO, optional: true },
                        { label: "TN", value: TN_TO, font: "tn", optional: true, when: "tnSwapped" },
                    ],
                    sub: "to_technology",
                    tone: "to",
                },
            ],
        },
        SERVICE_CHANGE: {
            title: "Requested Services",
            compare: true,
            cards: [{
                    label: "Existing",
                    lines: [
                        { label: "Speed", value: SPEED_FROM, optional: true },
                        { label: "TN", value: TN_FROM, font: "tn", optional: true },
                    ],
                },
                {
                    label: "Requested",
                    lines: [
                        { label: "Speed", value: SPEED_TO, optional: true },
                        { label: "TN", value: TN_TO, font: "tn", optional: true },
                    ],
                    sub: "to_technology",
                    tone: "to",
                },
            ],
        },
        TN_CHANGE: {
            title: "Requested Services",
            compare: true,
            cards: [{
                    label: "Existing TN",
                    multiLabel: "Existing",
                    lines: [
                        { label: "TN", value: TN_FROM, font: "tn", optional: true },
                        { label: "Speed", value: SPEED_FROM, optional: true, when: "speedChanged" },
                    ],
                },
                {
                    label: "Requested TN",
                    multiLabel: "Requested",
                    lines: [
                        { label: "TN", value: TN_TO, font: "tn", optional: true },
                        { label: "Speed", value: SPEED_TO, optional: true, when: "speedChanged" },
                    ],
                    tone: "to",
                },
            ],
        },
        NEW_INSTALL: {
            title: "Requested Services",
            cards: [
                ORDERED_SERVICE_CARD,
                {
                    label: "Installation Appointment",
                    value: "appointmentSlot",
                    sub: { from: "dispatchStatus", prefix: "Dispatch: " },
                    tone: "amber",
                    font: "compact",
                },
            ],
            // No technician visit (has_tech_install false) -> no appointment
            fallBackCards: [
                ORDERED_SERVICE_CARD,
                { label: "Service ID", value: "service_instance_id", font: "tn", tone: "to", optional: true },
            ],
        },
        // Added / changed products are listed in the Products section
        ADD_SERVICES: currentServiceProfile(),
        PRODUCT_CHANGE: currentServiceProfile(),
        PRODUCT_ADD: currentServiceProfile(),
        PRODUCT_REMOVE: currentServiceProfile(),
        BNOW_TO_STDBULK: currentServiceProfile(),
        DISCONNECT: disconnectProfile("Services to Disconnect", "Service to Disconnect"),
        PORT_OUT: disconnectProfile("Services to Port Out", "Service to Port Out"),
        SUSPEND: serviceStatusProfile("Suspended Services", "disco"),
        PAUSE: serviceStatusProfile("Paused Services", "to"),
        RESTORE: serviceStatusProfile("Restored Services", "to"),
        RESUME: serviceStatusProfile("Resumed Services", "to"),
        MOVE: moveProfile("Services at New Address"),
        FROM: moveProfile("Services Moving Out"),
        TO: moveProfile("Services at New Address"),
        BILLING_ONLY: serviceStatusProfile("Services on Account", "to"),
        RECORD_CHANGE: {
            title: "Requested Services",
            compare: true,
            cards: function(o) {
                var changes = changedRecords(o);
                function side(label, key, tone) {
                    return {
                        label: changes.length === 1 ? label + " " + changes[0].label : label,
                        multiLabel: label,
                        stack: true,
                        lines: changes.map(function(ch) {
                            return { label: ch.label, value: { text: ch[key] || "" }, font: "compact", optional: true };
                        }),
                        tone: tone,
                    };
                }
                return [side("Existing", "existing_value", "from"), side("Requested", "requested_value", "to")];
            },
        },
        DEFAULT: {
            title: "Requested Services",
            cards: NO_CARDS,
        },
    };
    c.actionKey = function() {
        var o = c.data.order || {};
        var sub = (o.actionSubtype || "").toUpperCase();
        if (sub && ACTION_PROFILES[sub]) return sub;
        if (c.isDisconnect()) return "DISCONNECT";
        return ACTION_PROFILES[o.scenarioType] ? o.scenarioType : "DEFAULT";
    };
    c.actionProfile = function() {
        return ACTION_PROFILES[c.actionKey()] || ACTION_PROFILES.DEFAULT;
    };
    // ---------------- Badge helpers ----------------
    function statusTone(text) {
        var s = (text || "").toLowerCase();
        if (/requested|billing update/.test(s)) return "info";
        if (/suspend|paus/.test(s)) return "warning";
        if (/disconnect|ported out|moved out|fallout|error|fail|critical/.test(s)) return "danger";
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
            var key = String(p).trim();
            if (!key || c.isInstallOrFee(key) || seen[key]) return false;
            seen[key] = true;
            return true;
        });
    }
    c.existingProducts = function() {
        var g = groups();
        if (g) return (g.existing && g.existing.items) || [];
        var sc = (c.data.order && c.data.order.scenario) || {};
        return uniqueProducts(
            sc.existing_products && sc.existing_products.length ?
            sc.existing_products :
            sc.disconnected_services,
        );
    };
    c.requestedProducts = function() {
        var g = groups();
        if (g) return (g.requested && g.requested.items) || [];
        var sc = (c.data.order && c.data.order.scenario) || {};
        return uniqueProducts(
            sc.requested_products && sc.requested_products.length ?
            sc.requested_products :
            sc.added_services,
        );
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
        return c.actionProfile().title;
    };
    c.existingTitle = function() {
        return c.actionKey() === "FROM" ? c.actionProfile().title : "Existing Services";
    };
    c.requestedBadge = function() {
        return groupBadge((groups() || {}).requested);
    };
    c.existingBadge = function() {
        return groupBadge((groups() || {}).existing);
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
        return !!o && o.scenarioType === "MOVE" && !c.isDisconnect();
    };

    c.moveFromAddress = function() {
        var o = c.data.order || {};
        var sc = o.scenario || {};
        return sc.from_address || (c.actionKey() === "FROM" ? o.serviceAddress : "") || "";
    };
    c.moveToAddress = function() {
        var o = c.data.order || {};
        var sc = o.scenario || {};
        return sc.to_address || (c.actionKey() === "TO" ? o.serviceAddress : "") || "";
    };
    c.moveDateLabel = function() {
        var key = c.actionKey();
        if (key === "FROM") return "Move-Out Date";
        if (key === "TO") return "Move-In Date";
        return "Effective Date";
    };
    // ---------------- Comparison cards (rule engine) ----------------
    // Card content lives in ACTION_PROFILES; this section only resolves it.
    //
    // PROFILE_RULES: checked top to bottom, first match wins. `when` lists
    // CARD_PREDICATES names that must all pass ("!name" negates).
    // No match -> the order's own action profile (c.actionKey()).
    var PROFILE_RULES = [
        { profile: "MIGRATION", when: ["isMigration"] },
        { profile: "SERVICE_CHANGE", when: ["isServiceChange"] },
        { profile: "SPEED_CHANGE", when: ["isSpeedChange"] },
        { profile: "TN_CHANGE", when: ["isTnChange", "!isDisconnect"] },
        { profile: "RECORD_CHANGE", when: ["hasRecordChanges"] },
        { profile: "CANCELLATION", when: ["isCanceled"] },
        // Disconnects are checked before New Install: the 622 payload can set
        // has_tech_install on any order type.
        { profile: "PORT_OUT", when: ["isPortOut"] },
        { profile: "DISCONNECT", when: ["isDisconnect"] },
        { profile: "PRODUCT_CHANGE", when: ["isDisconnectOrRemoval", "isChangeOrder"] },
        { profile: "DISCONNECT", when: ["isDisconnectOrRemoval"] },
        { profile: "NEW_INSTALL", when: ["isNewInstall"] },
        { profile: "ADD_SERVICES", when: ["hasAddedServices", "!isAccountAction"] },
    ];

    function nonEmpty(list) {
        return (list || []).filter(function(s) {
            return s !== null && s !== undefined && String(s).trim() !== "";
        });
    }

    var CARD_PREDICATES = {
        isCanceled: function() {
            return c.isCanceled();
        },
        isDisconnect: function() {
            return c.isDisconnect();
        },
        isMigration: function(o, sc) {
            return o.scenarioType === "MIGRATION" || sc.is_migration === true;
        },
        isServiceChange: function(o, sc) {
            return o.scenarioType === "SERVICE_CHANGE" || sc.is_speed_and_tn_change === true;
        },
        isSpeedChange: function(o, sc) {
            return o.scenarioType === "SPEED_CHANGE" || sc.is_speed_change === true;
        },
        hasRecordChanges: function(o) {
            return changedRecords(o).length > 0;
        },
        isTnChange: function(o, sc) {
            return o.scenarioType === "TN_CHANGE" || sc.is_tn_change === true;
        },
        isNewInstall: function(o, sc) {
            return o.scenarioType === "NEW_INSTALL" ||
                (sc.has_tech_install === true && c.existingProducts().length === 0 &&
                    !CARD_PREDICATES.isAccountAction());
        },
        // Secondary lines: only when both sides are known and actually differ
        speedChanged: function(o, sc) {
            var a = speedToMbps(sc.from_speed || sc.existing_speed);
            var b = speedToMbps(sc.to_speed || sc.requested_speed);
            return a !== null && b !== null && a !== b;
        },
        tnSwapped: function(o, sc) {
            var a = digitsOnly(sc.from_tn || sc.existing_tn);
            var b = digitsOnly(sc.to_tn || sc.requested_tn);
            return !!a && !!b && a !== b;
        },
        tnChanged: function(o, sc) {
            var a = digitsOnly(sc.from_tn || sc.existing_tn);
            var b = digitsOnly(sc.to_tn || sc.requested_tn);
            return (!!a || !!b) && a !== b;
        },
        isPortOut: function() {
            return c.isDisconnect() && c.actionKey() === "PORT_OUT";
        },
        isDisconnectOrRemoval: function(o, sc) {
            return c.isDisconnect() || nonEmpty(sc.disconnected_services).length > 0;
        },
        isChangeOrder: function(o, sc) {
            return /\b(change|modify)\b/i.test(o.orderAction || sc.order_action || "");
        },
        isAccountAction: function() {
            return ["SUSPEND", "PAUSE", "RESTORE", "RESUME", "BILLING_ONLY"].indexOf(c.actionKey()) > -1;
        },
        hasAddedServices: function(o, sc) {
            return nonEmpty(sc.added_services).length > 0;
        },
    };

    // "@name" values used in card specs
    var CARD_FIELDS = {
        orderAction: function() {
            return c.orderActionValue();
        },
        existingProducts: function() {
            return c.existingProducts();
        },
        requestedProducts: function() {
            return c.requestedProducts();
        },
        cancellationReason: function() {
            return c.getCancellationDetail("cancellation_reason");
        },
        canceledOn: function() {
            return c.getCancellationDetail("canceled_on");
        },
        moveFromAddress: function() {
            return c.moveFromAddress();
        },
        moveToAddress: function() {
            return c.moveToAddress();
        },
    };

    var CARD_FORMATS = {
        tn: function(v) {
            return { value: c.formatTN(v) };
        },
        // ["A","B","C","D"] -> "A, B" with "+2 more" as the sub line
        list: function(v) {
            var items = nonEmpty(angular.isArray(v) ? v : [v]);
            return {
                value: items.slice(0, 2).join(", "),
                more: items.length > 2 ? "+" + (items.length - 2) + " more" : "",
            };
        },
    };

    function hasValue(v) {
        if (angular.isArray(v)) return nonEmpty(v).length > 0;
        return v !== null && v !== undefined && String(v).trim() !== "";
    }

    function readField(name, o, sc) {
        if (name.charAt(0) === "@") {
            var getter = CARD_FIELDS[name.substring(1)];
            return getter ? getter(o, sc) : "";
        }
        return hasValue(sc[name]) ? sc[name] : o[name];
    }

    // Spec -> { value, more }; value is "" when nothing resolves
    function resolveSpec(spec, o, sc) {
        if (!spec) return { value: "" };
        if (angular.isString(spec)) {
            var raw = readField(spec, o, sc);
            return { value: hasValue(raw) ? raw : "" };
        }
        if (angular.isArray(spec)) {
            for (var i = 0; i < spec.length; i++) {
                var r = resolveSpec(spec[i], o, sc);
                if (hasValue(r.value)) return r;
            }
            return { value: "" };
        }
        if (spec.text) return { value: spec.text };
        var res = resolveSpec(spec.from, o, sc);
        if (hasValue(res.value) && spec.format && CARD_FORMATS[spec.format]) {
            res = CARD_FORMATS[spec.format](res.value);
        }
        if (hasValue(res.value) && spec.prefix) res.value = spec.prefix + res.value;
        return res;
    }

    // "940M" -> 940, "1 Gig" / "1G" -> 1000, "200 Mbps" -> 200
    function speedToMbps(raw) {
        var m = String(raw || "").match(/(\d+(?:\.\d+)?)\s*(g|gig|gbps|m|mb|mbps|k|kbps)?/i);
        if (!m) return null;
        var n = parseFloat(m[1]);
        var unit = (m[2] || "m").toLowerCase();
        if (unit.charAt(0) === "g") return n * 1000;
        if (unit.charAt(0) === "k") return n / 1000;
        return n;
    }

    // "1 (910) 242-3786" -> "9102423786"
    function digitsOnly(raw) {
        var s = String(raw || "").replace(/\D/g, "");
        return s.length === 11 && s.charAt(0) === "1" ? s.substring(1) : s;
    }

    function toText(v) {
        v = angular.isArray(v) ? v.join(", ") : v;
        return hasValue(v) ? String(v) : "";
    }

    function predicatePasses(name, o, sc) {
        var fn = CARD_PREDICATES[name];
        return !!(fn && fn(o, sc));
    }

    // card.lines -> visible lines [{ label, value, font, missing }]
    function buildLines(card, o, sc) {
        var lines = card.lines
            .filter(function(line) {
                return !line.when || predicatePasses(line.when, o, sc);
            })
            .map(function(line) {
                var value = toText(resolveSpec(line.value, o, sc).value);
                return {
                    label: line.label,
                    value: value || "—",
                    font: line.font || card.font || "",
                    missing: !value && !line.optional,
                    empty: !value,
                    hideEmpty: line.hideEmpty === true,
                };
            });
        var anyFilled = lines.some(function(l) {
            return !l.empty;
        });
        return anyFilled ? lines.filter(function(l) {
            return !(l.empty && l.hideEmpty);
        }) : lines;
    }

    // Card spec -> tile model { label, value, lines, sub, tone, font, missing }
    function buildTile(card, o, sc) {
        var tile = {
            label: card.label,
            sub: toText(resolveSpec(card.sub, o, sc).value),
            tone: card.tone || "from",
            font: card.font || "",
            lines: null,
            stack: card.stack === true,
        };
        if (card.lines) {
            var lines = buildLines(card, o, sc);
            tile.missing = lines.some(function(l) {
                return l.missing;
            });
            if (lines.length > 1) {
                tile.label = card.multiLabel || card.label;
                tile.lines = lines;
            } else if (lines.length === 1) {
                if (card.singleLineLabel) tile.label = lines[0].label;
                tile.value = lines[0].value;
                tile.font = lines[0].font;
            } else {
                tile.value = "—";
            }
        } else {
            var main = resolveSpec(card.value, o, sc);
            var value = toText(main.value);
            tile.value = value || "—";
            tile.sub = tile.sub || main.more || "";
            tile.missing = !value && !card.optional;
        }
        var suffix = card.labelFrom ? toText(resolveSpec(card.labelFrom, o, sc).value) : "";
        if (suffix) tile.label += " (" + suffix + ")";
        return tile;
    }

    function ruleMatches(rule, o, sc) {
        return rule.when.every(function(name) {
            var negate = name.charAt(0) === "!";
            var fn = CARD_PREDICATES[negate ? name.substring(1) : name];
            var result = !!(fn && fn(o, sc));
            return negate ? !result : result;
        });
    }

    function resolveProfileKey(o, sc) {
        for (var i = 0; i < PROFILE_RULES.length; i++) {
            if (ruleMatches(PROFILE_RULES[i], o, sc)) return PROFILE_RULES[i].profile;
        }
        return c.actionKey();
    }

    function changedRecords(o) {
        return (o.recordChanges || []).filter(function(ch) {
            return ch && ch.changed !== false && hasValue(ch.label) &&
                (hasValue(ch.existing_value) || hasValue(ch.requested_value));
        });
    }

    function buildCards(o) {
        if (!o) return null;
        var sc = o.scenario || {};
        var key = resolveProfileKey(o, sc);
        var profile = ACTION_PROFILES[key] || ACTION_PROFILES.DEFAULT;
        var build = function(cards) {
            var all = (cards || []).map(function(card, i) {
                var tile = buildTile(card, o, sc);
                return { card: card, tile: tile, index: i, empty: card.hideEmpty && tile.value === "—" };
            });
            var main = all.filter(function(b) {
                return !b.empty && !b.card.extra;
            }).length;
            var keep = all.filter(function(b) {
                return !b.empty && (!b.card.extra || main < 2);
            });
            var padding = all.filter(function(b) {
                return keep.indexOf(b) === -1;
            }).sort(function(a, b) {
                return (b.card.extra ? 1 : 0) - (a.card.extra ? 1 : 0);
            });
            while (keep.length < (profile.minCards || 0) && padding.length) {
                keep.push(padding.shift());
            }
            return keep.sort(function(a, b) {
                return a.index - b.index;
            }).map(function(b) {
                return b.tile;
            });
        };
        var tiles = build(angular.isFunction(profile.cards) ? profile.cards(o, sc) : profile.cards);
        var usedFallback = false;
        var anyMissing = tiles.some(function(t) {
            return t.missing;
        });
        if (anyMissing && profile.fallBackCards) {
            tiles = build(profile.fallBackCards);
            usedFallback = true;
        }
        if (!tiles.length) return null;
        return {
            caseId: key + (usedFallback ? ":fallback" : ""),
            tiles: tiles,
            // Arrow only for a real Existing -> Requested pair, never for fallback info tiles
            arrow: profile.compare === true && !usedFallback && tiles.length === 2,
            // One full-width card (e.g. Service to Disconnect)
            single: profile.single === true && tiles.length === 1,
        };
    }

    // Built once per server response, not on every digest
    c.cards = null;
    $scope.$watch(
        function() {
            return c.data.order;
        },
        function(order) {
            c.cards = buildCards(order);
        },
    );
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
        var st = (o.u_state || o.state || "").toLowerCase();
        if (st.indexOf("hold") > -1 || hs === "risk") {
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
    c.getOnHoldReason = function() {
        var order = c.data.order;
        if (!order) return "";
        return order.onHoldReason || (order.scenario && order.scenario.on_hold_reason) || "";
    };
    c.isOnHold = function() {
        var order = c.data.order;
        if (!order) return false;
        var st = (order.u_state || "").toLowerCase();
        var hs = (order.healthStatus || "").toLowerCase();
        return st.indexOf("hold") > -1 || hs === "risk" || !!c.getOnHoldReason();
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
        casePage: 0,
        falloutPage: 0,
    };

    function fetchSummary(force) {
        if (c.state.loading) return;
        if (c.state.loaded && !force) return;
        c.data.action = "summary";
        c.state.loading = true;
        c.state.casePage = 0;
        c.state.falloutPage = 0;
        c.server.update().then(
            function() {
                c.state.loading = false;
                c.state.loaded = !!c.data.order;
            },
            function() {
                c.state.loading = false;
            },
        );
    }

    c.orderActionValue = function() {
        var o = c.data.order || {};
        var sc = o.scenario || {};
        return o.orderAction || sc.order_action || sc.u_order_type || o.scenarioTitle || "-";
    };

    // Skeleton shows while a request is in flight (incl. refresh) or before the first response
    c.isLoadingView = function() {
        return c.state.loading || (!c.data.order && !c.data.errorMessage);
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