(function () {
  data.order_id =
    options.order_id ||
    $sp.getParameter("order_id") ||
    $sp.getParameter("number") ||
    "";
  data.sys_id = options.sys_id || $sp.getParameter("sys_id") || "";
  data.orderData = options.data;
  data.falloutTasks = options.falloutTasks;
  data.tabUniqueId = options.tabUniqueId;
  data.tabContainerId = options.tabContainerId;
  data.cases = options.cases;
  data.totalPrice = options.totalPrice;
  data.products = options.products;
  // 622 payload is independent of Customer Order field mapping.
  var PAYLOAD_FIELDS = ["u_request_payload", "request_payload", "u_622_payload", "u_payload", "payload"];
  var PHASE = {
    SUCCESS: "success",
    ERROR: "error",
    PENDING: "pending",
  };
  var GENERIC_ORDER_TYPES = [
    "change",
    "order change",
        "change order",
        "change_order",
        "modify",
        "standard",
        "standard order",
        "general",
        "general change",
        "general change order",
        "order_change",
        "new",
        "order",
        "normal",
        "regular",
      ];
  function resolvePhase(stateText) {
    var s = (stateText || "").toString().toLowerCase();
    if (s.indexOf("fallout") > -1 || s.indexOf("error") > -1)
      return PHASE.ERROR;
    if (s.indexOf("complete") > -1 || s.indexOf("closed") > -1)
      return PHASE.SUCCESS;
    return PHASE.PENDING;
  }
  function normalizeArray(value) {
    if (Array.isArray(value)) return value;
    return value ? [value] : [];
  }
  function normalizeKey(key) {
    return String(key)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }
  function isInstallOrFee(name) {
    if (!name) return true;
    var n = String(name).toLowerCase().trim();
    if (!n) return true;
    if (
      n.indexOf("tech install") > -1 ||
      n.indexOf("technician") > -1 ||
      n.indexOf("installation") > -1 ||
      n.indexOf("install waiver") > -1 ||
      n.indexOf("waiver") > -1 ||
      n.indexOf("install fee") > -1 ||
      n.indexOf("one time charge") > -1 ||
      n.indexOf("one-time charge") > -1 ||
      n.indexOf("activation fee") > -1 ||
      n.indexOf("dispatch fee") > -1 ||
      n.indexOf("setup fee") > -1 ||
      n.indexOf("shipping") > -1 ||
      n.indexOf("discount") > -1 ||
      n.indexOf("promotional credit") > -1
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
  }
  function toBool(v) {
    if (v === true || v === false) return v;
    var s = String(v == null ? "" : v).trim().toLowerCase();
    return s === "true" || s === "yes" || s === "1";
  }
  // next_action can arrive as a string or as
  // { instruction, action_required, action_type, responsible_party, priority, reason }
  function normalizeNextAction(raw, fallbackOwner) {
    if (!raw) return null;
    if (typeof raw === "string") raw = { instruction: raw };
    if (typeof raw !== "object") return null;
    var instruction = String(raw.instruction || raw.text || raw.description || "").trim();
    if (!instruction) return null;
    return {
      instruction: instruction,
      action_required:
        raw.action_required === undefined || raw.action_required === null
          ? null
          : toBool(raw.action_required),
      action_type: raw.action_type || "",
      responsible_party: String(raw.responsible_party || fallbackOwner || "").trim(),
      priority: String(raw.priority || "").toLowerCase(),
      reason: raw.reason || "",
      // Display fields, shown exactly as the API sends them
      display_status: String(raw.display_status || "").trim(),
      title: String(raw.title || "").trim(),
      status_label: String(raw.status_label || "").trim(),
      // Visual hints from the API: { icon_type, color_theme }
      presentation: {
        icon_type: String((raw.presentation && raw.presentation.icon_type) || "").trim().toLowerCase(),
        color_theme: String((raw.presentation && raw.presentation.color_theme) || "").trim().toLowerCase(),
      },
    };
  }
  // Accepts strings or { name } objects; dedupes and drops install/fee lines
  function productNames(list) {
    var seen = {};
    var out = [];
    normalizeArray(list).forEach(function (it) {
      var name =
        typeof it === "string"
          ? it
          : it && (it.name || it.product_name || it.productName);
      name = String(name || "").trim();
      if (!name || seen[name] || isInstallOrFee(name)) return;
      seen[name] = true;
      out.push(name);
    });
    return out;
  }
  // Exact order action → subtype (FROM / TO / PAUSE / RESUME / PORT_OUT)
  function resolveActionSubtype(orderAction, apiSubtype) {
    var api = String(apiSubtype || "").trim().toUpperCase();
    if (api) return api;
    var a = String(orderAction || "").trim().toLowerCase();
    if (a === "from") return "FROM";
    if (a === "to") return "TO";
    if (a === "pause" || a.indexOf("pause") > -1) return "PAUSE";
    if (a === "resume" || a.indexOf("resume") > -1) return "RESUME";
    if (a.indexOf("port out") > -1 || a.indexOf("port_out") > -1) return "PORT_OUT";
    return "";
  }
  // Product groups for the "Products in Order" cards.
  // Items, status and display_status come ONLY from
  // products.existing_services / products.requested_services in the API response.
  // Returns null when the response has no products block (client falls back).
  function buildProductGroups(ai, actionSubtype) {
    var prod = ai && ai.products;
    if (!prod || typeof prod !== "object" ||
        (!prod.existing_services && !prod.requested_services)) {
      return null;
    }
    var group = function (g) {
      g = g || {};
      var names = productNames(g.items);
      return {
        status: g.status ? String(g.status) : "",
        display_status: g.display_status ? String(g.display_status) : "",
        items: names,
        count: names.length,
      };
    };
    var existing = group(prod.existing_services);
    var requested = group(prod.requested_services);
    // Move "From": products are leaving the old address → existing card
    if (actionSubtype === "FROM" && existing.items.length === 0 && requested.items.length > 0) {
      existing = requested;
      requested = { status: "", display_status: "", items: [], count: 0 };
    }
    return {
      existing: existing,
      requested: requested,
      unclassified: group(prod.unclassified_services),
    };
  }
  function formatOrderTypeNomenclature(raw) {
    if (!raw) return "";
    var val = String(raw).trim();
    if (!val) return "";
    val = val.replace(/[\-_]to[\-_]/gi, " to ");
    val = val.replace(/->/g, " to ");
    val = val.replace(/_+/g, " ");
    var acronyms = {
      ban: "BAN",
      bnow: "BNOW",
      stdbulk: "STDBULK",
      ctx: "CTX",
      pots: "POTS",
      rcf: "RCF",
      tn: "TN",
      voip: "VOIP",
      sip: "SIP",
      pri: "PRI",
      ont: "ONT",
      olt: "OLT",
      fdh: "FDH",
      bvoip: "BVOIP",
      ip: "IP",
      dsl: "DSL",
      dia: "DIA",
      evc: "EVC",
      uni: "UNI",
    };
    var connectors = {
      to: 1,
      and: 1,
      or: 1,
      of: 1,
      for: 1,
      in: 1,
      on: 1,
      at: 1,
      by: 1,
      with: 1,
    };
    var words = val.split(/\s+/);
    var formatted = [];
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      var clean = w.replace(/[^A-Za-z0-9]/g, "").toLowerCase();
      if (acronyms[clean]) {
        formatted.push(acronyms[clean]);
      } else if (connectors[clean] && i > 0) {
        formatted.push(clean);
      } else if (
        w.length <= 4 &&
        w === w.toUpperCase() &&
        /^[A-Z0-9]+$/.test(w)
      ) {
        formatted.push(w.toUpperCase());
      } else {
        formatted.push(w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      }
    }
    return formatted.join(" ");
  }
  // Shared field lookup. Preserve original precedence:
  // Customer Order -> root order -> remaining nested objects.
  function findField(orderData, names) {
    if (!orderData || typeof orderData !== "object") return "";
    var wanted = {};
    for (var n = 0; n < names.length; n++) {
      wanted[normalizeKey(names[n])] = true;
    }
    var sections = [];
    if (orderData["Customer Order"] &&
        typeof orderData["Customer Order"] === "object" &&
        !Array.isArray(orderData["Customer Order"])) {
      sections.push(orderData["Customer Order"]);
    }
    if (!Array.isArray(orderData)) sections.push(orderData);
    for (var sectionName in orderData) {
      if (!Object.prototype.hasOwnProperty.call(orderData, sectionName) ||
          sectionName === "Customer Order") continue;
      var section = orderData[sectionName];
      if (section && typeof section === "object" && !Array.isArray(section)) {
        sections.push(section);
      }
    }
    for (var i = 0; i < sections.length; i++) {
      var current = sections[i];
      for (var key in current) {
        if (!Object.prototype.hasOwnProperty.call(current, key) ||
            !wanted[normalizeKey(key)]) continue;
        var value = current[key];
        if (value !== null && value !== undefined &&
            typeof value !== "object" && String(value).trim() !== "") {
          return String(value).trim();
        }
      }
    }
    return "";
  }
  function inspect622Payload(rawPayload) {
    var res = {
      hasPayload: false,
      hasItems: false,
      hasNonDiscoVoice: false,
      hasNonDiscoData: false,
      hasTechInstall: false,
      nonDiscoSpeed: "",
      nonDiscoTn: "",
      nonDiscoProducts: [],
      discoProducts: [],
    };
    if (!rawPayload) return res;
    var obj = null;
    if (typeof rawPayload === "object") {
      obj = rawPayload.value ? rawPayload.value : rawPayload;
    } else if (typeof rawPayload === "string") {
      var trimmed = rawPayload.trim();
      if (trimmed) {
        try {
          obj = JSON.parse(trimmed);
        } catch (eJson) {}
      }
    }
    if (!obj || typeof obj !== "object") return res;
    res.hasPayload = true;
    var items =
      obj.productOrderItem ||
      (obj.order && obj.order.productOrderItem) ||
      (obj.payload && obj.payload.productOrderItem) ||
      [];
    if (!Array.isArray(items)) items = [];
    var voiceKws = [
      "voice",
      "telephone",
      "phone",
      "pots",
      "dial tone",
      "calling",
      "voip",
      "bvoip",
      "sip",
      "directory",
      "residence ln",
      "1 pty",
      "metro-cat",
    ];
    var dataKws = [
      "fiber",
      "internet",
      "broadband",
      "hsi",
      "high speed",
      "data",
      "gig",
      "mbps",
      "gbps",
      "kbps",
      "gpon",
      "xgs",
      "dsl",
      "adsl",
      "vdsl",
      "speed",
    ];
    var walkItems = function (list, parentAct) {
      for (var i = 0; i < list.length; i++) {
        var itm = list[i];
        if (!itm || typeof itm !== "object") continue;
        res.hasItems = true;
        var act = String(
          itm.action || itm.orderItemAction || itm.itemAction || parentAct || ""
        )
          .trim()
          .toLowerCase();
        var isDisco =
          act === "delete" ||
          act === "remove" ||
          act === "disconnect" ||
          act === "cease" ||
          act === "cancel" ||
          act.indexOf("disconnect") > -1 ||
          act.indexOf("delete") > -1 ||
          act.indexOf("remove") > -1 ||
          act.indexOf("cease") > -1;
        var prod = itm.product || {};
        var off = itm.productOffering || prod.productOffering || {};
        var spec = prod.productSpecification || itm.productSpecification || {};
        var pName = String(
          prod.name ||
            off.name ||
            spec.name ||
            itm.name ||
            itm.productName ||
            off.id ||
            spec.id ||
            ""
        ).trim();
        var pType = String(
          prod.productType ||
            prod["@type"] ||
            spec.productType ||
            off.category ||
            itm.productType ||
            ""
        ).trim();
        var combined = (pName + " " + pType).toLowerCase();
        var chars = prod.productCharacteristic || itm.productCharacteristic || [];
        var itemChars = {};
        if (Array.isArray(chars)) {
          for (var c = 0; c < chars.length; c++) {
            var ch = chars[c];
            if (ch && ch.name && ch.value !== undefined && ch.value !== null) {
              var ck = normalizeKey(ch.name);
              var cv = String(ch.value).trim();
              if (ck && cv) {
                itemChars[ck] = cv;
                combined += " " + String(ch.name).toLowerCase() + " " + cv.toLowerCase();
              }
            }
          }
        }
        if (isDisco) {
          if (pName) res.discoProducts.push(pName);
        } else {
          if (pName) res.nonDiscoProducts.push(pName);
          var pLower = pName.toLowerCase();
          if (
            (pLower.indexOf("tech install") > -1 ||
              pLower.indexOf("technician install") > -1 ||
              pLower.indexOf("tech installation") > -1 ||
              pLower.indexOf("professional install") > -1 ||
              pLower.indexOf("techinstall") > -1) &&
            pLower.indexOf("waiver") === -1
          ) {
            res.hasTechInstall = true;
          }
          var instType =
            itemChars.installationtype ||
            itemChars.installtype ||
            itemChars.deliverymethod ||
            itemChars.installoption ||
            "";
          if (
            instType &&
            (instType.toLowerCase().indexOf("tech") > -1 ||
              instType.toLowerCase().indexOf("pro") > -1)
          ) {
            res.hasTechInstall = true;
          }
          var isVoice = false;
          for (var vk = 0; vk < voiceKws.length; vk++) {
            if (combined.indexOf(voiceKws[vk]) > -1) {
              isVoice = true;
              break;
            }
          }
          if (
            itemChars.tn ||
            itemChars.telephonenumber ||
            itemChars.assignedtn ||
            itemChars.phonenumber ||
            itemChars.requestedtn ||
            itemChars.newtn ||
            itemChars.portedtn ||
            itemChars.directorynumber
          ) {
            isVoice = true;
          }
          var isData = false;
          for (var dk = 0; dk < dataKws.length; dk++) {
            if (combined.indexOf(dataKws[dk]) > -1) {
              isData = true;
              break;
            }
          }
          if (
            itemChars.speed ||
            itemChars.downloadspeed ||
            itemChars.bandwidth ||
            itemChars.requestedspeed ||
            itemChars.newspeed ||
            itemChars.datarate ||
            itemChars.tier
          ) {
            isData = true;
          }
          if (isVoice) {
            res.hasNonDiscoVoice = true;
            var candTn =
              itemChars.assignedtn ||
              itemChars.telephonenumber ||
              itemChars.tn ||
              itemChars.phonenumber ||
              itemChars.requestedtn ||
              itemChars.newtn ||
              itemChars.portedtn ||
              itemChars.directorynumber ||
              "";
            if (candTn && !res.nonDiscoTn) {
              res.nonDiscoTn = candTn;
            }
          }
          if (
            isData &&
            pLower.indexOf("waiver") === -1 &&
            pLower.indexOf("tech install") === -1
          ) {
            res.hasNonDiscoData = true;
            var candSpd =
              itemChars.speed ||
              itemChars.requestedspeed ||
              itemChars.newspeed ||
              itemChars.downloadspeed ||
              itemChars.bandwidth ||
              itemChars.datarate ||
              itemChars.tier ||
              "";
            if (candSpd && !res.nonDiscoSpeed) {
              res.nonDiscoSpeed = candSpd;
            }
          }
        }
        var sub = itm.productOrderItem || prod.productOrderItem || [];
        if (Array.isArray(sub) && sub.length > 0) {
          walkItems(sub, act);
        }
      }
    };
    walkItems(items, "");
    return res;
  }
  function isCaseClosedOrResolved(c) {
    if (!c) return true;
    var s = (c.state || c.status || c.stage || c.case_state || "")
      .toString()
      .toLowerCase();
    if (
      s === "3" ||
      s === "4" ||
      s === "6" ||
      s === "7" ||
      s.indexOf("closed") > -1 ||
      s.indexOf("resolve") > -1 ||
      s.indexOf("cancel") > -1 ||
      s.indexOf("complete") > -1
    ) {
      return true;
    }
    if (c.active === false || c.active === "false" || c.is_active === false) {
      return true;
    }
    return false;
  }
  function buildCaseRecords(rawCases) {
    return normalizeArray(rawCases)
      .filter(function (c) {
        if (!c || isCaseClosedOrResolved(c)) return false;
        var num = (
          c.case_number ||
          c.number ||
          c.fallout_number ||
          c.task_number ||
          c.related_task_number ||
          c.task_name ||
          ""
        )
          .toString()
          .trim();
        if (!num) return false;
        var numUpper = num.toUpperCase();
        if (
          numUpper.indexOf("FO") === 0 ||
          numUpper.indexOf("OMTASK") === 0 ||
          numUpper.indexOf("TASK") === 0
        ) {
          return false;
        }
        if (c.isFallout === true || c.is_fallout === true) {
          return false;
        }
        return true;
      })
      .map(function (c) {
        var num = c.case_number || c.number || c.related_task_number || "Case";
        return {
          case_number: num,
          case_sys_id: c.case_sys_id || c.sys_id || "",
          assignment_group: c.assignment_group || "Unassigned",
          task_name: c.task_name || c.short_description || "Order Case",
          assigned_to: c.assigned_to || "",
          state: c.state || "",
          isFallout: false,
          isRouting: c.isRouting === true,
        };
      });
  }
  function isFalloutClosed(f) {
    if (!f) return true;
    var s = (f.state || f.status || f.fallout_state || "")
      .toString()
      .toLowerCase();
    if (
      s === "3" ||
      s === "4" ||
      s === "7" ||
      s.indexOf("closed") > -1 ||
      s.indexOf("complete") > -1 ||
      s.indexOf("cancel") > -1 ||
      s.indexOf("resolve") > -1
    ) {
      return true;
    }
    if (f.active === false || f.active === "false" || f.is_active === false) {
      return true;
    }
    return false;
  }
  function buildFalloutRecords(rawFallouts) {
    return normalizeArray(rawFallouts)
      .filter(function (f) {
        return !!f && !isFalloutClosed(f);
      })
      .map(function (f) {
        return {
          fallout_number: f.fallout_number || f.number || "",
          case_number: f.case_number || "",
          related_task_number: f.related_task_number || f.task_number || "",
          task_name:
            f.task_name || f.short_description || f.name || "Fallout task",
          retry_count: f.retry_count != null ? f.retry_count : null,
          fallout_sys_id: f.fallout_sys_id || f.sys_id || "",
          assignment_group: f.assignment_group || "",
          assigned_to: f.assigned_to || "",
          error_message: f.error_message || "",
        };
      });
  }
  function buildItems(ai, phase, falloutCount, isGoodHealth) {
    var items = [];
    var healthStatus = isGoodHealth
      ? "Good"
      : (ai.order_health && ai.order_health.status) ||
        (phase === PHASE.ERROR ? "Critical" : "Good");
    items.push({
      id: "order_health",
      label: "Order Health",
      value: healthStatus,
      tone: healthStatus.toLowerCase() === "critical" ? "danger" : "success",
      emphasize: true,
    });
    var productItems =
      (ai.order_scenario && ai.order_scenario.added_services) ||
      (ai.products && ai.products.items) ||
      [];
    items.push({
      id: "products",
      label: "Products in Order (" + productItems.length + ")",
      lines: productItems.length > 0 ? productItems : ["None"],
      tone: "info",
      emphasize: false,
    });
    var sc = ai.order_scenario || {};
    if (sc.scenario_type === "TN_CHANGE") {
      if (sc.from_tn) {
        items.push({
          id: "existing_tn",
          label: "Existing TN",
          value: sc.from_tn,
          tone: "info",
          emphasize: false,
        });
      }
      if (sc.to_tn) {
        items.push({
          id: "requested_tn",
          label: "Requested TN",
          value: sc.to_tn,
          tone: "success",
          emphasize: true,
        });
      }
    }
    return items;
  }
  function transformOrder(responseData, reqPayload) {
	console.log(JSON.stringify({"response":responseData}));
	
    var inputOrdData = (input && input.orderData) || data.orderData || (options && options.data) || {};
    var orderRecord = inputOrdData && inputOrdData["Customer Order"];
    var pRef = reqPayload || (typeof p !== "undefined" ? p : null);
    // Customer Order is the authoritative source for Order Status.
    var rawStatus = String(
      (pRef && pRef.u_state) ||
      findField(inputOrdData, ["u_state"]) ||
      ""
    ).trim();
    var phase = resolvePhase(rawStatus);
    var rawStatusLower = String(rawStatus).toLowerCase();
    var isCompleted =
      phase === PHASE.SUCCESS ||
      rawStatusLower.indexOf("complet") > -1 ||
      rawStatusLower.indexOf("clos") > -1 ||
      rawStatus === "3" ||
      rawStatus === "4";
    var isCanceled =
      rawStatusLower.indexOf("cancel") > -1 ||
      rawStatusLower.indexOf("void") > -1 ||
      rawStatusLower.indexOf("reject") > -1;
    var ai = responseData || {};
    var sd = ai.summary_details || {};
    var rawHealth = (ai.order_health && ai.order_health.status) || sd.health_status || "";
    var onHoldReason =
      (ai.order_health && ai.order_health.reason) ||
      ai.on_hold_reason ||
      sd.on_hold_reason ||
      findField(inputOrdData, ["u_reason_for_jeopardy", "on_hold_reason"]) ||
      "";
    var cancellationDetails =
      ai.cancellation_details ||
      sd.cancellation_details ||
      (ai.summary_details && ai.summary_details.cancellation_details) ||
      null;
    if (isCanceled) {
      if (!cancellationDetails) {
        cancellationDetails = {};
      }
    }
    var computedHealth = isCanceled
      ? rawStatus || "Canceled"
      : (rawStatusLower.indexOf("hold") > -1 || (rawHealth && rawHealth.toLowerCase() === "risk"))
        ? "Risk"
        : isCompleted
          ? "Good"
          : rawHealth
            ? rawHealth
            : phase === PHASE.ERROR
              ? "Critical"
              : "Good";
    var isGoodHealth = computedHealth.toLowerCase() === "good";
    var scenario =
      ai.order_scenario && typeof ai.order_scenario === "object"
        ? ai.order_scenario
        : sd.order_scenario && typeof sd.order_scenario === "object"
          ? sd.order_scenario
          : {};
    scenario.added_services = (scenario.added_services || []).filter(function (s) {
      return !isInstallOrFee(s);
    });
    scenario.disconnected_services = (scenario.disconnected_services || []).filter(function (s) {
      return !isInstallOrFee(s);
    });
    if (scenario.existing_products) {
      scenario.existing_products = scenario.existing_products.filter(function (s) {
        return !isInstallOrFee(s);
      });
    }
    if (scenario.requested_products) {
      scenario.requested_products = scenario.requested_products.filter(function (s) {
        return !isInstallOrFee(s);
      });
    }
    var ORDER_ACTION_VALUES = [
      "change",
      "add",
      "disconnect",
      "port out disconnect",
      "restore",
      "resume",
      "suspend",
      "pause",
      "to",
      "from",
      "move",
      "billingonly",
      "billing only",
      "modify",
      "new",
      "provide",
      "install",
      "cease",
      "delete",
      "cancel",
    ];
    // Strictly read u_order_type (Additional Order Operation).
    // Never fall back to order_type, because order_type represents Order Action in ServiceNow.
    var rawUOrderType = String(
      (scenario && scenario.u_order_type) ||
      (pRef && pRef.u_order_type) ||
      findField(inputOrdData, ["u_order_type"]) ||
      ""
    ).trim();
    if (
      rawUOrderType &&
      (GENERIC_ORDER_TYPES.indexOf(rawUOrderType.toLowerCase()) > -1 ||
        ORDER_ACTION_VALUES.indexOf(rawUOrderType.toLowerCase()) > -1)
    ) {
      rawUOrderType = "";
    }
    var formattedOrderType = rawUOrderType ? formatOrderTypeNomenclature(rawUOrderType) : "";
    // order_type in ServiceNow sn_ind_tmt_orm_order represents Order Action
    // order_type is the Customer Order action; do not confuse it with u_order_type.
    var orderAction = String(
      (pRef && pRef.order_type) ||
      findField(inputOrdData, ["order_type"]) ||
      ""
    ).trim().toLowerCase();
    var isInvalidSpeed = function (val) {
      if (!val) return true;
      var s = String(val).trim().toLowerCase();
      return (
        s === "0" ||
        s === "0m" ||
        s === "om" ||
        s === "0 mbps" ||
        s === "0mbps" ||
        s === "0k" ||
        s === "0kbps" ||
        s === "0 kbps" ||
        s === "n/a" ||
        s === "null" ||
        s === "none" ||
        s === "-" ||
        s === "--" ||
        s === "\u2014"
      );
    };
    var isCopperSpeed = function (val) {
      if (!val) return false;
      var s = String(val).trim().toLowerCase();
      if (s.indexOf("/") > -1 || s.indexOf("kbps") > -1 || s.indexOf("dsl") > -1 || s.indexOf("copper") > -1) {
        return true;
      }
      var numMatch = s.match(/^(\d+(?:\.\d+)?)\s*(?:m|mbps)?(?:[_\/]\d+(?:\.\d+)?\s*(?:m|mbps|k|kbps)?)?$/i);
      if (numMatch) {
        var num = parseFloat(numMatch[1]);
        if (num <= 40) return true;
      }
      return false;
    };
    var isFiberSpeed = function (val) {
      if (!val) return false;
      var s = String(val).trim().toLowerCase();
      if (s.indexOf("g") > -1 || s.indexOf("gig") > -1 || s.indexOf("fiber") > -1) {
        return true;
      }
      var numMatch = s.match(/^(\d+(?:\.\d+)?)\s*(?:m|mbps)?(?:[_\/]\d+(?:\.\d+)?\s*(?:m|mbps|k|kbps)?)?$/i);
      if (numMatch) {
        var num = parseFloat(numMatch[1]);
        if (num >= 100) return true;
      }
      return false;
    };
    // Current requested speed directly from current order u_speed (verbatim, no conversion)
    var currentRequestedSpeed =
      (pRef && pRef.u_speed) ||
      (orderRecord && orderRecord.u_speed) ||
      findField(inputOrdData, ["u_speed"]) ||
      (scenario && (scenario.to_speed || scenario.requested_speed)) ||
      "";
    if (isInvalidSpeed(currentRequestedSpeed)) {
      currentRequestedSpeed = "";
    }
    // Customer Order u_assigned_tn is the only current-order TN column.
    var currentRequestedTn =
      (pRef && pRef.u_assigned_tn) ||
      (orderRecord && orderRecord.u_assigned_tn) ||
      findField(inputOrdData, ["u_assigned_tn"]) ||
      (scenario && (scenario.to_tn || scenario.requested_tn)) ||
      "";
    // Existing speed retrieved directly from active customer order u_speed (no conversion, no line item scraping)
    var existingSpeedVal =
      (pRef && pRef.existing_speed) ||
      scenario.from_speed ||
      scenario.existing_speed ||
      "";
    if (isInvalidSpeed(existingSpeedVal)) {
      existingSpeedVal = "";
    }
    // Existing TN retrieved directly from active customer order u_assinged_tn
    var existingTnVal =
      (pRef && (pRef.existing_tn || pRef.active_tn)) ||
      scenario.from_tn ||
      scenario.existing_tn ||
      "";
    var rawOrderProducts =
      scenario.order_products ||
      (ai.products && ai.products.items) ||
      (input && input.products) ||
      data.products ||
      [];
    if (!rawOrderProducts || rawOrderProducts.length === 0) {
      var pOff = findField(inputOrdData, [
        "Product Offering",
        "Product Category",
        "Service Type",
        "Product",
      ]);
      if (pOff) rawOrderProducts = [pOff];
    }
    var cleanOrderProducts = normalizeArray(rawOrderProducts).filter(function (prod) {
      return !isInstallOrFee(prod);
    });
    scenario.order_products = cleanOrderProducts;
    var allProductNamesLower = cleanOrderProducts.join(" ").toLowerCase();
    var serviceTypeLower = String(
      findField(inputOrdData, ["Service Type", "service_type", "Product Category", "product_category"]) || ""
    ).toLowerCase();
    var hasVoiceContext =
      allProductNamesLower.indexOf("voice") > -1 ||
      allProductNamesLower.indexOf("telephone") > -1 ||
      allProductNamesLower.indexOf("pots") > -1 ||
      allProductNamesLower.indexOf("dial tone") > -1 ||
      serviceTypeLower.indexOf("voice") > -1;
    var hasSpecificUOrderType = Boolean(formattedOrderType);
    var isChangeAction = !hasSpecificUOrderType && (orderAction === "change" || orderAction === "modify");
    // Copper to Fiber / Copper to 4GLTE Migration Detection (Change orders ONLY)
    var copperFlag = String((pRef && pRef.u_copper_migrator) || findField(inputOrdData, ["u_copper_migrator", "copper_migrator"]) || "").toLowerCase();
    var migratorType = String((pRef && pRef.u_migrator_type) || findField(inputOrdData, ["u_migrator_type", "migrator_type"]) || "").toLowerCase();
    var networkTypeLower = String(
      (pRef && pRef.u_network_type) ||
      findField(inputOrdData, ["u_network_type"]) ||
      ""
    ).toLowerCase();
    var is4gLteTarget =
      networkTypeLower.indexOf("4glte") > -1 ||
      networkTypeLower.indexOf("4g lte") > -1 ||
      networkTypeLower.indexOf("lte") > -1 ||
      serviceTypeLower.indexOf("4glte") > -1 ||
      serviceTypeLower.indexOf("4g lte") > -1 ||
      allProductNamesLower.indexOf("4glte") > -1 ||
      allProductNamesLower.indexOf("4g lte") > -1 ||
      migratorType.indexOf("4glte") > -1 ||
      migratorType.indexOf("4g lte") > -1 ||
      (scenario.display_title && String(scenario.display_title).toLowerCase().indexOf("4glte") > -1);
    var isExplicitMigration =
      copperFlag === "true" ||
      migratorType.indexOf("copper") > -1 ||
      migratorType.indexOf("dsl") > -1;
    var currentNetworkLower = String(
      networkTypeLower || findField(inputOrdData, ["network_type", "Network Type"]) || ""
    ).toLowerCase();
    var isCopperTarget =
      currentNetworkLower.indexOf("copper") > -1 ||
      serviceTypeLower.indexOf("dsl") > -1 ||
      serviceTypeLower.indexOf("copper") > -1;
    var isFiberTarget =
      !isCopperTarget &&
      (isFiberSpeed(currentRequestedSpeed) ||
        serviceTypeLower.indexOf("fiber") > -1 ||
        allProductNamesLower.indexOf("fiber") > -1);
    var isCopperTransition =
      isCopperSpeed(existingSpeedVal) && Boolean(currentRequestedSpeed) && isFiberTarget;
    var isMigrationOrder =
      isChangeAction &&
      (isExplicitMigration ||
        isCopperTransition ||
        scenario.scenario_type === "MIGRATION" ||
        scenario.is_migration);
    var isSpeedChangeOrder =
      isChangeAction &&
      !isMigrationOrder &&
      ((existingSpeedVal && currentRequestedSpeed && existingSpeedVal !== currentRequestedSpeed) ||
        scenario.scenario_type === "SPEED_CHANGE" ||
        scenario.scenario_type === "SERVICE_CHANGE" ||
        scenario.is_speed_change);
    var isVoiceModifyTnOrder =
      isChangeAction &&
      hasVoiceContext &&
      !currentRequestedSpeed &&
      (!scenario.added_services || scenario.added_services.length === 0) &&
      (!scenario.disconnected_services || scenario.disconnected_services.length === 0);
    var isTnChangeOrder =
      isChangeAction &&
      !isMigrationOrder &&
      !isSpeedChangeOrder &&
      (scenario.scenario_type === "TN_CHANGE" ||
        scenario.is_tn_change ||
        (existingTnVal && currentRequestedTn && existingTnVal !== currentRequestedTn) ||
        isVoiceModifyTnOrder);
    var isInstallOrder =
      !hasSpecificUOrderType &&
      !isChangeAction &&
      (orderAction === "add" ||
        orderAction === "provide" ||
        orderAction === "new" ||
        orderAction === "install");
    var isDisconnectOrder =
      !hasSpecificUOrderType &&
      !isChangeAction &&
      (orderAction === "disconnect" ||
        orderAction === "port out disconnect" ||
        orderAction === "port_out_disconnect" ||
        orderAction.indexOf("disconnect") > -1 ||
        orderAction === "cease" ||
        orderAction === "delete" ||
        orderAction === "cancel");
    var isRestoreOrder =
      !hasSpecificUOrderType &&
      !isChangeAction &&
      (orderAction === "restore" ||
        orderAction === "resume" ||
        orderAction.indexOf("restore") > -1 ||
        orderAction.indexOf("resume") > -1);
    var isSuspendOrder =
      !hasSpecificUOrderType &&
      !isChangeAction &&
      (orderAction === "suspend" ||
        orderAction === "pause" ||
        orderAction.indexOf("suspend") > -1 ||
        orderAction.indexOf("pause") > -1);
    var isMoveOrder =
      !hasSpecificUOrderType &&
      !isChangeAction &&
      (orderAction === "to" ||
        orderAction === "from" ||
        orderAction === "move" ||
        orderAction.indexOf("move") > -1);
    var isBillingOnlyOrder =
      !hasSpecificUOrderType &&
      !isChangeAction &&
      (orderAction === "billingonly" ||
        orderAction === "billing only" ||
        orderAction === "billing_only" ||
        orderAction.indexOf("billing only") > -1);
    scenario.is_speed_and_tn_change = false;
    // STEP 1: u_order_type takes precedence when populated
    if (hasSpecificUOrderType) {
      var uotLow = formattedOrderType.toLowerCase();
      scenario.u_order_type = formattedOrderType;
      scenario.is_migration = false;
      scenario.is_speed_change = false;
      scenario.is_tn_change = false;
      scenario.from_speed = null;
      scenario.existing_speed = null;
      scenario.speed_upgrade = null;
      if (uotLow.indexOf("ban") > -1 || uotLow.indexOf("move") > -1) {
        scenario.scenario_type = "MOVE";
        scenario.display_title = formattedOrderType;
      } else if (uotLow.indexOf("bnow") > -1 || uotLow.indexOf("bulk") > -1) {
        scenario.scenario_type = "BNOW_TO_STDBULK";
        scenario.display_title = formattedOrderType;
      } else {
        scenario.scenario_type =
          formattedOrderType.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toUpperCase() || "ORDER_CHANGE";
        scenario.display_title = formattedOrderType;
      }
    } else if (isMigrationOrder) {
      scenario.scenario_type = "MIGRATION";
      scenario.is_migration = true;
      scenario.is_speed_change = true;
      scenario.is_tn_change = false;
      scenario.display_title = is4gLteTarget ? "Copper to 4GLTE Migration" : "Copper to Fiber Migration";
      scenario.from_technology = "Copper";
      scenario.to_technology = is4gLteTarget ? "4GLTE" : "Fiber";
      if (existingSpeedVal) {
        scenario.from_speed = existingSpeedVal;
        scenario.existing_speed = existingSpeedVal;
      }
      if (currentRequestedSpeed) {
        scenario.to_speed = currentRequestedSpeed;
        scenario.requested_speed = currentRequestedSpeed;
      }
      if (scenario.from_speed && scenario.to_speed) {
        scenario.speed_upgrade = scenario.from_speed + " \u2794 " + scenario.to_speed;
      }
      if ((existingTnVal || currentRequestedTn) &&
          String(existingTnVal || "").replace(/\D/g, "").slice(-10) !== String(currentRequestedTn || "").replace(/\D/g, "").slice(-10)) {
        scenario.from_tn = existingTnVal || null;
        scenario.existing_tn = existingTnVal || null;
        scenario.to_tn = currentRequestedTn || null;
        scenario.requested_tn = currentRequestedTn || null;
        scenario.is_tn_change = true;
      }
    } else if (isSpeedChangeOrder) {
      scenario.scenario_type = "SPEED_CHANGE";
      scenario.is_speed_change = true;
      scenario.is_migration = false;
      scenario.is_tn_change = false;
      scenario.display_title = "Speed Change";
      if (existingSpeedVal) {
        scenario.from_speed = existingSpeedVal;
        scenario.existing_speed = existingSpeedVal;
      }
      if (currentRequestedSpeed) {
        scenario.to_speed = currentRequestedSpeed;
        scenario.requested_speed = currentRequestedSpeed;
      }
      if (scenario.from_speed && scenario.to_speed) {
        scenario.speed_upgrade = scenario.from_speed + " \u2794 " + scenario.to_speed;
      }
      if ((existingTnVal || currentRequestedTn) &&
          String(existingTnVal || "").replace(/\D/g, "").slice(-10) !== String(currentRequestedTn || "").replace(/\D/g, "").slice(-10)) {
        scenario.from_tn = existingTnVal || null;
        scenario.existing_tn = existingTnVal || null;
        scenario.to_tn = currentRequestedTn || null;
        scenario.requested_tn = currentRequestedTn || null;
        scenario.is_tn_change = true;
        if (scenario.from_speed && scenario.to_speed && scenario.from_speed !== scenario.to_speed) {
          scenario.scenario_type = "SERVICE_CHANGE";
          scenario.display_title = "Service Change";
          scenario.is_speed_and_tn_change = true;
        }
      }
    } else if (isTnChangeOrder) {
      scenario.scenario_type = "TN_CHANGE";
      scenario.is_tn_change = true;
      scenario.is_speed_change = false;
      scenario.is_migration = false;
      scenario.display_title = "Telephone Number Change";
      if (existingTnVal) {
        scenario.from_tn = existingTnVal;
        scenario.existing_tn = existingTnVal;
      }
      if (currentRequestedTn) {
        scenario.to_tn = currentRequestedTn;
        scenario.requested_tn = currentRequestedTn;
      }
    } else if (isInstallOrder) {
      scenario.scenario_type = "NEW_INSTALL";
      scenario.display_title = "New Installation";
      scenario.from_speed = null;
      scenario.existing_speed = null;
      scenario.from_tn = null;
      scenario.existing_tn = null;
      scenario.is_tn_change = false;
      scenario.is_speed_change = false;
      scenario.is_migration = false;
      var hasTechInstall =
        pRef && pRef.has_tech_install !== undefined && pRef.has_tech_install !== null
          ? Boolean(pRef.has_tech_install)
          : scenario.has_tech_install !== undefined && scenario.has_tech_install !== null
            ? Boolean(scenario.has_tech_install)
            : true;
      scenario.has_tech_install = hasTechInstall;
      if (currentRequestedSpeed) {
        scenario.to_speed = currentRequestedSpeed;
        scenario.requested_speed = currentRequestedSpeed;
      }
      if (currentRequestedTn) {
        scenario.to_tn = currentRequestedTn;
        scenario.requested_tn = currentRequestedTn;
      }
    } else if (isDisconnectOrder) {
      scenario.scenario_type = "DISCONNECT";
      scenario.display_title = "Service Disconnection";
      scenario.from_speed = null;
      scenario.existing_speed = null;
      scenario.to_speed = null;
      scenario.requested_speed = null;
      scenario.from_tn = null;
      scenario.existing_tn = null;
      scenario.to_tn = null;
      scenario.requested_tn = null;
      scenario.speed_upgrade = null;
      scenario.is_tn_change = false;
      scenario.is_speed_change = false;
      scenario.is_migration = false;
    } else if (isSuspendOrder) {
      scenario.scenario_type = "SUSPEND";
      scenario.display_title = "Service Suspension";
      scenario.from_speed = null;
      scenario.to_speed = null;
      scenario.from_tn = null;
      scenario.to_tn = null;
      scenario.speed_upgrade = null;
      scenario.is_tn_change = false;
      scenario.is_speed_change = false;
      scenario.is_migration = false;
    } else if (isRestoreOrder) {
      scenario.scenario_type = "RESTORE";
      scenario.display_title = "Service Restoration";
      scenario.from_speed = null;
      scenario.to_speed = null;
      scenario.from_tn = null;
      scenario.to_tn = null;
      scenario.speed_upgrade = null;
      scenario.is_tn_change = false;
      scenario.is_speed_change = false;
      scenario.is_migration = false;
    } else if (isMoveOrder) {
      scenario.scenario_type = "MOVE";
      scenario.display_title = "Move";
      scenario.from_speed = null;
      scenario.to_speed = null;
      scenario.from_tn = null;
      scenario.to_tn = null;
      scenario.speed_upgrade = null;
      scenario.is_tn_change = false;
      scenario.is_speed_change = false;
      scenario.is_migration = false;
    } else if (isBillingOnlyOrder) {
      scenario.scenario_type = "BILLING_ONLY";
      scenario.display_title = "Billing Only";
      scenario.from_speed = null;
      scenario.to_speed = null;
      scenario.from_tn = null;
      scenario.to_tn = null;
      scenario.speed_upgrade = null;
      scenario.is_tn_change = false;
      scenario.is_speed_change = false;
      scenario.is_migration = false;
    } else {
      scenario.scenario_type = scenario.scenario_type || "GENERAL_CHANGE";
      scenario.display_title = scenario.display_title || (isChangeAction ? "Order Change" : "Order Summary");
      scenario.is_tn_change = false;
      scenario.is_speed_change = false;
      scenario.is_migration = false;
    }
    // Preserve requested service details for suspend/restore/resume actions.
    // Values are sourced from the current order; no speed conversions.
    if (scenario.scenario_type === "SUSPEND" || scenario.scenario_type === "RESTORE" || scenario.scenario_type === "RESUME") {
      if (currentRequestedTn) {
        scenario.to_tn = currentRequestedTn;
        scenario.requested_tn = currentRequestedTn;
      }
      if (currentRequestedSpeed) {
        scenario.to_speed = currentRequestedSpeed;
        scenario.requested_speed = currentRequestedSpeed;
      }
    }
    // Move details: source only from explicit order fields; never invent a previous address.
    if (scenario.scenario_type === "MOVE") {
      scenario.from_address =
        scenario.from_address ||
        findField(inputOrdData, ["From Address", "from_address", "from_service_address",
          "old_service_address", "previous_service_address", "source_address",
          "move_from_address", "move_out_address", "old_address"]) || "";
      scenario.to_address =
        scenario.to_address ||
        findField(inputOrdData, ["To Address", "to_address", "to_service_address",
          "new_service_address", "destination_address", "move_to_address",
          "move_in_address", "new_address"]) || "";
      if (currentRequestedTn) {
        scenario.requested_tn = currentRequestedTn;
        scenario.to_tn = currentRequestedTn;
      }
      if (currentRequestedSpeed) {
        scenario.requested_speed = currentRequestedSpeed;
        scenario.to_speed = currentRequestedSpeed;
      }
    }
    // Exact order action subtype (From / To / Pause / Resume / Port Out)
    var actionSubtype = resolveActionSubtype(orderAction, scenario.action_subtype);
    scenario.action_subtype = actionSubtype;
    if (actionSubtype === "RESUME" && (scenario.scenario_type === "RESTORE" || scenario.scenario_type === "RESUME")) {
      if (currentRequestedTn) { scenario.to_tn = currentRequestedTn; scenario.requested_tn = currentRequestedTn; }
      if (currentRequestedSpeed) { scenario.to_speed = currentRequestedSpeed; scenario.requested_speed = currentRequestedSpeed; }
    }
    // u_order_type keeps its title; subtype only refines generic action titles
    if (!hasSpecificUOrderType) {
      if (isMoveOrder) {
        scenario.display_title =
          actionSubtype === "FROM"
            ? "Move (From Address)"
            : actionSubtype === "TO"
              ? "Move (To Address)"
              : "Move";
      } else if (isSuspendOrder && actionSubtype === "PAUSE") {
        scenario.display_title = "Service Pause";
      } else if (isRestoreOrder && actionSubtype === "RESUME") {
        scenario.display_title = "Service Resumption";
      } else if (isDisconnectOrder && actionSubtype === "PORT_OUT") {
        scenario.display_title = "Port Out Disconnection";
      }
    }
    // Read "Label: value" lines from the API highlights (e.g. "Service: Fiber Internet+Value Added Services")
    var apiHighlights = normalizeArray(ai.highlights).concat(normalizeArray(sd.highlights));
    function apiHighlightValue(label) {
      var prefix = label.toLowerCase() + ":";
      for (var h = 0; h < apiHighlights.length; h++) {
        var line = String(apiHighlights[h] || "").trim();
        if (line.toLowerCase().indexOf(prefix) === 0) return line.substring(prefix.length).trim();
      }
      return "";
    }
    // "Appointment: 08:00 AM to 10:00 AM (Due: 2026-10-29)" → 2026-10-29
    var apiDueDate = "";
    var apptHighlight = apiHighlightValue("Appointment");
    var dueMatch = apptHighlight.match(/Due:\s*([^)]+)\)/i);
    if (dueMatch) apiDueDate = dueMatch[1].trim();
    var orderNumber =
      (input && input.order_id) ||
      (inputOrdData && (inputOrdData.order_id || inputOrdData.order_number || inputOrdData.number)) ||
      (pRef && pRef.order_id) ||
      "";
    var orderSysId =
      (pRef && pRef._resolved_sys_id) ||
      (inputOrdData && (inputOrdData.sys_id || inputOrdData.sysId)) ||
      "";
    var falloutRecords = [];
    var caseRecords = [];
    if (!isGoodHealth && !isCompleted && !isCanceled) {
      var rawCases =
        ai.case_ownership && ai.case_ownership.length
          ? ai.case_ownership
          : ai.open_cases || (input && input.cases) || [];
      caseRecords = buildCaseRecords(rawCases);
      if (caseRecords.length === 0 && (orderSysId || orderNumber)) {
        try {
          var caseGr = new GlideRecord("sn_customerservice_case");
          if (orderSysId) {
            var qcSys = caseGr.addQuery("u_order", orderSysId);
            qcSys.addOrCondition("order", orderSysId);
          } else {
            var qcNum = caseGr.addQuery("u_order.number", orderNumber);
            qcNum.addOrCondition("order.number", orderNumber);
          }
          caseGr.addQuery("state", "NOT IN", "3,6,7");
          caseGr.setLimit(5);
          caseGr.query();
          while (caseGr.next()) {
            var cNum = (caseGr.getValue("number") || "").toString().trim();
            var cNumUpper = cNum.toUpperCase();
            if (
              cNumUpper.indexOf("FO") === 0 ||
              cNumUpper.indexOf("OMTASK") === 0 ||
              cNumUpper.indexOf("TASK") === 0
            ) {
              continue;
            }
            var cStateVal = (caseGr.getValue("state") || "").toString();
            var cStateDisplay = (caseGr.getDisplayValue("state") || "").toLowerCase();
            if (
              cStateVal === "3" ||
              cStateVal === "6" ||
              cStateVal === "7" ||
              cStateDisplay.indexOf("closed") > -1 ||
              cStateDisplay.indexOf("resolve") > -1 ||
              cStateDisplay.indexOf("cancel") > -1
            ) {
              continue;
            }
            caseRecords.push({
              case_number: caseGr.getValue("number"),
              case_sys_id: caseGr.getUniqueValue(),
              assignment_group: caseGr.getDisplayValue("assignment_group") || "",
              task_name: caseGr.getValue("short_description") || "Order Case",
              assigned_to: caseGr.getDisplayValue("assigned_to") || "",
              state: caseGr.getDisplayValue("state") || "",
              isRouting: false,
              isFallout: false,
            });
          }
        } catch (eCase) {}
      }
      // case_ownership often says "Unassigned" while open_cases has the real group
      var openCaseMap = {};
      normalizeArray(ai.open_cases).forEach(function (oc) {
        if (oc && oc.case_number) openCaseMap[oc.case_number] = oc;
      });
      caseRecords.forEach(function (cr) {
        var oc = openCaseMap[cr.case_number];
        if (!oc) return;
        if ((!cr.assignment_group || cr.assignment_group === "Unassigned") && oc.assignment_group) {
          cr.assignment_group = oc.assignment_group;
        }
        if (!cr.case_sys_id && oc.case_sys_id) cr.case_sys_id = oc.case_sys_id;
      });
    }
    var serviceAddress =
      (pRef && pRef.service_address) ||
      scenario.service_address ||
      findField(inputOrdData, [
        "Service Address",
        "Address",
        "Location",
        "Service Location",
        "Street Address",
        "u_service_address",
        "u_address_alias_id",
        "premise_address",
        "formatted_address",
      ]) ||
      "";
    var productsList =
      scenario.added_services.length > 0
        ? scenario.added_services
        : cleanOrderProducts.length > 0
          ? cleanOrderProducts
          : (ai.products && ai.products.items) || [];
    var productsDisplay = productsList.length > 0 ? productsList.join(", ") : "";
    var scenarioSubtitle = "";
    if (isCanceled) {
      scenarioSubtitle = "Order was canceled. Fulfillment has been discontinued.";
    } else if (isCompleted) {
      scenarioSubtitle = "Order completed successfully. All automated provisioning steps finished.";
    } else if (!isGoodHealth && caseRecords.length > 0) {
      scenarioSubtitle = caseRecords.length + " open case(s) requiring attention.";
    } else if (isGoodHealth) {
      scenarioSubtitle = "Order is proceeding normally through automated fulfillment.";
    } else if (scenario.scenario_type === "PRODUCT_CHANGE") {
      scenarioSubtitle = "Product change modifying active services on account.";
    } else {
      scenarioSubtitle = "Order is processing normally.";
    }
    var appointmentSlot =
      (pRef && pRef.u_appointment_window) ||
      findField(inputOrdData, [
        "u_appointment_window",
        "u_appointment",
        "Appointment Window",
        "appointment_window",
        "Appointment",
        "Appointment Slot",
        "Slot",
        "Schedule",
        "expected_start",
      ]) ||
      (orderRecord && (orderRecord.u_appointment_window || orderRecord["Appointment Window"])) ||
      "";
    var dispatchStatus =
      (pRef && pRef.u_dispatch_status) ||
      findField(inputOrdData, [
        "u_dispatch_status",
        "dispatch_status",
        "Dispatch Status",
        "Dispatch",
        "work_order_status",
      ]) ||
      (orderRecord && (orderRecord.u_dispatch_status || orderRecord["Dispatch Status"] || orderRecord.dispatch_status)) ||
      "";
    if (isCompleted) {
      if (!dispatchStatus || dispatchStatus.toLowerCase().indexOf("pend") > -1 || dispatchStatus.toLowerCase().indexOf("unsch") > -1) {
        dispatchStatus = "Completed";
      }
      if (!appointmentSlot || appointmentSlot.toLowerCase().indexOf("pend") > -1) {
        var completedDate = findField(inputOrdData, [
          "Customer Due Date",
          "Due Date",
          "closed_at",
          "sys_updated_on",
          "actual_end",
        ]);
        appointmentSlot = completedDate ? "Completed on " + completedDate : "Completed";
      }
    }
    if (scenario.scenario_type === "NEW_INSTALL" && scenario.has_tech_install === false) {
      appointmentSlot = "";
      dispatchStatus = "";
    }
    // ---------------- Next actions ----------------
    // Primary: next_action object. Extra: critical_next_actions (deduped by instruction).
    var defaultOwner =
      (falloutRecords.length > 0 && falloutRecords[0].assignment_group) ||
      (caseRecords.length > 0 &&
        caseRecords[0].assignment_group !== "Unassigned" &&
        caseRecords[0].assignment_group) ||
      (ai.action_owner && ai.action_owner.value) ||
      sd.action_owner ||
      "";
    var nextActions = [];
    var primaryAction = normalizeNextAction(ai.next_action || sd.next_action, defaultOwner);
    if (primaryAction) nextActions.push(primaryAction);
    normalizeArray(ai.critical_next_actions).forEach(function (raw) {
      var n = normalizeNextAction(raw, defaultOwner);
      if (!n) return;
      for (var i = 0; i < nextActions.length; i++) {
        if (nextActions[i].instruction === n.instruction) {
          if (nextActions[i].action_required === null) nextActions[i].action_required = n.action_required;
          if (!nextActions[i].responsible_party) nextActions[i].responsible_party = n.responsible_party;
          ["display_status", "title", "status_label", "reason", "priority", "action_type"].forEach(function (k) {
            if (!nextActions[i][k] && n[k]) nextActions[i][k] = n[k];
          });
          if (!nextActions[i].presentation.icon_type) nextActions[i].presentation.icon_type = n.presentation.icon_type;
          if (!nextActions[i].presentation.color_theme) nextActions[i].presentation.color_theme = n.presentation.color_theme;
          return;
        }
      }
      nextActions.push(n);
    });
    if (nextActions.length === 0 && (isCompleted || isCanceled || isGoodHealth)) {
      nextActions.push({
        instruction: isCompleted
          ? "No manual intervention required: Order completed and services are provisioned."
          : isCanceled
            ? "No action required: Order was canceled."
            : "No manual intervention required: Order is proceeding through automated fulfillment.",
        action_required: false,
        action_type: "",
        responsible_party: "Automated Provisioning",
        priority: "",
        reason: "",
      });
    }
    nextActions.forEach(function (act) {
      // Closed orders never need action
      if (isCompleted || isCanceled) act.action_required = false;
      // Infer when the API omits action_required
      if (act.action_required === null) act.action_required = !isGoodHealth;
      if (!act.action_required && !act.responsible_party) {
        act.responsible_party = "Automated Provisioning";
      }
    });
    var summaryText = ai.summary || "";
    if (!summaryText) {
      if (isCanceled) {
        summaryText = "Order " + (orderNumber || "") + " was canceled. Fulfillment has been discontinued.";
      } else if (isCompleted) {
        summaryText = "Order " + (orderNumber || "") + " completed successfully. All automated provisioning and activation steps finished.";
      } else {
        summaryText = "Order " + (orderNumber || "") + " is currently processing through automated fulfillment.";
      }
    } else if ((isCompleted || isGoodHealth) && summaryText.toLowerCase().indexOf("fallout") > -1) {
      summaryText =
        "Order " + (orderNumber || "") + " completed successfully. All automated provisioning and activation steps finished.";
    }
    return {
      orderNo:
        orderNumber ||
        ai.order_number ||
        (ai.summary_details && ai.summary_details.order_number) ||
        "",
      u_state: rawStatus,
      state: rawStatus,
      phase: phase,
      summary: summaryText,
      scenario: scenario,
      scenarioType: scenario.scenario_type || "GENERAL_CHANGE",
      actionSubtype: actionSubtype,
      productGroups: buildProductGroups(ai, actionSubtype),
      recordChanges: (ai.summary_details && ai.summary_details.record_changes) || ai.record_changes || [],
      scenarioTitle: scenario.display_title || "Order Summary",
      scenarioSubtitle: scenarioSubtitle,
      serviceAddress: serviceAddress,
      productsDisplay: productsDisplay,
      productsList: cleanOrderProducts,
      appointmentSlot: appointmentSlot,
      dispatchStatus: dispatchStatus,
      dueDate: findField(inputOrdData, ["Due Date", "Customer Due Date"]) || apiDueDate,
      serviceType:
        findField(inputOrdData, ["Service Type", "service_type", "Product Category"]) ||
        apiHighlightValue("Service"),
      caseOwnership: caseRecords,
      criticalNextActions: nextActions,
      healthStatus: computedHealth,
      onHoldReason: onHoldReason,
      cancellationDetails: cancellationDetails,
      actionOwner:
        isGoodHealth || isCompleted
          ? "Automated Provisioning"
          : caseRecords.length > 0 &&
              caseRecords[0].assignment_group &&
              caseRecords[0].assignment_group !== "Unassigned"
            ? caseRecords[0].assignment_group
            : ai.action_owner &&
                ai.action_owner.value &&
                ai.action_owner.value !== "Owner not returned" &&
                ai.action_owner.value !== "Responsible Team"
              ? ai.action_owner.value
              : "Automated Provisioning",
      items: buildItems(ai, phase, falloutRecords.length, isGoodHealth),
      caseRecords: caseRecords,
      caseCount: caseRecords.length,
      showFalloutDetails: false,
      falloutRecords: falloutRecords,
      falloutRecordCount: falloutRecords.length,
    };
  }
  if (input && input.action === "summary") {
    try {
      var r = null;
      var methodCandidates = [
        "GET - AI Summary",
        "POST - AI Order Analyze",
        "POST - AI Summary",
        "AI Summary",
      ];
      for (var m = 0; m < methodCandidates.length; m++) {
        try {
          r = new sn_ws.RESTMessageV2(
            "x_fobr_boss_om.BOSS OM API",
            methodCandidates[m],
          );
          if (r) {
            break;
          }
        } catch (errMethod) {}
      }
      if (!r) {
        r = new sn_ws.RESTMessageV2();
      }
      var p = {};
      var orderDataObj = (input && input.orderData) || data.orderData || (options && options.data) || {};
      for (var key in orderDataObj) {
        if (orderDataObj.hasOwnProperty(key)) {
          p[key] = orderDataObj[key];
        }
      }
      p.order_id =
        input.order_id ||
        data.order_id ||
        findField(orderDataObj, [
          "Order ID",
          "order_id",
          "u_order_id",
          "Number",
          "number",
          "order_number",
          "u_order_number",
          "External Order ID",
          "external_id",
          "u_external_id",
          "PON",
          "u_pon",
        ]) ||
        "";
      p.question = input.question || "";
      p.use_ai = true;
      p.fallout_tasks = input.falloutTasks;
      p.open_cases = input.cases;
      p.total_price = input.totalPrice;
      p.products = input.products;
      p.order_summary_min = 100;
      p.order_summary_max = 250;
      var isInvalidSpd = function (val) {
        if (!val) return true;
        var s = String(val).trim().toLowerCase();
        return (
          s === "0" ||
          s === "0m" ||
          s === "om" ||
          s === "0 mbps" ||
          s === "0mbps" ||
          s === "0k" ||
          s === "0kbps" ||
          s === "0 kbps" ||
          s === "n/a" ||
          s === "null" ||
          s === "none" ||
          s === "-" ||
          s === "--" ||
          s === "\u2014"
        );
      };
      var formatTn = function (raw) {
        if (!raw) return "";
        var s = String(raw).trim();
        var digits = s.replace(/\D/g, "");
        if (digits.length === 11 && digits.charAt(0) === "1") digits = digits.substring(1);
        if (digits.length === 10) return digits.substring(0, 3) + "-" + digits.substring(3, 6) + "-" + digits.substring(6);
        return s;
      };
      var currentOrderRec = orderDataObj && orderDataObj["Customer Order"];
      // Canonical Customer Order field. Legacy payload aliases are not queried.
      var initialTn = (currentOrderRec && currentOrderRec.u_assigned_tn) ||
        (orderDataObj && orderDataObj.u_assigned_tn) || "";
      if (initialTn) {
        initialTn = formatTn(initialTn);
        p.assignedTN = initialTn;
        p.u_assinged_tn = initialTn;
        p.u_assigned_tn = initialTn;
      }
      var orderAddress = findField(orderDataObj, ["u_service_address"]) || "";
      var currentSysId =
        input.sys_id ||
        input.sysId ||
        data.sys_id ||
        findField(orderDataObj, ["sys_id", "sysId", "u_sys_id"]) ||
        "";
      var currentOrderNumber =
        p.order_id ||
        findField(orderDataObj, [
          "Order ID",
          "order_id",
          "u_order_id",
          "Number",
          "number",
          "order_number",
          "u_order_number",
        ]) ||
        "";
      var currentSnNumber =
        findField(orderDataObj, ["Number", "number", "u_number"]) || "";
      var currentBan =
        findField(orderDataObj, [
          "Billing Account Number",
          "u_billing_account_number",
          "billing_account_number",
          "u_ban",
          "BAN",
        ]) || "";
      var currentCreated =
        findField(orderDataObj, [
          "Created",
          "sys_created_on",
          "Order Date",
          "order_date",
        ]) || "";
      if (!currentBan) currentBan = findField(orderDataObj, ["account"]) || "";
      var toIsoTimestamp = function (val) {
        if (!val) return "";
        var s = String(val).trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s;
        var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}:\d{2}(?::\d{2})?))?/);
        if (m) {
          var mm = m[1].length === 1 ? "0" + m[1] : m[1];
          var dd = m[2].length === 1 ? "0" + m[2] : m[2];
          var yyyy = m[3];
          var tm = m[4] || "00:00:00";
          if (tm.length === 5) tm += ":00";
          return yyyy + "-" + mm + "-" + dd + " " + tm;
        }
        return s;
      };
      var currentCreatedIso = toIsoTimestamp(currentCreated);
      var currentAddrSysId = "";
      var currentLocExternalId = "";
      var locSysIds = [];
      var currentBanCandidates = [];
      var addBanCandidate = function (v) {
        if (!v) return;
        var s = String(v).trim();
        if (s && currentBanCandidates.indexOf(s) === -1) {
          currentBanCandidates.push(s);
        }
      };
      addBanCandidate(currentBan);
      // Strictly read u_order_type (Additional Order Operation) from u_order_type only - NEVER fall back to order_type
      var uOrderType = findField(orderDataObj, ["u_order_type"]) || "";
      var orderActionRaw = findField(orderDataObj, ["order_type"]) || "";
      if (orderActionRaw) {
        p.order_type = orderActionRaw;
      }
      // Single consolidated lookup on sn_ind_tmt_orm_order for the current order:
      // Resolves cmn_location reference, sn_tmt_core_external_id (AMS Location ID), BAN, u_speed, u_assinged_tn, u_order_type, order_type, and 622 payload
      var current622Info = null;
      try {
        if (currentSysId || currentOrderNumber || currentSnNumber) {
          var curOrdLookupGr = null;
          var foundCurrent = false;
          if (currentSysId) {
            var sysGr = new GlideRecord("sn_ind_tmt_orm_order");
            if (sysGr.get(currentSysId)) {
              curOrdLookupGr = sysGr;
              foundCurrent = true;
            }
          }
          var lookupNums = [];
          if (currentOrderNumber) lookupNums.push(currentOrderNumber);
          if (currentSnNumber && lookupNums.indexOf(currentSnNumber) === -1) {
            lookupNums.push(currentSnNumber);
          }
          var idCandidateCols = ["number", "external_id"];
          for (var lni = 0; lni < lookupNums.length && !foundCurrent; lni++) {
            var lNum = lookupNums[lni];
            for (var fi = 0; fi < idCandidateCols.length; fi++) {
              var colName = idCandidateCols[fi];
              var tryGr = new GlideRecord("sn_ind_tmt_orm_order");
              if (tryGr.isValidField(colName) && tryGr.get(colName, lNum)) {
                curOrdLookupGr = tryGr;
                foundCurrent = true;
                break;
              }
            }
          }
          if (foundCurrent && curOrdLookupGr) {
            currentSysId = curOrdLookupGr.getUniqueValue();
            p._resolved_sys_id = currentSysId;
            var resolvedNum = curOrdLookupGr.getValue("number") || "";
            if (resolvedNum && !currentSnNumber) currentSnNumber = resolvedNum;
            var resolvedOrdId =
              (curOrdLookupGr.isValidField("external_id") ? curOrdLookupGr.getValue("external_id") : "") ||
              (curOrdLookupGr.isValidField("u_order_id") ? curOrdLookupGr.getValue("u_order_id") : "") ||
              (curOrdLookupGr.isValidField("order_id") ? curOrdLookupGr.getValue("order_id") : "") ||
              resolvedNum;
            if (resolvedOrdId && !p.order_id) {
              p.order_id = resolvedOrdId;
            }
            if (curOrdLookupGr.isValidField("u_service_address")) {
              var addressId = curOrdLookupGr.getValue("u_service_address") || "";
              if (addressId) {
                if (!currentAddrSysId) currentAddrSysId = addressId;
                if (locSysIds.indexOf(addressId) === -1) locSysIds.push(addressId);
              }
            }
            if (curOrdLookupGr.isValidField("sn_tmt_core_external_id")) {
              var directExtId =
                curOrdLookupGr.getDisplayValue("sn_tmt_core_external_id") ||
                curOrdLookupGr.getValue("sn_tmt_core_external_id") ||
                "";
              if (directExtId && directExtId !== currentAddrSysId) {
                currentLocExternalId = directExtId;
              }
            }
            // Dot-walk u_service_address.sn_tmt_core_external_id directly from curOrdLookupGr if available
            if (!currentLocExternalId) {
              try {
                var dotWalkExt = curOrdLookupGr.getElement("u_service_address.sn_tmt_core_external_id");
                if (dotWalkExt) {
                  var dwVal = String(dotWalkExt.toString() || "").trim();
                  if (dwVal) currentLocExternalId = dwVal;
                }
              } catch (eDotWalk) {}
            }
            // Resolve cmn_location and sn_tmt_core_external_id (AMS Location ID)
            if (currentAddrSysId) {
              try {
                var locGr = new GlideRecord("cmn_location");
                if (locGr.get(currentAddrSysId)) {
                  var extId =
                    (locGr.isValidField("sn_tmt_core_external_id")
                      ? locGr.getValue("sn_tmt_core_external_id") || locGr.getDisplayValue("sn_tmt_core_external_id")
                      : "") ||
                    (locGr.isValidField("u_ams_location_id")
                      ? locGr.getValue("u_ams_location_id") || locGr.getDisplayValue("u_ams_location_id")
                      : "") ||
                    "";
                  if (extId) {
                    currentLocExternalId = String(extId).trim();
                  }
                  if (!orderAddress || orderAddress.indexOf("*") > -1) {
                    var locDisp = locGr.getDisplayValue() || locGr.getValue("name") || locGr.getValue("street") || "";
                    if (locDisp && locDisp.indexOf("*") === -1) {
                      orderAddress = locDisp;
                    }
                  }
                }
              } catch (eLoc) {}
            }
            // Find all cmn_location records sharing the same sn_tmt_core_external_id
            if (currentLocExternalId) {
              try {
                var sameLocGr = new GlideRecord("cmn_location");
                if (sameLocGr.isValidField("sn_tmt_core_external_id")) {
                  sameLocGr.addQuery("sn_tmt_core_external_id", currentLocExternalId);
                  sameLocGr.setLimit(25);
                  sameLocGr.query();
                  while (sameLocGr.next()) {
                    var lid = sameLocGr.getUniqueValue();
                    if (lid && locSysIds.indexOf(lid) === -1) {
                      locSysIds.push(lid);
                    }
                  }
                }
              } catch (eSameLoc) {}
            }
            var unmaskedAddr =
              curOrdLookupGr.getDisplayValue("u_service_address") ||
              curOrdLookupGr.getValue("u_service_address") || "";
            if (unmaskedAddr && unmaskedAddr.indexOf("*") === -1) {
              orderAddress = unmaskedAddr;
            }
            if (orderAddress && orderAddress.indexOf("*") === -1) {
              p.service_address = orderAddress;
            }
            // Collect BAN and Account identifiers (both raw sys_id and display value)
            var banFields = ["account"];
            for (var bf = 0; bf < banFields.length; bf++) {
              var bfName = banFields[bf];
              if (curOrdLookupGr.isValidField(bfName)) {
                addBanCandidate(curOrdLookupGr.getValue(bfName));
                addBanCandidate(curOrdLookupGr.getDisplayValue(bfName));
              }
            }
            if (!currentBan && curOrdLookupGr.isValidField("account")) {
              currentBan = curOrdLookupGr.getValue("account") ||
                curOrdLookupGr.getDisplayValue("account") || "";
            }
            var dbCreated = curOrdLookupGr.getValue("sys_created_on") || "";
            if (dbCreated) {
              currentCreatedIso = dbCreated;
            }
            if (curOrdLookupGr.isValidField("u_appointment_window")) {
              var dbAppt = curOrdLookupGr.getDisplayValue("u_appointment_window") || curOrdLookupGr.getValue("u_appointment_window") || "";
              if (dbAppt) p.u_appointment_window = dbAppt;
            }
            if (curOrdLookupGr.isValidField("u_dispatch_status")) {
              var dbDisp = curOrdLookupGr.getDisplayValue("u_dispatch_status") || curOrdLookupGr.getValue("u_dispatch_status") || "";
              if (dbDisp) p.u_dispatch_status = dbDisp;
            }
            if (curOrdLookupGr.isValidField("u_speed")) {
              var dbSpd = curOrdLookupGr.getDisplayValue("u_speed") || curOrdLookupGr.getValue("u_speed") || "";
              if (dbSpd && !isInvalidSpd(dbSpd)) p.u_speed = dbSpd;
            }
            var dbTn = curOrdLookupGr.isValidField("u_assigned_tn")
              ? (curOrdLookupGr.getDisplayValue("u_assigned_tn") || curOrdLookupGr.getValue("u_assigned_tn") || "")
              : "";
            if (dbTn) p.u_assigned_tn = dbTn;
            if (curOrdLookupGr.isValidField("u_state")) {
              var dbSt = curOrdLookupGr.getDisplayValue("u_state") || curOrdLookupGr.getValue("u_state") || "";
              if (dbSt) p.u_state = dbSt;
            }
            if (curOrdLookupGr.isValidField("u_order_type")) {
              var grUOrdType = curOrdLookupGr.getDisplayValue("u_order_type") || curOrdLookupGr.getValue("u_order_type") || "";
              if (grUOrdType && GENERIC_ORDER_TYPES.indexOf(grUOrdType.toLowerCase()) === -1) {
                uOrderType = grUOrdType;
              }
            }
            if (curOrdLookupGr.isValidField("order_type")) {
              var grOrdTypeVal = curOrdLookupGr.getValue("order_type") || "";
              var grOrdTypeDisp = curOrdLookupGr.getDisplayValue("order_type") || "";
              var resolvedAction = grOrdTypeVal || grOrdTypeDisp;
              if (resolvedAction) {
                p.order_type = resolvedAction;
              }
            }
            if (curOrdLookupGr.isValidField("u_network_type")) {
              var grNet = curOrdLookupGr.getDisplayValue("u_network_type") || curOrdLookupGr.getValue("u_network_type") || "";
              if (grNet) p.u_network_type = grNet;
            }
            if (curOrdLookupGr.isValidField("u_migrator_type")) {
              var grMig = curOrdLookupGr.getDisplayValue("u_migrator_type") || curOrdLookupGr.getValue("u_migrator_type") || "";
              if (grMig) p.u_migrator_type = grMig;
            }
            if (curOrdLookupGr.isValidField("u_copper_migrator")) {
              var grCopMig = curOrdLookupGr.getDisplayValue("u_copper_migrator") || curOrdLookupGr.getValue("u_copper_migrator") || "";
              if (grCopMig) p.u_copper_migrator = grCopMig;
            }
            // Inspect 622 payload on current order for Tech Installation product and non-disconnect items
            var payloadCols = PAYLOAD_FIELDS;
            var rawCurPayload = "";
            for (var pci = 0; pci < payloadCols.length; pci++) {
              var pCol = payloadCols[pci];
              if (curOrdLookupGr.isValidField(pCol)) {
                var pv = curOrdLookupGr.getValue(pCol) || "";
                if (pv && pv.indexOf("productOrderItem") > -1) {
                  rawCurPayload = pv;
                  break;
                }
              }
            }
            if (!rawCurPayload) {
              rawCurPayload = findField(orderDataObj, ["u_request_payload", "request_payload", "u_622_payload", "Request Payload", "622 Payload"]) || "";
            }
            if (rawCurPayload) {
              current622Info = inspect622Payload(rawCurPayload);
              if (current622Info && current622Info.hasItems) {
                p.has_tech_install = current622Info.hasTechInstall;
                if (!p.u_speed && current622Info.nonDiscoSpeed) {
                  p.u_speed = current622Info.nonDiscoSpeed;
                }
                if (!p.u_assigned_tn && current622Info.nonDiscoTn) {
                  p.u_assinged_tn = current622Info.nonDiscoTn;
                  p.u_assigned_tn = current622Info.nonDiscoTn;
                }
              }
            }
          }
        }
      } catch (eAddrLookup) {}
      if (!current622Info) {
        var fallbackCur622 = findField(orderDataObj, ["u_request_payload", "request_payload", "u_622_payload", "Request Payload", "622 Payload"]) || "";
        if (fallbackCur622) {
          current622Info = inspect622Payload(fallbackCur622);
          if (current622Info && current622Info.hasItems) {
            p.has_tech_install = current622Info.hasTechInstall;
          }
        }
      }
      var isGenericType = !uOrderType || GENERIC_ORDER_TYPES.indexOf(uOrderType.toLowerCase()) > -1;
      if (uOrderType && !isGenericType) {
        var formattedUot = formatOrderTypeNomenclature(uOrderType);
        p.u_order_type = formattedUot;
      }
      var currentExistingSpeed = findField(orderDataObj, [
        "u_previous_speed",
        "previous_speed",
        "u_old_speed",
        "old_speed",
        "u_existing_speed",
        "existing_speed",
        "from_speed",
      ]);
      if (currentExistingSpeed && !isInvalidSpd(currentExistingSpeed)) {
        p.existing_speed = String(currentExistingSpeed).trim();
      }
      // Active Customer Order Lookup via Service Address reference (sn_tmt_core_external_id / cmn_location) and BAN
      // Retrieves exact u_speed and u_assigned_tn directly from the active customer order without conversion or line-item scraping
      var foundExistingSpeed = "";
      var foundExistingTn = "";
      // Retrieve an existing service from the same service-address reference and account.
      // Preserve raw u_speed / u_assigned_tn; never infer them from the 622 payload.
      var lookupActiveOrderByLocationAndBan = function () {
        if (!locSysIds.length || !currentBanCandidates.length) return;
        var activeStatuses = ["complet", "clos", "active", "fulfilled"];
        var excludedStatuses = [
          "cancel", "void", "reject", "incomplet", "draft", "in progress",
          "ponr", "fallout", "hold", "jeopardy", "assess", "qualif", "schedul"
        ];
        var excludedActions = ["disconnect", "cease", "delete", "cancel", "suspend"];
        function includesAny(text, values) {
          for (var i = 0; i < values.length; i++) {
            if (text.indexOf(values[i]) !== -1) return true;
          }
          return false;
        }
        function displayAndValue(gr, field) {
          return String(gr.getValue(field) || "").toLowerCase() + " " +
            String(gr.getDisplayValue(field) || "").toLowerCase();
        }
        function isActiveService(gr) {
          var state = displayAndValue(gr, "u_state");
          var action = displayAndValue(gr, "order_type");
          if (includesAny(state, excludedStatuses) || includesAny(action, excludedActions)) return false;
          return includesAny(state, activeStatuses) || /(^|\s)[34](\s|$)/.test(state);
        }
        var candidates = [];
        try {
          var gr = new GlideRecord("sn_ind_tmt_orm_order");
          gr.addQuery("u_service_address", "IN", locSysIds.join(","));
          gr.addQuery("account", "IN", currentBanCandidates.join(","));
          if (currentSysId) gr.addQuery("sys_id", "!=", currentSysId);
          gr.orderByDesc("sys_created_on");
          gr.setLimit(100);
          gr.query();
          while (gr.next()) {
            var number = String(gr.getValue("number") || "");
            if (number === currentOrderNumber || number === currentSnNumber) continue;
            if (/^RO/i.test(number)) continue;
            if (!isActiveService(gr)) continue;
            candidates.push({
              speed: String(gr.getValue("u_speed") || ""),
              tn: String(gr.getValue("u_assigned_tn") || gr.getValue("u_assinged_tn") || ""),
              created: String(gr.getValue("sys_created_on") || "")
            });
          }
          for (var pass = 0; pass < 2 && !foundExistingSpeed && !foundExistingTn; pass++) {
            for (var i = 0; i < candidates.length; i++) {
              var candidate = candidates[i];
              if (pass === 0 && currentCreatedIso && candidate.created > currentCreatedIso) continue;
              var validSpeed = candidate.speed && !isInvalidSpd(candidate.speed) ? candidate.speed : "";
              if (!validSpeed && !candidate.tn) continue;
              foundExistingSpeed = validSpeed;
              foundExistingTn = candidate.tn;
              break;
            }
          }
        } catch (lookupError) {
          gs.warn("AI Order Summary active-order lookup failed: " + lookupError.message);
        }
      };
      var actionLower = (
        (p && p.order_type) ||
        findField(orderDataObj, ["order_type"]) || ""
      ).toLowerCase().trim();
      var isChangeOrder =
        isGenericType &&
        (actionLower === "change" || actionLower === "modify" || actionLower === "order change" || actionLower === "change order");
      if (isChangeOrder) {
        lookupActiveOrderByLocationAndBan();
      }
      // Retain exact u_speed and u_assigned_tn values from active customer order without conversion
      if (foundExistingSpeed) {
        p.existing_speed = foundExistingSpeed;
      }
      if (foundExistingTn) {
        p.active_tn = foundExistingTn;
        p.existing_tn = foundExistingTn;
      }
      var parsedResponse = null;
      try {
        r.setHttpMethod("POST");
        r.setStringParameterNoEscape("request", JSON.stringify(p));
        r.setRequestBody(JSON.stringify(p));
        r.setRequestHeader("Content-Type", "application/json");
        var response = r.execute();
        if (response) {
          var responseBody = response.getBody();
          if (responseBody) {
            try {
              parsedResponse = JSON.parse(responseBody);
            } catch (eParse) {}
          }
        }
      } catch (eRest) {}
      data.order = transformOrder(parsedResponse || {}, p);
      data.errorMessage = "";
      return;
    } catch (ex) {
      data.errorMessage = ex.message;
    }
  }
})();