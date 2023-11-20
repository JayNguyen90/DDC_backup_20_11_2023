/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/record", 'N/search', 'N/task', 'N/format'], function (record, search, task, format) {

    function onRequest(context) {
        log.debug("start", "start");
        var result = {};
        if (context.request.method !== "GET") {
            log.debug("post", "post")
            var dataPost = context.request.body;
            dataPost = JSON.parse(dataPost)
            log.debug("dataPost", dataPost);
            try {

                var rec = createTransaction(dataPost);
                if (rec.recId) {
                    result = { status: true, recId: rec.recId }
                }

            } catch (error) {
                result = { status: false }
            }
            log.debug("result", result)
            context.response.setHeader({
                name: 'Content-Type',
                value: 'application/json; charset=utf-8'
            });
            context.response.write({
                output: JSON.stringify(result)
            });
        }

        log.debug("finish", "finish");
    }

    function createTransaction(objectData) {
        var result = {};
        try {

            var rec = record.create(
                {
                    type: 'purchaseorder',
                    isDynamic: true
                });
            rec.setValue({
                fieldId: 'customform',
                value: 188
            })
            rec.setValue({
                fieldId: 'entity',
                value: objectData.header.vendor
            })

            var arrItem = objectData.lineItem;


            rec.setValue({
                fieldId: 'subsidiary',
                value: 2
            })

            rec.setValue({
                fieldId: 'custbody_ddc_req_rfq_link',
                value: objectData.header.recId
            })
            rec.setValue({
                fieldId: 'custbody_ddc_rfq_job_link',
                value: objectData.header.linkJob
            })

            rec.setValue({
                fieldId: 'custbody_ddc_sales_contact',
                value: objectData.header.saleContact
            })
            rec.setValue({
                fieldId: 'custbody_ddc_rfq_quote_link',
                value: objectData.header.quoteLink
            })

            //source additional fields

            rec.setValue({
                fieldId: 'custbody_ddc_vendor_quote_num',
                value: objectData.header.vendorQuoteNum
            })

            // GR - Adding Supplier Contact
            rec.setValue({
                fieldId: 'custbody_ddc_supplier_contact',
                value: objectData.header.supplierContact
            })
            if (objectData.header.dueDate) {
                var duDate = format.parse({
                    value: objectData.header.dueDate,
                    type: format.Type.DATE
                })
                rec.setValue({
                    fieldId: 'duedate',
                    value: duDate
                })
            }

            // GR - Adding Requestor
            rec.setValue({
                fieldId: 'employee',
                value: objectData.header.requestor
            })
          
            rec.setValue({
                fieldId: 'memo',
                value: objectData.header.memo
            })

            //rec.setValue({
            //    fieldId: 'custbody_ddc_ship_to_attn',
            //    value: objectData.header.shipToAttn
            //})

            //rec.setValue({
            //    fieldId: 'custbody_ddc_ship_to_third_party',
            //    value: objectData.header.shipToThirdPty
            //})

            //rec.setValue({
            //    fieldId: 'custbody_ddc_third_party_location',
            //    value: objectData.header.thirdPtyLoc
            //})

            //rec.setValue({
            //    fieldId: 'custbody_ddc_warehouse_location',
            //    value: objectData.header.warehouseLoc
            //})

            //rec.setValue({
            //    fieldId: 'custbody_ddc_delivery_instructions',
            //    value: objectData.header.deliveryInstruc
            //})

            //end



            for (var i = 0; i < arrItem.length; i++) {
                rec.selectLine(
                    {
                        sublistId: 'item',
                        line: i
                    });
                rec.setCurrentSublistValue(
                    {
                        sublistId: 'item',
                        fieldId: 'item',
                        value: arrItem[i].itemId
                    });
                log.debug("item", rec.getCurrentSublistValue(
                    {
                        sublistId: 'item',
                        fieldId: 'item'
                    }))
                rec.setCurrentSublistValue(
                    {
                        sublistId: 'item',
                        fieldId: 'description',
                        value: arrItem[i].description
                    });
                rec.setCurrentSublistValue(
                    {
                        sublistId: 'item',
                        fieldId: 'location',
                        value: parseInt(arrItem[i].location)
                    });
                log.debug("location", rec.getCurrentSublistValue(
                    {
                        sublistId: 'item',
                        fieldId: 'location'
                    }))
              
                //log.debug("targetsubsidiary", objectData.header.subsidiary)
                //log.debug("description", rec.getCurrentSublistValue(
                //    {
                //        sublistId: 'item',
                //        fieldId: 'description'
                //    }))
                //rec.setCurrentSublistValue(
                //    {
                //        sublistId: 'item',
                //        fieldId: 'custcol_rec_sub',
                //        value: parseInt(objectData.header.subsidiary)
                //    });
                //log.debug("custcol_rec_sub", rec.getCurrentSublistValue(
                //    {
                //        sublistId: 'item',
                //        fieldId: 'custcol_rec_sub'
                //    }))
                //rec.setCurrentSublistValue(
                //    {
                //        sublistId: 'item',
                //        fieldId: 'custcol_rec_loc',
                //        value: parseInt(arrItem[i].location)
                //    });
                //log.debug("custcol_rec_loc", rec.getCurrentSublistValue(
                //    {
                //        sublistId: 'item',
                //        fieldId: 'custcol_rec_loc'
                //    }))
                //rec.setCurrentSublistValue(
                //    {
                //        sublistId: 'item',
                //        fieldId: 'targetsubsidiary',
                //        value: parseInt(objectData.header.subsidiary)
                //    });
                //log.debug("targetsubsidiary", rec.getCurrentSublistValue(
                //    {
                //        sublistId: 'item',
                //        fieldId: 'targetsubsidiary'
                //    }))
                //log.debug("targetlocation", arrItem[i].location)
                //rec.setCurrentSublistValue(
                //    {
                //        sublistId: 'item',
                //        fieldId: 'targetlocation',
                //        value: parseInt(arrItem[i].location)
                //    });
                //log.debug("targetlocation", rec.getCurrentSublistValue(
                //    {
                //        sublistId: 'item',
                //        fieldId: 'targetlocation'
                //    }))
                rec.setCurrentSublistValue(
                    {
                        sublistId: 'item',
                        fieldId: 'quantity',
                        value: arrItem[i].quantity
                    });
                log.debug("quantity", rec.getCurrentSublistValue(
                    {
                        sublistId: 'item',
                        fieldId: 'quantity'
                    }))
                rec.setCurrentSublistValue(
                    {
                        sublistId: 'item',
                        fieldId: 'rate',
                        value: arrItem[i].estimatedrate
                    });
                log.debug("rate", rec.getCurrentSublistValue(
                    {
                        sublistId: 'item',
                        fieldId: 'rate'
                    }))
                rec.setCurrentSublistValue(
                    {
                        sublistId: 'item',
                        fieldId: 'amount',
                        value: arrItem[i].estimatedamount
                    });
                log.debug("amount", rec.getCurrentSublistValue(
                    {
                        sublistId: 'item',
                        fieldId: 'amount'
                    }))
                if (arrItem[i].unit) {
                    rec.setCurrentSublistValue(
                        {
                            sublistId: 'item',
                            fieldId: 'unit',
                            value: arrItem[i].unit
                        });
                    log.debug("unit", rec.getCurrentSublistValue(
                        {
                            sublistId: 'item',
                            fieldId: 'unit'
                        }))
                }
                if (arrItem[i].untSale) {
                    rec.setCurrentSublistValue(
                        {
                            sublistId: 'item',
                            fieldId: 'custcol_ddc_unit_sale',
                            value: arrItem[i].untSale
                        });

                }

                rec.commitLine(
                    {
                        sublistId: 'item'
                    });

            }
            log.debug("rec", rec)
            var recId = rec.save();
            log.debug("recId", recId)
            if (recId) {
                log.debug("doing some thing");
                var id = record.submitFields({
                    type: 'purchaserequisition',
                    id: objectData.header.recId,
                    values: {
                        custbody_ddc_rfq_status: '6',
                        custbody_ddc_rfq_linked_po: recId
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });

            }
            result.recId = recId;
            result.status = true;
            return result;

        } catch (error) {
            log.debug("error", error)
            result.status = false;
            return result;

        }
    }
    return {
        onRequest: onRequest
    }
})