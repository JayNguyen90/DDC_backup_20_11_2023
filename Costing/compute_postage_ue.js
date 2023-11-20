/**
 * @name:                                       compute_postage_ue.js
 * @author:                                     Patrick Lising
 * @summary:                                    Script Description
 * @copyright:                                  © Copyright by Jcurve Solutions
 * Date Created:                                Fri Feb 03 2023 7:02:27 AM
 * Change Logs:
 * Date                          Author               Description
 * Fri Feb 03 2023 7:02:27 AM -- Patrick Lising -- Initial Creation
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/runtime'], function (runtime) {

    function compute_postage_beforeSubmit(context) {

        var jobRecord = context.newRecord;
        var oldJobRecord = context.oldRecord;

        var subsidiary = jobRecord.getValue('subsidiary');
        log.debug("subsidiary", subsidiary);
        //adding validation to only run script if subsidiary is == 2 (DDC subsidiary)
        if (subsidiary != '2') {
            return;
        }

        //only execute on Edit and UI context
        if (context.type == 'edit' && runtime.executionContext != 'SUITELET') {

            var postageInclusive = jobRecord.getValue({
                fieldId: 'custbody_ddc_postage_mgt_fee_inclusive'
            })

            var lineCount = jobRecord.getLineCount({
                sublistId: 'item'
            })

            var postageFeeRate = jobRecord.getValue({
                fieldId: 'custbody_ddc_postage_mgt_fee_rate'
            })

            var postageItemsArr = [];

            //If Postage Management Fee Inclusive ?= FALSE (unticked), update the Postage Management Fee line item “Amount” field with the new calculated amount.

            if (!postageInclusive) {

                log.debug({
                    title: '!postageInclusive',
                    details: postageInclusive
                })

                var totalPostageAmt = 0;

                //Logic: Add amount of all Specific Postage Service Items(Criteria: Item Category= Postage Details and Exclude from Quote PDF = TRUE) and multiply with the Postage Management Fee Rate

                for (var i = 0; i < lineCount; i++) {

                    var itemCat = jobRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_ddc_item_category',
                        line: i
                    })

                    var excludePdf = jobRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_ddc_exclude_quote_pdf',
                        line: i
                    })

                    var itemId = jobRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    })
                    var quantity = jobRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_ddc_actual_qty',
                        line: i
                    }) || 0
                    if (itemCat == 20 && excludePdf) {

                        // var oldPostageAmt = oldJobRecord.getSublistValue({
                        //     sublistId: 'item',
                        //     fieldId: 'custcol_ddc_postage_amount',
                        //     line: i
                        // })
                        var postageAmt = jobRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_ddc_postage_amount',
                            line: i
                        })

                        // jobRecord.setSublistValue({
                        //     sublistId:'item',
                        //     fieldId:'amount',
                        //     line: i,
                        //     value: postageAmt
                        // })

                        //only run if there is an update to the postage amount

                        //if (parseFloat(oldPostageAmt) != parseFloat(newPostageAmt)) {

                        log.debug({
                            title: 'totalPostageAmt || parseFloat(postageAmt)',
                            details: totalPostageAmt + ' || ' + parseFloatOrZero(postageAmt)
                        })

                        totalPostageAmt += parseFloatOrZero(postageAmt)
                        //}

                        postageItemsArr.push({
                            index: i,
                            itemId: itemId,
                            quantity: quantity,
                            postageAmt: parseFloatOrZero(postageAmt)
                        })
                    } else if (itemId == 10894 || itemId == 10895 || itemId == 8460) {
                        // postageItemsArr.push(i)
                        postageItemsArr.push({
                            index: i,
                            itemId: itemId,
                            quantity: quantity,
                            postageAmt: parseFloatOrZero(postageAmt)
                        })
                    }
                }
                //Set the “Amount” field of the Specific Postage Service Item equal to “Postage Amount” field

                log.debug({
                    title: 'postageItemsArr',
                    details: JSON.stringify(postageItemsArr)
                })

                log.debug({
                    title: 'totalPostageAmt * rate',
                    details: totalPostageAmt + ' || ' + parseFloatOrZero(postageFeeRate / 100)
                })

                var computedPostageAmt = parseFloatOrZero(totalPostageAmt) * parseFloatOrZero(postageFeeRate / 100)

                log.debug({
                    title: 'computedPostageAmt',
                    details: computedPostageAmt
                })

                for (var j = 0; j < postageItemsArr.length; j++) {

                    if (postageItemsArr[j].itemId == 10894 || postageItemsArr[j].itemId == 10895 || postageItemsArr[j].itemId == 8460) {

                        jobRecord.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            line: postageItemsArr[j].index,
                            value: computedPostageAmt
                        })
                    } else {


                        log.debug({
                            title: 'GR/LG: setting the amount on non fee lines: line,value',
                            details: postageItemsArr[j].index + "; " + postageItemsArr[j].postageAmt
                        })
                        if (postageItemsArr[j].quantity != 0) {
                            jobRecord.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'rate',
                                line: postageItemsArr[j].index,
                                value: postageItemsArr[j].postageAmt / postageItemsArr[j].quantity
                            })
                        }
                        else {
                            jobRecord.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'rate',
                                line: postageItemsArr[j].index,
                                value: 0
                            })
                        }

                    }

                }



                //Update the amount of the Postage Management Fee line item. This item can either be PMGT05, PMGT10, or PMGTOT

                // var pmgt05Line = jobRecord.findSublistLineWithValue({
                //     sublistId: 'item',
                //     fieldId: 'item',
                //     value: 10894
                // });

                // var pmgt10Line = jobRecord.findSublistLineWithValue({
                //     sublistId: 'item',
                //     fieldId: 'item',
                //     value: 10895
                // });

                // var pmgtotLine = jobRecord.findSublistLineWithValue({
                //     sublistId: 'item',
                //     fieldId: 'item',
                //     value: 8460
                // });

                // if (pmgt05Line != -1) {
                //     jobRecord.setSublistValue({
                //         sublistId: 'item',
                //         fieldId: 'amount',
                //         line: pmgt05Line,
                //         value: computedPostageAmt
                //     })
                // } else if (pmgt10Line != -1) {
                //     jobRecord.setSublistValue({
                //         sublistId: 'item',
                //         fieldId: 'amount',
                //         line: pmgt10Line,
                //         value: computedPostageAmt
                //     })
                // } else if (pmgtotLine != -1) {
                //     jobRecord.setSublistValue({
                //         sublistId: 'item',
                //         fieldId: 'amount',
                //         line: pmgtotLine,
                //         value: computedPostageAmt
                //     })
                // }


            } else {
                // Scenario 2: Postage Management Fee Inclusive ?= TRUE
                // For each of the Specific Postage Service line item/s multiply the “Postage Amount” field with the Postage Management Fee Rate
                // add the computed amount into their corresponding “Amount” fields

                log.debug({
                    title: 'postageInclusive',
                    details: postageInclusive
                })

                for (var i = 0; i < lineCount; i++) {

                    var itemCat = jobRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_ddc_item_category',
                        line: i
                    })

                    var excludePdf = jobRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_ddc_exclude_quote_pdf',
                        line: i
                    })

                    if (itemCat == 20 && excludePdf) {
                        var postageAmt = jobRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_ddc_postage_amount',
                            line: i
                        })

                        var quantity = jobRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_ddc_actual_qty',
                            line: i
                        })||0
                        var additionalAmt = (parseFloatOrZero(postageAmt) * parseFloatOrZero(postageFeeRate / 100))

                        log.debug({
                            title: 'additionalAmt',
                            details: additionalAmt
                        })

                        if (quantity != 0) {
                            jobRecord.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'rate',
                                line: i,
                                value: (parseFloatOrZero(postageAmt) + parseFloatOrZero(additionalAmt)) / quantity
                            })
                        } else {
                            jobRecord.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'rate',
                                line: i,
                                value: 0
                            })
                        }

                    }
                }
            }

        }

    }

    const parseFloatOrZero = n => parseFloat(n) || 0

    return {
        beforeSubmit: compute_postage_beforeSubmit
    }
});
