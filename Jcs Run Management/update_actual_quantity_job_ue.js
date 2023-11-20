/**
 *
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
 define(['N/record', 'N/runtime', 'N/search'],
 function (record, runtime, search) {



     /**
      *  Function definition to be triggered after record is submitted.
      *
      * @param {Object} scriptContextS
      * @param {Record} scriptContext.newRecord - New record
      * @param {string} scriptContext.type - Trigger type
      * @param {Form} scriptContext.form - Current form
      * @Since 2015.2
      */
     function afterSubmit(context) {
         try {
             var newRecord = context.newRecord;
             var transactionId = newRecord.id;
             log.debug("transactionId", transactionId);
             var parentRun = newRecord.getValue({ fieldId: 'custrecord_ddc_rd_parent_run' });
             log.debug("parentRun", parentRun);
             var itemIdRunDetail = parseInt(newRecord.getValue({ fieldId: 'custrecord_ddc_rd_item' }));
             log.debug("itemIdRunDetail", itemIdRunDetail);
             log.debug("type of itemIdRunDetail", typeof (itemIdRunDetail));
             if (!itemIdRunDetail) {
                 return;
             }
             //var lineid = parseInt(newRecord.getValue('custrecord_ddc_rd_lineid'));
             var lineid = newRecord.getValue('custrecord_ddc_rd_lineid');
             log.debug("lineid", lineid);
             log.debug("type of lineid", typeof (lineid));
             if (!lineid) {
                 return;
             }
             var objRun = search.lookupFields({
                 type: "customrecord_ddc_run",
                 id: parentRun,
                 columns: ['custrecord_ddc_run_job']
             });
             log.debug("objRun", objRun);
             if (!objRun.custrecord_ddc_run_job) {
                 return;

             }
             var saleOrderId = objRun.custrecord_ddc_run_job[0].value;
             log.debug("saleOrderId", saleOrderId)
             var runArr = getRunByJob(saleOrderId);
             log.debug("runArr", runArr);
             var runDetailArr = getRunDetail(runArr);
             log.debug("runDetailArr", runDetailArr);
             var actualQuantity = runDetailArr.filter(x => x.itemID == itemIdRunDetail && x.lineId == lineid);
             log.debug("actualQuantity object array ", actualQuantity);
             var actualQuantitySum = actualQuantity.reduce((n, { actualQuantity }) => n + actualQuantity, 0)
             log.debug("actualQuantitySum", actualQuantitySum);
             var actualMachineHourSum = actualQuantity.reduce((n, { actualMachineHours }) => n + actualMachineHours, 0)
             log.debug("actualMachineHourSum", actualMachineHourSum);
             var actualLabourHoursSum = actualQuantity.reduce((n, { actualLabourHours }) => n + actualLabourHours, 0)
             log.debug("actualLabourHoursSum", actualLabourHoursSum);
             var actualMachineTp=actualQuantitySum/actualMachineHourSum
            log.debug("actualMachineTp",actualMachineTp);
             var actualQuantityActualCAlCost = actualQuantity.filter(x => x.internalId != transactionId);
             log.debug("actualQuantityActualCAlCost", actualQuantityActualCAlCost);
             var actualCalculatedCostSum = actualQuantityActualCAlCost.reduce((n, { actualCalculatedCost }) => n + actualCalculatedCost, 0)
             log.debug("actualCalculatedCostSum", actualCalculatedCostSum);

             var currentActualCost;
             var runDetailRec = record.load({
                 type: 'customrecord_ddc_run_detail',
                 id: parseInt(transactionId),
             });
             var itemID = runDetailRec.getValue({ fieldId: 'custrecord_ddc_rd_item' });
             if (itemID) {
                 var costingFormulaLookup = search.lookupFields({
                     type: "item",
                     id: itemID,
                     columns: ['custitem_ddc_costing_formula']
                 });
                 log.debug("costingFormulaLookup", costingFormulaLookup);
                 var costingFormulaId
                 var costingFormulaValue = costingFormulaLookup.custitem_ddc_costing_formula
                 if (costingFormulaValue) {
                     if (costingFormulaValue.length > 0) {
                         costingFormulaId = costingFormulaValue[0].value
                     }
                 }
                 else {
                     var costingFormulaId = runDetailRec.getValue({ fieldId: 'custrecord_ddc_rd_costing_formula' });
                 }

                 if (!costingFormulaId) {
                     currentActualCost = parseFloat(newRecord.getValue('custrecord_ddc_rd_actual_calc_cost'));
                     actualCalculatedCostSum = actualCalculatedCostSum + currentActualCost
                 } else {
                     var costingFormulaLookup = search.lookupFields({
                         type: "customrecord_ddc_costing_formula_list",
                         id: costingFormulaId,
                         columns: ['custrecord_ddc_cfl_formula_coded_rd_plan', 'custrecord_ddc_cfl_formula_coded_rd_act']
                     });
                     log.debug("costingFormulaLookup", costingFormulaLookup)
                     var formulaRunDetailAct = costingFormulaLookup.custrecord_ddc_cfl_formula_coded_rd_act;
                     log.debug("formulaRunDetailAct", formulaRunDetailAct);
                     if (formulaRunDetailAct) {
                         var formularRemoveBracketsAct = formulaRunDetailAct.replace(/[{}]/g, '');;
                         log.debug("formularRemoveBracketsAct", formularRemoveBracketsAct);
                         var matchesAct = formulaRunDetailAct.split('{')
                             .filter(function (v) { return v.indexOf('}') > -1 })
                             .map(function (value) {
                                 return value.split('}')[0]
                             })
                         log.debug("matchesAct", matchesAct);
                         var costingRepairAct = search.lookupFields({
                             type: "customrecord_ddc_run_detail",
                             id: transactionId,
                             columns: matchesAct
                         });
                         log.debug("costingRepairAct", costingRepairAct);
                         for (var [key, value] of Object.entries(costingRepairAct)) {
                             if (!value) {
                                value=0
                             }
                             formularRemoveBracketsAct = formularRemoveBracketsAct.replace(key, value);

                         }
                         log.debug("formularRemoveBracketsAct", eval(formularRemoveBracketsAct));
                         actualCalculatedCostSum = actualCalculatedCostSum + eval(formularRemoveBracketsAct)
                     }
                     else {
                         actualCalculatedCostSum = actualCalculatedCostSum + currentActualCost
                     }
                 }

             }

             var saleOrderRec = record.load({
                 type: record.Type.SALES_ORDER,
                 id: saleOrderId
             })
             var lineNumber = saleOrderRec.findSublistLineWithValue({
                 sublistId: 'item',
                 fieldId: 'custcol_ddc_item_key_scpq',
                 value: lineid
             });
             log.debug('lineNumber',lineNumber);
             log.debug('custcol_ddc_actual_qty',actualQuantitySum);
             saleOrderRec.setSublistValue({
                 sublistId: 'item',
                 fieldId: 'custcol_ddc_actual_qty',
                 value: actualQuantitySum,
                 line: lineNumber
             })
             saleOrderRec.setSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                value: actualQuantitySum,
                line: lineNumber
            })
             //var quantity=rec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i })
            //  var amount= saleOrderRec.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: lineNumber })
            //  log.debug('amount',amount);
            //  log.debug('rate',(amount/actualQuantitySum));
            //  saleOrderRec.setSublistValue({ sublistId: 'item', fieldId: 'rate', line: lineNumber, value:(amount/actualQuantitySum)})

             //saleOrderRec.setSublistValue({ sublistId: 'item', fieldId: 'amount', line:lineNumber, value:amount})
             log.debug('custcol_ddc_actual_machine_hr_total',actualMachineHourSum);

             saleOrderRec.setSublistValue({
                 sublistId: 'item',
                 fieldId: 'custcol_ddc_actual_machine_hr_total',
                 value: actualMachineHourSum,
                 line: lineNumber
             })
             log.debug('custcol_ddc_actual_labour_hr_total',actualLabourHoursSum);
             saleOrderRec.setSublistValue({
                 sublistId: 'item',
                 fieldId: 'custcol_ddc_actual_labour_hr_total',
                 value: actualLabourHoursSum,
                 line: lineNumber
             })
             log.debug('actualCalculatedCostSum',actualCalculatedCostSum);
             saleOrderRec.setSublistValue({
                 sublistId: 'item',
                 fieldId: 'custcol_ddc_actual_total_cost',
                 value: actualCalculatedCostSum,
                 line: lineNumber
             })
             saleOrderRec.setSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_ddc_actual_machine_throughput',
                value: actualMachineTp,
                line: lineNumber
            })
            //  let manual_qty = saleOrderRec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_manual_qty', line: lineNumber })
            // if (!manual_qty) {
            //     if (actualQuantitySum) {
            //         saleOrderRec.setSublistValue({
            //             sublistId: 'item',
            //             fieldId: 'quantity',
            //             value: actualQuantitySum,
            //             line: lineNumber
            //         })
            //     }
            //     saleOrderRec.setSublistValue({
            //         sublistId: 'item',
            //         fieldId: 'amount',
            //         value: actualQuantitySum*(saleOrderRec.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: lineNumber }))/saleOrderRec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_unit_sale', line: lineNumber }),
            //         line: lineNumber
            //     })
            // }
             var salesOrderId = saleOrderRec.save();
             log.debug("salesOrderId", salesOrderId);
         } catch (e) {
             log.debug("e", e)
         }
     };
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
                     search.createColumn({name: "custrecord_ddc_rd_actual_machine_tp", label: "Actual Machine Throughput(Calc)"})
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
                 //var lineId = parseInt(ssResult[i].getValue('custrecord_ddc_rd_lineid'));
                 var lineId = ssResult[i].getValue('custrecord_ddc_rd_lineid');
                 var actualMachineHours = Number(ssResult[i].getValue('custrecord_ddc_rd_actual_machine_hr')) || 0;
                 var actualLabourHours = Number(ssResult[i].getValue('custrecord_ddc_rd_actual_labour_hr')) || 0;
                 var actualCalculatedCost = Number(ssResult[i].getValue('custrecord_ddc_rd_actual_calc_cost')) || 0;
                 var actualMachincTp= Number(ssResult[i].getValue('custrecord_ddc_rd_actual_machine_tp')) || 0;
                 ret.push({
                     internalId: internalId,
                     itemID: itemID,
                     actualQuantity: actualQuantity,
                     status: status,
                     lineId: lineId,
                     actualMachineHours: actualMachineHours,
                     actualLabourHours: actualLabourHours,
                     actualCalculatedCost: actualCalculatedCost,
                     actualMachincTp:actualMachincTp
                     //actualWeightedStockQuantity:actualWeightedStockQuantity

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
     return { afterSubmit: afterSubmit };
 });
