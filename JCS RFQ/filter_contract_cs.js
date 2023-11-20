/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */

define(['N/search'], function (search) {



    function filter_fieldChanged(context) {
        var currRec = context.currentRecord
        var changedField = context.fieldId
        var sublist = context.sublistId
        var form = context.form;
        console.log('form',form);
        console.log(changedField)
        console.log(sublist)
        var subsidiary = currRec.getValue({
            fieldId: 'custbody_bill_subsidiary'
        })
        if(!subsidiary){
            subsidiary = currRec.getValue({
                fieldId: 'subsidiary'
            })
        }
        if (subsidiary != '2') {
            return;
        }
        if (changedField == 'custbody_ddc_rfq_supplier1') {

            var vendor1 = currRec.getValue({
                fieldId: 'custbody_ddc_rfq_supplier1'
            })
            var custContact = currRec.getField({
                fieldId: 'custpage_purchase_contact1'
            });
            var altContact = currRec.getField({
                fieldId: 'custpage_alt_contact1'
            });
            if(altContact){
                custContact.removeSelectOption({
                    value: null,
                });
            }
            if(altContact){
                altContact.removeSelectOption({
                    value: null,
                });
            }
            getContactList(vendor1, custContact,altContact)

        } 
        if (changedField == 'custbody_ddc_rfq_supplier2') {

            var vendor2 = currRec.getValue({
                fieldId: 'custbody_ddc_rfq_supplier2'
            })
            var custContact2 = currRec.getField({
                fieldId: 'custpage_purchase_contact2'
            });
            var altContact2 = currRec.getField({
                fieldId: 'custpage_alt_contact2'
            });
            custContact2.removeSelectOption({
                value: null,
            });
            altContact2.removeSelectOption({
                value: null,
            });
            getContactList(vendor2, custContact2,altContact2)

        } 

        if (changedField == 'custbody_ddc_rfq_supplier3') {

            var vendor3 = currRec.getValue({
                fieldId: 'custbody_ddc_rfq_supplier3'
            })
            var custContact3 = currRec.getField({
                fieldId: 'custpage_purchase_contact3'
            });
            var altContact3 = currRec.getField({
                fieldId: 'custpage_alt_contact3'
            });
            custContact3.removeSelectOption({
                value: null,
            });
            altContact3.removeSelectOption({
                value: null,
            });
            getContactList(vendor3, custContact3,altContact3)

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

    function getContactList(vendor, contact,altContact) {
        contact.insertSelectOption({
            value: "",
            text: ""
        });
        altContact.insertSelectOption({
            value: "",
            text: ""
        });
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

            var intId = result.getValue('internalid')
            var txtVal = result.getValue('entityid')
            contact.insertSelectOption({
                value: intId,
                text: txtVal
            });
            altContact.insertSelectOption({
                value: intId,
                text: txtVal
            });



            return true;
        });
    }


    return {
        fieldChanged: filter_fieldChanged,
    }
});
