/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @Author: Rex Jean
 */
define([
    'N/record',
    'N/runtime',
    'N/url',
    'N/ui/serverWidget',
    'N/search'
], function (record, runtime, url, serverWidget, search) {
    const beforeSubmit = context => {
        let { newRecord, form } = context
        let { type, id } = newRecord

        // let curRecord = record.load({
        //     type,
        //     id
        // })
        var subsidiary=newRecord.getValue('custbody_bill_subsidiary');
        if(!subsidiary){
            var subsidiary = newRecord.getValue('subsidiary');

        }
        log.debug("subsidiary", subsidiary);
        //adding validation to only run script if subsidiary is == 2 (DDC subsidiary)
        if (subsidiary != '2') {
            return;
        }
        let numLines = newRecord.getLineCount({ sublistId: 'item' });
        var rateField = "", amountField = "";
        if (type == "purchaserequisition") {
            rateField = "estimatedrate";
            amountField = "estimatedamount";
        } else if (type == "purchaseorder") {
            rateField = "rate";
            amountField = "amount";
        }

        for (let i = 0; i < numLines; i++) {

            let quantity = parseFloat(newRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i }));
            let unitsale = parseFloat(newRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_unit_sale', line: i })) || 1.00;
            let rate = parseFloat(newRecord.getSublistValue({ sublistId: 'item', fieldId: rateField, line: i }));

            let amount = parseFloat((quantity / unitsale) * rate)

            newRecord.setSublistValue({ sublistId: 'item', fieldId: amountField, line: i, value: amount })
        }

    }
    return {
        beforeSubmit
    }
})
