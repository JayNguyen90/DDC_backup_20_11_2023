/**
 * @name:                                       customer_rate_card_ue.js
 * @author:                                     Patrick Lising
 * @summary:                                    Script Description
 * @copyright:                                  © Copyright by Jcurve Solutions
 * Date Created:                                Fri Oct 14 2022 8:26:11 AM
 * Change Logs:
 * Date                          Author               Description
 * Fri Oct 14 2022 8:26:11 AM -- Patrick Lising -- Initial Creation
 * Thu Nov 10 2022 9:35:00 AM -- Patrick Lising -- Updating logic based on KT feedback
 * Fri Nov 11 2022 11:21:00 AM -- Patrick Lising -- Adding Manual Rate validation on setting of Rate Schedule
 * Mon Nov 14 2022 9:34:22 AM -- Patrick Lising -- Added Overall Volume handling
 * Fri Nov 25 2022 3:11:22 PM -- Patrick Lising -- Added add new item scenario
 * Wed Nov 30 2022 10:11:22 AM -- Patrick Lising -- Fixed bugs on new item scenario, changed Rate Schedule message
 * Thu Jan 05 2023 09:46:22 AM -- Patrick Lising -- Fixed bugs on manual rate without quantity change
 * Fri Feb 10 2023 10:13:22 AM -- Patrick Lising -- changed manual change field from custcol_ddc_manual_rate to custcol_ddc_manual_rate_change
 * Mon Aug 29 2023 02:22:00 AM -- Junnel Mercado -- v1.1.0 - Added changes on looping item CRC data
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search', './lodash.js', 'N/runtime'], function (record, search, _, runtime) {

    function rate_card_beforeSubmit(context) {
        log.debug('rate_card_beforeSubmit', 'rate_card_beforeSubmit');
        var oldRec = context.oldRecord;
        var newRec = context.newRecord;

        log.debug({
            title: 'newRec type',
            details: 'newRec type: ' + newRec.type
        })

        log.debug({
            title: 'context type',
            details: 'runtime.executionContext type: ' + runtime.executionContext
        })

        log.debug({
            title: 'context type',
            details: 'runtime.ContextType : ' + runtime.ContextType
        })

        if (oldRec && runtime.executionContext != 'SUITELET') {

            //minimum charge logic will be deployed on Run Detail only
            if (newRec.type == 'customrecord_ddc_run_detail') {

                var currentUser = runtime.getCurrentUser();
                var subsidiary = currentUser.subsidiary
                if (subsidiary == '2') {
                    var actualQtyCompleted = newRec.getValue({
                        fieldId: 'custrecord_ddc_rd_actual_qty_completed'
                    })

                    if (actualQtyCompleted > 0) {
                        var runId = newRec.getValue({
                            fieldId: 'custrecord_ddc_rd_parent_run'
                        })

                        var itemId = newRec.getValue({
                            fieldId: 'custrecord_ddc_rd_item'
                        })

                        var jobId = search.lookupFields({
                            type: 'customrecord_ddc_run',
                            id: runId,
                            columns: 'custrecord_ddc_run_job'
                        })

                        var customerId = search.lookupFields({
                            type: 'salesorder',
                            id: jobId.custrecord_ddc_run_job[0].value,
                            columns: 'entity'
                        })

                        //check for parent rate card if no crc for current customer
                        var parentCustomer = search.lookupFields({
                            type: 'customer',
                            id: customerId.entity[0].value,
                            columns: 'parent'
                        })
                        if (parentCustomer) {
                            var parentCustomerId = parentCustomer.parent[0].value
                            var entityIds = [customerId.entity[0].value, parentCustomerId, '600663']
                        } else {
                            var entityIds = [customerId.entity[0].value, '600663']
                        }
                        var parentCrcIds = getCrcId(entityIds)

                        var runCrcDetails = getCrcItemDetails(customerId.entity[0].value, itemId, actualQtyCompleted, parentCrcIds, entityIds)
                        log.emergency({
                            title: 'getCrcItemDetails beforesubmit 1',
                            details: runCrcDetails
                        });
                        log.debug({
                            title: 'runCrcDetails',
                            details: 'runCrcDetails value: ' + JSON.stringify(runCrcDetails)
                        })

                        if (runCrcDetails[0].minCharge) {
                            log.debug({
                                title: 'is minimum charge',
                                details: 'is minimum charge'
                            })

                            var isMinCharge = newRec.getValue({
                                fieldId: 'custrecord_ddc_rd_minimum_charge'
                            })
                            if (!(isMinCharge)) {
                                newRec.setValue({
                                    fieldId: 'custrecord_ddc_rd_minimum_charge',
                                    value: true
                                })

                                newRec.setValue({
                                    fieldId: 'custrecord_ddc_actual_rate',
                                    value: runCrcDetails[0].itemRate
                                })

                                var jobRecObj = record.load({
                                    type: 'salesorder',
                                    id: jobId.custrecord_ddc_run_job[0].value
                                })

                                var lineNum = jobRecObj.findSublistLineWithValue({
                                    sublistId: 'item',
                                    fieldId: 'item',
                                    value: itemId
                                });

                                var currentCount = jobRecObj.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_ddc_minimum_charge_count',
                                    line: lineNum
                                });

                                jobRecObj.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_ddc_minimum_charge_count',
                                    line: lineNum,
                                    value: currentCount + 1
                                });
                                jobRecObj.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_ddc_crc_rate_storage',
                                    line: lineNum,
                                    value: runCrcDetails[0].itemRate
                                });
                                jobRecObj.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_ddc_rollup_amount',
                                    line: lineNum,
                                    value: runCrcDetails[0].itemRate
                                });
                                var jobSave = jobRecObj.save()

                                log.debug({
                                    title: 'jobSave1',
                                    details: 'jobSave value1: ' + jobSave
                                })
                            }
                            else {
                                var jobRecObj = record.load({
                                    type: 'salesorder',
                                    id: jobId.custrecord_ddc_run_job[0].value
                                })

                                var lineNum = jobRecObj.findSublistLineWithValue({
                                    sublistId: 'item',
                                    fieldId: 'item',
                                    value: itemId
                                });

                                jobRecObj.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_ddc_rollup_amount',
                                    line: lineNum,
                                    value: runCrcDetails[0].itemRate
                                });
                                jobRecObj.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_ddc_crc_rate_storage',
                                    line: lineNum,
                                    value: runCrcDetails[0].itemRate
                                });
                                var jobSave = jobRecObj.save()

                                log.debug({
                                    title: 'jobSave2',
                                    details: 'jobSave value2: ' + jobSave
                                })
                            }
                        } else { //update Actual Rate on Run Detail Record using CRC custrecord_ddc_actual_rate

                            log.debug({
                                title: 'not minimum charge',
                                details: 'not minimum charge'
                            })
                            newRec.setValue({
                                fieldId: 'custrecord_ddc_rd_minimum_charge',
                                value: false
                            })
                            newRec.setValue({
                                fieldId: 'custrecord_ddc_actual_rate',
                                value: runCrcDetails[0].itemRate
                            })
                            var jobRecObj = record.load({
                                type: 'salesorder',
                                id: jobId.custrecord_ddc_run_job[0].value
                            })

                            var lineNum = jobRecObj.findSublistLineWithValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                value: itemId
                            });
                            jobRecObj.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ddc_crc_rate_storage',
                                line: lineNum,
                                value: runCrcDetails[0].itemRate
                            });
                            jobRecObj.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ddc_rollup_amount',
                                line: lineNum,
                                value: (actualQtyCompleted / runCrcDetails[0].itemUnit) * runCrcDetails[0].itemRate
                            });
                            var jobSave = jobRecObj.save()

                            log.debug({
                                title: 'jobSave3',
                                details: 'jobSave value:3 ' + jobSave
                            })
                        }
                    }
                }

                //end of Run detail minimum charge logic
            } else {
                //start of transactions logic
                //check if there are changes made to billable qty old vs new rec

                var subsidiary = newRec.getValue('subsidiary');
                log.debug("subsidiary", subsidiary);
                //adding validation to only run script if subsidiary is == 2 (DDC subsidiary)
                if (subsidiary != '2') {
                    return;
                }

                var oldLineCount = oldRec.getLineCount({
                    sublistId: 'item'
                })

                var newLineCount = newRec.getLineCount({
                    sublistId: 'item'
                })

                if (oldLineCount == newLineCount) {

                    log.debug({
                        title: 'oldLineCount == newLineCount',
                        details: 'oldLineCount == newLineCount'
                    })

                    var oldItemArr = []
                    var newItemArr = []

                    log.debug({
                        title: 'oldLineCount value',
                        details: 'oldLineCount value: ' + oldLineCount
                    })

                    for (var i = 0; i < newLineCount; i++) {

                        var oldLineKey = oldRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'lineuniquekey',
                            line: i
                        })

                        var newLineKey = newRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'lineuniquekey',
                            line: i
                        })

                        var oldItemId = oldRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        })

                        var newItemId = newRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        })

                        var oldBillable = oldRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: i
                        })

                        var newBillable = newRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: i
                        })

                        var oldItemType = oldRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'itemtype',
                            line: i
                        })

                        var newItemType = newRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'itemtype',
                            line: i
                        })

                        //check for misc item
                        var oldMiscItem = oldRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_ddc_miscellaneous_item',
                            line: i
                        })

                        var newMiscItem = newRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_ddc_miscellaneous_item',
                            line: i
                        })

                        var setupItem = search.lookupFields({
                            type: 'item',
                            id: newItemId,
                            columns: ['custitem_ddc_setup_item', 'custitem_ddc_costing_formula']
                        })

                        oldItemArr.push({
                            oldLineKey: oldLineKey,
                            oldItemType: oldItemType,
                            oldItemId: oldItemId,
                            oldBillable: oldBillable,
                            setupItem: setupItem.custitem_ddc_setup_item,
                            oldMiscItem: oldMiscItem,
                            costingFormula: setupItem.custitem_ddc_costing_formula
                        })

                        newItemArr.push({
                            newLineKey: newLineKey,
                            newItemType: newItemType,
                            newItemId: newItemId,
                            newBillable: newBillable,
                            setupItem: setupItem.custitem_ddc_setup_item,
                            newMiscItem: newMiscItem,
                            costingFormula: setupItem.custitem_ddc_costing_formula
                        })
                    }

                    log.debug({
                        title: 'newItemArr value',
                        details: newItemArr
                    })

                    if (oldItemArr && newItemArr) {
                        var customerId = newRec.getValue({
                            fieldId: 'entity'
                        })

                        var customerLookUp = search.lookupFields({
                            type: 'customer',
                            id: customerId,
                            columns: ['custentity_ddc_excl_setup_minimum', 'custentity_ddc_overall_volume_charge']
                        })
                        // var volumeCharge = search.lookupFields({
                        //     type: 'customer',
                        //     id: customerId,
                        //     columns: 'custentity_ddc_overall_volume_charge'
                        // })
                        var isExclude = customerLookUp.custentity_ddc_excl_setup_minimum
                        var isVolumeCharge = customerLookUp.custentity_ddc_overall_volume_charge

                        //check for parent rate card if no crc for current customer
                        var parentCustomer = search.lookupFields({
                            type: 'customer',
                            id: customerId,
                            columns: 'parent'
                        })
                        if (parentCustomer) {
                            var parentCustomerId = parentCustomer.parent[0].value
                            var entityIds = [customerId, parentCustomerId, '600663']
                        } else {
                            var entityIds = [customerId, '600663']
                        }
                        var parentCrcIds = getCrcId(entityIds)

                        // Aug 28, 2023 v1.1.0
                        // customerId
                        // parentCrcIds
                        // entityIds
                        let dataCRCItems = loadItemCRCData(parentCrcIds);
                        log.debug('dataCRCItemsdddddddddddddddddd',dataCRCItems);
                        for (var j = 0; j < newItemArr.length; j++) {

                            //do not continue if misc item

                            if (newItemArr[j].newMiscItem == false) {

                                var lineNum = newRec.findSublistLineWithValue({
                                    sublistId: 'item',
                                    fieldId: 'lineuniquekey',
                                    value: newItemArr[j].newLineKey
                                });
                                //if customer has exclude setup when minimum, remove setup item if item after it meets minimum charge qty

                                if (isExclude) {
                                    if (newItemArr[j].setupItem) {
                                        var nextItemId = newItemArr[j + 1].newItemId
                                        var nextNewBillableQty = parseFloat(newItemArr[j + 1].newBillable)
                                        var setupItemDetails = getCrcItemDetails(customerId, nextItemId, nextNewBillableQty, parentCrcIds, entityIds)
                                        log.emergency({
                                            title: 'getCrcItemDetails 2',
                                            details: setupItemDetails
                                        });
                                        var itemType = search.lookupFields({
                                            type: 'item',
                                            id: nextItemId,
                                            columns: 'type'
                                        })
                                        //if InvPart, no need to check minCharge
                                        if (itemType.type[0].value == 'Service' && !(isVolumeCharge)) {
                                            if (setupItemDetails[0].minCharge) {
                                                // log.debug({
                                                //     title: 'remove nextItemId',
                                                //     details: 'remove nextItemId: ' + nextItemId
                                                // })
                                                // newRec.removeLine({
                                                //     sublistId: 'item',
                                                //     line: lineNum
                                                // });


                                                //set setup item qty to 0 if mincharge is true
                                                log.debug({
                                                    title: 'minCh nextItemId',
                                                    details: 'setup item qty set to 0 due to minCharge'
                                                })
                                                newRec.setSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'quantity',
                                                    line: lineNum,
                                                    value: 0
                                                });


                                                continue;
                                            }
                                        }
                                    }
                                }

                                //only handle items where billable qty was changed
                                if (oldItemArr[j].oldBillable != newItemArr[j].newBillable) {
                                    log.debug({
                                        title: 'oldItemArr[i].oldBillable != newItemArr[i].newBillable',
                                        details: oldItemArr[j].oldItemId + ' || ' + oldItemArr[j].oldBillable + ' || ' + newItemArr[j].newBillable
                                    })
                                    var itemId = newItemArr[j].newItemId
                                    var newBillableQty = parseFloat(newItemArr[j].newBillable)
                                    log.debug({
                                        title: 'itemId',
                                        details: 'itemId billable quantity was changed: ' + itemId
                                    })

                                    //get customer rate card details of current customer on Job
                                    if (itemId != -3) {//skip description item
                                        // var itmLookup = search.lookupFields({
                                        //     type: search.Type.ITEM,
                                        //     id: itemId,
                                        //     columns: 'type'
                                        // })

                                        // log.debug({
                                        //     title: 'item Type',
                                        //     details: 'Type: ' + JSON.stringify(itmLookup)
                                        // })

                                        // var itemType = newRec.getSublistValue({
                                        //     sublistId: 'item',
                                        //     fieldId: 'itemtype',
                                        //     line: lineNum
                                        // });

                                        log.debug({
                                            title: 'item Type var ',
                                            details: 'Type: ' + newItemArr[j].newItemType
                                        })
                                        var scriptObj = runtime.getCurrentScript();

                                        if (newItemArr[j].newItemType != 'Description' && (newItemArr[j].newItemType == 'Service' || newItemArr[j].newItemType == "NonInvtPart" || newItemArr[j].newItemType == "InvtPart")) {
                                            var crcItemDetails = getCrcItemDetails(customerId, itemId, newBillableQty, parentCrcIds, entityIds)
                                            log.emergency({
                                                title: 'getCrcItemDetails 3',
                                                details: crcItemDetails
                                            });
                                            log.debug('Remaining governance units after crc item lookup: ' + scriptObj.getRemainingUsage());

                                            log.debug({
                                                title: 'crcItemDetails',
                                                details: 'crcItemDetails value: ' + JSON.stringify(crcItemDetails)
                                            })
                                            var manualRate = newRec.getSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'custcol_ddc_manual_rate_change',
                                                line: lineNum
                                            });
                                            var billableQty = newRec.getSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'quantity',
                                                line: lineNum
                                            });
                                            // var rate = newRec.getSublistValue({
                                            //     sublistId: 'item',
                                            //     fieldId: 'rate',
                                            //     line: lineNum
                                            // });
                                            var rate = newRec.getSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'custcol_ddc_rate',
                                                line: lineNum
                                            });
                                            if (!rate) {
                                                var rate = newRec.getSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'rate',
                                                    line: lineNum
                                                });
                                            }
                                            var unit = newRec.getSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'custcol_ddc_unit_sale',
                                                line: lineNum
                                            });
                                            if (manualRate) {


                                                log.debug('dkm123 rate', rate)
                                                log.debug('dkm123 billableQty', billableQty)
                                                log.debug('dkm123 unit', unit)
                                                log.debug('dkm123', (billableQty * rate) / unit)
                                                newRec.setSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'amount',
                                                    line: lineNum,
                                                    value: (billableQty * rate) / unit
                                                });
                                                continue;
                                            }
                                            //if no CRC details or item is inventory part, set rate to 0
                                            if (crcItemDetails.length == 0) {
                                                log.debug('dkm1234', "dkm1234")
                                                log.debug('dkm1234 manualRate', manualRate)
                                                if (!manualRate) {
                                                    log.debug('dkm12345', "dkm12345")
                                                    newRec.setSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'rate',
                                                        line: lineNum,
                                                        value: 0
                                                    });
                                                    newRec.setSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'custcol_ddc_rate',
                                                        line: lineNum,
                                                        value: 0
                                                    });
                                                }


                                            } else {

                                                //get manual rate
                                                var manualRate = newRec.getSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'custcol_ddc_manual_rate_change',
                                                    line: lineNum
                                                });

                                                log.debug("newItemArr[j]", newItemArr[j])
                                                // //16_06_2023
                                                if (newItemArr[j].costingFormula.length > 0) {
                                                    //if (!manualRate && newItemArr[j].costingFormula[0].value != 9) {
                                                    if (!manualRate) {
                                                        newRec.setSublistValue({
                                                            sublistId: 'item',
                                                            fieldId: 'rate',
                                                            line: lineNum,
                                                            value: crcItemDetails[0].itemRate
                                                        });
                                                        newRec.setSublistValue({
                                                            sublistId: 'item',
                                                            fieldId: 'custcol_ddc_rate',
                                                            line: lineNum,
                                                            value: crcItemDetails[0].itemRate
                                                        });
                                                        // Add 15_11_2023
                                                        var itemUnit = newRec.getSublistValue({
                                                            sublistId: 'item',
                                                            fieldId: 'custcol_ddc_unit_sale',
                                                            line: lineNum
                                                        });    
                                                        if (itemUnit == '1000') {
                                                            log.debug('qty1', newItemArr[j].newBillable)
                                                            var qty = parseFloat(newItemArr[j].newBillable) / 1000
            
                                                            log.debug({
                                                                title: 'quantity not updated, itemUnit == 1000',
                                                                details: qty
                                                            })
            
                                                            newRec.setSublistValue({
                                                                sublistId: 'item',
                                                                fieldId: 'amount',
                                                                line: lineNum,
                                                                value: qty * (crcItemDetails[0].itemRate)
                                                            });
                                                            if (newItemArr[j].newBillable == 0) {
                                                                newRec.setSublistValue({
                                                                    sublistId: 'item',
                                                                    fieldId: 'rate',
                                                                    line: lineNum,
                                                                    value: 0
                                                                });
                                                            }
                                                            else {
                          
                                                                newRec.setSublistValue({
                                                                    sublistId: 'item',
                                                                    fieldId: 'rate',
                                                                    line: lineNum,
                                                                    value: qty * (crcItemDetails[0].itemRate)
                                                                });
                                                            }
            
            
                                                        }
                                                        else {
                                                            log.debug({
                                                                title: 'quantity not updated, itemUnit !=1000',
                                                                details: qty
                                                            })
                                                            var qty = parseFloat(newItemArr[j].newBillable) / itemUnit
                                                            newRec.setSublistValue({
                                                                sublistId: 'item',
                                                                fieldId: 'amount',
                                                                line: lineNum,
                                                                value: qty * (crcItemDetails[0].itemRate)
                                                            });
                                                            if (newItemArr[j].newBillable == 0) {
                                                                newRec.setSublistValue({
                                                                    sublistId: 'item',
                                                                    fieldId: 'rate',
                                                                    line: lineNum,
                                                                    value: 0
                                                                });
                                                            }
                                                            else {
                                                            
                                                                newRec.setSublistValue({
                                                                    sublistId: 'item',
                                                                    fieldId: 'rate',
                                                                    line: lineNum,
                                                                    value: qty * (crcItemDetails[0].itemRate)
                                                                });
                                                            }
            
                                                        }

                                                    }
                                                }
                                                else {
                                                    newRec.setSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'rate',
                                                        line: lineNum,
                                                        value: 0
                                                    });
                                                    newRec.setSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'custcol_ddc_rate',
                                                        line: lineNum,
                                                        value: 0
                                                    });
                                                }


                                                if (crcItemDetails[0].flatFee) {
                                                    //if flat rate is true, set rate from rate card to amount

                                                    newRec.setSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'custcol_ddc_crc_rate',
                                                        line: lineNum,
                                                        value: crcItemDetails[0].itemRate
                                                    });

                                                    newRec.setSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'amount',
                                                        line: lineNum,
                                                        value: crcItemDetails[0].itemRate
                                                    });

                                                } else if (crcItemDetails[0].itemUnit != '1000' && !(crcItemDetails[0].flatFee) && !(crcItemDetails[0].minCharge)) {

                                                    newRec.setSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'custcol_ddc_crc_rate',
                                                        line: lineNum,
                                                        value: crcItemDetails[0].itemRate
                                                    });

                                                } else if (crcItemDetails[0].itemUnit == '1000' && !(crcItemDetails[0].flatFee) && !(crcItemDetails[0].minCharge)) {

                                                    log.debug({
                                                        title: 'itemUnit == 1000',
                                                        details: 'itemUnit == 1,000. newBillableQty = ' + newBillableQty
                                                    })

                                                    if (newBillableQty >= 1000) {
                                                        newBillableQty = newBillableQty / 1000

                                                        log.debug({
                                                            title: 'newBillableQty >= 1000',
                                                            details: 'newBillableQty >= 1000. newBillableQty = ' + newBillableQty
                                                        })

                                                        newRec.setSublistValue({
                                                            sublistId: 'item',
                                                            fieldId: 'custcol_ddc_crc_rate',
                                                            line: lineNum,
                                                            value: crcItemDetails[0].itemRate
                                                        });
                                                        //16_06_2023

                                                        if (newItemArr[j].costingFormula.length > 0) {
                                                            if (!manualRate && newItemArr[j].costingFormula[0].value) {
                                                                log.debug({
                                                                    title: '!manualRate',
                                                                    details: 'set amount to: crcItemDetails[0].itemRate * newBillableQty'
                                                                })

                                                                newRec.setSublistValue({
                                                                    sublistId: 'item',
                                                                    fieldId: 'amount',
                                                                    line: lineNum,
                                                                    value: crcItemDetails[0].itemRate * newBillableQty
                                                                });

                                                            } else {

                                                                log.debug({
                                                                    title: 'manualRate is true',
                                                                    details: 'set amount to: newRate * newBillableQty'
                                                                })

                                                                // var newRate = newRec.getSublistValue({
                                                                //     sublistId: 'item',
                                                                //     fieldId: 'rate',
                                                                //     line: lineNum
                                                                // });
                                                                var newRate = newRec.getSublistValue({
                                                                    sublistId: 'item',
                                                                    fieldId: 'custcol_ddc_rate',
                                                                    line: lineNum
                                                                });
                                                                if (!newRate) {
                                                                    newRate = newRec.getSublistValue({
                                                                        sublistId: 'item',
                                                                        fieldId: 'rate',
                                                                        line: lineNum
                                                                    });
                                                                }
                                                                newRec.setSublistValue({
                                                                    sublistId: 'item',
                                                                    fieldId: 'amount',
                                                                    line: lineNum,
                                                                    value: newRate * newBillableQty
                                                                });
                                                            }

                                                        }
                                                        else {
                                                            newRec.setSublistValue({
                                                                sublistId: 'item',
                                                                fieldId: 'amount',
                                                                line: lineNum,
                                                                value: 0
                                                            });
                                                        }


                                                    }

                                                }
                                            }
                                        } else {
                                            newRec.setSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'rate',
                                                line: lineNum,
                                                value: 0
                                            });
                                            newRec.setSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'custcol_ddc_rate',
                                                line: lineNum,
                                                value: 0
                                            });
                                            newRec.setSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'amount',
                                                line: lineNum,
                                                value: 0
                                            });
                                        }
                                    }
                                } else { // still check manual rate even if qty is not updated
                                    var itemId = newItemArr[j].newItemId
                                    log.debug({
                                        title: 'itemId quantity not updated',
                                        details: 'itemId: ' + itemId
                                    })

                                    if (itemId != -3) {//skip description item

                                        // var itemType = newRec.getSublistValue({
                                        //     sublistId: 'item',
                                        //     fieldId: 'itemtype',
                                        //     line: lineNum
                                        // });

                                        log.debug({
                                            title: 'item Type var ',
                                            details: 'Type: ' + newItemArr[j].newItemType
                                        })
                                        log.debug({
                                            title: 'item Detai index '+j,
                                            details:  newItemArr[j]
                                        })

                                        if (newItemArr[j].newItemType != 'Description' && ((newItemArr[j].newItemType == 'Service' || newItemArr[j].newItemType == "NonInvtPart" || newItemArr[j].newItemType == "InvtPart"))) {
                                            //J add 13_07
                                            var newBillableQty = newItemArr[j].newBillable
                                            log.debug("dkm vao daysss newBillableQty ", newBillableQty)
                                            //var crcItemDetails = getCrcItemDetails(customerId, itemId, newBillableQty, parentCrcIds, entityIds);
                                            var crcItemDetails = dataCRCItems.filter(val => {
                                                return val.item == itemId
                                            });
                                            log.debug("dkm abc ", crcItemDetails)
                                            crcItemDetails = checkBillableQty(crcItemDetails, newBillableQty)
                                            log.emergency({
                                                title: 'getCrcItemDetails details 4',
                                                details: {
                                                    customerId, // one time load
                                                    itemId, // from item line
                                                    newBillableQty, // from item line
                                                    parentCrcIds, // one time load
                                                    entityIds // one time load
                                                }
                                            });
                                            log.audit({
                                                title: 'getCrcItemDetails details 4',
                                                details: {
                                                    customerId, // one time load                                                  
                                                    parentCrcIds, // one time load
                                                    entityIds // one time load
                                                }
                                            });
                              
                                            log.debug("crcItemDetails dkm1", crcItemDetails)
                                            if (crcItemDetails.length > 0) {
                                                if (newItemArr[j].newItemType == 'Service') {
                                                    log.debug("dkm vao day ", 'dkm vao day')
                                                    log.debug("dkm4", parseFloat(crcItemDetails[0].fromQty) < parseFloat(newBillableQty))
                                                    log.debug('dkm3', parseFloat(crcItemDetails[0].toQty) > parseFloat(newBillableQty))
                                                    var workCenter = newRec.getSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'custcol_ddc_work_centre',
                                                        line: lineNum,
                                                    });
                                                    log.debug('dkm6', workCenter)
                                                    if (!workCenter) {
                                                        if ((parseFloat(crcItemDetails[0].fromQty) < parseFloat(newBillableQty)) && (parseFloat(crcItemDetails[0].toQty) > parseFloat(newBillableQty)) && (crcItemDetails[0].minCharge == true)) {
                                                            newRec.setSublistValue({
                                                                sublistId: 'item',
                                                                fieldId: 'custcol_ddc_minimum_charge_count',
                                                                line: lineNum,
                                                                value: 1
                                                            });
                                                        }
                                                        else {
                                                            newRec.setSublistValue({
                                                                sublistId: 'item',
                                                                fieldId: 'custcol_ddc_minimum_charge_count',
                                                                line: lineNum,
                                                                value: ''
                                                            });
                                                        }
                                                    }
                                                }
                                            }








                                            //log.debug('Remaining governance units after crc item lookup: ' + scriptObj.getRemainingUsage());

                                            //get manual rate
                                            var manualRate = newRec.getSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'custcol_ddc_manual_rate_change',
                                                line: lineNum
                                            });
                                  
                                            log.debug("manualRate Jay ", manualRate)
                                            if (!manualRate && newItemArr[j].costingFormula.length == 0) {
                                                continue;
                                            }
                                            var itemUnit = newRec.getSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'custcol_ddc_unit_sale',
                                                line: lineNum
                                            });
                                            var newRate = newRec.getSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'custcol_ddc_rate',
                                                line: lineNum
                                            });
                                            if (!newRate) {

                                                newRate = newRec.getSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'rate',
                                                    line: lineNum
                                                });
                                                newRec.setSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'custcol_ddc_rate',
                                                    line: lineNum,
                                                    value: newRate
                                                });

                                            }
                                            log.debug({
                                                title: 'newRatedddd',
                                                details: newRate
                                            })
                                            log.debug({
                                                title: 'itemUnit',
                                                details: itemUnit
                                            })
                                          
                                            if (itemUnit == '1000') {
                                                log.debug('qty1', newItemArr[j].newBillable)
                                                var qty = parseFloat(newItemArr[j].newBillable) / 1000

                                                log.debug({
                                                    title: 'quantity not updated, itemUnit == 1000',
                                                    details: qty
                                                })

                                                newRec.setSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'amount',
                                                    line: lineNum,
                                                    value: qty * newRate
                                                });
                                                log.debug('dkmmmmmmmmmmmmmmmmmmmm',qty * newRate)
                                                if (newItemArr[j].newBillable == 0) {
                                                    newRec.setSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'rate',
                                                        line: lineNum,
                                                        value: 0
                                                    });
                                                }
                                                else {
                                                    log.debug('dkmmmmmmmmmmmmmmmmmmmmk',qty * newRate)
                                                    newRec.setSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'rate',
                                                        line: lineNum,
                                                        value: qty * newRate
                                                    });
                                                }


                                            }
                                            else {
                                                log.debug({
                                                    title: 'quantity not updated, itemUnit !=1000',
                                                    details: qty
                                                })
                                                var qty = parseFloat(newItemArr[j].newBillable) / itemUnit
                                                newRec.setSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'amount',
                                                    line: lineNum,
                                                    value: qty * newRate
                                                });
                                                if (newItemArr[j].newBillable == 0) {
                                                    newRec.setSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'rate',
                                                        line: lineNum,
                                                        value: 0
                                                    });
                                                }
                                                else {
                                                
                                                    newRec.setSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'rate',
                                                        line: lineNum,
                                                        value: qty * newRate
                                                    });
                                                }

                                            }
                                            // if(crcItemDetails.length > 0){
                                            //     if(crcItemDetails[0].minCharge==true&&crcItemDetails[0].flatFee==true){
                                            //         newRec.setSublistValue({
                                            //             sublistId: 'item',
                                            //             fieldId: 'custcol_ddc_crc_rate',
                                            //             line: lineNum,
                                            //             value: crcItemDetails[0].itemRate
                                            //         });
                                            //         newRec.setSublistValue({
                                            //             sublistId: 'item',
                                            //             fieldId: 'custcol_ddc_rate',
                                            //             line: lineNum,
                                            //             value: crcItemDetails[0].itemRate
                                            //         });
                                            //         newRec.setSublistValue({
                                            //             sublistId: 'item',
                                            //             fieldId: 'amount',
                                            //             line: lineNum,
                                            //             value: crcItemDetails[0].itemRate
                                            //         });
                                            //     }
                                            // }
                                            
                                        }
                                    }



                                }
                            }
                        }
                    }


                } else if (newLineCount > oldLineCount) { //if new item is added on item sublist
                    log.debug({
                        title: 'newLineCount > oldLineCount',
                        details: 'newLineCount > oldLineCount'
                    })

                    log.debug({
                        title: 'oldLineCount value',
                        details: 'oldLineCount value: ' + oldLineCount
                    })

                    var oldItemArr = []
                    var newItemArr = []

                    for (var i = 0; i < newLineCount; i++) {

                        var oldLineKey = oldRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'lineuniquekey',
                            line: i
                        })

                        var newLineKey = newRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'lineuniquekey',
                            line: i
                        })

                        var oldItemId = oldRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        })

                        var newItemId = newRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        })

                        var oldBillable = oldRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: i
                        })

                        var newBillable = newRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: i
                        })

                        var oldItemType = oldRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'itemtype',
                            line: i
                        })

                        var newItemType = newRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'itemtype',
                            line: i
                        })

                        //check for misc item
                        var oldMiscItem = oldRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_ddc_miscellaneous_item',
                            line: i
                        })

                        var newMiscItem = newRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_ddc_miscellaneous_item',
                            line: i
                        })

                        var setupItem = search.lookupFields({
                            type: 'item',
                            id: newItemId,
                            columns: ['custitem_ddc_setup_item', 'custitem_ddc_costing_formula']
                        })

                        oldItemArr.push({
                            oldLineKey: oldLineKey,
                            oldItemType: oldItemType,
                            oldItemId: oldItemId,
                            oldBillable: oldBillable,
                            setupItem: setupItem.custitem_ddc_setup_item,
                            oldMiscItem: oldMiscItem,
                            costingFormula: setupItem.custitem_ddc_costing_formula
                        })

                        newItemArr.push({
                            newLineKey: newLineKey,
                            newItemType: newItemType,
                            newItemId: newItemId,
                            newBillable: newBillable,
                            setupItem: setupItem.custitem_ddc_setup_item,
                            newMiscItem: newMiscItem,
                            costingFormula: setupItem.custitem_ddc_costing_formula
                        })


                    }

                    var addedItemsArr = newItemArr.filter(({ newLineKey: id1 }) => !oldItemArr.some(({ oldLineKey: id2 }) => id2 === id1)); //get the newly added items from newItemArr

                    log.debug({
                        title: 'array lengths',
                        details: 'addedItemsArr value: ' + addedItemsArr.length + ' newItemArr value: ' + newItemArr.length + ' oldItemArr value: ' + oldItemArr.length
                    })

                    if (addedItemsArr.length > 0) {
                        var customerId = newRec.getValue({
                            fieldId: 'entity'
                        })

                        var customerLookUp = search.lookupFields({
                            type: 'customer',
                            id: customerId,
                            columns: ['custentity_ddc_excl_setup_minimum', 'custentity_ddc_overall_volume_charge']
                        })
                        // var volumeCharge = search.lookupFields({
                        //     type: 'customer',
                        //     id: customerId,
                        //     columns: 'custentity_ddc_overall_volume_charge'
                        // })
                        var isExclude = customerLookUp.custentity_ddc_excl_setup_minimum
                        var isVolumeCharge = customerLookUp.custentity_ddc_overall_volume_charge

                        //check for parent rate card if no crc for current customer
                        var parentCustomer = search.lookupFields({
                            type: 'customer',
                            id: customerId,
                            columns: 'parent'
                        })
                        if (parentCustomer) {
                            var parentCustomerId = parentCustomer.parent[0].value
                            var entityIds = [customerId, parentCustomerId, '600663']
                        } else {
                            var entityIds = [customerId, '600663']
                        }
                        var parentCrcIds = getCrcId(entityIds)

                        var scriptObj = runtime.getCurrentScript();

                        for (var j = 0; j < addedItemsArr.length; j++) {

                            if (addedItemsArr[j].newMiscItem == false) {
                                log.debug('Remaining governance units for item: ' + scriptObj.getRemainingUsage());
                                if (addedItemsArr[j].newItemId != -3) { //skip description item
                                    // var itmLookup = search.lookupFields({
                                    //     type: 'item',
                                    //     id: addedItemsArr[j].newItemId,
                                    //     columns: 'type'
                                    // })

                                    // if (itmLookup.type[0].value != 'Description' && itmLookup.type[0].value != 'InvtPart') {
                                    // var lineNum = newRec.findSublistLineWithValue({
                                    //     sublistId: 'item',
                                    //     fieldId: 'lineuniquekey',
                                    //     value: addedItemsArr[j].newLineKey
                                    // });

                                    // var itemType = newRec.getSublistValue({
                                    //     sublistId: 'item',
                                    //     fieldId: 'itemtype',
                                    //     line: lineNum
                                    // });

                                    log.debug({
                                        title: 'item Type var ',
                                        details: 'Type: ' + addedItemsArr[j].newItemType
                                    })
                                    if (addedItemsArr[j].newItemType != 'Description' && addedItemsArr[j].newItemType == 'Service') {

                                        //var crcItemDetails = getCrcItemDetails(customerId, nextItemId, nextNewBillableQty)
                                        //if customer has exclude setup when minimum, remove setup item if item after it meets minimum charge qty

                                        // var lineNum = newRec.findSublistLineWithValue({
                                        //     sublistId: 'item',
                                        //     fieldId: 'item',
                                        //     value: addedItemsArr[j].newItemId
                                        // });


                                        //get line number, start from the last added item
                                        var lineCtr = j + 1;

                                        var lineNum = newLineCount - lineCtr

                                        log.debug({
                                            title: 'lineNum ',
                                            details: 'lineNum: ' + lineNum
                                        })


                                        if (isExclude) {
                                            if (addedItemsArr[j].setupItem) {
                                                var nextItemId = addedItemsArr[j + 1].newItemId
                                                var nextNewBillableQty = parseFloat(addedItemsArr[j + 1].newBillable)
                                                var setupItemDetails = getCrcItemDetails(customerId, nextItemId, nextNewBillableQty, parentCrcIds, entityIds)
                                                log.emergency({
                                                    title: 'getCrcItemDetails 5',
                                                    details: setupItemDetails
                                                });
                                                log.debug('Remaining governance units after getCrcItemDetails: ' + scriptObj.getRemainingUsage());
                                                var itemType = search.lookupFields({
                                                    type: 'item',
                                                    id: nextItemId,
                                                    columns: 'type'
                                                })
                                                //if InvPart, no need to check minCharge
                                                if (itemType.type[0].value == 'Service' && !(isVolumeCharge)) {
                                                    if (setupItemDetails[0].minCharge) {
                                                        // log.debug({
                                                        //     title: 'remove nextItemId',
                                                        //     details: 'remove nextItemId: ' + nextItemId
                                                        // })
                                                        // newRec.removeLine({
                                                        //     sublistId: 'item',
                                                        //     line: lineNum
                                                        // });


                                                        //set setup item qty to 0 if mincharge is true
                                                        log.debug({
                                                            title: 'minCh nextItemId',
                                                            details: 'setup item qty set to 0 due to minCharge'
                                                        })
                                                        newRec.setSublistValue({
                                                            sublistId: 'item',
                                                            fieldId: 'quantity',
                                                            line: lineNum,
                                                            value: 0
                                                        });


                                                        continue;
                                                    }
                                                }
                                            }
                                        }

                                        // var itemId = addedItemsArr[j].newItemId
                                        var newBillableQty = parseFloat(addedItemsArr[j].newBillable)

                                        var itemId = newRec.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'item',
                                            line: lineNum
                                        });
                                        //J add 02_08_2023
                                        var manalRateLine = newRec.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_ddc_manual_rate_change',
                                            line: lineNum
                                        });
                                        if (manalRateLine) {
                                            continue;
                                        }
                                        //get customer rate card details of current customer on Job

                                        var crcItemDetails = getCrcItemDetails(customerId, itemId, newBillableQty, parentCrcIds, entityIds)
                                        log.emergency({
                                            title: 'getCrcItemDetails 6',
                                            details: crcItemDetails
                                        });
                                        log.debug({
                                            title: 'crcItemDetails',
                                            details: 'crcItemDetails value: ' + JSON.stringify(crcItemDetails)
                                        })

                                        if (crcItemDetails.length == 0) {

                                            newRec.setSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'rate',
                                                line: lineNum,
                                                value: 0
                                            });
                                            newRec.setSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'custcol_ddc_rate',
                                                line: lineNum,
                                                value: 0
                                            });

                                        } else {

                                            var manualRate = newRec.getSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'custcol_ddc_manual_rate_change',
                                                line: lineNum
                                            });

                                            log.debug({
                                                title: 'addedItemsArr',
                                                details: 'addedItemsArr value: ' + JSON.stringify(addedItemsArr)
                                            })

                                            if (!manualRate && addedItemsArr[j].costingFormula[0].value != 9) {
                                                log.debug({
                                                    title: '!manualRate && addedItemsArr[j].costingFormula[0].value != 9',
                                                    details: 'true'
                                                })

                                                newRec.setSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'rate',
                                                    line: lineNum,
                                                    value: crcItemDetails[0].itemRate
                                                });
                                                newRec.setSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'custcol_ddc_rate',
                                                    line: lineNum,
                                                    value: crcItemDetails[0].itemRate
                                                });


                                            }

                                            if (crcItemDetails[0].flatFee) {
                                                //if flat rate is true, set rate from rate card to amount
                                                log.debug({
                                                    title: 'crcItemDetails[0].flatFee',
                                                    details: 'crcItemDetails[0].flatFee value: ' + crcItemDetails[0].flatFee
                                                })
                                                newRec.setSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'custcol_ddc_crc_rate',
                                                    line: lineNum,
                                                    value: crcItemDetails[0].itemRate
                                                });

                                                newRec.setSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'amount',
                                                    line: lineNum,
                                                    value: crcItemDetails[0].itemRate
                                                });

                                            } else if (crcItemDetails[0].itemUnit != '1000' && !(crcItemDetails[0].flatFee) && !(crcItemDetails[0].minCharge)) {

                                                newRec.setSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'custcol_ddc_crc_rate',
                                                    line: lineNum,
                                                    value: crcItemDetails[0].itemRate
                                                });

                                            } else if (crcItemDetails[0].itemUnit == '1000' && !(crcItemDetails[0].flatFee) && !(crcItemDetails[0].minCharge)) {

                                                log.debug({
                                                    title: 'itemUnit == 1000',
                                                    details: 'itemUnit == 1,000. newBillableQty = ' + newBillableQty
                                                })

                                                log.debug({
                                                    title: 'manualRate value',
                                                    details: manualRate
                                                })

                                                if (newBillableQty >= 1000) {
                                                    newBillableQty = newBillableQty / 1000

                                                    log.debug({
                                                        title: 'newBillableQty >= 1000',
                                                        details: 'newBillableQty >= 1000. newBillableQty = ' + newBillableQty
                                                    })

                                                    newRec.setSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'custcol_ddc_crc_rate',
                                                        line: lineNum,
                                                        value: crcItemDetails[0].itemRate
                                                    });

                                                    if (!manualRate && addedItemsArr[j].costingFormula[0].value != 9) {
                                                        log.debug({
                                                            title: '!manualRate',
                                                            details: 'set amount to: ' + crcItemDetails[0].itemRate * newBillableQty
                                                        })

                                                        newRec.setSublistValue({
                                                            sublistId: 'item',
                                                            fieldId: 'amount',
                                                            line: lineNum,
                                                            value: crcItemDetails[0].itemRate * newBillableQty
                                                        });

                                                    } else {

                                                        log.debug({
                                                            title: 'manualRate is true',
                                                            details: 'set amount to: ' + newRate * newBillableQty
                                                        })

                                                        // var newRate = newRec.getSublistValue({
                                                        //     sublistId: 'item',
                                                        //     fieldId: 'rate',
                                                        //     line: lineNum
                                                        // });
                                                        var newRate = newRec.getSublistValue({
                                                            sublistId: 'item',
                                                            fieldId: 'custcol_ddc_rate',
                                                            line: lineNum
                                                        });
                                                        if (!newRate) {
                                                            newRate = newRec.getSublistValue({
                                                                sublistId: 'item',
                                                                fieldId: 'rate',
                                                                line: lineNum
                                                            });
                                                        }
                                                        newRec.setSublistValue({
                                                            sublistId: 'item',
                                                            fieldId: 'amount',
                                                            line: lineNum,
                                                            value: newRate * newBillableQty
                                                        });
                                                    }



                                                }
                                            }
                                        }
                                    } else {
                                        //bug 
                                        // newRec.setSublistValue({
                                        //     sublistId: 'item',
                                        //     fieldId: 'rate',
                                        //     line: lineNum,
                                        //     value: 0
                                        // });
                                    }
                                }
                            }
                        }
                    }
                } // end of newLine > oldLine
            }// end of transactions logic
        }
    }

    function rate_card_afterSubmit(context) {

        var newRec = context.newRecord;


        log.debug({
            title: 'rate_card_afterSubmit context.type',
            details: context.type
        })


        if (newRec.type == 'customrecord_ddc_run_detail' && context.type == 'edit') {

            var actualRunQty = newRec.getValue({
                fieldId: 'custrecord_ddc_rd_actual_qty_completed'
            })

            if (parseFloat(actualRunQty) > 0) {
                var runId = newRec.getValue({
                    fieldId: 'custrecord_ddc_rd_parent_run'
                })

                var itemId = newRec.getValue({
                    fieldId: 'custrecord_ddc_rd_item'
                })

                var jobId = search.lookupFields({
                    type: 'customrecord_ddc_run',
                    id: runId,
                    columns: 'custrecord_ddc_run_job'
                })

                var customerId = search.lookupFields({
                    type: 'salesorder',
                    id: jobId.custrecord_ddc_run_job[0].value,
                    columns: 'entity'
                })

                //check for parent rate card if no crc for current customer
                var parentCustomer = search.lookupFields({
                    type: 'customer',
                    id: customerId.entity[0].value,
                    columns: 'parent'
                })
                if (parentCustomer) {
                    var parentCustomerId = parentCustomer.parent[0].value
                    var entityIds = [customerId.entity[0].value, parentCustomerId, '600663']
                } else {
                    var entityIds = [customerId.entity[0].value, '600663']
                }
                var parentCrcIds = getCrcId(entityIds)

                //set rate schedule field on job
                setRateSchedule(itemId, runId, parentCrcIds, entityIds, actualRunQty)
            }
        }
    }

    function getCrcId(custId) {
        var parentCrcId = {};

        log.debug({
            title: 'custId',
            details: 'custId: ' + custId
        })
        var customrecord_customer_rate_cardSearchObj = search.create({
            type: "customrecord_customer_rate_card",
            filters:
                [
                    ["custrecord_crc_customer", "anyof", custId],"AND", 
                    ["isinactive","is","F"]
                ],
            columns:
                [
                    search.createColumn({ name: "internalid", label: "Internal ID" }),
                    search.createColumn({ name: "custrecord_crc_doc_number", label: "Document Number" }),
                    search.createColumn({ name: "custrecord_crc_customer", label: "Customer" }),
                    search.createColumn({ name: "custrecord_crc_start_date", label: "Contract Start Date" }),
                    search.createColumn({ name: "custrecord_crc_end_date", label: "Contract End Date" })
                ]
        });
        var searchResultCount = customrecord_customer_rate_cardSearchObj.runPaged().count;
        log.debug("customrecord_customer_rate_cardSearchObj result count", searchResultCount);
        customrecord_customer_rate_cardSearchObj.run().each(function (result) {
            var customerId = result.getValue('custrecord_crc_customer')
            parentCrcId[customerId] = result.getValue('internalid')
            // .run().each has a limit of 4,000 results
            return true;
        });

        log.debug({
            title: 'parentCrcId',
            details: 'parentCrcId: ' + JSON.stringify(parentCrcId)
        })

        return parentCrcId
    }

    const loadCrcItemDetail = (itemId, newBillableQty, parentCrcIds, entityIds) => {

    }


    function getCrcItemDetails(customerId, itemId, newBillableQty, parentCrcIds, entityIds) {

        //check for parent rate card if no crc for current customer
        // var parentCustomer = search.lookupFields({
        //     type: 'customer',
        //     id: customerId,
        //     columns: 'parent'
        // })
        // if (parentCustomer) {
        //     var parentCustomerId = parentCustomer.parent[0].value
        //     var entityIds = [customerId, parentCustomerId, '600663']
        // } else {
        //     var entityIds = [customerId, '600663']
        // }
        var itemDetailsArr = []
        // var parentCrcIds = getCrcId(entityIds)
        log.debug("parentCrcIds", parentCrcIds);
        var dataMappingParentObject = getDataMappingParent(parentCrcIds, itemId, newBillableQty);

        //testing array find
        for (var p = 0; p < entityIds.length; p++) {
            if (itemDetailsArr.length == 0) {
                log.debug("entityIds[p] finding", entityIds[p]);
                var matchCustomer = parentCrcIds[entityIds[p]]
                log.debug("matchCustomer", matchCustomer);
                var foundCrcCustomer = dataMappingParentObject.find(parent => parent.parent == matchCustomer)
                if (foundCrcCustomer) {
                    log.debug("foundCrcCustomer", foundCrcCustomer);
                    itemDetailsArr.push({
                        parent: foundCrcCustomer.parent,
                        itemUnit: foundCrcCustomer.itemUnit,
                        itemMeasure: foundCrcCustomer.itemMeasure,
                        itemRate: foundCrcCustomer.itemRate,
                        minCharge: foundCrcCustomer.minCharge,
                        flatFee: foundCrcCustomer.flatFee,
                        fromQty: foundCrcCustomer.fromQty,
                        toQty: foundCrcCustomer.toQty,
                        isMinCharge: foundCrcCustomer.isMinCharge,
                    })
                    break;
                }
            }
        }

        // for (var i = 0; i < dataMappingParentObject.length; i++) {
        //     if (itemDetailsArr.length == 0) {
        //         var data = dataMappingParentObject[i];
        //         log.debug("data", data);
        //         var cutomerRateCardLookup = search.lookupFields({
        //             type: 'customrecord_customer_rate_card',
        //             id: data.parent,
        //             columns: 'custrecord_crc_customer'
        //         }).custrecord_crc_customer

        //         log.debug("cutomerRateCardLookup", cutomerRateCardLookup);



        //         log.debug("cutomerRateCardLookup", cutomerRateCardLookup);

        //         if (cutomerRateCardLookup.length > 0) {
        //             customerRate = cutomerRateCardLookup[0].value;
        //             log.debug("entityIds[i]", entityIds[i]);
        //             log.debug("customerRate", customerRate);

        //             // var foundCrcCustomer = entityIds.find(customer => customer == customerRate)

        //             // log.debug("foundCrc", foundCrcCustomer);
        //             if (entityIds[i] == customerRate) {
        //                 itemDetailsArr.push({
        //                     parent: data.parent,
        //                     itemUnit: data.itemUnit,
        //                     itemMeasure: data.itemMeasure,
        //                     itemRate: data.itemRate,
        //                     minCharge: data.minCharge,
        //                     flatFee: data.flatFee
        //                 })
        //                 break;
        //             }
        //         }
        //         // for (var j = 0; j < data.length; j++) {
        //         //     if (newBillableQty >= data[j].fromQty && newBillableQty <= data[j].toQty) {

        //         //         itemDetailsArr.push({
        //         //             parent: data[j].parent,
        //         //             itemUnit: data[j].itemUnit,
        //         //             itemMeasure: data[j].itemMeasure,
        //         //             itemRate: data[j].itemRate,
        //         //             minCharge: data[j].minCharge,
        //         //             flatFee: data[j].flatFee
        //         //         })

        //         //         log.debug({
        //         //             title: 'BETWEEN FROM AND TO QTY',
        //         //             details: 'BETWEEN FROM AND TO QTY. ITEM ADDED'
        //         //         })

        //         //         break;
        //         //     } else if (isNaN(data[j].fromQty) && isNaN(data[j].toQty)) {

        //         //         itemDetailsArr.push({
        //         //             parent: data[j].parent,
        //         //             itemUnit: data[j].itemUnit,
        //         //             itemMeasure: data[j].itemMeasure,
        //         //             itemRate: data[j].itemRate,
        //         //             minCharge: data[j].minCharge,
        //         //             flatFee: data[j].flatFee
        //         //         })

        //         //         log.debug({
        //         //             title: 'NO FROM AND TO QTY',
        //         //             details: 'NO FROM AND TO QTY. ITEM ADDED'
        //         //         })

        //         //         break;
        //         //     } else if (newBillableQty >= data[j].fromQty && isNaN(data[j].toQty)) {

        //         //         itemDetailsArr.push({
        //         //             parent: data[j].parent,
        //         //             itemUnit: data[j].itemUnit,
        //         //             itemMeasure: data[j].itemMeasure,
        //         //             itemRate: data[j].itemRate,
        //         //             minCharge: data[j].minCharge,
        //         //             flatFee: data[j].flatFee
        //         //         })

        //         //         log.debug({
        //         //             title: 'GREATER THAN FROM QTY BUT NO TO QTY',
        //         //             details: 'GREATER THAN FROM QTY BUT NO TO QTY. ITEM ADDED'
        //         //         })

        //         //         break;

        //         //     }
        //         // }
        //     }

        // }


        // for (var p = 0; p < parentCrcIds.length; p++) {

        //     log.debug({
        //         title: 'checking CRC',
        //         details: 'checking CRC: ' + parentCrcIds[p]
        //     })

        //     log.debug({
        //         title: 'checking itemId',
        //         details: 'checking itemId: ' + itemId
        //     })

        //     var crcItemDetailsObj = search.create({
        //         type: "customrecord_crc_items",
        //         filters:
        //             [
        //                 ["custrecord_crc_parent", "anyof", parentCrcIds[p]],
        //                 "AND",
        //                 ["custrecord_crc_item", "anyof", itemId]
        //             ],
        //         columns:
        //             [
        //                 search.createColumn({ name: "custrecord_crc_parent", label: "Parent CRC" }),
        //                 // search.createColumn({ name: "custrecord_crc_hidden_item_no", label: "Group Item No." }),
        //                 // search.createColumn({ name: "custrecord_crc_item_no", label: "Item No." }),
        //                 search.createColumn({ name: "custrecord_crc_item", label: "Item" }),
        //                 search.createColumn({ name: "custrecord_crc_cust_itemcode", label: "Customer Item Name" }),
        //                 search.createColumn({ name: "custrecord_crc_unit", label: "Unit" }),
        //                 search.createColumn({ name: "custrecord_crc_measure", label: "Measure" }),
        //                 search.createColumn({
        //                     name: "custrecord_crc_from_quantity",
        //                     sort: search.Sort.ASC,
        //                     label: "From Quantity"
        //                 }),
        //                 search.createColumn({ name: "custrecord_crc_to_quantity", label: "To Quantity" }),
        //                 search.createColumn({ name: "custrecord_crc_rate", label: "Rate" }),
        //                 search.createColumn({ name: "custrecord_crc_minimum_charge", label: "Minimum Charge" }),
        //                 search.createColumn({ name: "custrecord_crc_flat_fee", label: "Flat Fee" })
        //             ]
        //     });
        //     resultCount = crcItemDetailsObj.runPaged().count;
        //     log.debug("crcItemDetailsObj result count", resultCount);

        //     //if customer rate card search has results, check which from and to quantity does the item fall under

        //     if (resultCount > 0) {
        //         //var unitConverted = 0;

        //         crcItemDetailsObj.run().each(function (result) {


        //             var fromQty = parseInt(result.getValue('custrecord_crc_from_quantity'))
        //             var toQty = parseInt(result.getValue('custrecord_crc_to_quantity'))
        //             var itemUnit = result.getValue('custrecord_crc_unit')
        //             var itemMeasure = result.getValue('custrecord_crc_measure')
        //             var itemRate = result.getValue('custrecord_crc_rate')
        //             var minCharge = result.getValue('custrecord_crc_minimum_charge')
        //             var flatFee = result.getValue('custrecord_crc_flat_fee')

        //             //customization 6: if the unit is 1,000, divide billable qty by 1000 and check from and to qty does it belong

        //             // if (unitConverted == 0 && itemUnit == '1000') {

        //             //     if(newBillableQty >= 1000){
        //             //         newBillableQty = newBillableQty / 1000 
        //             //     }else{
        //             //         newBillableQty = 1;
        //             //     }

        //             //     log.debug({
        //             //         title: 'itemUnit == 1000',
        //             //         details: 'itemUnit == 1,000. newBillableQty = ' + newBillableQty + '|| toQty = ' + fromQty
        //             //     })

        //             //     unitConverted++
        //             // }

        //             if (newBillableQty >= fromQty && newBillableQty <= toQty) {

        //                 itemDetailsArr.push({
        //                     itemUnit: itemUnit,
        //                     itemMeasure: itemMeasure,
        //                     itemRate: itemRate,
        //                     minCharge: minCharge,
        //                     flatFee: flatFee
        //                 })

        //                 log.debug({
        //                     title: 'BETWEEN FROM AND TO QTY',
        //                     details: 'BETWEEN FROM AND TO QTY. ITEM ADDED'
        //                 })

        //                 return false;
        //             } else if (isNaN(fromQty) && isNaN(toQty)) {

        //                 itemDetailsArr.push({
        //                     itemUnit: itemUnit,
        //                     itemMeasure: itemMeasure,
        //                     itemRate: itemRate,
        //                     minCharge: minCharge,
        //                     flatFee: flatFee
        //                 })

        //                 log.debug({
        //                     title: 'NO FROM AND TO QTY',
        //                     details: 'NO FROM AND TO QTY. ITEM ADDED'
        //                 })

        //                 return false;
        //             } else if (newBillableQty >= fromQty && isNaN(toQty)) {

        //                 itemDetailsArr.push({
        //                     itemUnit: itemUnit,
        //                     itemMeasure: itemMeasure,
        //                     itemRate: itemRate,
        //                     minCharge: minCharge,
        //                     flatFee: flatFee
        //                 })

        //                 log.debug({
        //                     title: 'GREATER THAN FROM QTY BUT NO TO QTY',
        //                     details: 'GREATER THAN FROM QTY BUT NO TO QTY. ITEM ADDED'
        //                 })

        //                 return false;

        //             }


        //             return true;
        //         });

        //         break;

        //     } else {
        //         log.debug({
        //             title: 'NO RESULTS',
        //             details: 'NO RESULTS. CHECK OTHER CUSTOMER RATE CARD'
        //         })

        //         continue;
        //     }
        // }

        return itemDetailsArr;
    }


    /**
     * August 28, 2023 - v1.1.0
     * Test Function for Loading the CRC Item Details
     * This replicates the getDataMappingParent but loads the whole Data set
     * This is to set the CRC Item Details to the CRC Item Details Array by not using the search on the loop.
     * @param {*} parentCrcIds 
     * @param {*} itemId 
     * @param {*} newBillableQty 
     * @returns array
     */
    const loadItemCRCData = (parentCrcIds) => {
        var fifter = [];
        for (var item in parentCrcIds) {
            fifter.push(parentCrcIds[item])
        }
        var crcItemDetailsObj = search.create({
            type: "customrecord_crc_items",
            filters:
                [
                    ["custrecord_crc_parent", "anyof", fifter]
                ],
            columns:
                [
                    search.createColumn({ name: "custrecord_crc_parent", label: "Parent CRC" }),
                    // search.createColumn({ name: "custrecord_crc_hidden_item_no", label: "Group Item No." }),
                    // search.createColumn({ name: "custrecord_crc_item_no", label: "Item No." }),
                    search.createColumn({ name: "custrecord_crc_item", label: "Item" }),
                    search.createColumn({ name: "custrecord_crc_cust_itemcode", label: "Customer Item Name" }),
                    search.createColumn({ name: "custrecord_crc_unit", label: "Unit" }),
                    search.createColumn({ name: "custrecord_crc_measure", label: "Measure" }),
                    search.createColumn({
                        name: "custrecord_crc_from_quantity",
                        sort: search.Sort.ASC,
                        label: "From Quantity"
                    }),
                    search.createColumn({ name: "custrecord_crc_to_quantity", label: "To Quantity" }),
                    search.createColumn({ name: "custrecord_crc_rate", label: "Rate" }),
                    search.createColumn({ name: "custrecord_crc_minimum_charge", label: "Minimum Charge" }),
                    search.createColumn({ name: "custrecord_crc_flat_fee", label: "Flat Fee" }),

                ]
        });
        resultCount = crcItemDetailsObj.runPaged().count;
        let results = getResults(crcItemDetailsObj.run());
        results = results.map(mapCRCItem)
        return results
    }

    const mapCRCItem = (result) => {
        return {
            parent: parseInt(result.getValue('custrecord_crc_parent')),
            fromQty: parseInt(result.getValue('custrecord_crc_from_quantity')),
            toQty: parseInt(result.getValue('custrecord_crc_to_quantity')),
            itemUnit: result.getValue('custrecord_crc_unit'),
            itemMeasure: result.getValue('custrecord_crc_measure'),
            itemRate: result.getValue('custrecord_crc_rate'),
            minCharge: result.getValue('custrecord_crc_minimum_charge'),
            flatFee: result.getValue('custrecord_crc_flat_fee'),
            item: result.getValue('custrecord_crc_item')
        };
    };

    const checkBillableQty = (data, newBillableQty) => {
        arrayHolder = [];
        data.forEach((result) => {
            var parent = parseInt(result.parent)
            var fromQty = parseInt(result.fromQty)
            var toQty = parseInt(result.toQty)
            var itemUnit = result.itemUnit
            var itemMeasure = result.itemMeasure
            var itemRate = result.itemRate
            var minCharge = result.minCharge
            var flatFee = result.flatFee
            var item = result.item
            if (newBillableQty >= fromQty && newBillableQty <= toQty) {
                arrayHolder.push({
                    parent: parent,
                    fromQty: fromQty,
                    toQty: toQty,
                    itemUnit: itemUnit,
                    itemMeasure: itemMeasure,
                    itemRate: itemRate,
                    minCharge: minCharge,
                    flatFee: flatFee,
                    item: item
                })
                log.debug({
                    title: 'BETWEEN FROM AND TO QTY',
                    details: 'BETWEEN FROM AND TO QTY. ITEM ADDED'
                })
            } else if (isNaN(fromQty) && isNaN(toQty)) {
                arrayHolder.push({
                    parent: parent,
                    fromQty: fromQty,
                    toQty: toQty,
                    itemUnit: itemUnit,
                    itemMeasure: itemMeasure,
                    itemRate: itemRate,
                    minCharge: minCharge,
                    flatFee: flatFee,
                    item: item

                })
                log.debug({
                    title: 'NO FROM AND TO QTY',
                    details: 'NO FROM AND TO QTY. ITEM ADDED'
                })
            } else if (newBillableQty >= fromQty && isNaN(toQty)) {
                arrayHolder.push({
                    parent: parent,
                    fromQty: fromQty,
                    toQty: toQty,
                    itemUnit: itemUnit,
                    itemMeasure: itemMeasure,
                    itemRate: itemRate,
                    minCharge: minCharge,
                    flatFee: flatFee,
                    item: item
                })
                log.debug({
                    title: 'GREATER THAN FROM QTY BUT NO TO QTY',
                    details: 'GREATER THAN FROM QTY BUT NO TO QTY. ITEM ADDED'
                })
            }
            return true;
        });
        return arrayHolder;
    }

    function getDataMappingParent(parentCrcIds, itemId, newBillableQty) {
        var fifter = [];
        for (var item in parentCrcIds) {
            fifter.push(parentCrcIds[item])
        }
        var ret = [];
        var crcItemDetailsObj = search.create({
            type: "customrecord_crc_items",
            filters:
                [
                    ["custrecord_crc_parent", "anyof", fifter],
                    "AND",
                    ["custrecord_crc_item", "anyof", itemId]
                ],
            columns:
                [
                    search.createColumn({ name: "custrecord_crc_parent", label: "Parent CRC" }),
                    // search.createColumn({ name: "custrecord_crc_hidden_item_no", label: "Group Item No." }),
                    // search.createColumn({ name: "custrecord_crc_item_no", label: "Item No." }),
                    search.createColumn({ name: "custrecord_crc_item", label: "Item" }),
                    search.createColumn({ name: "custrecord_crc_cust_itemcode", label: "Customer Item Name" }),
                    search.createColumn({ name: "custrecord_crc_unit", label: "Unit" }),
                    search.createColumn({ name: "custrecord_crc_measure", label: "Measure" }),
                    search.createColumn({
                        name: "custrecord_crc_from_quantity",
                        sort: search.Sort.ASC,
                        label: "From Quantity"
                    }),
                    search.createColumn({ name: "custrecord_crc_to_quantity", label: "To Quantity" }),
                    search.createColumn({ name: "custrecord_crc_rate", label: "Rate" }),
                    search.createColumn({ name: "custrecord_crc_minimum_charge", label: "Minimum Charge" }),
                    search.createColumn({ name: "custrecord_crc_flat_fee", label: "Flat Fee" }),

                ]
        });
        resultCount = crcItemDetailsObj.runPaged().count;
        log.debug("crcItemDetailsObj result count", resultCount);

        //if customer rate card search has results, check which from and to quantity does the item fall under

        if (resultCount > 0) {
            //var unitConverted = 0;

            crcItemDetailsObj.run().each(function (result) {
                var parent = parseInt(result.getValue('custrecord_crc_parent'))
                var fromQty = parseInt(result.getValue('custrecord_crc_from_quantity'))
                var toQty = parseInt(result.getValue('custrecord_crc_to_quantity'))
                var itemUnit = result.getValue('custrecord_crc_unit')
                var itemMeasure = result.getValue('custrecord_crc_measure')
                var itemRate = result.getValue('custrecord_crc_rate')
                var minCharge = result.getValue('custrecord_crc_minimum_charge')
                var flatFee = result.getValue('custrecord_crc_flat_fee')

                //     ret.push({
                //         parent: parent,
                //         fromQty: fromQty,
                //         toQty: toQty,
                //         itemUnit: itemUnit,
                //         itemMeasure: itemMeasure,
                //         itemRate: itemRate,
                //         minCharge: minCharge,
                //         flatFee: flatFee

                //     })

                if (newBillableQty >= fromQty && newBillableQty <= toQty) {

                    ret.push({
                        parent: parent,
                        fromQty: fromQty,
                        toQty: toQty,
                        itemUnit: itemUnit,
                        itemMeasure: itemMeasure,
                        itemRate: itemRate,
                        minCharge: minCharge,
                        flatFee: flatFee

                    })

                    log.debug({
                        title: 'BETWEEN FROM AND TO QTY',
                        details: 'BETWEEN FROM AND TO QTY. ITEM ADDED'
                    })

                } else if (isNaN(fromQty) && isNaN(toQty)) {

                    ret.push({
                        parent: parent,
                        fromQty: fromQty,
                        toQty: toQty,
                        itemUnit: itemUnit,
                        itemMeasure: itemMeasure,
                        itemRate: itemRate,
                        minCharge: minCharge,
                        flatFee: flatFee

                    })

                    log.debug({
                        title: 'NO FROM AND TO QTY',
                        details: 'NO FROM AND TO QTY. ITEM ADDED'
                    })

                } else if (newBillableQty >= fromQty && isNaN(toQty)) {

                    ret.push({
                        parent: parent,
                        fromQty: fromQty,
                        toQty: toQty,
                        itemUnit: itemUnit,
                        itemMeasure: itemMeasure,
                        itemRate: itemRate,
                        minCharge: minCharge,
                        flatFee: flatFee

                    })

                    log.debug({
                        title: 'GREATER THAN FROM QTY BUT NO TO QTY',
                        details: 'GREATER THAN FROM QTY BUT NO TO QTY. ITEM ADDED'
                    })

                }

                return true;
            });

            log.debug("ret value", JSON.stringify(ret))
            // var groupByParent = groupBy(ret, function (item) {
            //     return [item.parent];
            // });
            // log.debug("groupByParent", groupByParent)
            return ret

        }
        else {
            return []
        }
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
    function setRateSchedule(itemId, parentRun, parentCrcIds, entityIds, actualRunQty) {
        log.debug("setRateSchedule  parentRun", parentRun)
        if (!parentRun) {
            return;
        }
        var lookupParent = search.lookupFields({
            type: 'customrecord_ddc_run',
            id: parentRun,
            columns: 'custrecord_ddc_run_job'
        })

        var jobId = lookupParent.custrecord_ddc_run_job[0].value
        var rateScheduleArr = [];
        var minChargeArr = [];

        var customrecord_ddc_runSearchObj = search.create({
            type: "customrecord_ddc_run",
            filters:
                [
                    ["custrecord_ddc_run_job", "anyof", jobId],
                    "AND",
                    ["custrecord_ddc_rd_parent_run.custrecord_ddc_rd_item", "anyof", itemId]
                ],
            columns:
                [
                    search.createColumn({
                        name: "name",
                        sort: search.Sort.ASC,
                        label: "ID"
                    }),
                    search.createColumn({ name: "custrecord_ddc_run_job", label: "Job" }),
                    search.createColumn({
                        name: "custrecord_ddc_rd_item",
                        join: "CUSTRECORD_DDC_RD_PARENT_RUN",
                        label: "Item"
                    }),
                    search.createColumn({
                        name: "custrecord_ddc_rd_actual_qty_completed",
                        join: "CUSTRECORD_DDC_RD_PARENT_RUN",
                        label: "Actual Qty Completed"
                    }),
                    search.createColumn({
                        name: "custrecord_ddc_rd_minimum_charge",
                        join: "CUSTRECORD_DDC_RD_PARENT_RUN",
                        label: "Minimum Charge"
                    }),
                    search.createColumn({
                        name: "custrecord_ddc_actual_rate",
                        join: "CUSTRECORD_DDC_RD_PARENT_RUN",
                        label: "Actual Rate"
                    })
                ]
        });
        var searchResultCount = customrecord_ddc_runSearchObj.runPaged().count;
        log.debug("customrecord_ddc_runSearchObj result count", searchResultCount);
        customrecord_ddc_runSearchObj.run().each(function (result) {
            // .run().each has a limit of 4,000 results

            var rdMinCharge = result.getValue({ 'name': 'custrecord_ddc_rd_minimum_charge', join: 'CUSTRECORD_DDC_RD_PARENT_RUN' })

            if (rdMinCharge) {
                minChargeArr.push(
                    {
                        itemName: result.getText({ 'name': 'custrecord_ddc_rd_item', join: 'CUSTRECORD_DDC_RD_PARENT_RUN' }),
                        name: result.getValue('name'),
                        rdQty: result.getValue({ 'name': 'custrecord_ddc_rd_actual_qty_completed', join: 'CUSTRECORD_DDC_RD_PARENT_RUN' }),
                        rdRate: result.getValue({ 'name': 'custrecord_ddc_actual_rate', join: 'CUSTRECORD_DDC_RD_PARENT_RUN' }),
                        rdMinCharge: rdMinCharge
                    }
                )
            } else {
                rateScheduleArr.push(
                    {
                        itemName: result.getText({ 'name': 'custrecord_ddc_rd_item', join: 'CUSTRECORD_DDC_RD_PARENT_RUN' }),
                        name: result.getValue('name'),
                        rdQty: result.getValue({ 'name': 'custrecord_ddc_rd_actual_qty_completed', join: 'CUSTRECORD_DDC_RD_PARENT_RUN' }),
                        rdRate: result.getValue({ 'name': 'custrecord_ddc_actual_rate', join: 'CUSTRECORD_DDC_RD_PARENT_RUN' }),
                        rdMinCharge: rdMinCharge
                    }
                )
            }

            return true;
        });
        var totalJobQty = 0;
        var jobRecObj = record.load({
            type: record.Type.SALES_ORDER,
            id: jobId
        })
        var lineNum = jobRecObj.findSublistLineWithValue({
            sublistId: 'item',
            fieldId: 'item',
            value: itemId
        });

        var customerId = search.lookupFields({
            type: 'salesorder',
            id: jobId,
            columns: 'entity'
        })
        if (!actualRunQty) {
            totalJobQty = jobRecObj.getSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                line: lineNum
            });
        } else {
            totalJobQty = actualRunQty
        }
        var totalJobQty = jobRecObj.getSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            line: lineNum
        });

        log.debug({
            title: 'totalJobQty',
            details: 'totalJobQty val:' + totalJobQty
        })

        var runCrcDetails = getCrcItemDetails(customerId.entity[0].value, itemId, totalJobQty, parentCrcIds, entityIds)
        log.emergency({
            title: 'getCrcItemDetails 7 dkm',
            details: runCrcDetails
        });
        log.debug({
            title: 'runCrcDetails dkm',
            details: 'runCrcDetails for setRateSchedule function: ' + JSON.stringify(runCrcDetails)
        })

        //add manual rate validation
        if (runCrcDetails.length > 0) {
            var manualRate = jobRecObj.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_ddc_manual_rate_change',
                line: lineNum
            });
            // var quantity = jobRecObj.getSublistValue({
            //     sublistId: 'item',
            //     fieldId: 'quantity',
            //     line: lineNum
            // });

            if (!manualRate && itemId != 10892 && itemId != 10893) {

                jobRecObj.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'rate',
                    line: lineNum,
                    value: runCrcDetails[0].itemRate
                });
                jobRecObj.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_ddc_rate',
                    line: lineNum,
                    value: runCrcDetails[0].itemRate
                });
                var testAmount = jobRecObj.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_ddc_rollup_amount',
                    line: lineNum
                });
                jobRecObj.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'amount',
                    line: lineNum,
                    value: testAmount
                });
            }
            var rateStore = jobRecObj.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_ddc_crc_rate_storage',
                line: lineNum
            });
            // jobRecObj.setSublistValue({
            //     sublistId: 'item',
            //     fieldId: 'custcol_ddc_crc_rate',
            //     line: lineNum,
            //     value: runCrcDetails[0].itemRate
            // });
            jobRecObj.setSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_ddc_crc_rate',
                line: lineNum,
                value: rateStore
            });

        }
        else {
            //doing some thing 
        }


        var finalSchedule = ''

        log.debug({
            title: 'rateScheduleArr',
            details: 'rateScheduleArr val: ' + JSON.stringify(rateScheduleArr)
        })

        if (rateScheduleArr.length > 0) {
            var groupByRate = _.groupBy(rateScheduleArr, 'rdRate')

            log.debug({
                title: 'groupByRate value',
                details: groupByRate
            })

            Object.keys(groupByRate).forEach((keys, keyIndex) => {
                log.debug({
                    title: 'groupByRate Keys',
                    details: keyIndex + ' || ' + keys
                })
                var totalQty = 0
                var totalRuns = 0;
                groupByRate[keys].forEach((value, index) => {
                    log.debug({
                        title: 'object value',
                        details: value
                    })

                    totalQty += parseFloat(value.rdQty)
                    totalRuns++
                })
                log.debug({
                    title: 'totalQty value',
                    details: 'totalQty val: ' + totalQty
                })

                var rdRate = parseFloat(groupByRate[keys][0].rdRate)
                var totalAmnt = totalQty * rdRate

                if (totalQty > 0) {
                    finalSchedule += ' Qty: ' + totalQty + ' @ ' + groupByRate[keys][0].rdRate + '\n' + ' Total: ' + totalAmnt + ' For ' + totalRuns + ' Runs.'
                }

            })


            // for (var x = 0; x < rateScheduleArr.length; x++) {
            //     // finalSchedule += rateScheduleArr[x].itemName + ' Qty: ' + rateScheduleArr[x].rdQty + ' @ ' + rateScheduleArr[x].rdRate + '\n'
            // }
        }

        log.debug({
            title: 'minChargeArr',
            details: 'minChargeArr val: ' + JSON.stringify(minChargeArr)
        })

        if (minChargeArr.length > 0) {
            // for (var y = 0; y < minChargeArr.length; y++) {
            //     finalSchedule += 'Minimum charge: ' + ' Qty: ' + minChargeArr[y].rdQty + ' @ ' + minChargeArr[y].rdRate + '\n'
            // }

            var groupByRate = _.groupBy(minChargeArr, 'rdRate')

            log.debug({
                title: 'groupByRate value',
                details: groupByRate
            })

            var minChargeCount = 0;

            Object.keys(groupByRate).forEach((keys, keyIndex) => {
                log.debug({
                    title: 'groupByRate Keys',
                    details: keyIndex + ' || ' + keys
                })
                var totalQty = 0
                groupByRate[keys].forEach((value, index) => {
                    log.debug({
                        title: 'object value',
                        details: value
                    })

                    totalQty += parseFloat(value.rdQty)
                    minChargeCount++
                })
                log.debug({
                    title: 'totalQty value',
                    details: 'totalQty val: ' + totalQty
                })

                if (totalQty > 0) {
                    finalSchedule += '\n' + groupByRate[keys][0].itemName + ' Minimum charge: ' + ' Qty: ' + totalQty + ' @ ' + groupByRate[keys][0].rdRate + '\n' + '* includes ' + minChargeCount + 'x minimum charge'
                }

            })


        }


        log.debug({
            title: 'finalSchedule',
            details: 'finalSchedule val: ' + finalSchedule
        })

        jobRecObj.setSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_ddc_rate_schedule',
            line: lineNum,
            value: finalSchedule
        });

        jobRecObj.save()


    }

    const parseFloatOrZero = n => parseFloat(n) || 0

    /**
     * DONOT ALTER THIS FUNCTION
     * Retrieves all(even if data is more than 2000) 
     * search results of an nlobjSearchResultSet
     *
     * @param  {resultSet} set search result set to retrieve results
     * @return {Array}     array containing search results
     */
    var getResults = (set) => {
        let holder = [];
        let i = 0;
        while (true) {
            let result = set.getRange({
                start: i,
                end: i + 1000
            });
            if (!result) break;
            holder = holder.concat(result);
            if (result.length < 1000) break;
            i += 1000;
        }
        return holder;
    };

    return {
        beforeSubmit: rate_card_beforeSubmit,
        afterSubmit: rate_card_afterSubmit
    }
});