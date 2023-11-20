/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/email', 'N/log', 'N/record', 'N/runtime', 'N/search', 'N/format', '../lib/ns.utils', 'N/url', 'N/https'],
    /**
     * @param {currentRecord} currentRecord
     * @param {email} email
     * @param {log} log
     * @param {record} record
     * @param {runtime} runtime
     * @param {search} search
     */
    function (currentRecord, email, log, record, runtime, search, format, ns_utils, url, https) {

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type
         * @param {Form} scriptContext.form - Current form
         * @Since 2015.2
         */
        function beforeLoad(scriptContext) {



        }

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function beforeSubmit(scriptContext) {
            log.debug("beforeSubmit", 'beforeSubmit');
            // if (runtime.executionContext == 'SUITELET') {
            //     try {
            //         var newRec = scriptContext.newRecord;
            //         var subsidary = newRec.getValue('subsidiary');
            //         if (subsidary != '2') {
            //             return;
            //         }
            //         var newLineCount = newRec.getLineCount({
            //             sublistId: 'item'
            //         })

            //         var itemArr = []
            //         for (var i = 0; i < newLineCount; i++) {
            //             var itemId = newRec.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
            //             itemArr.push(itemId);
            //         }
            //         //log.debug("itemArr", itemArr);
            //         var itemMap = lookupItems(Array.from(new Set(itemArr)))
            //         //log.debug("itemMap", itemMap);
            //         for (var i = 0; i < newLineCount; i++) {
            //             var itemId = newRec.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
            //             log.debug("itemId", itemId);
            //             if (itemMap[itemId]) {
            //                 log.debug("set value", itemId);
            //                 log.debug("itemMap", itemMap[itemId]);
            //                 newRec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_item_category', value: itemMap[itemId].itemCategory, line: i });
            //                 newRec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_unit_sale', value: itemMap[itemId].itemUnit, line: i })
            //                 newRec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_measure', value: itemMap[itemId].itemMeasure, line: i });
            //                 newRec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_work_centre_group', value: itemMap[itemId].workCenterGroup, line: i });

            //                 newRec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_planned_machine_setup', value: itemMap[itemId].machineSetup, line: i });
            //                 //
            //                 newRec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_planned_labour_resources', value: itemMap[itemId].labourResources, line: i });
            //                 //
            //                 newRec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_planned_machine_tp', value: itemMap[itemId].throughputSpeed, line: i });
            //                 //
            //                 newRec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_third_party_cost', value: itemMap[itemId].partyCost, line: i });
            //                 //
            //                 newRec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_other_cost', value: itemMap[itemId].otherCost, line: i });

            //                 newRec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_margin_category', value: itemMap[itemId].marginCategory, line: i });
            //                 //

            //             }


            //         }
            //     } catch (error) {
            //         log.debug("error", error)
            //     }
            // }
            try {
                var newRec = scriptContext.newRecord;
                var subsidary = newRec.getValue('subsidiary');
                if (subsidary != '2') {
                    return;
                }
                var newLineCount = newRec.getLineCount({
                    sublistId: 'item'
                })
                for (var i = 0; i < newLineCount; i++) {
                    var actual_qty = newRec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_actual_qty', line: i });
                    log.debug("actual_qty", actual_qty);
                    newRec.setSublistValue({ sublistId: 'item', fieldId: 'quantity', value: actual_qty, line: i });
                }

            } catch (error) {
                log.debug('error', error)
            }

        }
        var lookupItems = ids => {
            let map = {}
            search.create({
                type: 'item',
                filters: [
                    ['internalid', 'anyof', ids]
                ],
                columns: [
                    'itemid',
                    'custitem_ddc_item_unit',
                    'custitem_ddc_item_measure',
                    'custitem_ddc_item_category',
                    'custitem_ddc_work_centre_group',
                    'custitem_ddc_margin_category',
                    'custitem_ddc_labour_resources',
                    'custitem_ddc_machine_setup',
                    'custitem_ddc_throughput_speed',
                    'custitem_ddc_third_party_cost',
                    'custitem_ddc_service_other_cost'


                ]
            })
                .run().each(each => {
                    map[each.id] = {
                        type: each.recordType,
                        itemid: each.getValue({ name: 'itemid' }),
                        itemUnit: each.getValue({ name: 'custitem_ddc_item_unit' }),
                        itemMeasure: each.getValue({ name: 'custitem_ddc_item_measure' }),
                        itemCategory: parseInt(each.getValue({ name: 'custitem_ddc_item_category' })) || "",
                        workCenterGroup: each.getValue({ name: 'custitem_ddc_work_centre_group' }),
                        marginCategory: each.getValue({ name: 'custitem_ddc_margin_category' }) || "",
                        labourResources: each.getValue({ name: 'custitem_ddc_labour_resources' }) || "",
                        machineSetup: each.getValue({ name: 'custitem_ddc_machine_setup' }) || "",
                        throughputSpeed: each.getValue({ name: 'custitem_ddc_throughput_speed' }) || "",
                        partyCost: each.getValue({ name: 'custitem_ddc_third_party_cost' }) || "",
                        otherCost: each.getValue({ name: 'custitem_ddc_service_other_cost' || "" }),



                    }
                    return true
                })
            //log.debug('Item Map', map)
            return map
        }
        function afterSubmit(context) {
            try {
                log.debug("afterSubmit", "afterSubmit");
                if (runtime.executionContext == 'SUITELET') {
                    log.debug("runtime.executionContext", runtime.executionContext);
                    var tgType = context.type;
                    if (tgType != "create") return;
                    var newRecord = context.newRecord;
                    var id = newRecord.id;
                    // var rec = record.load({type: newRecord.type, id: id});
                    log.debug(" newRecord.type", newRecord.type);
                    log.debug(" id", newRecord.id);
                    var triggerSuiteletURL = url.resolveScript({
                        scriptId: 'customscript_jcs_trigger_quote_job_sl',
                        deploymentId: 'customdeploy_jcs_trigger_quote_job_sl',
                        returnExternalUrl: true
                    });
                    var response = https.get({
                        url: triggerSuiteletURL + '&rid=' + id + '&rtype=' + newRecord.type,
                        body: ''
                    });
                    log.debug("response", response.body);
                    response = JSON.parse(response.body)
                }


            } catch (e) {
                log.debug("e", e)
            }
        };
        /**
         * Function definition to be triggered before record is loaded.afterSubmit
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */



        return {
            beforeSubmit: beforeSubmit,
            //afterSubmit: afterSubmit

        };

    });
