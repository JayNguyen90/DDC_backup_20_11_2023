/**
 * Client : IVE GROUP
 * 
 * Description : Script will copy custcol_rec_sub value to duetofromsubsidiary through UI on vendor bill
 * 
 * Author : Mayur Savaliya
 * 
 * Created on : 6 Oct 2021
 * 
 */
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
                //////// COPY STANDARD TO CUSTCOL
                if (execCtx == runtime.ContextType.USER_INTERFACE) {
                    let standardSub = rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_rec_sub',
                        line: i
                    })
                    rec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'duetofromsubsidiary',
                        line: i,
                        value: standardSub
                    })
                }   
            }
        } catch(e) {
            log.debug('Error beforeSubmit', e.message)
        }
    }

    return {
        beforeSubmit
    };
});
