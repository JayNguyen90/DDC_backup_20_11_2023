/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 *@NModuleScope Public
 */
define([
    'N/record',
    'N/search',
    'N/task',
    'N/runtime',
    './ddc_jcs_util.js'
],
    function (
        _nRecord,
        _nSearch,
        _nTask,
        _nRuntime,
        util
    ) {
        var ReturnObj = {};

        function afterSubmit(context) {
            try {

                log.debug({
                    title: 'context.type',
                    details: context.type
                });

                log.debug({
                    title: '_nRuntime.executionContext',
                    details: _nRuntime.executionContext
                });

                if (context.type != 'create' || _nRuntime.executionContext == 'USERINTERFACE') return;

                var thisrec = context.newRecord;
                var poSubId = thisrec.getValue({ fieldId: 'subsidiary' });
                var entity = thisrec.getValue({ fieldId: 'entity' });
                var trandate = thisrec.getValue("trandate");
                var saleAdmin = thisrec.getValue('custbody_ddc_sales_contact');
                var quoteLink = thisrec.getValue('custbody_ddc_rfq_quote_link');
                var jobLink = thisrec.getValue('custbody_ddc_rfq_job_link');
                var rfqLink = thisrec.getValue('custbody_ddc_req_rfq_link');
                var quoteNum = thisrec.getValue('custbody_ddc_vendor_quote_num');
                var supplierContact = thisrec.getValue('custbody_ddc_supplier_contact');
                var location = thisrec.getValue('location');
                var lineCount = thisrec.getLineCount('item');

                var arrItem = []
                for (var i = 0; i < lineCount; i++) {
                    var itemId = thisrec.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                    var description = thisrec.getSublistValue({ sublistId: 'item', fieldId: 'description', line: i });
                    var custcol_rec_sub = thisrec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_rec_sub', line: i });
                    var custcol_rec_loc = thisrec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_rec_loc', line: i });
                    var targetsubsidiary = thisrec.getSublistValue({ sublistId: 'item', fieldId: 'targetsubsidiary', line: i });
                    var targetlocation = thisrec.getSublistValue({ sublistId: 'item', fieldId: 'targetlocation', line: i });
                    var quantity = thisrec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
                    var rate = thisrec.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i });
                    var amount = thisrec.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i });
                    arrItem.push({
                        itemId: itemId,
                        description: description,
                        custcol_rec_sub: custcol_rec_sub,
                        custcol_rec_loc: custcol_rec_loc,
                        targetsubsidiary: targetsubsidiary,
                        targetlocation: targetlocation,
                        quantity: quantity,
                        rate: rate,
                        amount: amount

                    })

                }
                log.debug({
                    title: 'poSubId',
                    details: poSubId
                });


                /**
                 * Aug 29, 2023 8:34:00 AM
                 * Commented out look up field for central ap
                 * Based on this link https://trello.com/c/VtApTW4U/1590-support-sc162757-ddc-removing-central-ap-impact-from-purchasing-scripts
                 * Changed the logic to create PO based on subsidiary to DDC Subsidiary
                 */
                // var vals = _nSearch.lookupFields({
                //     type: 'subsidiary',
                //     id: poSubId,
                //     columns: 'custrecord_central_ap'
                // });
                log.debug("vals", vals);
                // if (vals.custrecord_central_ap.length > 0) {
                //     var subsidiaryCentral = vals.custrecord_central_ap[0].value;
                //     log.debug("subsidiaryCentral", subsidiaryCentral)
                //     if (subsidiaryCentral) {

                // Changed the process of creation here and added it for DDC subsidiary.
                if (poSubId == 2) {
                    var rec = _nRecord.create(
                        {
                            type: 'purchaseorder',
                            isDynamic: true
                        });
                    rec.setValue({
                        fieldId: 'customform',
                        value: 188
                    })
                    rec.setValue({
                        fieldId: 'trandate',
                        value: trandate
                    })
                    rec.setValue({
                        fieldId: 'entity',
                        value: entity
                    })
                    rec.setValue({
                        fieldId: 'subsidiary',
                        value: subsidiaryCentral
                    })
                    // rec.setValue({
                    //     fieldId: 'location',
                    //     value: location
                    // })
                    rec.setValue({
                        fieldId: 'custbody_ddc_req_rfq_link',
                        value: rfqLink
                    })
                    rec.setValue({
                        fieldId: 'custbody_ddc_rfq_job_link',
                        value: jobLink
                    })
                    //Add new field
                    rec.setValue({
                        fieldId: 'custbody_ddc_vendor_quote_num',
                        value: quoteNum
                    })
                    rec.setValue({
                        fieldId: 'custbody_ddc_supplier_contact',
                        value: supplierContact
                    })
                    rec.setValue({
                        fieldId: 'custbody_ddc_sales_contact',
                        value: saleAdmin
                    })
                    rec.setValue({
                        fieldId: 'custbody_ddc_rfq_quote_link',
                        value: quoteLink
                    })
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
                        rec.setCurrentSublistValue(
                            {
                                sublistId: 'item',
                                fieldId: 'description',
                                value: arrItem[i].description
                            });

                        rec.setCurrentSublistValue(
                            {
                                sublistId: 'item',
                                fieldId: 'custcol_rec_sub',
                                value: arrItem[i].custcol_rec_sub
                            });
                        rec.setCurrentSublistValue(
                            {
                                sublistId: 'item',
                                fieldId: 'custcol_rec_loc',
                                value: arrItem[i].custcol_rec_loc
                            });

                        rec.setCurrentSublistValue(
                            {
                                sublistId: 'item',
                                fieldId: 'targetsubsidiary',
                                value: arrItem[i].targetsubsidiary
                            });
                        rec.setCurrentSublistValue(
                            {
                                sublistId: 'item',
                                fieldId: 'targetlocation',
                                value: arrItem[i].targetlocation
                            });

                        rec.setCurrentSublistValue(
                            {
                                sublistId: 'item',
                                fieldId: 'quantity',
                                value: arrItem[i].quantity
                            });

                        rec.setCurrentSublistValue(
                            {
                                sublistId: 'item',
                                fieldId: 'rate',
                                value: arrItem[i].rate
                            });

                        rec.setCurrentSublistValue(
                            {
                                sublistId: 'item',
                                fieldId: 'amount',
                                value: arrItem[i].amount
                            });

                        rec.commitLine(
                            {
                                sublistId: 'item'
                            });

                    }
                    var recNewPo = rec.save();
                    log.debug("recNewPo", recNewPo)
                    if (recNewPo) {
                        CloseOldRec(thisrec.id, recNewPo);
                    }
                }
                //     }
                // }


                // log.debug({title: 'Central AP Subsidiary = ', details: vals.custrecord_central_ap[0].value });
                // var newPO = _nRecord.copy({
                //     type: _nRecord.Type.PURCHASE_ORDER,
                //     id: thisrec.id,
                //     isDynamic: true,
                //     defaultValue : {
                //         fieldId:'subsidiary',
                //         //value: vals.custrecord_central_ap[0].value
                //       value: 'Test'
                //     }
                // });

                // /*
                // newPO.setValue({
                //     fieldId:'subsidiary',
                //     value: vals.custrecord_central_ap[0].value
                // });
                // */

                // var newPOID = newPO.save({
                //     enableSourcing: false,
                //     ignoreMandatoryFields: true
                // });
                // log.debug({
                //     title: 'new po id',
                //     details: newPOID
                // });

                //CloseOldRec(thisrec.id,newPOID);

                //return;
                /*   var thisrec = context.newRecord;
                   
                   var subs = thisrec.getValue({fieldId: 'subsidiary'});
                   if (subs!=SUBSIDIARY) return;
   
                   var custOwned = thisrec.getValue({fieldId: 'custitem_ddc_is_cust_owned'});//custitem_ive_item_customer_owned
                   if (custOwned){
                       //look up entityid
                       var custid = thisrec.getValue({fieldId: 'custitem_ddc_owned_by_cust'});//custitem_ive_item_intended_customer
                       var custVals = util.lookupFields('CUSTOMER',custid,'custentity_entity_code');
                       prefix =  custVals.custentity_entity_code; //entityid
                   }
   
                   var res = util.LoadSearch(COUNTSEARCH, null, null) //searchid, recordtype, filters
                   
                   var max = res[0].getValue({name:'custrecord_stock_count',
                                               summary: 'MAX'});
   
                   if (isNaN(parseInt(max))) max = 0;
                   var len = max.toString().length; var zeroes = '';
   
                   log.debug({title: 'prefix', details: prefix });
                   while (len<6){
                       zeroes+='0';
                       len++;
                   }
                   max = parseInt(max);
                   var maxStr = prefix.toString()+zeroes.toString()+(parseInt(max)+1).toString();
                   
                   var id = _nRecord.submitFields({
                       type: thisrec.type,
                       id: thisrec.id,
                       values: {
                           itemid: maxStr
                       },
                       options: {
                           enableSourcing: false,
                           ignoreMandatoryFields : true
                       }
                   });
   
                   CreateRecordCount(thisrec.id,max);
   
                   log.debug({
                       title: 'afterSubmit success',
                       details: 'maxStr: '+maxStr
                   });
                   */
            } catch (ex) {
                log.debug({
                    title: 'afterSubmit ex',
                    details: ex
                });
            }
        }

        function CloseOldRec(oldPOID, newPOID) {
            try {

                var poRec = _nRecord.load({
                    type: _nRecord.Type.PURCHASE_ORDER,
                    id: oldPOID,
                    isDynamic: true
                });


                poRec.setValue({
                    fieldId: 'custbody_ive_central_po',
                    value: newPOID,
                    ignoreFieldChange: true
                });

                var count = poRec.getLineCount({
                    sublistId: 'item'
                });

                for (var i = 0; i < count; i++) {
                    poRec.selectLine({
                        sublistId: 'item',
                        line: i
                    });

                    poRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'isclosed',
                        value: true,
                        ignoreFieldChange: false,
                        forceSyncSourcing: false
                    });

                    poRec.commitLine({
                        sublistId: 'item',
                        ignoreRecalc: true
                    });
                }

                poRec.save();

                log.debug({
                    title: 'CloseOldRec',
                    details: 'closed'
                });
            } catch (ex) {
                log.debug({
                    title: 'CloseOldRec ex',
                    details: ex
                });
            }
        }


        ReturnObj.afterSubmit = afterSubmit;
        return ReturnObj;
    });
