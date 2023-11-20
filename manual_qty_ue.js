/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/search'],
    /**
   * @param{record} record
   * @param{runtime} runtime
   */
    (record, runtime, search) => {
        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            log.debug('------ [START] ------', { type: scriptContext.type, executionContext: runtime.executionContext });
            let scriptObj = runtime.getCurrentScript();
            let getScriptParameterSubsidiary = scriptObj.getParameter({ name: 'custscript_jcs_sbsdry_fltrng' }) ? parseFloatOrZero(scriptObj.getParameter({ name: 'custscript_jcs_sbsdry_fltrng' })) : '';
            let getScriptParameterUser = scriptObj.getParameter({ name: 'custscript_jcs_usr_fltrng' }) ? parseFloatOrZero(scriptObj.getParameter({ name: 'custscript_jcs_usr_fltrng' })) : '';

            var currentUser = getUserInfo();
            log.emergency({
                title: 'runtime exec and user',
                details: {
                    scriptContextType: scriptContext.type,
                    execContext: runtime.executionContext,
                    currentUser: currentUser
                }
            });
            let rec = scriptContext.newRecord
            let oldRec = scriptContext.oldRecord
            var subsidiary = rec.getValue('subsidiary');
            log.debug("subsidiary", subsidiary);
            //adding validation to only run script if subsidiary is == 2 (DDC subsidiary)
            if (subsidiary != '2') {
                return;
            }
            let lineCount = rec.getLineCount({ sublistId: 'item' })
            log.debug('>>>', 'lineCount1: ' + lineCount)
            try {
                for (var i = 0; i < lineCount; i++) {
                    var quantity = rec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i })
                    var amount = rec.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i })
                    //var rate = rec.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i })
                    log.debug('amount', amount)
                    log.debug('quantity', quantity)
                    log.debug('rate', amount / quantity)
                    if (quantity == 0) {
                        rec.setSublistValue({ sublistId: 'item', fieldId: 'rate', line: i, value: 0 })
                    }
                    else {
                        rec.setSublistValue({ sublistId: 'item', fieldId: 'rate', line: i, value: (amount / quantity) })
                    }

                }

            } catch (error) {
                log.debug('error', error)
            }

            if ((runtime.executionContext != 'SUITELET' && scriptContext.type == 'edit') ||
                (currentUser.user_internalid === getScriptParameterUser && runtime.executionContext === 'WEBSERVICES' && scriptContext.type == 'edit') ||
                (currentUser.user_subsidiary === getScriptParameterSubsidiary && scriptContext.type == 'edit')) {
                try {

                    for (let i = 0; i < lineCount; i++) {
                        let itemId = rec.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i })
                        log.debug('>>>', 'itemId: ' + itemId)

                        if (itemId != -3 && itemId != 10892 && itemId != 10893) {
                            let projectTaskItem = search.lookupFields({
                                type: search.Type.ITEM,
                                id: itemId,
                                columns: ['custitem_ddc_project_task_cb', 'type']
                            })

                            log.debug('>>>', 'projectTaskItem.type: ' + JSON.stringify(projectTaskItem))
                            if (projectTaskItem.type[0].value != 'Description') {

                                log.debug('>>>', 'projectTaskItem.type[0].value != Description')

                                let qty = parseFloatOrZero(rec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i }))
                                let actual_qty = parseFloatOrZero(rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_actual_qty', line: i }))
                                let manual_qty = parseFloatOrZero(rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_billable_qty_manual', line: i }))
                                let old_manual_qty = parseFloatOrZero(oldRec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_billable_qty_manual', line: i }))

                                log.debug('>>>', 'projectTaskItem.custitem_ddc_project_task_cb: ' + projectTaskItem.custitem_ddc_project_task_cb)
                                log.debug('>>>', 'old_manual_qty vs manual_qty: ' + old_manual_qty + ' ' + manual_qty)
                                if (projectTaskItem.custitem_ddc_project_task_cb) {
                                    if (manual_qty > 0) {
                                        if (old_manual_qty != manual_qty) {
                                            log.debug('>>>', 'projectTaskItem.custitem_ddc_project_task_cb: && manual_qty == true ' + manual_qty)
                                            rec.setSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i, value: manual_qty })
                                            log.debug('>>>', { line: i, manual_qty })
                                        }
                                    }
                                } else {
                                    if (manual_qty > 0) {
                                        if (old_manual_qty != manual_qty) {
                                            log.debug('>>>', 'else && old_manual_qty != manual_qty == true ' + manual_qty)
                                            rec.setSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i, value: manual_qty })
                                            log.debug('>>>', { line: i, manual_qty })
                                        }
                                    } else if (manual_qty == 0 && actual_qty > 0) {
                                        log.debug('>>>', 'manual_qty == 0 && actual_qty > 0 ')

                                        //GR 25-01-2023 - adding next line for Prebill Qty - field backup when updating Actual
                                        rec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_prebill_qty', line: i, value: actual_qty })
                                        rec.setSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i, value: actual_qty })
                                        var quantity = rec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i })
                                        var amount = rec.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i })
                                        //var rate = rec.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i })
                                        rec.setSublistValue({ sublistId: 'item', fieldId: 'rate', line: i, value: (amount / quantity) })
                                        //rec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_manual_rate_storage', line: i, value: rate })
                                        rec.setSublistValue({ sublistId: 'item', fieldId: 'amount', line: i, value: amount })
                                        log.debug('>>>', { line: i, actual_qty })

                                    }
                                }
                            }
                        }

                    }
                } catch (e) {
                    log.debug('Error beforeSubmit', e.message)
                }
                log.debug('------ [END] ------')
            }


        }

        //  const beforeLoad = (scriptContext) => {
        //     log.debug('before load')

        //     let rec = scriptContext.newRecord
        //     let lineCount = rec.getLineCount({ sublistId: 'item' })

        //     for (let i = 0; i < lineCount; i++) {
        //         let manual_qty = rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_manual_qty', line: i })
        //         if (!manual_qty) {
        //             var qtyField = rec.getSublistField({
        //                 sublistId: 'item',
        //                 fieldId: 'quantity',
        //                 line: lineCount
        //             });
        //             qtyField.isDisabled = true;
        //         }
        //     }
        //  }

        const parseFloatOrZero = n => parseFloat(n) || 0

        const getUserInfo = () => {
            let getUser = runtime.getCurrentUser();
            let userData = {
                user_subsidiary: getUser.subsidiary,
                user_internalid: getUser.id
            }
            return userData
        }

        return { beforeSubmit }

    });