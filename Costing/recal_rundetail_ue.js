/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/format', 'N/xml', '/SuiteScripts/lib/ns.utils','N/url','N/https'], function (record, search, format, xml, ns_utils,url,https) {


    function afterSubmit(context) {
        log.debug("context.type", context.type);
        try {
            if (context.type == "edit") {
                var newRecord = context.newRecord;
                var transactionId = newRecord.id;
                log.debug("transactionId", transactionId);
                var rec = record.load({
                    type: newRecord.type,
                    id: transactionId
                })
                var parentRun = rec.getValue('custrecord_ddc_rd_parent_run');
                log.debug("parentRun", parentRun);
                var lineid = rec.getValue('custrecord_ddc_rd_lineid');
                var itemID = rec.getValue('custrecord_ddc_rd_item');
                log.debug("itemID", itemID);
                var workCenter = rec.getValue('custrecord_ddc_rd_work_centre');
                log.debug("workCenter", workCenter);
                var workCenterLoad = record.load({
                    type: 'customrecord_ddc_work_centre',
                    id: workCenter
                })
                var itemCaterogry = workCenterLoad.getValue("custrecord_ddc_wcl_item_category")
                var schedSeq = workCenterLoad.getValue("custrecord_ddc_wcl_default_sched_seq")
                log.debug("schedSeq", schedSeq);
                var machine = workCenterLoad.getValue("custrecord_ddc_wcl_machine")
                var machineHourRate = workCenterLoad.getValue('custrecord_ddc_wcl_machine_hour_rate');
                var labourHourRate = workCenterLoad.getValue('custrecord_ddc_wcl_labour_rate');
                var labourOhrate = workCenterLoad.getValue('custrecord_ddc_wcl_labour_oh_rate');
                var site = workCenterLoad.getValue('custrecord_ddc_wcl_site');
                var qtyCompleted = rec.getValue('custrecord_ddc_rd_actual_qty_completed');
                log.debug("qtyCompleted", qtyCompleted)
                var actualRate=rec.getValue('custrecord_ddc_actual_rate');
                log.debug("actualRate", actualRate)
                var actualLabourHr = rec.getValue('custrecord_ddc_rd_actual_labour_hr');
                var actualMachineHours = rec.getValue('custrecord_ddc_rd_actual_machine_hr');
                log.debug("actualMachineHours", actualMachineHours)
                log.debug("actualLabourHr", actualLabourHr)
                rec.setValue("custrecord_ddc_rd_item_category", itemCaterogry)
                rec.setValue("custrecord_ddc_rd_sched_seq", parseInt(schedSeq))
                rec.setValue("custrecord_ddc_rd_planned_machine", machine)
                rec.setValue("custrecord_ddc_rd_machine_hour_rate", machineHourRate)
                rec.setValue("custrecord_ddc_rd_labour_hour_rate", labourHourRate)
                rec.setValue("custrecord_ddc_rd_labour_oh_rate", labourOhrate)
                rec.setValue("custrecord_ddc_rd_site", site);
                let obj = {
                    custrecord_ddc_rd_planned_qty: rec.getValue('custrecord_ddc_rd_planned_qty'),
                    custrecord_ddc_rd_planned_mc_throughput: rec.getValue('custrecord_ddc_rd_planned_mc_throughput'),
                    custrecord_ddc_rd_planned_setup_time: rec.getValue('custrecord_ddc_rd_planned_setup_time'),
                    custrecord_ddc_rd_planned_run_machine_hr: rec.getValue('custrecord_ddc_rd_planned_run_machine_hr'),
                    custrecord_ddc_rd_planned_total_mach_hr: rec.getValue('custrecord_ddc_rd_planned_total_mach_hr'),
                    custrecord_ddc_rd_planned_labour_res: rec.getValue('custrecord_ddc_rd_planned_labour_res'),
                    custrecord_ddc_rd_planned_labour_tp: rec.getValue('custrecord_ddc_rd_planned_labour_tp'),
                    custrecord_ddc_rd_planned_total_lab_hr: rec.getValue('custrecord_ddc_rd_planned_total_lab_hr'),
                    custrecord_ddc_rd_actual_calc_cost: rec.getValue('custrecord_ddc_rd_actual_calc_cost'),
                    custrecord_ddc_rd_actual_qty_completed: rec.getValue('custrecord_ddc_rd_actual_qty_completed'),
                    custrecord_ddc_rd_labour_hour_rate: labourHourRate,
                    custrecord_ddc_rd_labour_oh_rate: labourOhrate,
                    custrecord_ddc_rd_machine_hour_rate: machineHourRate,
                }
                var objRun = search.lookupFields({
                    type: "customrecord_ddc_run",
                    id: parentRun,
                    columns: ['custrecord_ddc_run_job']
                });
                log.debug("objRun", objRun);
                var actualLabourHourSum=0;
                var actualMachineHoursSum=0
                if (objRun.custrecord_ddc_run_job) {
                    var saleOrderId = objRun.custrecord_ddc_run_job[0].value;
                    log.debug("saleOrderId", saleOrderId)
                    var runArr = getRunByJob(saleOrderId);
                    log.debug("runArr", runArr);
                    var runDetailArr = getRunDetail(runArr);
                    log.debug("runDetailArr", runDetailArr);
                    var actualQuantity = runDetailArr.filter(x => x.itemID == itemID && x.lineId == lineid);
                    log.debug("actualQuantity object array ", actualQuantity);
                    //var actualQuantityActualCAlCost = actualQuantity.filter(x => x.internalId != transactionId);
                    actualLabourHourSum = actualQuantity.reduce((n, { actualLabourHours }) => n + actualLabourHours, 0)
                    actualMachineHoursSum = actualQuantity.reduce((n, { actualMachineHours }) => n + actualMachineHours, 0)
                }
                var pwsq = actualWStockQtyMap([itemID])
                log.debug("pwsq1", pwsq);
                if (pwsq) {
                    if (pwsq[itemID]) {
                        let rdFormula = pwsq[itemID]
                        for (key in obj)
                            rdFormula = rdFormula.replace(`{${key}}`, obj[key])
                        log.debug(" eval(fieldFormula dkm1)", eval(rdFormula))
                        rec.setValue("custrecord_ddc_rd_actual_w_stock_qty", eval(rdFormula))
                        // if (eval(rdFormula)) {
                        //     actualWeightedStockQuantitySum += eval(rdFormula)
                        // }

                    }
                }
                if(actualQuantity.length>0){
                    var saleOrderRec = record.load({
                        type: record.Type.SALES_ORDER,
                        id: saleOrderId
                    })
                    var lineNumber = saleOrderRec.findSublistLineWithValue({
                        sublistId: 'item',
                        fieldId: 'line',
                        value: lineid
                    });
                    //log.debug("actualWeightedStockQuantitySum", actualWeightedStockQuantitySum);
                    // saleOrderRec.setSublistValue({
                    //     sublistId: 'item',
                    //     fieldId: 'custcol_ddc_actual_kgs',
                    //     value: actualWeightedStockQuantitySum,
                    //     line: lineNumber
                    // })
                    saleOrderRec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_ddc_actual_labour_hr_total',
                        value: actualLabourHourSum,
                        line: lineNumber
                    })
                    saleOrderRec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_ddc_actual_machine_hr_total',
                        value: actualMachineHoursSum,
                        line: lineNumber
                    })
                    var salesOrderId = saleOrderRec.save();
                    log.debug('update so ',salesOrderId)
                }
                

                var triggerSuiteletURL = url.resolveScript({
                    scriptId: 'customscript_jcs_trigger_quote_job_sl',
                    deploymentId: 'customdeploy_jcs_trigger_quote_job_sl',
                    returnExternalUrl: true
                });
                var response = https.get({
                    url: triggerSuiteletURL + '&rid=' + salesOrderId + '&rtype=' + 'salesorder',
                    body: ''
                });
                log.debug("response", response.body);
                response = JSON.parse(response.body)

                var pwsq = plannedWStockQtyMap([itemID])
                log.debug("pwsq", pwsq);
                if (pwsq) {
                    if (pwsq[itemID]) {
                        let rdFormula = pwsq[itemID]
                        for (key in obj)
                            rdFormula = rdFormula.replace(`{${key}}`, obj[key])
                        log.debug(" eval(fieldFormula dkm2)", eval(rdFormula))
                        rec.setValue("custrecord_ddc_rd_planned_w_stock_qty", eval(rdFormula))

                    }
                }

                var planCal = plannedWPlanQtyMap([itemID])
                log.debug("planCal", planCal);
                if (planCal) {
                    if (planCal[itemID]) {
                        let rdFormula = planCal[itemID]
                        for (key in obj)
                            rdFormula = rdFormula.replace(`{${key}}`, obj[key])
                        log.debug(" eval(fieldFormula dkm3)", eval(rdFormula))
                        rec.setValue("custrecord_ddc_rd_planned_calc_cost", eval(rdFormula))
                    }
                }
                if (actualMachineHours != 0) {
                    rec.setValue("custrecord_ddc_rd_actual_machine_tp", qtyCompleted / actualMachineHours)
                }
                if (actualLabourHr != 0) {
                    rec.setValue("custrecord_ddc_rd_actual_labour_tp", qtyCompleted / actualLabourHr)
                }
                var recid = rec.save();
                log.debug("recid", recid)

            }


        } catch (e) {
            log.debug("e", e)
        }
    };
    const parseFloatOrZero = n => parseFloat(n) || 0
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
        log.debug("formulaMap plannedWStockQtyMap", formulaMap);
        log.debug("columns", columns);
        columns = Array.from(new Set(columns))
        log.debug("set columns", columns);
        itemColumns = columns.filter(f => f.match(/custitem/))
        log.debug("itemColumns", itemColumns);
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
        log.debug('Linked Items map plannedWStockQtyMap', map)
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
        log.debug('Linked Items map plannedWPlanQtyMap', map)
        return map
    }
    const actualWStockQtyMap = ids => {
        log.debug('Linked item ids', ids)

        let columns = [],
            itemColumns = [],
            formulaMap = {}

        search.create({
            type: 'customrecord_ddc_weighted_stock_formula',
            columns: ['custrecord_ddc_wsf_formula_coded_rd_act']
        })
            .run().each(each => {
                formulaMap[each.id] = each.getValue({ name: 'custrecord_ddc_wsf_formula_coded_rd_act' })
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
        log.debug("formulaMap plannedWStockQtyMap", formulaMap);
        log.debug("columns", columns);
        columns = Array.from(new Set(columns))
        log.debug("set columns", columns);
        itemColumns = columns.filter(f => f.match(/custitem/))
        log.debug("itemColumns", itemColumns);
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
        log.debug('Linked Items map plannedWStockQtyMap', map)
        return map
    }
    function getRunByJob(saleOrderId) {
        var runArr = [];
        var searchRun = search.create({
            type: "customrecord_ddc_run",
            filters:
                [
                    ["custrecord_ddc_run_job", "anyof", saleOrderId]
                ],
            columns:
                [
                    search.createColumn({ name: "internalid", label: "Internal ID" })
                ]
        });
        var searchRunCount = searchRun.runPaged().count;
        log.debug("searchRunCount", searchRunCount);
        if (searchRun) {
            var ssResult = getAllResults(searchRun);
            for (var i = 0; i < ssResult.length; i++) {
                var internalid = ssResult[i].id;
                runArr.push(internalid);
            }
        }
        else {
            log.debug(waJcurce, ' Return Null, Search issue');
            return [];
        }
        return runArr;
    }
    function getRunDetail(runArr) {
        var ret = [];
        var runDetailSearch = search.create({
            type: "customrecord_ddc_run_detail",
            filters:
                [
                    ["custrecord_ddc_rd_parent_run", "anyof", runArr]
                ],
            columns:
                [
                    search.createColumn({ name: "custrecord_ddc_rd_item", label: "Item" }),
                    search.createColumn({ name: "custrecord_ddc_rd_actual_qty_completed", label: "Actual Qty Completed" }),
                    search.createColumn({ name: "custrecord_ddc_rd_status", label: "Run Detail Status" }),
                    search.createColumn({ name: "custrecord_ddc_rd_lineid", label: "Line ID" }),
                    search.createColumn({ name: "custrecord_ddc_rd_actual_machine_hr", label: "Actual Machine Hours" }),
                    search.createColumn({ name: "custrecord_ddc_rd_actual_labour_hr", label: "Actual Labour Hours" }),
                    search.createColumn({ name: "custrecord_ddc_rd_actual_calc_cost", label: "Actual Calculated Cost" }),
                    //search.createColumn({ name: "custrecord_ddc_rd_actual_w_stock_qty", label: "Actual Weighted Stock Quantity" })
                ]
        });
        var searchResultCount = runDetailSearch.runPaged().count;
        log.debug("customrecord_ddc_run_detailSearchObj result count", searchResultCount);
        if (runDetailSearch) {
            var ssResult = getAllResults(runDetailSearch);
            for (var i = 0; i < ssResult.length; i++) {
                var internalId = ssResult[i].id;
                var itemID = parseInt(ssResult[i].getValue('custrecord_ddc_rd_item'));
                var actualQuantity = Number(ssResult[i].getValue('custrecord_ddc_rd_actual_qty_completed')) || 0;
                var status = ssResult[i].getValue('custrecord_ddc_rd_status');
                var lineId = parseInt(ssResult[i].getValue('custrecord_ddc_rd_lineid'));
                var actualMachineHours = Number(ssResult[i].getValue('custrecord_ddc_rd_actual_machine_hr')) || 0;
                var actualLabourHours = Number(ssResult[i].getValue('custrecord_ddc_rd_actual_labour_hr')) || 0;
                var actualCalculatedCost = Number(ssResult[i].getValue('custrecord_ddc_rd_actual_calc_cost')) || 0;
                //var actualWeightedStockQuantity = Number(ssResult[i].getValue('custrecord_ddc_rd_actual_w_stock_qty')) || 0;
                ret.push({
                    internalId: internalId,
                    itemID: itemID,
                    actualQuantity: actualQuantity,
                    status: status,
                    lineId: lineId,
                    actualMachineHours: actualMachineHours,
                    actualLabourHours: actualLabourHours,
                    actualCalculatedCost: actualCalculatedCost,
                   // actualWeightedStockQuantity: actualWeightedStockQuantity

                });
            }
        }
        else {
            log.debug(waJcurce, ' Return Null, Search issue');
            return [];
        }
        return ret;
    }
    function getAllResults(search) {
        var results = [];
        var pgSize = 1000;
        var r = search.runPaged({ pageSize: pgSize });
        var numPage = r.pageRanges.length;
        var searchPage;
        var ssResult;
        for (var np = 0; np < numPage; np++) {
            searchPage = r.fetch({ index: np });
            ssResult = searchPage.data;
            if (ssResult != undefined && ssResult != null && ssResult != '') {
                results = results.concat(ssResult);
            }
        }
        return results;

    }
    return {

        afterSubmit: afterSubmit
    };
});