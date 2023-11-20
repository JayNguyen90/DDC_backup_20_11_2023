/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 * @name:                                       filter_contacts_cs.js
 * @author:                                     Patrick Lising
 * @summary:                                    Script Description
 * @copyright:                                  © Copyright by Jcurve Solutions
 * Date Created:                                Mon Nov 28 2022 11:13:54 AM
 * Change Logs:
 * Date                          Author               Description
 * Mon Nov 28 2022 11:13:54 AM -- Patrick Lising -- Initial Creation
 * 
 */

define(['N/search'], function (search) {


    var globalVar = []
    //hddn_custpage_placeholderitem8
    //indx_custpage_placeholderitem8

    function filter_pageInit(context) {
        console.log('test')
        // var currentRecord = context.currentRecord

        // jQuery(document).ready(function () {
        //     jQuery('#inpt_custpage_placeholderitem8').click(function () {
        //         alert(jQuery('#inpt_custpage_placeholderitem8').val());
        //         var lineNum = currentRecord.getCurrentSublistIndex({
        //             sublistId: 'item'
        //         });
        //         alert(lineNum)
        //     });
        // });

    }


    function filter_fieldChanged(context) {
        var currRec = context.currentRecord
        var changedField = context.fieldId
        var sublist = context.sublistId

        console.log(changedField)
        console.log(sublist)

        if (changedField == 'custbody_ddc_rfq_supplier1') {

            var vendor1 = currRec.getValue({
                fieldId: 'custbody_ddc_rfq_supplier1'
            })

            var custContact1 = currRec.getField({
                fieldId: 'custpage_contact1'
            });

            var altCustContact1 = currRec.getField({
                fieldId: 'custpage_altcontact1'
            });

            getContactList(vendor1, custContact1, altCustContact1)

        } else if (changedField == 'custbody_ddc_rfq_supplier2') {
            var vendor2 = currRec.getValue({
                fieldId: 'custbody_ddc_rfq_supplier2'
            })

            var custContact2 = currRec.getField({
                fieldId: 'custpage_contact2'
            });

            var altCustContact2 = currRec.getField({
                fieldId: 'custpage_altcontact2'
            });

            getContactList(vendor2, custContact2, altCustContact2)

        } else if (changedField == 'custbody_ddc_rfq_supplier3') {
            var vendor3 = currRec.getValue({
                fieldId: 'custbody_ddc_rfq_supplier3'
            })

            var custContact3 = currRec.getField({
                fieldId: 'custpage_contact3'
            });

            var altCustContact3 = currRec.getField({
                fieldId: 'custpage_altcontact3'
            });

            getContactList(vendor3, custContact3, altCustContact3)
        }

        if (changedField == 'custpage_placeholderitem') {

            var currVal = currRec.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custpage_placeholderitem'
            })

            console.log(currVal)

            currRec.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_placeholder_replacement_item',
                value: currVal
            });

        }

    }

    // function filter_lineInit(context) {
    //     var currentRecord = context.currentRecord;
    //     var sublistName = context.sublistId;

    //     if (sublistName === 'item') {
    //         var lineNum = currentRecord.getCurrentSublistIndex({
    //             sublistId: 'item'
    //         });

    //         console.log('Line Num: ' + lineNum)

    //         var placeholderItemColumn = currentRecord.getSublistField({
    //             sublistId: 'item',
    //             fieldId: 'custpage_placeholderitem',
    //             line: lineNum
    //         });


    //         var inventoryitemSearchObj = search.create({
    //             type: "inventoryitem",
    //             filters:
    //                 [
    //                     ["type", "anyof", "InvtPart"],
    //                     "AND",
    //                     ["custitem_ddc_owned_by_cust", "anyof", customer],
    //                     "OR",
    //                     ["custitem_ddc_is_cust_owned", "is", "F"]
    //                 ],
    //             columns:
    //                 [
    //                     search.createColumn({ name: "internalid", label: "Internal ID" }),
    //                     search.createColumn({ name: "displayname", label: "Display Name" })
    //                 ]
    //         });
    //         var searchResultCount = inventoryitemSearchObj.runPaged().count;
    //         log.debug("inventoryitemSearchObj result count", searchResultCount);
    //         inventoryitemSearchObj.run().each(function (result) {
    //             // .run().each has a limit of 4,000 results

    //             var id = result.getValue('internalid')
    //             var displayName = result.getValue('displayname')
    //             placeholderItemColumn.insertSelectOption({
    //                 value: id,
    //                 text: displayName
    //             });

    //             return true;
    //         });


    //     }
    // }

    function filter_saveRecord(context) {
        var currRec = context.currentRecord

        //1
        var contact1 = currRec.getValue({
            fieldId: 'custpage_contact1'
        })

        var altContact1 = currRec.getValue({
            fieldId: 'custpage_altcontact1'
        })

        currRec.setValue({
            fieldId: 'custbody_ddc_rfq_supplier1_contact',
            value: contact1
        })

        currRec.setValue({
            fieldId: 'custbody_ddc_rfq_supplier1_altcontact',
            value: altContact1
        })

        //2

        var contact2 = currRec.getValue({
            fieldId: 'custpage_contact2'
        })

        var altContact2 = currRec.getValue({
            fieldId: 'custpage_altcontact2'
        })

        currRec.setValue({
            fieldId: 'custbody_ddc_rfq_supplier2_contact',
            value: contact2
        })

        currRec.setValue({
            fieldId: 'custbody_ddc_rfq_supplier2_altcontact',
            value: altContact2
        })

        //3

        var contact3 = currRec.getValue({
            fieldId: 'custpage_contact3'
        })

        var altContact3 = currRec.getValue({
            fieldId: 'custpage_altcontact3'
        })

        currRec.setValue({
            fieldId: 'custbody_ddc_rfq_supplier3_contact',
            value: contact3
        })

        currRec.setValue({
            fieldId: 'custbody_ddc_rfq_supplier3_altcontact',
            value: altContact3
        })

        return true;

    }

    function getContactList(vendor, contact, alternateContact) {

        var contactSearchObj = search.create({
            type: "contact",
            filters:
                [
                    ["company", "anyof", vendor],
                    "AND",
                    ["email", "isnotempty", ""]
                ],
            columns:
                [
                    search.createColumn({ name: "internalid", label: "Internal ID" }),
                    search.createColumn({
                        name: "entityid",
                        sort: search.Sort.ASC,
                        label: "Name"
                    }),
                    search.createColumn({ name: "company", label: "Company" })
                ]
        });
        var searchResultCount = contactSearchObj.runPaged().count;
        log.debug("contactSearchObj result count", searchResultCount);
        contactSearchObj.run().each(function (result) {
            // .run().each has a limit of 4,000 results

            var intId = result.getValue('internalid')
            var txtVal = result.getValue('entityid')
            contact.insertSelectOption({
                value: intId,
                text: txtVal
            });

            alternateContact.insertSelectOption({
                value: intId,
                text: txtVal
            });


            return true;
        });
    }


    return {
        pageInit: filter_pageInit,
        fieldChanged: filter_fieldChanged,
        //lineInit: filter_lineInit,
        saveRecord: filter_saveRecord
    }
});
