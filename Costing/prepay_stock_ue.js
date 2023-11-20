/**
 * @name:                                       prepay_stock_ue.js
 * @author:                                     Patrick Lising
 * @summary:                                    Script Description
 * @copyright:                                  © Copyright by Jcurve Solutions
 * Date Created:                                Tue Oct 25 2022 10:17:10 AM
 * Change Logs:
 * Date                          Author               Description
 * Tue Oct 25 2022 10:17:10 AM -- Patrick Lising -- Initial Creation
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */



 define(['N/record', 'N/search'], function (record, search) {

    function prepay_beforeLoad(context) {

    }

    function prepay_beforeSubmit(context) {

    }

    function prepay_afterSubmit(context) {

        var itemReceiptObj = context.newRecord;
        var createdFrom = itemReceiptObj.getValue({
            fieldId: 'createdfrom'
        })
        var jobRecord = search.lookupFields({
            type: 'purchaseorder',
            id: createdFrom,
            columns: ['custbody_ddc_rfq_job_link', 'subsidiary', 'entity']
        })

        log.debug({
            title: 'jobRecord value',
            details: 'jobRecord value: ' + jobRecord.custbody_ddc_rfq_job_link[0].value
        })

        var jobId = jobRecord.custbody_ddc_rfq_job_link[0].value

        //get prepay item stock in Job linked to Purchase Order

        if (jobId) {

            var prepayItemsArr = getPrepayItems(jobId)

            var lineCount = itemReceiptObj.getLineCount({
                sublistId: 'item'
            })
            var itemReceiptArr = []

            for (var i = 0; i < lineCount; i++) {

                var itemId = itemReceiptObj.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });

                prepayItemsArr.forEach(id => {
                    if (id.itemId == itemId) {

                        var itemQty = itemReceiptObj.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: i
                        });

                        itemReceiptArr.push({
                            itemId: itemId,
                            itemQty: itemQty,
                            itemLoc: id.inventoryLoc
                        })
                    }
                })

            }

            log.debug({
                title: 'itemReceiptArr',
                details: 'itemReceiptArr value: ' + JSON.stringify(itemReceiptArr)
            })

            //proceed to create Item Fulfillment and Inventory Adjustment
            //Item Fulfillment needs to check fulfill of Item Id and set Qty

            if (itemReceiptArr.length > 0) {

                var fulfillmentId = createFulfillment(jobId, itemReceiptArr)
                log.debug({
                    title: 'fulfillmentId',
                    details: 'fulfillmentId: ' + fulfillmentId
                })

                if (fulfillmentId) {
                    var adjustmentId = createAdjustment(jobId, itemReceiptArr)
                    log.debug({
                        title: 'adjustmentId',
                        details: 'adjustmentId: ' + adjustmentId
                    })
                }

            }

        }

    }


    function getPrepayItems(jobId) {
        var prepayItemsArr = [];

        var salesorderSearchObj = search.create({
            type: "salesorder",
            filters:
                [
                    ["type", "anyof", "SalesOrd"],
                    "AND",
                    ["mainline", "is", "F"],
                    "AND",
                    ["item.type", "anyof", "InvtPart"],
                    "AND",
                    ["custcol_ddc_prepay_stock", "is", "T"]
                ],
            columns:
                [
                    search.createColumn({ name: "item", label: "Item" }),
                    search.createColumn({ name: "quantity", label: "Quantity" }),
                    search.createColumn({ name: "custcol_ddc_prepay_stock", label: "Prepay Stock" }),
                    search.createColumn({ name: "inventorylocation", label: "Inventory Location" })
                ]
        });
        var searchResultCount = salesorderSearchObj.runPaged().count;
        log.debug("salesorderSearchObj result count", searchResultCount);
        salesorderSearchObj.run().each(function (result) {

            var itemId = result.getValue('item');
            var inventoryLoc = result.getValue('inventorylocation');

            prepayItemsArr.push(
                {
                    itemId: itemId,
                    inventoryLoc: inventoryLoc
                }
            )

            // prepayItemsArr.push({
            //     item: itemId,
            //     qty: itemQty,
            //     prepay:itemPrepay

            // })
            // .run().each has a limit of 4,000 results
            return true;
        });


        return prepayItemsArr;
    }


    function createFulfillment(jobId, itemReceiptArr) {

        var jobRecord = search.lookupFields({
            type: 'salesorder',
            id: jobId,
            columns: 'location'
        })

        var itemFulfillmentObj = record.transform({
            fromType: record.Type.SALES_ORDER,
            fromId: jobId,
            toType: record.Type.ITEM_FULFILLMENT,
            isDynamic: true,
            defaultValues: {
                inventorylocation: jobRecord.location[0].value
            }
        });

        var fulfillCount = itemFulfillmentObj.getLineCount({
            sublistId: 'item'
        })


        for (var j = 0; j < fulfillCount; j++) {

            itemFulfillmentObj.selectLine({
                sublistId: 'item',
                line: j
            });

            var fulfillmentItem = itemFulfillmentObj.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: j
            });

            log.debug({
                title: 'check',
                details: 'checking item: ' + fulfillmentItem
            })

            for (var k = 0; k < itemReceiptArr.length; k++) {
                if (itemReceiptArr[k].itemId == fulfillmentItem) {

                    itemFulfillmentObj.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'itemreceive',
                        value: true
                    });

                    log.debug({
                        title: 'include',
                        details: 'including item: ' + fulfillmentItem
                    })
                    break;

                } else {
                    itemFulfillmentObj.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'itemreceive',
                        value: false
                    });

                    log.debug({
                        title: 'remove',
                        details: 'removing item: ' + fulfillmentItem
                    })

                }
            }

            itemFulfillmentObj.commitLine({
                sublistId: 'item'
            });



        }


        var recId = itemFulfillmentObj.save()

        return recId;

    }


    function createAdjustment(jobId, itemReceiptArr) {

        var jobRecord = search.lookupFields({
            type: 'salesorder',
            id: jobId,
            columns: ['subsidiary', 'entity']
        })
        var jobSubsidiary = jobRecord.subsidiary[0].value
        var jobCustomer = jobRecord.entity[0].value

        var adjustmentRec = record.create({
            type: record.Type.INVENTORY_ADJUSTMENT,
            isDynamic: true
        })

        adjustmentRec.setValue({
            fieldId: 'subsidiary',
            value: jobSubsidiary
        })

        adjustmentRec.setValue({
            fieldId: 'customer',
            value: jobCustomer
        })

        adjustmentRec.setValue({
            fieldId: 'account',
            value: 242
        })

        for (var h = 0; h < itemReceiptArr.length; h++) {
            adjustmentRec.selectLine({
                sublistId: 'inventory',
                line: h
            });

            adjustmentRec.setCurrentSublistValue({
                sublistId: 'inventory',
                fieldId: 'item',
                value: itemReceiptArr[h].itemId
            });

            adjustmentRec.setCurrentSublistValue({
                sublistId: 'inventory',
                fieldId: 'location',
                value: itemReceiptArr[h].itemLoc
            });

            adjustmentRec.setCurrentSublistValue({
                sublistId: 'inventory',
                fieldId: 'adjustqtyby',
                value: itemReceiptArr[h].itemQty
            });

            adjustmentRec.setCurrentSublistValue({
                sublistId: 'inventory',
                fieldId: 'unitcost',
                value: 0
            });

            adjustmentRec.commitLine({
                sublistId: 'inventory'
            });

        }

        var adjustment = adjustmentRec.save();

        return adjustment;
    }

    return {
        beforeLoad: prepay_beforeLoad,
        beforeSubmit: prepay_beforeSubmit,
        afterSubmit: prepay_afterSubmit
    }
});
