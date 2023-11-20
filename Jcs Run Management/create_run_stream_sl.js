/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/render', 'N/url', 'N/file', 'N/search', 'N/record', "N/https", "N/http", 'N/format', 'N/xml', '/SuiteScripts/lib/ns.utils', 'N/task', 'N/ui/message', 'N/runtime'], function (serverWidget, render, url, file, search, record, https, http, format, xml, ns_utils, task, message, runtime) {
    function onRequest(context) {
        var request = context.request;
        var jobId = context.request.parameters.jobId
        log.debug("jobId", jobId)
        var parameters = request.parameters;
        var response = context.response;
        var action = parameters.action;
        if (context.request.method == "GET") {
            try {
                var recordData = record.load({
                    id: jobId,
                    type: 'salesorder'
                });
                log.debug("recordData", recordData)
                var form = showMainPageRequest(recordData);
                response.writePage(form);

            } catch (error) {
                log.debug("error", error)
            }

        }
        else {
            log.debug("post", "post");
            var runDetailPost = context.request.parameters.custpage_data_detail_group
            var jobId = context.request.parameters.custpage_jobid
            if (runDetailPost) {
                runDetailPost = JSON.parse(runDetailPost);
            }
            var count = context.request.getLineCount({
                group: 'custpage_sublist'
            });
            var arrPost = []
            for (var i = 0; i < count; i++) {
                var isCreate = context.request.getSublistValue({
                    group: 'custpage_sublist',
                    line: i,
                    name: 'custpage_updateduedate'
                })
                log.debug("isCreate", isCreate);
                if (isCreate == true || isCreate == 'T') {
                    var runId = context.request.getSublistValue({
                        group: 'custpage_sublist',
                        line: i,
                        name: 'custpage_run_id'
                    })
                    var streamName = context.request.getSublistValue({
                        group: 'custpage_sublist',
                        line: i,
                        name: 'custpage_stream_name'
                    })
                    var streamNumber = context.request.getSublistValue({
                        group: 'custpage_sublist',
                        line: i,
                        name: 'custpage_stream_number'
                    })
                    var startDate = context.request.getSublistValue({
                        group: 'custpage_sublist',
                        line: i,
                        name: 'custpage_start_date'
                    })
                    var endDate = context.request.getSublistValue({
                        group: 'custpage_sublist',
                        line: i,
                        name: 'custpage_end_date'
                    })
                    var approvalStatus = context.request.getSublistValue({
                        group: 'custpage_sublist',
                        line: i,
                        name: 'custpage_production_approval_status'
                    })
                    arrPost.push({
                        custrecord_ddc_run_id: runId,
                        custrecord_ddc_rd_stream_name: streamName,
                        custrecord_ddc_rd_stream_number: streamNumber,
                        custrecord_ddc_run_planned_startdate: startDate,
                        custrecord_ddc_run_planned_enddate: endDate,
                        approvalStatus: approvalStatus
                    })
                }


            }
            var result = runDetailPost.filter(o => arrPost.some(({ custrecord_ddc_run_id, custrecord_ddc_rd_stream_name, custrecord_ddc_rd_stream_number }) => o.custrecord_ddc_run_id === custrecord_ddc_run_id && o.custrecord_ddc_rd_stream_name === custrecord_ddc_rd_stream_name && o.custrecord_ddc_rd_stream_number === custrecord_ddc_rd_stream_number));
            for (var i = 0; i < result.length; i++) {
                for (var j = 0; j < arrPost.length; j++) {
                    if (result[i].custrecord_ddc_run_id == arrPost[j].custrecord_ddc_run_id
                        && result[i].custrecord_ddc_rd_stream_name == arrPost[j].custrecord_ddc_rd_stream_name
                        && result[i].custrecord_ddc_rd_stream_number == arrPost[j].custrecord_ddc_rd_stream_number
                    ) {

                        result[i].custrecord_ddc_run_planned_startdate = arrPost[j].custrecord_ddc_run_planned_startdate
                        result[i].custrecord_ddc_run_planned_enddate = arrPost[j].custrecord_ddc_run_planned_enddate
                        var item = result[i].details
                        for (var k = 0; k < item.length; k++) {
                            item[k]['custrecord_ddc_rd_prod_approval_status'] = arrPost[j].approvalStatus;
                        }

                    }
                }
            }

            log.debug("result", result);
            result = mergeIds(result)
            if (result.length == 0) {
                context.response.write("No Run Select!")
                return;
            }
            var taskId = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                params: {
                    custscript_jcs_run_create_stream_jobid: jobId,
                    custscript_jcs_data_run_detail: JSON.stringify(result)
                },
                scriptId: 'customscript_jcs_run_create_stream_mr'
            }).submit()
            log.debug("taskId", taskId);
            if (taskId) {

                // var currentScript = runtime.getCurrentScript();
                // var thisLink = url.resolveScript({
                //     scriptId: currentScript.id,
                //     deploymentId: currentScript.deploymentId,
                //     returnExternalUrl: false
                // });
                // var thisLink = thisLink + "&jobId=" + jobId
                var str = '';
                str += '<html><head><script type="text/javascript">';
                str += "function delay(time) {";
                str += "return new Promise(resolve => setTimeout(resolve, time));"
                str += "}";
                str += "delay(5000).then(() =>{";

                str += 'var win = window.open("","_self");win.close();';
                str += "});";
                str += "</script></head><body></body></html>";

                context.response.write("The Run Creation process has started in the background. <br> Please be patient as processing times may vary. <br> Try refreshing the Job after a few minutes and checking the Run Management tab for the desired output to see if it’s ready. <br><br>This message window will soon close.")
                log.debug('str', str)
                context.response.write(str);
                return;
            }
            else {
                context.response.write("All Job still running waiting for ......!")
            }
            return form;

        }
        log.debug("Finish", "Finish")

    }

    function mergeIds(list) {
        const out = [];
        for (entry of list) {
            const existingEntry = out.find(o => o.custrecord_ddc_run_id === entry.custrecord_ddc_run_id);
            if (existingEntry) {
                existingEntry.details = existingEntry.details.concat(entry.details);
            } else {
                out.push(entry);
            }
        }

        return out;
    }
    function showMainPageRequest(recordData) {
        log.debug("recordData", recordData);
        var jobNo = recordData.getValue({ fieldId: 'custbody_ddc_job_no_without_prefix' })
        var xmlStr = recordData.getValue({ fieldId: 'custbody_ddc_run_schedule_dates' })
        var productionApprovalStatus = recordData.getValue({ fieldId: 'custbody_ddc_production_approvalstatus' })
        log.debug("productionApprovalStatus", productionApprovalStatus)
        var runs = jobRunSchedules(recordData.id, jobNo, xmlStr)
        log.debug("runs", runs);
        var dataForm = [];
        if (runs.length) {
            let runDetailItems = jobRunDetailItems(runs, recordData.id)
            var groupByStream = groupBy(runDetailItems, function (item) {
                return [item.custrecord_ddc_rd_stream_name, item.custrecord_ddc_rd_stream_number];
            });
            runs = runs.map(m => {
                m.custrecord_ddc_run_site = recordData.getValue({ fieldId: 'custbody_ddc_site' })
                m.details = JSON.parse(JSON.stringify(groupByStream))
                return m
            })
            for (var i = 0; i < runs.length; i++) {
                var itemDetail = runs[i].details;
                for (var j = 0; j < itemDetail.length; j++) {
                    var obj = {};
                    var item = itemDetail[j];
                    obj['custrecord_ddc_run_job'] = runs[i].custrecord_ddc_run_job;
                    obj['custrecord_ddc_run_id'] = runs[i].custrecord_ddc_run_id;
                    obj['custrecord_ddc_run_planned_startdate'] = runs[i].custrecord_ddc_run_planned_startdate;
                    obj['custrecord_ddc_run_planned_enddate'] = runs[i].custrecord_ddc_run_planned_enddate;
                    obj['type'] = runs[i].type;
                    obj['id'] = '';
                    obj['custrecord_ddc_run_site'] = runs[i].custrecord_ddc_run_site;
                    obj['custrecord_ddc_rd_stream_name'] = item[0].custrecord_ddc_rd_stream_name
                    obj['custrecord_ddc_rd_stream_number'] = item[0].custrecord_ddc_rd_stream_number
                    obj['details'] = item
                    dataForm.push(obj);
                }


            }

        }

        var form = serverWidget.createForm({ title: 'Create Runs/Streams', hideNavBar: true });
        var sublist = form.addSublist({
            id: 'custpage_sublist',
            type: serverWidget.SublistType.LIST,
            label: 'Runs Stream '
        });
        sublist.addMarkAllButtons();
        sublist.addField({
            id: 'custpage_updateduedate',
            label: 'Create?',
            type: serverWidget.FieldType.CHECKBOX
        });
        sublist.addField({
            id: 'custpage_internalid',
            type: serverWidget.FieldType.TEXT,
            label: 'Internal ID'
        }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });
        sublist.addField({
            id: 'custpage_run_id',
            type: serverWidget.FieldType.TEXT,
            label: 'Run Id'
        })
        sublist.addField({
            id: 'custpage_stream_name',
            type: serverWidget.FieldType.TEXT,
            label: 'Stream Name'
        })
        sublist.addField({
            id: 'custpage_stream_number',
            type: serverWidget.FieldType.TEXT,
            label: 'Stream Number'
        })

        sublist.addField({
            id: 'custpage_start_date',
            type: serverWidget.FieldType.DATE,
            label: 'Start Date'
        }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
        sublist.addField({
            id: 'custpage_end_date',
            type: serverWidget.FieldType.DATE,
            label: 'Lodgement Date'
        }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });

        var productionApprovaleStatus = sublist.addField({
            id: 'custpage_production_approval_status',
            type: serverWidget.FieldType.SELECT,
            label: 'Production Approval Status',
            source: 'customlist_ddc_product_approval_status',
        }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
        productionApprovaleStatus.defaultValue = productionApprovalStatus

        var jsonData = form.addField({
            id: 'custpage_data_detail_group',
            type: serverWidget.FieldType.RICHTEXT,
            label: 'Data Group Run Detail'
        }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });
        jsonData.defaultValue = JSON.stringify(dataForm)

        var jobId = form.addField({
            id: 'custpage_jobid',
            type: serverWidget.FieldType.TEXT,
            label: 'Data Group Run Detail'
        }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });
        jobId.defaultValue = recordData.id
        for (var i = 0; i < dataForm.length; i++) {
            sublist.setSublistValue({ id: 'custpage_run_id', line: i, value: dataForm[i].custrecord_ddc_run_id });
            sublist.setSublistValue({ id: 'custpage_stream_name', line: i, value: dataForm[i].custrecord_ddc_rd_stream_name });
            sublist.setSublistValue({ id: 'custpage_stream_number', line: i, value: dataForm[i].custrecord_ddc_rd_stream_number });
            sublist.setSublistValue({ id: 'custpage_start_date', line: i, value: format.format({ value: (dataForm[i].custrecord_ddc_run_planned_startdate), type: format.Type.DATE }) });
            sublist.setSublistValue({ id: 'custpage_end_date', line: i, value: format.format({ value: (dataForm[i].custrecord_ddc_run_planned_enddate), type: format.Type.DATE }) });
            sublist.setSublistValue({ id: 'custpage_updateduedate', line: i, value: 'T' });
            if (productionApprovalStatus) {
                sublist.setSublistValue({ id: 'custpage_production_approval_status', line: i, value: productionApprovalStatus });
            }

        }
        form.addSubmitButton({
            label: 'Submit'
        });
        return form;
    }
    function groupBy(array, f) {
        var groups = {};
        array.forEach(function (o) {
            var group = JSON.stringify(f(o));
            groups[group] = groups[group] || [];
            groups[group].push(o);
        });
        return Object.keys(groups).map(function (group) {
            return groups[group];
        })
    }
    const jobRunDetailItems = (runs, id) => {
        let runDetailItems = []
        var salesorderSearchObj = search.create({
            type: "salesorder",
            filters:
                [
                    ["type", "anyof", "SalesOrd"],
                    "AND",
                    ["internalid", "anyof", id],
                    "AND",
                    ["custcol_ddc_stream_name", "isnotempty", ""],
                    "AND",
                    ["item.type", "anyof", "Service"],
                    "AND",
                    ["custcol_ddc_work_centre", "noneof", "@NONE@"],
                    "AND",
                    ["custcol_ddc_site", "noneof", "@NONE@"]
                ],
            columns:
                [
                    search.createColumn({ name: "tranid", label: "Document Number" }),
                    search.createColumn({ name: "item", label: "Item" }),
                    search.createColumn({ name: "custcol_ddc_quoted_qty_external", label: "Quantity" }),
                    search.createColumn({ name: "custcol_ddc_stream_name", label: "Stream Name" }),
                    search.createColumn({ name: "custcol_ddc_stream_number", label: "Stream Number" }),
                    search.createColumn({ name: "custcol_ddc_task_group_code", label: "Task Group Code" }), //May 26 add Task Group Code
                    search.createColumn({
                        name: "custcol_ddc_work_centre",
                        label: "Work Centre"
                    }),
                    search.createColumn({
                        name: "custcol_ddc_site",
                        label: "Site"
                    }),
                    search.createColumn({
                        name: "custcol_ddc_item_category",
                        label: "Item Category"
                    }),
                    //search.createColumn({ name: "line", label: "Line ID" }),
                    search.createColumn({ name: "custcol_ddc_item_key_scpq", label: "Item Key" }),
                    search.createColumn({
                        name: "custitem_ddc_throughput_speed",
                        join: "item",
                        label: "Machine Throughput"
                    }),
                    search.createColumn({
                        name: "custitem_ddc_machine_setup",
                        join: "item",
                        label: "Machine Setup Time"
                    }),
                    search.createColumn({
                        name: "custitem_ddc_labour_resources",
                        join: "item",
                        label: "Labour Resources"
                    }),
                    search.createColumn({
                        name: "custitem_ddc_linked_stock_item",
                        join: "item",
                        label: "Linked Stock Code"
                    }),
                    search.createColumn({
                        name: "custitem_ddc_linked_ot_service",
                        join: "item",
                        label: "Linked OT Service"
                    }),
                    search.createColumn({
                        name: "custitem_ddc_third_party_cost",
                        join: "item",
                        label: "3rd Party Cost"
                    }),
                    search.createColumn({
                        name: "custitem_ddc_service_other_cost",
                        join: "item",
                        label: "Order Cost"
                    }),
                ]
        });

        salesorderSearchObj = ns_utils.expandSearch(salesorderSearchObj)

        let linkedItemIDs = []
        let ItemIDMappingPlan = []
        for (let result of salesorderSearchObj) {
            //fix J
            let item = result.getValue({ name: 'item' })
            ItemIDMappingPlan.push(item);
            let linked_stock_item = result.getValue({ name: 'custitem_ddc_linked_stock_item', join: 'item' })
            let linked_ot_service = result.getValue({ name: 'custitem_ddc_linked_ot_service', join: 'item' })
            if (linked_stock_item)
                //linkedItemIDs.push(linked_stock_item)
                ////fix J
                linkedItemIDs.push(item)
            /* if (linked_ot_service)
                linkedItemIDs.push(linked_ot_service) */
        }

        let pwsq = linkedItemIDs.length ? plannedWStockQtyMap(linkedItemIDs) : {}
        let planCal = ItemIDMappingPlan.length ? plannedWPlanQtyMap(ItemIDMappingPlan) : {}
        salesorderSearchObj.forEach(result => {
            let item = result.getValue({ name: 'item' })
            let linked_stock_item = result.getValue({ name: 'custitem_ddc_linked_stock_item', join: 'item' })
            let linked_ot_service = result.getValue({ name: 'custitem_ddc_linked_ot_service', join: 'item' })
            let txQty = parseFloatOrZero(result.getValue({ name: 'custcol_ddc_quoted_qty_external' }))
            let plannedQty = txQty / (runs.length)
            let setupTime = parseFloatOrZero(result.getValue({ name: 'custitem_ddc_machine_setup', join: 'item' }))
            let machineHrs = txQty / parseFloatOrZero(result.getValue({ name: 'custitem_ddc_throughput_speed', join: 'item' }))
            let setupPlusHrs = setupTime + machineHrs
            let laborResources = parseFloatOrZero(result.getValue({ name: 'custitem_ddc_labour_resources', join: 'item' }))
            let rdPartyCost = parseFloatOrZero(result.getValue({ name: 'custitem_ddc_third_party_cost', join: 'item' }))
            let otherCost = parseFloatOrZero(result.getValue({ name: 'custitem_ddc_service_other_cost', join: 'item' }))
            let plannedTotalLabourHr = setupPlusHrs * laborResources
            let taskGroupCode = result.getValue({ name: 'custcol_ddc_task_group_code' }) //May 16 Added task group code
            let obj = {
                custrecord_ddc_rd_parent_run: '',
                custrecord_ddc_rd_item: item,
                custrecord_ddc_rd_task_group_code: taskGroupCode, //May 26 added task group code
                custrecord_ddc_rd_stream_name: result.getValue({ name: 'custcol_ddc_stream_name' }),
                custrecord_ddc_rd_stream_number: result.getValue({ name: 'custcol_ddc_stream_number' }),
                custrecord_ddc_rd_work_centre: result.getValue({ name: 'custcol_ddc_work_centre' }),
                custrecord_ddc_rd_site: result.getValue({ name: 'custcol_ddc_site' }),
                custrecord_ddc_rd_item_category: result.getValue({ name: 'custcol_ddc_item_category' }),
                custrecord_ddc_rd_planned_qty: plannedQty,
                //custrecord_ddc_rd_lineid: result.getValue({ name: 'line' }),
                custrecord_ddc_rd_lineid: result.getValue({ name: 'custcol_ddc_item_key_scpq' }),
                custrecord_ddc_rd_planned_mc_throughput: result.getValue({ name: 'custitem_ddc_throughput_speed', join: 'item' }),
                custrecord_ddc_rd_planned_setup_time: setupTime,
                custrecord_ddc_rd_planned_run_machine_hr: machineHrs,
                custrecord_ddc_rd_planned_total_mach_hr: setupPlusHrs,
                custrecord_ddc_rd_planned_labour_res: laborResources,
                custrecord_ddc_rd_planned_labour_tp: plannedQty / plannedTotalLabourHr,
                custrecord_ddc_rd_planned_total_lab_hr: plannedTotalLabourHr,
                custrecord_ddc_rd_planned_w_stock_qty: '',
                custrecord_ddc_rd_planned_calc_cost: '',
                custrecord_ddc_rd_3rd_party_cost: rdPartyCost,
                custrecord_ddc_rd_other_cost: otherCost,
                type: 'customrecord_ddc_run_detail',
                id: ''
            }
            log.debug("dkm1 obj ", obj);
            if (pwsq[item]) {
                let rdFormula = pwsq[item]
                if (rdFormula) {
                    log.debug("co formular", "co forumlar")
                    for (key in obj)
                        rdFormula = rdFormula.replace(`{${key}}`, obj[key])
                    try {
                        log.debug("rdFormula", rdFormula);
                        obj.custrecord_ddc_rd_planned_w_stock_qty = eval(rdFormula)
                    } catch (e) { }
                } else {
                    log.debug(" kko formular", "ko forumlar")
                    obj.custrecord_ddc_rd_planned_w_stock_qty = plannedQty
                }
            }
            if (planCal[item]) {
                let rdFormula = planCal[item]
                if (rdFormula) {
                    log.debug("co formular planCal", "co forumlar")
                    for (key in obj)
                        rdFormula = rdFormula.replace(`{${key}}`, obj[key])
                    try {
                        log.debug("rdFormula", rdFormula);
                        obj.custrecord_ddc_rd_planned_calc_cost = eval(rdFormula)
                    } catch (e) { }
                } else {
                    log.debug(" kko formular", "ko forumlar")
                    obj.custrecord_ddc_rd_planned_calc_cost = 0
                }
            }
            log.debug("dkm", obj);
            runDetailItems.push(obj)
        });
        log.debug("runDetailItems before remove", runDetailItems)
        var runDetailItemsNoteIncludPostage = runDetailItems.filter(x => x.custrecord_ddc_rd_item_category != "20");
        log.debug("runDetailItemsNoteIncludPostage", runDetailItemsNoteIncludPostage)
        var runDetailItemsIncludePostage = runDetailItems.filter(x => x.custrecord_ddc_rd_item_category == "20");
        log.debug("runDetailItemsIncludePostage", runDetailItemsIncludePostage)
        runDetailItemsIncludePostage = runDetailItemsIncludePostage.filter(
            (obj, index) =>
                runDetailItemsIncludePostage.findIndex((item) => item.custrecord_ddc_rd_item_category === obj.custrecord_ddc_rd_item_category && item.custrecord_ddc_rd_stream_name === obj.custrecord_ddc_rd_stream_name) === index
        );
        log.debug("runDetailItemsIncludePostage remove duplicate", runDetailItemsIncludePostage)
        Array.prototype.push.apply(runDetailItemsNoteIncludPostage, runDetailItemsIncludePostage);
        runDetailItems = runDetailItemsNoteIncludPostage
        log.debug("runDetailItems affter remove", runDetailItems)
        // Map work centre fields
        if (runDetailItems.length) {
            let xFilters = [
                ['internalid', 'anyof', Array.from(new Set(runDetailItems.map(m => m.custrecord_ddc_rd_work_centre)))]
            ]
            let wcMap = workCentreMap(xFilters)
            for (runDetailItem of runDetailItems) {
                let idx = wcMap.findIndex(fi => fi.id == runDetailItem.custrecord_ddc_rd_work_centre)
                if (idx > -1) {
                    runDetailItem.custrecord_ddc_rd_sched_seq = wcMap[idx].scheduleSequence
                    runDetailItem.custrecord_ddc_rd_planned_machine = wcMap[idx].plannedMachine
                    runDetailItem.custrecord_ddc_rd_machine_hour_rate = wcMap[idx].machineRate
                    runDetailItem.custrecord_ddc_rd_labour_hour_rate = wcMap[idx].labourRate
                    runDetailItem.custrecord_ddc_rd_labour_oh_rate = wcMap[idx].labourOHRate
                }
            }
        }
        log.debug(`JobId:${id} => Run detail items`, runDetailItems)
        return runDetailItems
    }
    const plannedWStockQtyMap = ids => {
        log.debug('Linked item ids', ids)

        let columns = [],
            itemColumns = [],
            formulaMap = {}

        search.create({
            type: 'customrecord_ddc_weighted_stock_formula',
            columns: ['custrecord_ddc_wsf_formula_coded_rd']
        })
            .run().each(each => {
                formulaMap[each.id] = each.getValue({ name: 'custrecord_ddc_wsf_formula_coded_rd' })
                if (formulaMap[each.id]) {
                    try {
                        columns = columns.concat(formulaMap[each.id]
                            .replace(/ /g, '')
                            .split(/{|}|\+|\-|\*|\/|\(|\)/g)
                            .filter(f => f.length))
                    } catch (e) {
                    }
                }
                return true
            })
        columns = Array.from(new Set(columns))
        itemColumns = columns.filter(f => f.match(/custitem/))

        let map = {}
        search.create({
            type: 'item',
            filters: [
                ['internalid', 'anyof', ids],
                'AND',
                ['custitem_ddc_weighted_stock_formula', 'noneof', ['@NONE@', '']]
            ],
            columns: ['custitem_ddc_weighted_stock_formula'].concat(itemColumns)
        })
            .run().each(each => {
                map[each.id] = formulaMap[each.getValue({ name: 'custitem_ddc_weighted_stock_formula' })]
                for (itemColumn of itemColumns)
                    map[each.id] = map[each.id].replace(`{${itemColumn}}`, parseFloatOrZero(each.getValue({ name: itemColumn })))
                return true
            })
        log.debug('Linked Items map', map)
        return map
    }
    const plannedWPlanQtyMap = ids => {
        log.debug('Linked item ids', ids)

        let columns = [],
            itemColumns = [],
            formulaMap = {}

        search.create({
            type: 'customrecord_ddc_costing_formula_list',
            columns: ['custrecord_ddc_cfl_formula_coded_rd_plan']
        })
            .run().each(each => {
                formulaMap[each.id] = each.getValue({ name: 'custrecord_ddc_cfl_formula_coded_rd_plan' })
                if (formulaMap[each.id]) {
                    try {
                        columns = columns.concat(formulaMap[each.id]
                            .replace(/ /g, '')
                            .split(/{|}|\+|\-|\*|\/|\(|\)/g)
                            .filter(f => f.length))
                    } catch (e) {
                    }
                }
                return true
            })
        columns = Array.from(new Set(columns))
        itemColumns = columns.filter(f => f.match(/custitem/))

        let map = {}
        search.create({
            type: 'item',
            filters: [
                ['internalid', 'anyof', ids],
                'AND',
                ['custitem_ddc_costing_formula', 'noneof', ['@NONE@', '']]
            ],
            columns: ['custitem_ddc_costing_formula'].concat(itemColumns)
        })
            .run().each(each => {
                map[each.id] = formulaMap[each.getValue({ name: 'custitem_ddc_costing_formula' })]
                for (itemColumn of itemColumns)
                    map[each.id] = map[each.id].replace(`{${itemColumn}}`, parseFloatOrZero(each.getValue({ name: itemColumn })))
                return true
            })
        log.debug('Linked Items map', map)
        return map
    }
    const workCentreMap = xFilters => {
        let map = []
        var customrecord_ddc_work_centreSearchObj = search.create({
            type: "customrecord_ddc_work_centre",
            filters: xFilters,
            columns:
                [
                    search.createColumn({
                        name: "name",
                        sort: search.Sort.ASC,
                        label: "Name"
                    }),
                    search.createColumn({ name: "scriptid", label: "Script ID" }),
                    search.createColumn({ name: "custrecord_ddc_wcl_site", label: "Site" }),
                    search.createColumn({ name: "custrecord_ddc_wcl_work_centre_group", label: "Work Centre Name" }),
                    search.createColumn({ name: "custrecord_ddc_wcl_item_category", label: "Item Category" }),
                    search.createColumn({ name: "custrecord_ddc_wcl_default_sched_seq", label: "Default Schedule Sequence" }),
                    search.createColumn({ name: "custrecord_ddc_wcl_machine", label: "Machine" }),
                    search.createColumn({ name: "custrecord_ddc_wcl_default_at_site", label: "Default at Site" }),
                    search.createColumn({ name: "custrecord_ddc_wcl_machine_hour_rate", label: "Machine Run Rate" }),
                    search.createColumn({ name: "custrecord_ddc_wcl_labour_rate", label: "Labour Rate" }),
                    search.createColumn({ name: "custrecord_ddc_wcl_labour_oh_rate", label: "Labour OH Rate" })
                ]
        });
        customrecord_ddc_work_centreSearchObj.run().each(function (result) {
            map.push({
                id: result.id,
                workCentreGroup: result.getValue({ name: 'custrecord_ddc_wcl_work_centre_group' }),
                itemCategory: result.getValue({ name: 'custrecord_ddc_wcl_item_category' }),
                scheduleSequence: result.getValue({ name: 'custrecord_ddc_wcl_default_sched_seq' }),
                site: result.getValue({ name: 'custrecord_ddc_wcl_site' }),
                plannedMachine: result.getValue({ name: 'custrecord_ddc_wcl_machine' }),
                machineRate: result.getValue({ name: 'custrecord_ddc_wcl_machine_hour_rate' }),
                labourRate: result.getValue({ name: 'custrecord_ddc_wcl_labour_rate' }),
                labourOHRate: result.getValue({ name: 'custrecord_ddc_wcl_labour_oh_rate' }),
            })
            return true;
        });
        log.debug('WOC map', map)
        return map
    }

    const jobRunSchedules = (id, jobNo, str) => {
        str = removeXMLTagNullValues(str)
        log.debug(`JobId:${id} => XML string`, str)
        log.debug(`JobId:${id} => XML string length`, str.length)

        if (!str.length) return []
        let _runs = []

        let xmlDocument = xml.Parser.fromString({ text: str })
        let runs = xmlDocument.getElementsByTagNameNS({
            namespaceURI: '*',
            localName: 'run'
        })
        for (i in runs) {
            let run = runs[i]
            let r = {}
            r.custrecord_ddc_run_job = id
            r.custrecord_ddc_run_id = `Job${parseInt(jobNo)} Run ${(Number(i) + 1)}` // Ex. Job88 Run 1
            r.custrecord_ddc_run_planned_startdate = ''
            r.custrecord_ddc_run_planned_enddate = ''

            let startDateProperties = run.getElementsByTagNameNS({ namespaceURI: '*', localName: 'startdate' })
            if (startDateProperties.length) {
                let day = startDateProperties[0].getElementsByTagNameNS({ namespaceURI: '*', localName: 'day' })
                let month = startDateProperties[0].getElementsByTagNameNS({ namespaceURI: '*', localName: 'month' })
                let year = startDateProperties[0].getElementsByTagNameNS({ namespaceURI: '*', localName: 'year' })
                day = day && day.length ? day[0].textContent : ''
                month = month && month.length ? month[0].textContent : ''
                year = year && year.length ? year[0].textContent : ''
                if (day != "" && month != "" && year != "") {
                    var starDate = `${day}/${month}/${year}`;
                    r.custrecord_ddc_run_planned_startdate = starDate
                }
                else {
                    r.custrecord_ddc_run_planned_startdate = ""
                }
            }

            let endDateProperties = run.getElementsByTagNameNS({ namespaceURI: '*', localName: 'enddate' })
            if (endDateProperties.length) {
                let day = endDateProperties[0].getElementsByTagNameNS({ namespaceURI: '*', localName: 'day' })
                let month = endDateProperties[0].getElementsByTagNameNS({ namespaceURI: '*', localName: 'month' })
                let year = endDateProperties[0].getElementsByTagNameNS({ namespaceURI: '*', localName: 'year' })
                day = day && day.length ? day[0].textContent : ''
                month = month && month.length ? month[0].textContent : ''
                year = year && year.length ? year[0].textContent : ''
                if (day != "" && month != "" && year != "") {
                    var endDate = `${day}/${month}/${year}`;
                    r.custrecord_ddc_run_planned_enddate = endDate
                }
                else {
                    r.custrecord_ddc_run_planned_enddate = ""
                }
            }
            r.type = 'customrecord_ddc_run'
            r.id = ''
            _runs.push(r)
        }
        // log.debug(`JobId:${id} => runs`, _runs)
        return _runs
    }

    const removeXMLTagNullValues = xmlStr => {
        xmlStr = xmlStr.replace(/\n|\t|\r|&#160;|&nbsp;|  /g, '').replace(/&gt;/g, '>').replace(/&lt;/g, '<')
        let tags = xmlStr.match(/(<.*?>)/gi)
        if (tags) {
            tags = tags.filter(f => !f.match(/\//g)) // Remove end tags
            for (tag of tags)
                xmlStr = xmlStr.replace(`${tag}${tag.replace('<', '</')}`, '')
        }
        return xmlStr
    }


    const parseFloatOrZero = n => parseFloat(n) || 0



    return {
        onRequest: onRequest
    };
});