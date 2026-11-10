(function() {
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

    if (input && input.action === "summary") {
        try {
            data.apiFailed = false;
            data.errorMessage = "";
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
                        methodCandidates[m]
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

            var findField = function(obj, candidates) {
                if (!obj || typeof obj !== "object") return "";
                for (var i = 0; i < candidates.length; i++) {
                    var k = candidates[i];
                    if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== "") {
                        return obj[k];
                    }
                }
                return "";
            };

            p.order_id =
                input.order_id ||
                data.order_id ||
                findField(orderDataObj, [
                    "Order ID", "order_id", "u_order_id", "Number", "number",
                    "order_number", "u_order_number", "External Order ID", "external_id", "u_external_id"
                ]) ||
                "";

            var currentSysId =
                input.sys_id ||
                input.sysId ||
                data.sys_id ||
                findField(orderDataObj, ["sys_id", "sysId", "u_sys_id"]) ||
                "";
            if (currentSysId) {
                p._resolved_sys_id = currentSysId;
            }

            p.question = input.question || "";
            p.use_ai = true;
            p.fallout_tasks = input.falloutTasks || data.falloutTasks;
            p.open_cases = input.cases || data.cases;
            p.total_price = input.totalPrice || data.totalPrice;
            p.products = input.products || data.products;
            p.order_summary_min = 100;
            p.order_summary_max = 250;

            r.setHttpMethod("POST");
            r.setStringParameterNoEscape("request", JSON.stringify(p));
            r.setRequestBody(JSON.stringify(p));
            r.setRequestHeader("Content-Type", "application/json");

            var response = r.execute();
            var status = response ? response.getStatusCode() : 0;
            var responseBody = response ? response.getBody() : "";

            if (status < 200 || status >= 300) {
                throw new Error("AI Summary API HTTP status: " + status);
            }
            if (!responseBody || !responseBody.replace(/\s/g, "")) {
                throw new Error("AI Summary API returned empty response");
            }

            var parsedResponse = null;
            try {
                parsedResponse = JSON.parse(responseBody);
            } catch (parseError) {
                throw new Error("AI Summary API returned invalid JSON");
            }

            if (!parsedResponse || typeof parsedResponse !== "object" || Object.keys(parsedResponse).length === 0) {
                throw new Error("AI Summary API returned no data");
            }

            // Directly consume backend-assembled 31-field ui_order structure
            data.order = parsedResponse.ui_order || parsedResponse;

            // Synchronize installationType
            if (data.order && !data.order.installationType && (parsedResponse.installationType || parsedResponse.installation_type)) {
                data.order.installationType = parsedResponse.installationType || parsedResponse.installation_type;
            }

            // Priority evaluation for the 6 On-Hold boolean flags
            var ON_HOLD_FLAGS = [
                { key: "u_bsw_delayed", label: "BSW Delayed" },
                { key: "u_ows_hold", label: "OWS(Other Working Service)" },
                { key: "u_vmdu", label: "VMDU" },
                { key: "u_lnp_port_fallout", label: "LNP Porting Failure" },
                { key: "u_pre_provisioning_fallout", label: "Pre-Provisioning Fallout" },
                { key: "u_bsw_delay_predicted", label: "BSW Delay Predicted" }
            ];
            if (data.order) {
                var flagReason = "";
                for (var fIdx = 0; fIdx < ON_HOLD_FLAGS.length; fIdx++) {
                    var flagObj = ON_HOLD_FLAGS[fIdx];
                    var val = orderDataObj[flagObj.key];
                    if (val === true || val === 1 || String(val).toLowerCase() === "true" || String(val).toLowerCase() === "yes" || String(val) === "1") {
                        flagReason = flagObj.label;
                        break;
                    }
                }
                if (flagReason) {
                    data.order.onHoldReason = flagReason;
                } else if (!data.order.onHoldReason && orderDataObj.u_reason_for_jeopardy) {
                    data.order.onHoldReason = String(orderDataObj.u_reason_for_jeopardy);
                }
            }

            // Synchronize u_sid and service_instance_id
            if (data.order && !data.order.u_sid && (orderDataObj.u_sid || orderDataObj.service_instance_id)) {
                data.order.u_sid = orderDataObj.u_sid || orderDataObj.service_instance_id;
                data.order.service_instance_id = data.order.u_sid;
            }

            // Ensure healthStatus is Risk when on hold and set subtitle narrative
            if (data.order && (data.order.onHoldReason || (orderDataObj.order_status && String(orderDataObj.order_status).toLowerCase().indexOf("hold") > -1))) {
                data.order.healthStatus = "Risk";
                var rClean = String(data.order.onHoldReason || "").trim();
                var rLower = rClean.toLowerCase();
                if (rLower.indexOf("bsw") > -1 || rLower.indexOf("buried service wire") > -1) {
                    data.order.scenarioSubtitle = "Order is currently on hold awaiting Buried Service Wire completion.";
                } else if (rLower.indexOf("ows") > -1 || rLower.indexOf("other working service") > -1) {
                    data.order.scenarioSubtitle = "Order is currently on hold awaiting Other Working Service resolution.";
                } else if (rLower.indexOf("vmdu") > -1) {
                    data.order.scenarioSubtitle = "Order is currently on hold awaiting VMDU resolution.";
                } else if (rLower.indexOf("lnp") > -1 || rLower.indexOf("port") > -1) {
                    data.order.scenarioSubtitle = "Order is currently on hold due to LNP porting failure.";
                } else if (rLower.indexOf("pre-prov") > -1 || rLower.indexOf("preprov") > -1) {
                    data.order.scenarioSubtitle = "Order is currently on hold due to pre-provisioning fallout.";
                } else if (rLower.indexOf("awaiting") === 0 || rLower.indexOf("due to") === 0) {
                    data.order.scenarioSubtitle = "Order is currently on hold " + rClean + ".";
                } else if (rClean) {
                    data.order.scenarioSubtitle = "Order is currently on hold awaiting " + rClean + ".";
                }
            }

            data.apiFailed = false;
            data.errorMessage = "";

        } catch (apiError) {
            gs.error("AI Summary API error: " + apiError.message);
            data.order = null;
            data.apiFailed = true;
            data.errorMessage = "We couldn't retrieve the order summary at this time. Please try again.";
        }
        return;
    }
})();
