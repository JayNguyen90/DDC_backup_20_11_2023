/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/runtime'], (runtime) => {

    function beforeSubmit(context) {
        try {
            let rec = context.newRecord
            let { type, id } = rec
            let lineCount = rec.getLineCount({ sublistId: 'item' })
            let execCtx = runtime.executionContext
            log.debug('>>>>', { type, id, eventType: context.type, execCtx, lineCount })

            for (let i=0;i<lineCount;i++) {
                //////// COPY CUSTCOL TO STANDARD

                    let custSub = rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_rec_sub',
                        line: i
                    })
                    rec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'targetsubsidiary',
                        line: i,
                        value: custSub
                    })

                    let custLoc = rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_rec_loc',
                        line: i
                    })
                    rec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'targetlocation',
                        line: i,
                        value: custLoc
                    })
            }
        } catch(e) {
            log.debug('Error beforeSubmit', e.message)
        }
    }
    return {
        beforeSubmit
    };
});