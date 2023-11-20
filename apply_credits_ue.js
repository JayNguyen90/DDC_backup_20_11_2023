/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
 define(['N/runtime', 'N/record', 'N/search', 'N/error'],
 /**
* @param{runtime} runtime
* @param{record} record
* @param{search} search
* @param{error} error
*/
 (runtime, record, search, error) => {
     /**
      * Defines the function definition that is executed before record is loaded.
      * @param {Object} scriptContext
      * @param {Record} scriptContext.newRecord - New record
      * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
      * @param {Form} scriptContext.form - Current form
      * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
      * @since 2015.2
      */
     const beforeLoad = (scriptContext) => {

     }

     /**
      * Defines the function definition that is executed before record is submitted.
      * @param {Object} scriptContext
      * @param {Record} scriptContext.newRecord - New record
      * @param {Record} scriptContext.oldRecord - Old record
      * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
      * @since 2015.2
      */
     // Doesnt work via webservice
    const beforeSubmit = (scriptContext) => {
        if (scriptContext.type.match(/create|copy/g)) {
            let { oldRecord, newRecord } = scriptContext
            
            if (newRecord.type == 'vendorcredit') {
                let subsidiary = newRecord.getValue({ fieldId: 'subsidiary' })
                if (subsidiary != IVE_DISTRIBUTION_SUBSIDIARY) return; // If not IVE - Distribution terminate the process

                let numLines = newRecord.getLineCount({ sublistId: 'apply' })
                log.debug('beforeSubmit', { type: newRecord.type, eventType: scriptContext.type, execCtx: runtime.executionContext, numLines })

                newRecord.setValue({ fieldId: 'autoapply', value: true })
                for (let i = 0; i < numLines; i++) 
                    newRecord.setSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true, line: i })
            }
        }
     }

     /**
      * Defines the function definition that is executed after record is submitted.
      * @param {Object} scriptContext
      * @param {Record} scriptContext.newRecord - New record
      * @param {Record} scriptContext.oldRecord - Old record
      * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
      * @since 2015.2
      */
    const IVE_DISTRIBUTION_SUBSIDIARY = 10
    const DISTRIBUTION_CONTRACTOR_CATEGORY = 8
    const ERROR_MSG_TO_HANDLE = 'One or more of the vendor invoices or customer invoices has had a payment made on it since you retrieved the form'
    
     const afterSubmit = (scriptContext, executionCounter) => {
        executionCounter = executionCounter || 0
        executionCounter++

        let errorOccured = false

         if (scriptContext.type.match(/create|copy/g)) {
            let { oldRecord, newRecord } = scriptContext
            let { type, id } = newRecord
            // if (type == 'vendorcredit' && scriptContext.type == 'edit') return
            let entity = newRecord.getValue({ fieldId: 'entity' })
            let subsidiary = newRecord.getValue({ fieldId: 'subsidiary' })

            if (subsidiary != IVE_DISTRIBUTION_SUBSIDIARY) return; // If not IVE - Distribution terminate the process

            let cat = search.lookupFields({ type:search.Type.VENDOR, id:entity, columns:[ 'category' ] })
            cat = cat.category.length ? (cat.category[0].value||'') : ''

            if (cat != DISTRIBUTION_CONTRACTOR_CATEGORY || executionCounter > 3) return

            log.debug('-------- [START] --------', { type, id, eventType: scriptContext.type, execCtx: runtime.executionContext, executionCounter })
            
            try {
                if (type == 'vendorbill') {
                    let hasAppliedCredits = false
                    // let total = parseFloat(newRecord.getValue({ fieldId: 'usertotal' })) || 0
                    let total = parseFloat(search.lookupFields({ type, id, columns:[ 'amountremaining' ] }).amountremaining) || 0
                    let tranId = newRecord.getValue({ fieldId: 'transactionnumber' })
                    
                    log.debug('VB', { id, entity, tranId, subsidiary, total })
                    
                    // Load each bill credit and apply this current bill                
                    let ls = search.create({
                        type: "vendorcredit",
                        filters:
                        [
                           ["type","anyof","VendCred"], 
                           "AND", 
                           ["amountremaining","greaterthan","0.00"], 
                           "AND", 
                           ["subsidiary","anyof",IVE_DISTRIBUTION_SUBSIDIARY], 
                           "AND", 
                           ["vendor.category","anyof",DISTRIBUTION_CONTRACTOR_CATEGORY],
                           "AND",
                           ["entity", "is", entity]
                        ],
                        columns:
                        [
                           search.createColumn({name: "ordertype", label: "Order Type"}),
                           search.createColumn({name: "mainline", label: "*"}),
                           search.createColumn({name: "trandate", label: "Date"}),
                           search.createColumn({name: "asofdate", label: "As-Of Date"}),
                           search.createColumn({name: "postingperiod", label: "Period"}),
                           search.createColumn({name: "taxperiod", label: "Tax Period"}),
                           search.createColumn({name: "type", label: "Type"}),
                           search.createColumn({name: "tranid", label: "Document Number"}),
                           search.createColumn({name: "entity", label: "Name"}),
                           search.createColumn({name: "account", label: "Account"}),
                           search.createColumn({name: "memo", label: "Memo"}),
                           search.createColumn({name: "amount", label: "Amount"})
                        ]
                     })
                    let vcs = []
                    ls.run().each(each => {
                        let bcNum = ''
                        try {
                            let bc = record.load({ 
                                type: record.Type.VENDOR_CREDIT, 
                                id: each.id, isDynamic: true
                            })
                            bcNum = bc.getValue({ fieldId: 'tranid' })
                            let numLines = bc.getLineCount({ sublistId: 'apply' })
                            
                            for (let i = 0; i < numLines; i++) {
                                bc.selectLine({ sublistId: 'apply', line: i })
                                let billId = bc.getCurrentSublistValue({ sublistId: 'apply', fieldId: 'internalid' })

                                if (total > 0) { // Keep on applying credits to the current bill until it reaches 0
                                    if (id == billId) {
                                        bc.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true })
                                        let amount = parseFloat(bc.getCurrentSublistValue({ sublistId: 'apply', fieldId: 'amount' })) || 0
                                        log.debug(`Apply @ line: ${Number(i)+1}`, { id, billId, amount, total, x: total-amount })
                                        total -= amount
                                        saveCreditRec = true
                                        hasAppliedCredits = true
                                    }
                                } else {
                                    // return false
                                }
                            }
                            bc.save({ ignoreMandatoryFields: true })
                            log.debug('Updated billcredit', { billId: id, bcId: each.id, bcNum })
                        } catch(e) {
                            log.debug(`Error billcredit: ${bcNum}`, { billId:id, bcId: each.id, error: e.message })
                        }
                        vcs.push({ bcId, bcNum })
                        return true
                    })
                    log.debug('VCS Search Result', { id, length: vcs.length, vcs, hasAppliedCredits })

                    /* throw error.create({
                        message: ERROR_MSG_TO_HANDLE,
                        name: 'TEST IN PROGRESS',
                        notifyOff: true
                    }) */

                    if (hasAppliedCredits && total <= 0) {
                        record.submitFields({
                            type,
                            id,
                            values: {
                                custbody_payment_status: 3 // Processed
                            },
                            options: {
                                ignoreMandatoryFields: true,
                            }  
                        })
                    }
                    log.debug('>>>', { billId:id, hasAppliedCredits, total })
    
                } else if (type == 'vendorcredit') {
                    log.debug('VC', { type, id, eventType: scriptContext.type, execCtx: runtime.executionContext, cat })

                    let rec = record.load({ type, id })
                    let numLines = rec.getLineCount({ sublistId: 'apply' })
                    log.debug('Numlines', { id, numLines })
    
                    rec.setValue({ fieldId: 'autoapply', value: true })
                    for (let i = 0; i < numLines; i++) 
                        rec.setSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true, line: i })
                    
                    /* throw error.create({
                        message: ERROR_MSG_TO_HANDLE,
                        name: 'TEST IN PROGRESS',
                        notifyOff: true
                    }) */

                    rec.save({ ignoreMandatoryFields: true })

                    let vbs = []
                    // Update bills custom payment status
                    search.create({
                        type: 'vendorbill',
                        filters:
                        [
                            ["type","anyof","VendBill"], 
                            "AND", 
                            ["mainline","is","T"], 
                            "AND", 
                            ["applyingtransaction.internalid","anyof",id], 
                            "AND", 
                            ["status","anyof","VendBill:B"], // paid in full
                            "AND", 
                            ["custbody_payment_status","noneof","3"] // not processed
                         ],
                        columns:
                        [
                            'tranid'
                        ]
                    }).run().each(each => {
                        try {
                            record.submitFields({
                                type: 'vendorbill',
                                id: each.id,
                                values: {
                                    custbody_payment_status: 3 // Processed
                                },
                                options: {
                                    ignoreMandatoryFields: true,
                                }  
                            })
                            log.debug('Updated vendorbill', { bcId: id, billId: each.id })
                        } catch(e) {
                            log.debug('Error updating vendorbill', { bcId: id, billId: each.id, error: e.message })
                        }
                        vbs.push({ id: each.id, tranid: each.getValue({ name: 'tranid' }) })
                        return true
                    })
                    log.debug('VBS Search Result', { id, length: vbs.length, vbs })
                }
            } catch(e) {
                log.debug('Error afterSubmit', { id, error: e.message })
                
                if (e.message.match(new RegExp(ERROR_MSG_TO_HANDLE, 'gi'))) 
                    errorOccured = true
            }

             log.debug('-------- [END] --------', { id, remainingUsage: runtime.getCurrentScript().getRemainingUsage(), errorOccured })

            if (errorOccured)
                afterSubmit(scriptContext, executionCounter)
         }
     }

     return {/* beforeLoad, beforeSubmit,  */afterSubmit}

 });
