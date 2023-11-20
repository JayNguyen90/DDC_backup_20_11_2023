/**
 * 
 * @name:                                       call_suitelet_cs.js

 * @author:                                     Patrick Lising

 * @summary:                                    The script is used to call the Suitelet to convert the RFQ Response to a Purchase Order.

 * @copyright:                                  © Copyright by Jcurve Solutions

 * Date Created:                                09/14/2022

 * Change Log:

 *  09/14/2022 -- Patrick Lising -- Initial version

 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/record', 'N/search', 'N/https', 'N/ui/serverWidget', 'N/redirect'], function (record, search, https, serverWidget, redirect) {

    function onRequest(context) {

        if (context.request.method == https.Method.GET) {

            var recId = context.request.parameters.recId
            var itemArray = []

            log.debug({
                title: "Suitelet Called",
                details: "Success: " + recId
            })

            //load the Vendor RFQ Response record //purchaserequisition //vendorrequestforquote
            var vendorRfq = record.load({
                type: 'purchaserequisition',
                id: recId
            })

            var status = vendorRfq.getValue({
                fieldId: 'status'
            })

            var salesContact = vendorRfq.getValue({
                fieldId: 'custbody_sales_contact'
            })

            var vendorQuoteNum = vendorRfq.getValue({
                fieldId: 'custbody_ddc_vendor_quote_num'
            })

            var contactId = vendorRfq.getValue({
                fieldId: 'vendorContact'
            })

            //get Vendor ID
            var vendor = search.lookupFields({
                type: search.Type.CONTACT,
                id: contactId,
                columns: ['company']
            })

            var vendorId = vendor.company[0].value

            var quoteLink = vendorRfq.getValue({
                fieldId: 'custbody_ddc_rfq_quote_link'
            })

            // Get required fields from Vendor RFQ to be entered on the PO
            // Body Fields: Vendor, Vendor Quote #
            // Line Fields : Item, Rate, Quantity, Units

            var lineCount = vendorRfq.getLineCount({
                sublistId: 'item'
            });

            // Get line item information. check if there is Add to PO for atleast 1 line item

            for (var i = 0; i < lineCount; i++) {

                var itemId = vendorRfq.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });

                var itemRate = vendorRfq.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_ddc_vendor_rate',
                    line: i
                });

                var itemQty = vendorRfq.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_ddc_qty_vendor_rfq',
                    line: i
                });

                var itemUnits = vendorRfq.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'units',
                    line: i
                });


                var addToPo = vendorRfq.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_add_to_po',
                    line: i
                });

                var replacementItem = vendorRfq.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_placeholder_replacement_item',
                    line: i
                });

                // if add to po is checked, add to item array for PO creation

                if (addToPo) {
                    if (replacementItem) {

                        var replacementUnits = search.lookupFields({
                            type: search.Type.ITEM,
                            id: replacementItem,
                            columns: 'unitstype'
                        })

                        itemArray.push(
                            {
                                "itemId": replacementItem,
                                "itemRate": itemRate,
                                "itemQty": itemQty,
                                "itemUnits": replacementUnits.unitstype[0].value
                            }
                        )
                    } else {
                        itemArray.push(
                            {
                                "itemId": itemId,
                                "itemRate": itemRate,
                                "itemQty": itemQty,
                                "itemUnits": itemUnits
                            }
                        )
                    }
                }

                log.debug({
                    title: "Line Items",
                    details: itemArray
                })

            }

            // If atleast 1 item has add to PO, create Purchase Order

            if (itemArray.length == 0) {
                var landingPage = serverWidget.createForm({
                    title: 'Items are not valid'
                })


                context.response.writePage({
                    pageObject: landingPage
                })

            } else {
                var createdPoId = createPurchaseOrder(recId, vendorId, quoteLink, itemArray, salesContact, vendorQuoteNum)

                log.debug({
                    title: 'PO Creation',
                    details: "PO ID: " + createdPoId + " has been created"
                })

                // Set the PO ID on the PO Link field on the Vendor Request for Quote Record

                vendorRfq.setValue({
                    fieldId: 'custbody_ddc_rfq_linked_po',
                    value: createdPoId
                })

                var updateVrfq = vendorRfq.save();


                log.debug({
                    title: 'Vendor RFQ Updated',
                    details: "VRFQ ID: " + updateVrfq + " has been updated"
                })

                var createdPoNum = search.lookupFields({
                    type: search.Type.PURCHASE_ORDER,
                    id: createdPoId,
                    columns: 'tranid'
                })


                var landingPage = serverWidget.createForm({
                    title: 'Convert to PO success. ' + createdPoNum.tranid + ' has been created'
                })

                landingPage.clientScriptFileId = '12649'

                landingPage.addButton({
                    id: 'custpage_go_back',
                    label: 'Back to VRFQ',
                    functionName: 'redirectToRecord(' + updateVrfq + ')'
                })

                context.response.writePage({
                    pageObject: landingPage
                })

            }

            // START OF POST METHOD
        } else {

        }
    }

    function createPurchaseOrder(recId, vendorId, quoteLink, itemArray, salesContact, vendorQuoteNum) {

        var purchaseOrderRec = record.create({
            type: record.Type.PURCHASE_ORDER
        })

        purchaseOrderRec.setValue({
            fieldId: 'entity',
            value: vendorId
        })

        purchaseOrderRec.setValue({
            fieldId: 'custbody_ddc_rfq_linked_rfq_response',
            value: recId
        })

        purchaseOrderRec.setValue({
            fieldId: 'custbody_sales_contact',
            value: salesContact
        })

        purchaseOrderRec.setValue({
            fieldId: 'custbody_ddc_vendor_quote_num',
            value: vendorQuoteNum
        })

        purchaseOrderRec.setValue({
            fieldId: 'custbody_ddc_rfq_quote_link',
            value: quoteLink
        })

        for (var j = 0; j < itemArray.length; j++) {

            purchaseOrderRec.setSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: j,
                value: itemArray[j].itemId
            })

            purchaseOrderRec.setSublistValue({
                sublistId: 'item',
                fieldId: 'rate',
                line: j,
                value: itemArray[j].itemRate
            })

            purchaseOrderRec.setSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                line: j,
                value: itemArray[j].itemQty
            })

            purchaseOrderRec.setSublistValue({
                sublistId: 'item',
                fieldId: 'amount',
                line: j,
                value: itemArray[j].itemQty * itemArray[j].itemRate
            })

            purchaseOrderRec.setSublistValue({
                sublistId: 'item',
                fieldId: 'units',
                line: j,
                value: itemArray[j].itemUnits
            })
        }

        var poId = purchaseOrderRec.save();

        return poId;

    }


    return {
        onRequest: onRequest
    }
});
