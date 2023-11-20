/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/record', 'SuiteScripts/Jcs Run Management/sweetalert2.all.min.js', 'N/url'], function (currentRecord, record, Swal1, url) {

    var exports = {};
    function pageInit(context) {
    }
    /**
 * Function to be executed after page is initialized.
 *
 * @param {Object} scriptContext
 * @param {Record} scriptContext.currentRecord - Current form record
 * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
 *
 * @since 2015.2
 */
    function generationPo() {
        var recId = currentRecord.get().id;
        console.log("recId", recId);
        var soObject = {};
        var header = {};
        var itemArr = [];
        var objRecord = record.load({ type: 'purchaserequisition', id: recId });
        var linkJob = objRecord.getValue('custbody_ddc_rfq_job_link');
        var saleContact = objRecord.getValue('custbody_ddc_sales_contact');
        var quoteLink = objRecord.getValue('custbody_ddc_rfq_quote_link');
        var subsidiary = objRecord.getValue('subsidiary');
        var supplierRef1 = objRecord.getValue('custbody_ddc_rec_rfq_supplier1_pref');
        var supplierRef2 = objRecord.getValue('custbody_ddc_rec_rfq_supplier2_pref');
        var supplierRef3 = objRecord.getValue('custbody_ddc_rec_rfq_supplier3_pref');

        //added more fields as requested vendorQuoteNum,quoteContact,dueDate,memo,shipToAttn,shipToThirdPty,thirdPtyLoc,warehouseLoc,deliveryInstruc
        var vendorQuoteNum = objRecord.getValue({
            fieldId: 'custbody_ddc_vendor_quote_num'
        })

        var dueDate = objRecord.getText({
            fieldId: 'duedate'
        })

        var memo = objRecord.getValue({
            fieldId: 'memo'
        })

        // GR - Added Requestor
        var requestor = objRecord.getValue({
            fieldId: 'entity'
        })

        //var shipToAttn = objRecord.getValue({
        //    fieldId: 'custbody_ddc_ship_to_attn'
        //})

        //var shipToThirdPty = objRecord.getValue({
        //    fieldId: 'custbody_ddc_ship_to_third_party'
        //})

        //var thirdPtyLoc = objRecord.getValue({
        //    fieldId: 'custbody_ddc_third_party_location'
        //})

        //var warehouseLoc = objRecord.getValue({
        //    fieldId: 'custbody_ddc_warehouse_location'
        //})

        //var deliveryInstruc = objRecord.getValue({
        //    fieldId: 'custbody_ddc_delivery_instructions'
        //})

        //end of additional fields

        if (supplierRef1) {
            var vendor = objRecord.getValue('custbody_ddc_rfq_supplier1');
          
            // GR - Adding Supplier Contact (leaving as Quote Contact below)
            var supplierContact = objRecord.getValue('custbody_ddc_rfq_supplier1_contact');
        }
        if (supplierRef2) {
            var vendor = objRecord.getValue('custbody_ddc_rfq_supplier2');
          
            // GR - Adding Supplier Contact (leaving as Quote Contact below)
            var supplierContact = objRecord.getValue('custbody_ddc_rfq_supplier2_contact');
        }
        if (supplierRef3) {
            // GR - This next line should be supplier3 not supplier 2 again
            //var vendor = objRecord.getValue('custbody_ddc_rfq_supplier2');
            var vendor = objRecord.getValue('custbody_ddc_rfq_supplier3');
          
            // GR - Adding Supplier Contact (leaving as Quote Contact below)
            var supplierContact = objRecord.getValue('custbody_ddc_rfq_supplier3_contact');
        }

        header.recId = recId;
        header.vendor = vendor;
        header.linkJob = linkJob;
        header.saleContact = saleContact;
        header.quoteLink = quoteLink
        header.subsidiary = subsidiary;
        header.vendorQuoteNum = vendorQuoteNum;
        header.supplierContact = supplierContact;
        header.dueDate = dueDate;
        header.memo = memo;
        header.requestor = requestor; // GR - Added Requestor
        //header.shipToAttn = shipToAttn;
        //header.shipToThirdPty = shipToThirdPty;
        //header.thirdPtyLoc = thirdPtyLoc;
        //header.warehouseLoc = warehouseLoc;
        //header.deliveryInstruc = deliveryInstruc;

        var lineCount = objRecord.getLineCount('item');
        for (var j = 0; j < lineCount; j++) {
            var itemId = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: j })
            var quantity = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: j })
            var estimatedrate = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'estimatedrate', line: j })
            var estimatedamount = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'estimatedamount', line: j })
            var rate = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: j })
            var amount = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: j })
            var location = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'location', line: j })
            var description = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'description', line: j })
            var unit = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'unit', line: j })
            var untSale= objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_unit_sale', line: j })
            itemArr.push({
                itemId: itemId,
                quantity: quantity,
                estimatedrate: estimatedrate,
                estimatedamount: estimatedamount,
                rate: rate,
                amount: amount,
                location: location,
                description: description,
                unit:unit,
                untSale:untSale

            })
        }
        soObject["lineItem"] = itemArr;
        soObject["header"] = header
        Swal1.fire({
            onBeforeOpen: Swal1.showLoading,
            onOpen: function () {
                var suiteletUrl = url.resolveScript({
                    scriptId: 'customscript_jcs_create_po_sl',
                    deploymentId: 'customdeploy_jcs_create_po_sl'
                });
                console.log(suiteletUrl)
                try {
                    jQuery.ajax({
                        method: 'POST',
                        url: suiteletUrl,
                        data: JSON.stringify(soObject),
                        success: function (result) {
                            if (result.status == true) {
                                alert("Create Purchase Order Sucessfully");
                                window.location.reload();
                            }
                            else {
                                alert("Please contact admin!");
                                window.location.reload();
                            }

                        }
                    })

                } catch (error) {
                    console.log("error", error);
                    alert("Please contact admin!")
                    window.location.reload();
                }




            },
            allowOutsideClick: false,
            allowEscapeKey: true,
            text: "Processing"
        });


    }

    exports.pageInit = pageInit;
    exports.generationPo = generationPo;
    return exports;
});
