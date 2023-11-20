/**
 * 
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */



define(['N/record', 'N/search', 'N/runtime'], function (record, search, runtime) {


    // function afterSubmit(context) {
    //     try {

    //         if (context.type == "edit") {
    //             log.debug("reset rate context", 'reset rate context');
    //             var newRec = context.newRecord;
    //             var oldlRec = context.oldRecord;
    //             var id = context.newRecord.id;
    //             var rec=record.load({
    //                 type: 'salesorder',
    //                 id: newRec.id,

    //             })

    //             var lineCount = newRec.getLineCount({   
    //                 sublistId: 'item'
    //             });
    //             log.debug("lineCount", lineCount);
    //             for(var i=0;i<lineCount;i++){
    //                 var amountNew=newRec.getSublistValue({
    //                     sublistId: 'item',
    //                     fieldId: 'amount',
    //                     line: i
    //                 });
    //                 log.debug('amountNew',amountNew);
    //                 var amountOld=oldlRec.getSublistValue({
    //                     sublistId: 'item',
    //                     fieldId: 'amount',
    //                     line: i
    //                 });
    //                 log.debug('amountOld',amountOld);
    //                 var quantity=newRec.getSublistValue({
    //                     sublistId: 'item',
    //                     fieldId: 'quantity',
    //                     line: i
    //                 });
    //                 log.debug('quantity',quantity);
    //                 var rate=amountOld/quantity;
    //                 log.debug('start reset rate',rate);
    //                 if(rate){
    //                     rec.setSublistValue({
    //                         sublistId: 'item',
    //                         fieldId: 'rate',
    //                         line: i,
    //                         value: rate
    //                     });
    //                 }

    //                 // log.debug('end reset rate',rate);

    //             }
    //             var recid=newRec.save({
    //                 enableSourcing: true,
    //                 ignoreMandatoryFields: true
    //             })
    //             log.debug("recid", recid);


    //         }

    //     } catch (error) {
    //         log.debug("error", error)
    //     }


    // }
    const beforeSubmit = (scriptContext) => {
        log.debug('------ [START ssssssssssssss] ------', { type: scriptContext.type, executionContext: runtime.executionContext });
        if (runtime.executionContext != 'SUITELET' && scriptContext.type == 'edit') {
            try {
                let rec = scriptContext.newRecord
                let oldRec = scriptContext.oldRecord
                var subsidiary = rec.getValue('subsidiary');
                log.debug("subsidiary", subsidiary);
                if (subsidiary != '2') {
                    return;
                }
                let lineCount = rec.getLineCount({ sublistId: 'item' })
                log.debug('>>>', 'lineCount: ' + lineCount)
                for (let i = 0; i < lineCount; i++) {
                    let amount = rec.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i })
                    log.debug('amount', amount)
                    let amountOld = oldRec.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i })
                    log.debug('amountOld', amountOld)
                    let quantity = rec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i })
                    rec.setSublistValue({ sublistId: 'item', fieldId: 'rate', line: i, value: amountOld / quantity })
                }


            } catch (e) {
                log.debug('Error beforeSubmit', e.message)
            }
        }


    }
    return {
        beforeSubmit: beforeSubmit
    }
});
