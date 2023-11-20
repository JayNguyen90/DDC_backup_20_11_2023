/**
 * @name:                                       update_actual_qty_timesheet_ue.js
 * @author:                                     Patrick Lising
 * @summary:                                    Script Description
 * @copyright:                                  © Copyright by Jcurve Solutions
 * Date Created:                                Fri Sep 23 2022 11:54:30 AM
 * Change Logs:
 * Date                          Author               Description
 * Fri Sep 23 2022 11:54:30 AM -- Patrick Lising -- Initial Creation
 * Tue Sep 27 2022 01:03:00 PM -- Patrick Lising -- added logic to handle update of time
 * Thu Sep 29 2022 02:00:00 PM -- Patrick Lising -- fixed create/update/delete logic for overtime items
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/runtime', 'N/error'], function (record, search, runtime, error) {

    function timesheet_beforeSubmit(context) {

        var newRec = context.newRecord;

        var projectId = newRec.getValue({
            fieldId: 'customer'
        })

        log.debug({
            title: 'projectId',
            details: 'BEFORE SUBMIT projectId :' + projectId
        })

        if (projectId) {

            var jobIdLookup = search.lookupFields({
                type: search.Type.JOB,
                id: projectId,
                columns: ['custentity_ddc_linked_transaction', 'subsidiary']
            })

            if (jobIdLookup.subsidiary[0].value == 2 && jobIdLookup.custentity_ddc_linked_transaction[0].value != '') {
                log.debug({
                    title: 'jobIdLookup.subsidiary[0].value',
                    details: 'jobIdLookup.subsidiary[0].value: ' + jobIdLookup.subsidiary[0].value + ' || jobIdLookup.custentity_ddc_linked_transaction[0].text: ' + jobIdLookup.custentity_ddc_linked_transaction[0].text
                })

                var verifyTransac = jobIdLookup.custentity_ddc_linked_transaction[0].text

                if (verifyTransac.includes("Job")) {
                    var jobId = jobIdLookup.custentity_ddc_linked_transaction[0].value

                    //load Job/Sales Order

                    var jobIdLookup = search.lookupFields({
                        type: search.Type.JOB,
                        id: projectId,
                        columns: 'custentity_ddc_linked_transaction'
                    })

                    var jobId = jobIdLookup.custentity_ddc_linked_transaction[0].value

                    var jobRec = record.load({
                        type: record.Type.SALES_ORDER,
                        id: jobId
                    })

                    var jobStatus = jobRec.getValue({
                        fieldId: 'status'
                    })

                    log.debug({
                        title: 'jobStatus value',
                        details: 'jobStatus value: ' + jobStatus
                    })

                    if (jobStatus == 'Billed' || jobStatus == 'Closed') {
                        // var errorMsg = error.create({
                        //     name: 'ERROR_CODE',
                        //     message: 'Job for this Project is already Billed/Closed',
                        //     notifyOff: false
                        // })
                        // throw errorMsg;
                        throw 'Linked transaction is not a Job'
                    }
                }
            }
        }

    }

    function update_actual_qty_afterSubmit(context) {

        log.debug({
            title: 'context type',
            details: context.type
        })
        var contextType = context.type
        var timeEntryRec = context.newRecord;
        var newDuration = timeEntryRec.getValue({
            fieldId: 'hours'
        })
        var isNonBillable = timeEntryRec.getValue({
            fieldId: 'custcol_ddc_time_nonbillable_project'
        })
        var isInternalTraining = timeEntryRec.getValue({
            fieldId: 'custcol_ddc_time_internal_training'
        })
        var isRework = timeEntryRec.getValue({
            fieldId: 'custcol_ddc_time_rework'
        })

        if (contextType == 'create') {

            //get the Project ID and Project Task Name
            var projectId = timeEntryRec.getValue({
                fieldId: 'customer'
            })

            var jobIdLookup = search.lookupFields({
                type: search.Type.JOB,
                id: projectId,
                columns: ['custentity_ddc_linked_transaction', 'subsidiary']
            })


            if (jobIdLookup.subsidiary[0].value == 2 && jobIdLookup.custentity_ddc_linked_transaction[0].value != '') {

                var verifyTransac = jobIdLookup.custentity_ddc_linked_transaction[0].text

                if (verifyTransac.includes('Job')) {

                    var projectTaskId = timeEntryRec.getValue({
                        fieldId: 'casetaskevent'
                    })

                    var lookUpProjectTask = search.lookupFields({
                        type: search.Type.PROJECT_TASK,
                        id: projectTaskId,
                        columns: 'title'
                    })

                    var projectTaskText = lookUpProjectTask.title

                    if (projectId != "" && projectTaskText != "") {

                        var jobIdLookup = search.lookupFields({
                            type: search.Type.JOB,
                            id: projectId,
                            columns: 'custentity_ddc_linked_transaction'
                        })

                        var jobId = jobIdLookup.custentity_ddc_linked_transaction[0].value

                        //load Job/Sales Order

                        var jobRec = record.load({
                            type: record.Type.SALES_ORDER,
                            id: jobId
                        })

                        var itemListArr = getItemListArray(jobId, projectTaskText)  //get CURRENT values of the line Item on the Job/Sales Order

                        log.debug({
                            title: 'itemListArr',
                            details: itemListArr
                        })

                        setActualQtyValue(jobRec, itemListArr, newDuration, contextType, projectId, projectTaskId, isNonBillable, isInternalTraining, isRework) //compute the value to be set on the Actual Qty column
                    }
                } else {
                    // var errorMsg = error.create({
                    //     name: 'ERROR_CODE',
                    //     message: 'Linked transaction is not a Job',
                    //     notifyOff: false
                    // })
                    // throw errorMsg;

                    throw 'Linked transaction is not a Job'
                }
            }

        } else if (contextType == 'edit') {
            var oldTimeEntryRec = context.oldRecord;
            var oldDuration = oldTimeEntryRec.getValue({
                fieldId: 'hours'
            })

            var projectId = oldTimeEntryRec.getValue({
                fieldId: 'customer'
            })

            var jobIdLookup = search.lookupFields({
                type: search.Type.JOB,
                id: projectId,
                columns: ['custentity_ddc_linked_transaction', 'subsidiary']
            })

            if (jobIdLookup.subsidiary[0].value == 2 && jobIdLookup.custentity_ddc_linked_transaction[0].value != '') {

                //if duration is updated, update the Job

                //if (oldDuration != newDuration) {

                var verifyTransac = jobIdLookup.custentity_ddc_linked_transaction[0].text
                if (verifyTransac.includes('Job')) {
                    //get the Project ID and Project Task Name
                    var projectId = timeEntryRec.getValue({
                        fieldId: 'customer'
                    })

                    var projectTaskId = timeEntryRec.getValue({
                        fieldId: 'casetaskevent'
                    })

                    var projectTaskText = timeEntryRec.getText({
                        fieldId: 'casetaskevent'
                    }).replace(' (Project Task)', '')

                    if (projectId != "" && projectTaskText != "") {

                        var jobIdLookup = search.lookupFields({
                            type: search.Type.JOB,
                            id: projectId,
                            columns: 'custentity_ddc_linked_transaction'
                        })

                        var jobId = jobIdLookup.custentity_ddc_linked_transaction[0].value

                        //load Job/Sales Order

                        var jobRec = record.load({
                            type: record.Type.SALES_ORDER,
                            id: jobId
                        })

                        var itemListArr = getItemListArray(jobId, projectTaskText) //get CURRENT values of the line Item on the Job/Sales Order

                        log.debug({
                            title: 'itemListArr',
                            details: itemListArr
                        })

                        setActualQtyValue(jobRec, itemListArr, newDuration, contextType, projectId, projectTaskId, isNonBillable, isInternalTraining, isRework) //compute the value to be set on the Actual Qty column

                    }
                    //}
                } else {
                    // var errorMsg = error.create({
                    //     name: 'ERROR_CODE',
                    //     message: 'Linked transaction is not a Job',
                    //     notifyOff: false
                    // })
                    // throw errorMsg;

                    throw 'Linked transaction is not a Job'
                }
            }

        } else if (contextType == 'delete') {

            var deletedRec = context.oldRecord;
            var oldDuration = deletedRec.getValue({
                fieldId: 'hours'
            })

            //get the Project ID and Project Task Name
            var projectId = deletedRec.getValue({
                fieldId: 'customer'
            })

            var jobIdLookup = search.lookupFields({
                type: search.Type.JOB,
                id: projectId,
                columns: ['custentity_ddc_linked_transaction', 'subsidiary']
            })

            if (jobIdLookup.subsidiary[0].value == 2 && jobIdLookup.custentity_ddc_linked_transaction[0].value != '') {

                var verifyTransac = jobIdLookup.custentity_ddc_linked_transaction[0].text
                if (verifyTransac.includes('Job')) {
                    var projectTaskId = deletedRec.getValue({
                        fieldId: 'casetaskevent'
                    })

                    var lookUpProjectTask = search.lookupFields({
                        type: search.Type.PROJECT_TASK,
                        id: projectTaskId,
                        columns: 'title'
                    })

                    var projectTaskText = lookUpProjectTask.title

                    log.debug({
                        title: 'projectId || projectTaskId || lookUpProjectTask || projectTaskText || oldDuration',
                        details: projectId + ' || ' + projectTaskId + ' || ' + lookUpProjectTask + ' || ' + projectTaskText + ' || ' + oldDuration
                    })

                    if (projectId != "" && projectTaskText != "") {

                        var jobIdLookup = search.lookupFields({
                            type: search.Type.JOB,
                            id: projectId,
                            columns: 'custentity_ddc_linked_transaction'
                        })

                        var jobId = jobIdLookup.custentity_ddc_linked_transaction[0].value

                        //load Job/Sales Order

                        var jobRec = record.load({
                            type: record.Type.SALES_ORDER,
                            id: jobId
                        })

                        var itemListArr = getItemListArray(jobId, projectTaskText)  //get CURRENT values of the line Item on the Job/Sales Order

                        log.debug({
                            title: 'itemListArr',
                            details: itemListArr
                        })

                        setActualQtyValue(jobRec, itemListArr, oldDuration, contextType, projectId, projectTaskId, isNonBillable, isInternalTraining, isRework) //compute the value to be set on the Actual Qty column
                    }
                } else {
                    // var errorMsg = error.create({
                    //     name: 'ERROR_CODE',
                    //     message: 'Linked transaction is not a Job',
                    //     notifyOff: false
                    // })
                    // throw errorMsg;
                    throw 'Linked transaction is not a Job'
                }
            }

        }

        //end of after submit
    }

    function getItemListArray(jobId, projectTaskText) {
        //get Items on the Job/Sales Order and store into itemListArr
        var itemListArr = []
        var itemSearchObj = search.create({
            type: search.Type.SALES_ORDER,
            filters: [
                {
                    name: 'type',
                    operator: 'anyof',
                    values: 'SalesOrd'
                },
                {
                    name: 'internalid',
                    operator: 'anyof',
                    values: jobId
                },
                {
                    name: 'mainline',
                    operator: 'is',
                    values: 'F'
                },
                {
                    name: 'name',
                    join: 'item',
                    operator: 'startswith',
                    values: projectTaskText
                }
            ],
            columns: [
                {
                    name: 'lineuniquekey'
                },
                {
                    name: 'item'
                },
                {
                    name: 'salesdescription',
                    join: 'item',
                    sort: search.Sort.ASC
                },
                {
                    name: 'quantity'
                },
                {
                    name: 'custcol_ddc_quoted_qty_external'
                },
                {
                    name: 'custcol_ddc_estimated_qty'
                },
                {
                    name: 'custcol_ddc_actual_qty'
                }
            ]
        })

        itemSearchObj.run().each(function (result) {
            var lineKey = result.getValue('lineuniquekey')
            var resultId = result.getValue('item')
            var resultDesc = result.getValue({ name: 'salesdescription', join: 'item' })
            var billableQty = parseInt(result.getValue('quantity'))
            var quotedExtQty = parseInt(result.getValue('custcol_ddc_quoted_qty_external'))
            var estimatedQty = parseInt(result.getValue('custcol_ddc_estimated_qty'))
            var actualQty = parseInt(result.getValue('custcol_ddc_actual_qty'))


            if (actualQty > 0) {
                itemListArr.push(
                    {
                        lineKey: lineKey,
                        itemId: resultId,
                        itemDesc: resultDesc,
                        billableQty: billableQty,
                        quotedExtQty: quotedExtQty,
                        estimatedQty: estimatedQty,
                        actualQty: actualQty
                    }
                )
            } else {
                itemListArr.push(
                    {
                        lineKey: lineKey,
                        itemId: resultId,
                        itemDesc: resultDesc,
                        billableQty: billableQty,
                        quotedExtQty: quotedExtQty,
                        estimatedQty: estimatedQty,
                        actualQty: 0
                    }
                )
            }

            return true;
        });

        return itemListArr;
    }

    function getTotalHrs(projectId, projectTaskId) {
        var totalQty = 0;
        var timeEntrySearchObj = search.create({
            type: search.Type.TIME_BILL,
            filters: [
  //              {
  //                  name: 'employee',
  //                  operator: 'anyof',
  //                  values: ['@CURRENT@', 599900]
  //              },
                {
                    name: 'customer',
                    operator: 'anyof',
                    values: projectId
                },
                {
                    name: 'type',
                    operator: 'anyof',
                    values: ['A']
                },
                {
                    name: 'casetaskevent',
                    operator: 'anyof',
                    values: projectTaskId
                }
            ],
            columns: [
                {
                    name: 'hours'
                }
            ]
        })

        timeEntrySearchObj.run().each(function (result) {
            var duration = parseInt(result.getValue('hours'))
            totalQty += duration
            return true;
        });

        return totalQty;
    }

    function setActualQtyValue(jobRec, itemListArr, newDuration, contextType, projectId, projectTaskId, isNonBillable, isInternalTraining, isRework) {
        // check if Overtime item is present
        if (itemListArr.length > 1) {
            var setActualQty = 0;
            var totalWorkHrs = getTotalHrs(projectId, projectTaskId) //total hours of entered timesheet
            var finalQty = 0;
            var currentDurationQty = 0;
            var addToExistingQty = 0;
            var totalQuotedQty = itemListArr[0].quotedExtQty + itemListArr[1].quotedExtQty;
            var totalBillableQty = itemListArr[0].billableQty + itemListArr[1].billableQty;

            log.debug({
                title: 'Total Work Hours and Timesheet checkbox values',
                details: 'totalWorkHrs value: ' + totalWorkHrs + ' totalQuotedQty: ' + totalQuotedQty + ' || isNonBillable: ' + isNonBillable + ' || isInternalTraining: ' + ' || isRework: ' + isRework
            })


            log.debug({
                title: 'Billable Qty',
                details: 'CHECK BILLABLE QTY: totalWorkHrs: ' + totalWorkHrs + ' || ' + totalQuotedQty
            })

            //update Billable Qty of primary line
            //isNonBillable, isInternalTraining, isRework, totalWorkHrs
            if (contextType == 'create' || contextType == 'edit') {

                if (isNonBillable) { //if non billable, always set quantity to 0

                    var secondaryLineNum = jobRec.findSublistLineWithValue({
                        sublistId: 'item',
                        fieldId: 'lineuniquekey',
                        value: itemListArr[1].lineKey
                    });

                    jobRec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: secondaryLineNum,
                        value: 0
                    });

                    var primaryLineNum = jobRec.findSublistLineWithValue({
                        sublistId: 'item',
                        fieldId: 'lineuniquekey',
                        value: itemListArr[0].lineKey
                    });

                    jobRec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: primaryLineNum,
                        value: 0
                    });

                    jobRec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_ddc_prebill_qty',
                        line: primaryLineNum,
                        value: totalQuotedQty
                    });

                    jobRec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_ddc_prebill_qty',
                        line: secondaryLineNum,
                        value: totalQuotedQty
                    });
                } else if (!(isNonBillable) && parseInt(totalWorkHrs) > totalQuotedQty) {

                    var addToBillableQty = totalWorkHrs - totalQuotedQty
                    var primaryItemBillableQty = totalQuotedQty - itemListArr[1].quotedExtQty

                    log.debug({
                        title: 'Billable Qty',
                        details: 'addToBillableQty: ' + addToBillableQty + ' || primaryItemBillableQty: ' + primaryItemBillableQty
                    })

                    var primaryLineNum = jobRec.findSublistLineWithValue({
                        sublistId: 'item',
                        fieldId: 'lineuniquekey',
                        value: itemListArr[0].lineKey
                    });

                    var manualQty = jobRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_ddc_billable_qty_manual',
                        line: primaryLineNum
                    });

                    if (!manualQty) {

                        var itemDesc = jobRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'description',
                            line: primaryLineNum
                        });

                        var allReworkHrs = getAllRework(projectId, itemDesc)

                        log.debug({
                            title: 'COMPUTED HOURS',
                            details: 'allReworkHrs: ' + allReworkHrs
                        })

                        if (allReworkHrs) {

                            var withoutReworkHrs = addToBillableQty - allReworkHrs

                            log.debug({
                                title: 'COMPUTED HOURS',
                                details: 'allReworkHrs: ' + allReworkHrs + ' || withoutReworkHrs: ' + withoutReworkHrs
                            })

                            if (parseInt(withoutReworkHrs) > 0) {

                                log.debug({
                                    title: 'COMPUTED HOURS',
                                    details: 'parseInt(withoutReworkHrs) > 0'
                                })

                                jobRec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'quantity',
                                    line: primaryLineNum,
                                    value: primaryItemBillableQty + withoutReworkHrs
                                });

                                jobRec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_ddc_prebill_qty',
                                    line: primaryLineNum,
                                    value: primaryItemBillableQty + withoutReworkHrs
                                });
                            }


                        } else {

                            log.debug({
                                title: 'Billable Qty',
                                details: 'no rework or internalTraining'
                            })

                            jobRec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                line: primaryLineNum,
                                value: primaryItemBillableQty + addToBillableQty
                            });

                            jobRec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ddc_prebill_qty',
                                line: primaryLineNum,
                                value: primaryItemBillableQty + withoutReworkHrs
                            });

                        }
                    }
                }

            } else if (contextType == 'delete') {

                log.debug({
                    title: 'contextType == delete',
                    details: 'isNonBillable: ' + isNonBillable + ' || totalWorkHrs: ' + totalWorkHrs + ' || totalQuotedQty: ' + totalQuotedQty
                })

                if (!(isNonBillable) && parseInt(totalWorkHrs) <= totalQuotedQty) {

                    var addToBillableQty = totalWorkHrs - totalQuotedQty
                    var primaryItemBillableQty = totalQuotedQty - itemListArr[1].quotedExtQty

                    log.debug({
                        title: 'Billable Qty',
                        details: 'addToBillableQty: ' + addToBillableQty + ' || primaryItemBillableQty: ' + primaryItemBillableQty
                    })

                    var primaryLineNum = jobRec.findSublistLineWithValue({
                        sublistId: 'item',
                        fieldId: 'lineuniquekey',
                        value: itemListArr[0].lineKey
                    });

                    // if (isInternalTraining || isRework) {
                    //     var allReworkHrs = getAllRework(projectId)

                    // } else {

                    log.debug({
                        title: 'Billable Qty',
                        details: 'no rework or internalTraining'
                    })

                    jobRec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: primaryLineNum,
                        value: primaryItemBillableQty
                    });

                    jobRec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_ddc_prebill_qty',
                        line: primaryLineNum,
                        value: primaryItemBillableQty
                    });

                    //}
                }

            }

            //end of update billable qty logic

            //check each item on itemListArr
            for (var i = 0; i < itemListArr.length; i++) {

                var lineNum = jobRec.findSublistLineWithValue({
                    sublistId: 'item',
                    fieldId: 'lineuniquekey',
                    value: itemListArr[i].lineKey
                });



                log.debug({
                    title: 'newDuration value',
                    details: 'newDuration value: ' + newDuration
                })

                log.debug({
                    title: 'currentDurationQty value',
                    details: 'currentDurationQty value: ' + currentDurationQty
                })

                log.debug({
                    title: 'current Item',
                    details: itemListArr[i].itemDesc + ' || Actual Qty : ' + itemListArr[i].actualQty + ' || Estimated Qty: ' + itemListArr[i].estimatedQty
                })



                //update Actual Qty logic

                if (contextType == 'create') {

                    if (itemListArr[i].actualQty < itemListArr[i].estimatedQty && !(itemListArr[i].itemDesc.includes(' Overtime'))) { //if primary actual qty is > estimated, subtract from there

                        log.debug({
                            title: 'NON OVERTIME ITEM actualQty < estimatedQty',
                            details: 'NON OVERTIME ITEM actualQty: ' + itemListArr[i].actualQty + ' || estimatedQty: ' + itemListArr[i].estimatedQty
                        })
                        addToExistingQty = itemListArr[i].actualQty + newDuration

                        if (addToExistingQty > itemListArr[i].estimatedQty) { //if newDuration + actualQty exceeds estimated Qty, complete Primary Item first then proceed with overtime item
                            jobRec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ddc_actual_qty',
                                line: lineNum,
                                value: itemListArr[i].estimatedQty
                            });
                            newDuration = newDuration - (itemListArr[i].estimatedQty - itemListArr[i].actualQty)
                            log.debug({
                                title: 'NON OVERTIME ITEM',
                                details: 'newDuration + actualQty exceeds estimated Qty. Continue to set newDuration to OT item first: newDuration = ' + newDuration
                            })
                        } else {
                            jobRec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ddc_actual_qty',
                                line: lineNum,
                                value: addToExistingQty
                            });
                            log.debug({
                                title: 'NON OVERTIME ITEM',
                                details: 'addToExistingQty value: ' + addToExistingQty + ' was set'
                            })
                            break;
                        }

                    } else if (itemListArr[i].actualQty >= itemListArr[i].estimatedQty && !(itemListArr[i].itemDesc.includes(' Overtime'))) { //if primary item is full or over estimatedQty, check overtime item first
                        log.debug({
                            title: 'newDuration value',
                            details: 'actualQty >= estimatedQty'
                        })
                        if (itemListArr[i + 1].actualQty == itemListArr[i + 1].estimatedQty) {
                            log.debug({
                                title: 'NON OVERTIME ITEM',
                                details: 'OVERTIME ITEM IS COMPLETED. PROCEED TO ADD TO PRIMARY ITEM'
                            })
                            jobRec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ddc_actual_qty',
                                line: lineNum,
                                value: itemListArr[i].actualQty + newDuration
                            });
                        } else {
                            continue;
                        }


                    } else if (itemListArr[i].actualQty < itemListArr[i].estimatedQty && itemListArr[i].itemDesc.includes(' Overtime')) { //set actualQty of Overtime Item
                        log.debug({
                            title: 'OVERTIME ITEM',
                            details: 'OVERTIME ITEM actualQty <  estimatedQty. newDuration value: ' + newDuration
                        })
                        setActualQty = itemListArr[i].actualQty + newDuration

                        log.debug({
                            title: 'OVERTIME ITEM',
                            details: 'OVERTIME ITEM setActualQty value: ' + setActualQty
                        })

                        if (setActualQty > itemListArr[i].estimatedQty) { //if actualQty + remainingQty > estimatedQty, complete estimatedQty of overtime item and set remaining to primary item

                            log.debug({
                                title: 'OVERTIME ITEM',
                                details: 'OVERTIME ITEM setActualQty > itemListArr[i].estimatedQty. Set remaining to primary item '
                            })
                            var primaryLineNum = jobRec.findSublistLineWithValue({
                                sublistId: 'item',
                                fieldId: 'lineuniquekey',
                                value: itemListArr[i - 1].lineKey
                            });

                            jobRec.setSublistValue({ //complete estimatedQty of overtime item
                                sublistId: 'item',
                                fieldId: 'custcol_ddc_actual_qty',
                                line: lineNum,
                                value: itemListArr[i].estimatedQty
                            });

                            currentDurationQty = newDuration - (itemListArr[i].estimatedQty - itemListArr[i].actualQty)

                            log.debug({
                                title: 'OVERTIME ITEM',
                                details: 'OVERTIME ITEM currentDurationQty value = ' + currentDurationQty
                            })
                            //set remaining to primary item

                            jobRec.setSublistValue({ //complete estimatedQty of primary item
                                sublistId: 'item',
                                fieldId: 'custcol_ddc_actual_qty',
                                line: primaryLineNum,
                                value: itemListArr[i - 1].estimatedQty + currentDurationQty
                            });

                        } else {
                            jobRec.setSublistValue({ //if setActualQty < estimatedQty, set to Actual Qty column
                                sublistId: 'item',
                                fieldId: 'custcol_ddc_actual_qty',
                                line: lineNum,
                                value: setActualQty
                            });
                        }
                    } else if (itemListArr[i].actualQty == itemListArr[i].estimatedQty && itemListArr[i].itemDesc.includes(' Overtime')) {
                        log.debug({
                            title: 'OVERTIME ITEM',
                            details: 'OVERTIME ITEM setActualQty == itemListArr[i].estimatedQty. Set remaining to primary item '
                        })
                        var primaryLineNum = jobRec.findSublistLineWithValue({
                            sublistId: 'item',
                            fieldId: 'lineuniquekey',
                            value: itemListArr[i - 1].lineKey
                        });

                        //set remaining to primary item

                        jobRec.setSublistValue({ //complete estimatedQty of overtime item
                            sublistId: 'item',
                            fieldId: 'custcol_ddc_actual_qty',
                            line: primaryLineNum,
                            value: itemListArr[i - 1].actualQty + newDuration
                        });
                    }


                    //end of create context

                } else if (contextType == 'edit') {

                    log.debug({
                        title: 'totalWorkHrs',
                        details: 'ON EDIT totalWorkHrs value: ' + totalWorkHrs
                    })

                    if (totalWorkHrs > itemListArr[i].estimatedQty && !(itemListArr[i].itemDesc.includes(' Overtime'))) { //if totalWorkHrs exceeds estimatedQty, 

                        log.debug({
                            title: 'totalWorkHrs',
                            details: 'totalWorkHrs > itemListArr[i].estimatedQty && !(itemListArr[i].itemDesc.includes(Overtime))'
                        })

                        if (itemListArr[i + 1].estimatedQty == itemListArr[i + 1].actualQty) { //check if OT Qty is full
                            setActualQty = totalWorkHrs - itemListArr[i + 1].actualQty //subtract OT Qty to total hrs and set it on Primary Actual Qty

                            if (setActualQty < itemListArr[i].estimatedQty) { //if setActualQty is < estimatedQty of primary item, set it first to estimatedQty and continue to OT item

                                jobRec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_ddc_actual_qty',
                                    line: lineNum,
                                    value: itemListArr[i].estimatedQty
                                });

                                setActualQty = totalWorkHrs - itemListArr[i].estimatedQty;

                                log.debug({
                                    title: 'setActualQty',
                                    details: 'setActualQty if primary actualQty updated to estimatedQty = ' + setActualQty
                                })

                                continue;

                            } else {

                                jobRec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_ddc_actual_qty',
                                    line: lineNum,
                                    value: setActualQty
                                });
                                break;
                            }


                        } else { //proceed with OT Item first
                            setActualQty = totalWorkHrs
                            continue;
                        }
                    } else if (itemListArr[i].itemDesc.includes(' Overtime')) {

                        log.debug({
                            title: 'totalWorkHrs',
                            details: 'EDIT itemListArr[i].itemDesc.includes(Overtime). setActualQty value = ' + setActualQty
                        })

                        //var toCompleteQty = itemListArr[i].actualQty + setActualQty;

                        if (setActualQty <= itemListArr[i].estimatedQty) {

                            log.debug({
                                title: 'totalWorkHrs',
                                details: 'EDIT setActualQty <= itemListArr[i].estimatedQty'
                            })

                            jobRec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ddc_actual_qty',
                                line: lineNum,
                                value: setActualQty
                            });

                        } else {

                            log.debug({
                                title: 'totalWorkHrs',
                                details: 'EDIT else'
                            })

                            jobRec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ddc_actual_qty',
                                line: lineNum,
                                value: itemListArr[i].estimatedQty
                            });

                            setActualQty = setActualQty - itemListArr[i].estimatedQty

                            //after OT qty is complete, set remaining qty to primary item

                            var primaryLineNum = jobRec.findSublistLineWithValue({
                                sublistId: 'item',
                                fieldId: 'lineuniquekey',
                                value: itemListArr[i - 1].lineKey
                            });

                            jobRec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ddc_actual_qty',
                                line: primaryLineNum,
                                value: setActualQty
                            });

                        }


                    }

                    //end of context.type edit condition
                } else if (contextType == 'delete') {
                    //newDuration == oldDuration during delete context
                    //totaHrs is already what is on the current timesheet
                    //updatedWorkHrs should be distributed to Primary Item First, then Overtime Item


                    //actualQty is the value before timesheet was updated
                    //sample timesheet with 24 hrs is removed from previous total 30 hrs

                    var lineNum = jobRec.findSublistLineWithValue({
                        sublistId: 'item',
                        fieldId: 'lineuniquekey',
                        value: itemListArr[i].lineKey
                    });
                    log.debug({
                        title: 'itemListArr[i].actualQty || itemListArr[i].estimatedQty',
                        details: itemListArr[i].actualQty + ' || ' + itemListArr[i].estimatedQty
                    })

                    if (itemListArr[i].actualQty > itemListArr[i].estimatedQty && !(itemListArr[i].itemDesc.includes(' Overtime'))) { //if primary actual qty is > estimated, subtract from there

                        log.debug({
                            title: 'NonOvertime Item',
                            details: 'NonOvertime Item Value: ' + newDuration
                        })
                        var subtractToActualQty = itemListArr[i].actualQty - newDuration

                        if (subtractToActualQty >= itemListArr[i].estimatedQty) {
                            jobRec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ddc_actual_qty',
                                line: lineNum,
                                value: subtractToActualQty
                            });

                            break;
                        } else if (subtractToActualQty < itemListArr[i].estimatedQty) {

                            log.debug({
                                title: 'REMAINING TO SUBTRACT',
                                details: 'itemListArr[i].estimatedQty to set ' + itemListArr[i].estimatedQty
                            })


                            jobRec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ddc_actual_qty',
                                line: lineNum,
                                value: itemListArr[i].estimatedQty
                            });

                            var toEqualQty = itemListArr[i].actualQty - itemListArr[i].estimatedQty
                            newDuration = Math.abs(toEqualQty - newDuration)

                            log.debug({
                                title: 'REMAINING TO SUBTRACT',
                                details: 'REMAINING TO SUBTRACT TO OVERTIME ITEM: ' + newDuration
                            })

                            continue;
                        }

                    } else if (itemListArr[i].actualQty == itemListArr[i].estimatedQty && !(itemListArr[i].itemDesc.includes(' Overtime'))) {
                        log.debug({
                            title: 'Updated Hours',
                            details: 'NON OVERTIME ITEM itemListArr[i].actualQty == itemListArr[i].estimatedQty. subtract from Overtime Item first'
                        })
                        continue //subtract with Overtime Item first

                    } else if (itemListArr[i].actualQty == itemListArr[i].estimatedQty && itemListArr[i].itemDesc.includes(' Overtime')) { //Overtime Item processing

                        setActualQty = itemListArr[i].actualQty - newDuration
                        if (setActualQty <= 0) {
                            jobRec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ddc_actual_qty',
                                line: lineNum,
                                value: 0
                            });

                            finalQty = newDuration - itemListArr[i].actualQty


                            var primaryLineNum = jobRec.findSublistLineWithValue({
                                sublistId: 'item',
                                fieldId: 'lineuniquekey',
                                value: itemListArr[i - 1].lineKey
                            });

                            setActualQty = itemListArr[i - 1].estimatedQty - finalQty

                            jobRec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ddc_actual_qty',
                                line: primaryLineNum,
                                value: setActualQty
                            });
                        } else {
                            jobRec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ddc_actual_qty',
                                line: lineNum,
                                value: setActualQty
                            });
                        }

                    } else if (itemListArr[i].actualQty == 0 && itemListArr[i].itemDesc.includes(' Overtime')) { //if overtime is 0, proceed to subtract to primary

                        log.debug({
                            title: 'Updated Hours',
                            details: 'OVERTIME ITEM HAS NO VALUE. Proceed to subtract to Primary'
                        })

                        var primaryLineNum = jobRec.findSublistLineWithValue({
                            sublistId: 'item',
                            fieldId: 'lineuniquekey',
                            value: itemListArr[i - 1].lineKey
                        });

                        setActualQty = itemListArr[i - 1].estimatedQty - newDuration

                        jobRec.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_ddc_actual_qty',
                            line: primaryLineNum,
                            value: setActualQty
                        });

                    }

                } // end of delete context for overtime items
            }

        } else { // no Overtime item, set the totalWorkHrs directly to the Primary Item


            var totalWorkHrs = getTotalHrs(projectId, projectTaskId) //total hours of entered timesheet
            var addToExistingQty = 0;
            var totalQuotedQty = itemListArr[0].quotedExtQty

            log.debug({
                title: 'NO OVERTIME ITEM',
                details: 'NO OVERTIME ITEM. Total Hours Value: ' + totalWorkHrs + ' isNonBillable: ' + isNonBillable
            })

            var lineNum = jobRec.findSublistLineWithValue({
                sublistId: 'item',
                fieldId: 'lineuniquekey',
                value: itemListArr[0].lineKey
            });

            //update Billable Qty of primary line
            //isNonBillable, isInternalTraining, isRework, totalWorkHrs
            if (contextType == 'create' || contextType == 'edit') {

                if (isNonBillable) { //if non billable, always set quantity to 0

                    jobRec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: lineNum,
                        value: 0
                    });

                    jobRec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_ddc_prebill_qty',
                        line: lineNum,
                        value: 0
                    });
                } else if (!(isNonBillable) && parseInt(totalWorkHrs) > totalQuotedQty) {

                    var addToBillableQty = totalWorkHrs - totalQuotedQty
                    var manualQty = jobRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_ddc_billable_qty_manual',
                        line: lineNum
                    });

                    log.debug({
                        title: '!(isNonBillable) && parseInt(totalWorkHrs) > totalQuotedQty',
                        details: 'manualQty: ' + manualQty
                    })
                    if (!manualQty) {

                        log.debug({
                            title: 'Billable Qty',
                            details: 'addToBillableQty: ' + addToBillableQty + ' || totalQuotedQty: ' + totalQuotedQty
                        })

                        var itemDesc = jobRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'description',
                            line: lineNum
                        });

                        var allReworkHrs = getAllRework(projectId, itemDesc)

                        log.debug({
                            title: 'COMPUTED HOURS',
                            details: 'allReworkHrs: ' + allReworkHrs
                        })

                        if (allReworkHrs) {

                            var withoutReworkHrs = addToBillableQty - allReworkHrs

                            log.debug({
                                title: 'COMPUTED HOURS when allReworkHrs == true',
                                details: 'allReworkHrs: ' + allReworkHrs + ' || withoutReworkHrs: ' + withoutReworkHrs
                            })

                            if (totalWorkHrs < totalQuotedQty) { // withoutReworkHrs < totalQuotedQty, set quantity back to totalQuotedQty
                                log.debug({
                                    title: 'withoutReworkHrs < totalQuotedQty',
                                    details: 'set quantity back to totalQuotedQty'
                                })

                                jobRec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'quantity',
                                    line: lineNum,
                                    value: totalQuotedQty
                                });

                                jobRec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_ddc_prebill_qty',
                                    line: lineNum,
                                    value: totalQuotedQty
                                });
                            } else if (totalWorkHrs > totalQuotedQty) {
                                //else if(totalWorkHrs > totalQuotedQty && parseInt(withoutReworkHrs) > 0) {
                                log.debug({
                                    title: 'COMPUTED HOURS',
                                    details: 'totalWorkHrs > totalQuotedQty && parseInt(withoutReworkHrs) > 0'
                                })

                                jobRec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'quantity',
                                    line: lineNum,
                                    value: totalQuotedQty + withoutReworkHrs
                                });

                                jobRec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_ddc_prebill_qty',
                                    line: lineNum,
                                    value: totalQuotedQty + withoutReworkHrs
                                });
                            }


                        } else {

                            log.debug({
                                title: 'Billable Qty',
                                details: 'no rework or internalTraining'
                            })

                            jobRec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                line: lineNum,
                                value: totalQuotedQty + addToBillableQty
                            });

                            jobRec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ddc_prebill_qty',
                                line: lineNum,
                                value: totalQuotedQty + addToBillableQty
                            });

                        }
                    }
                } else if (!(isNonBillable) && parseInt(totalWorkHrs) <= totalQuotedQty) {

                    var manualQty = jobRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_ddc_billable_qty_manual',
                        line: lineNum
                    });

                    if (!manualQty) {

                        log.debug({
                            title: 'Billable Qty',
                            details: 'totalQuotedQty: ' + totalQuotedQty
                        })

                        // if (isInternalTraining || isRework) {
                        //     var allReworkHrs = getAllRework(projectId)

                        // } else {

                        log.debug({
                            title: 'Billable Qty',
                            details: 'no rework or internalTraining'
                        })

                        jobRec.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: lineNum,
                            value: totalQuotedQty
                        });

                        jobRec.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_ddc_prebill_qty',
                            line: lineNum,
                            value: totalQuotedQty
                        });

                        //}
                    }
                }

            } else if (contextType == 'delete') {

                log.debug({
                    title: 'contextType == delete',
                    details: 'isNonBillable: ' + isNonBillable + ' || totalWorkHrs: ' + totalWorkHrs + ' || totalQuotedQty: ' + totalQuotedQty
                })

                //check for hours without rework

                if (!(isNonBillable) && parseInt(totalWorkHrs) <= totalQuotedQty) {

                    var addToBillableQty = totalWorkHrs - totalQuotedQty
                    var manualQty = jobRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_ddc_billable_qty_manual',
                        line: lineNum
                    });

                    if (!manualQty) {

                        log.debug({
                            title: 'Billable Qty',
                            details: 'addToBillableQty: ' + addToBillableQty + ' || totalQuotedQty: ' + totalQuotedQty
                        })

                        // if (isInternalTraining || isRework) {
                        //     var allReworkHrs = getAllRework(projectId)

                        // } else {

                        log.debug({
                            title: 'Billable Qty',
                            details: 'no rework or internalTraining'
                        })

                        jobRec.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: lineNum,
                            value: totalQuotedQty
                        });

                        jobRec.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_ddc_prebill_qty',
                            line: lineNum,
                            value: totalQuotedQty
                        });

                        //}
                    }
                } else if (!(isNonBillable) && parseInt(totalWorkHrs) > totalQuotedQty) { //added else if clause for delete
                    var addToBillableQty = totalWorkHrs - totalQuotedQty
                    var manualQty = jobRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_ddc_billable_qty_manual',
                        line: lineNum
                    });
                    if (!manualQty) {

                        log.debug({
                            title: 'Billable Qty',
                            details: 'addToBillableQty: ' + addToBillableQty + ' || totalQuotedQty: ' + totalQuotedQty
                        })

                        var itemDesc = jobRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'description',
                            line: lineNum
                        });

                        var allReworkHrs = getAllRework(projectId, itemDesc)

                        log.debug({
                            title: 'COMPUTED HOURS',
                            details: 'allReworkHrs: ' + allReworkHrs
                        })

                        if (allReworkHrs) {

                            var withoutReworkHrs = totalWorkHrs - allReworkHrs

                            log.debug({
                                title: 'COMPUTED HOURS',
                                details: 'allReworkHrs: ' + allReworkHrs + ' || withoutReworkHrs: ' + withoutReworkHrs
                            })

                            if (withoutReworkHrs < totalQuotedQty) { // withoutReworkHrs < totalQuotedQty, set quantity back to totalQuotedQty
                                log.debug({
                                    title: 'withoutReworkHrs < totalQuotedQty',
                                    details: 'set quantity back to totalQuotedQty'
                                })

                                jobRec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'quantity',
                                    line: lineNum,
                                    value: totalQuotedQty
                                });

                                jobRec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_ddc_prebill_qty',
                                    line: lineNum,
                                    value: totalQuotedQty
                                });
                            } else if (withoutReworkHrs > totalQuotedQty && parseInt(withoutReworkHrs) > 0) {

                                log.debug({
                                    title: 'COMPUTED HOURS',
                                    details: 'totalWorkHrs > totalQuotedQty && parseInt(withoutReworkHrs) > 0'
                                })

                                jobRec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'quantity',
                                    line: lineNum,
                                    value: totalQuotedQty + withoutReworkHrs
                                });

                                jobRec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_ddc_prebill_qty',
                                    line: lineNum,
                                    value: totalQuotedQty + withoutReworkHrs
                                });
                            }


                        } else {

                            log.debug({
                                title: 'Billable Qty',
                                details: 'no rework or internalTraining'
                            })

                            jobRec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                line: lineNum,
                                value: totalQuotedQty + addToBillableQty
                            });

                            jobRec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ddc_prebill_qty',
                                line: lineNum,
                                value: totalQuotedQty + addToBillableQty
                            });

                        }
                    }

                }

            }

            //end of set billable qty

            //set actual qty

            jobRec.setSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_ddc_actual_qty',
                line: lineNum,
                value: totalWorkHrs
            });
        }



        //check governance units

        var governanceUsage = runtime.getCurrentScript()
        var govUnits = governanceUsage.getRemainingUsage()

        log.debug({
            title: 'govUnits',
            details: govUnits
        })

        var jobRecId = jobRec.save()

        return jobRecId
    }

    function getAllRework(projectId, itemDesc) {
        var reworkTotal = 0;
        var timeEntrySearchObj = search.create({
            type: search.Type.TIME_BILL,
            filters:
                [
                    ["customer", "anyof", projectId],
                    "AND",
   //                 ["employee", "anyof", ["@CURRENT@", 599900]],
   //                 "AND",
                    ["type", "anyof", "A"],
                    "AND",
                    [[["custcol_ddc_time_rework", "is", "T"], "OR", ["custcol_ddc_time_internal_training", "is", "T"]]],
                    "AND",
                    ["projecttask.title", "startswith", itemDesc]
                ],
            columns: [
                {
                    name: 'hours'
                }
            ]
        })

        timeEntrySearchObj.run().each(function (result) {
            var duration = parseInt(result.getValue('hours'))
            reworkTotal += duration

            log.debug({
                title: 'GET ALL REWORK',
                details: ' reworkTotal += duration: ' + reworkTotal
            })
            return true;
        });

        return reworkTotal;
    }

    return {
        beforeSubmit: timesheet_beforeSubmit,
        afterSubmit: update_actual_qty_afterSubmit
    }
});
