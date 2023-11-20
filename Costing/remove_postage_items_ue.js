/** 
 * @name:                                       remove_postage_items_ue.js
 * @author:                                     Patrick Lising
 * @summary:                                    Script Description
 * @copyright:                                  © Copyright by Jcurve Solutions
 * Date Created:                                Wed Feb 01 2023 3:09:27 PM
 * Change Logs:
 * Date                          Author               Description
 * Wed Feb 01 2023 3:09:27 PM -- Patrick Lising -- Initial Creation
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */

define(['N/record'], function (record) {

    function remove_postage_beforeLoad(context) {

        //During Job creation or During Job Save from SCPQ, delete Generic Postage Service Item lines (Criteria: Item Category = “Postage Details” and “Exclude from Invoice PDF” = TRUE) 
        var jobRecord = context.newRecord;

        var subsidiary = jobRecord.getValue('subsidiary');
        log.debug("subsidiary", subsidiary);
        //adding validation to only run script if subsidiary is == 2 (DDC subsidiary)
        if (subsidiary != '2') {
            return;
        }

        var runCreated = jobRecord.getValue('custbody_ddc_runs_created');
        log.debug("runCreated",runCreated);
        if(!runCreated){
            return ;
        }
        var lineCount = jobRecord.getLineCount({
            sublistId: 'item'
        })

        for (var i = 0; i < lineCount; i++) {

            var itemCat = jobRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_ddc_item_category',
                line: i
            })

            var excludePdf = jobRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_ddc_exclude_invoice_pdf',
                line: i
            })

            log.debug({
                title: 'Remove?',
                details: 'itemCat: ' + itemCat + ' excludePdf: ' + excludePdf
            })

            if (itemCat == 20 && excludePdf) {

                var itemId = jobRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                })

                log.debug({
                    title: 'Remove',
                    details: 'Remove item id: ' + itemId
                })

                jobRecord.removeLine({
                    sublistId: 'item',
                    line: i
                });

            }
        }

    }


    function remove_postage_beforeSubmit(context) {

        //During Job creation or During Job Save from SCPQ, delete Generic Postage Service Item lines (Criteria: Item Category = “Postage Details” and “Exclude from Invoice PDF” = TRUE) 
        var jobRecord = context.newRecord;
        if(jobRecord.type=="create"){
            return ;
        }
        var subsidiary = jobRecord.getValue('subsidiary');
        if (subsidiary != '2') {
            return;
        }
        var runCreated = jobRecord.getValue('custbody_ddc_runs_created');

        if (runCreated) {
            var lineCount = jobRecord.getLineCount({
                sublistId: 'item'
            })

            for (var i = 0; i < lineCount; i++) {

                var itemCat = jobRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_ddc_item_category',
                    line: i
                })

                var excludePdf = jobRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_ddc_exclude_invoice_pdf',
                    line: i
                })

                log.debug({
                    title: 'Remove?',
                    details: 'itemCat: ' + itemCat + ' excludePdf: ' + excludePdf
                })

                if (itemCat == 20 && excludePdf) {

                    var itemId = jobRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    })

                    log.debug({
                        title: 'Remove',
                        details: 'Remove item id: ' + itemId
                    })

                    jobRecord.removeLine({
                        sublistId: 'item',
                        line: i
                    });

                }
            }
        }

    }
    function afterSubmit(context) {
        try {
            var newRec = context.newRecord;
            var type = newRec.type;
            var internalId = newRec.id
            var rec = record.load(
                {
                    type: type,
                    id: internalId,
                    //isDynamic: true
                });
            var subsidiary = rec.getValue('subsidiary');
            if (subsidiary != '2') {
                return;
            }
            var runCreated = rec.getValue('custbody_ddc_runs_created');
            log.debug("runCreated",runCreated);
            if (runCreated) {
                var lineCount = rec.getLineCount({
                    sublistId: 'item'
                })
                lineCount=parseInt(lineCount)-parseInt(1);
                log.debug("lineCount",lineCount)
                for (var i = lineCount; i >=0; i--) {

                    var itemCat = rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_ddc_item_category',
                        line: i
                    })

                    var excludePdf = rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_ddc_exclude_invoice_pdf',
                        line: i
                    })

                    log.debug({
                        title: 'Remove?',
                        details: 'itemCat: ' + itemCat + ' excludePdf: ' + excludePdf
                    })

                    if (itemCat == 20 && excludePdf) {

                        var itemId = rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        })

                        log.debug({
                            title: 'Remove',
                            details: 'Remove item id: ' + itemId
                        })

                        rec.removeLine({
                            sublistId: 'item',
                            line: i
                        });

                    }

                }
                var recId = rec.save();
                log.debug("recId", recId);
            }

        } catch (error) {
            log.debug("error", error);
        }


    }
    return {
        //beforeLoad: remove_postage_beforeLoad,
        //beforeSubmit: remove_postage_beforeSubmit,
        afterSubmit: afterSubmit
    }
});
