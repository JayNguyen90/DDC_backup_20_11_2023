/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
 define(['N/record', 'N/runtime', 'N/search', 'N/task'],
 /**
* @param{record} record
* @param{runtime} runtime
* @param{search} search
* @param{task} task
*/
 (record, runtime, search, task) => {
     /**
      * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
      * @param {Object} inputContext
      * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
      *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
      * @param {Object} inputContext.ObjectRef - Object that references the input data
      * @typedef {Object} ObjectRef
      * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
      * @property {string} ObjectRef.type - Type of the record instance that contains the input data
      * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
      * @since 2015.2
      */
      const IVE_DISTRIBUTION_SUBSIDIARY = 10
      const DISTRIBUTION_CONTRACTOR_CATEGORY = 8

     const getInputData = (inputContext) => {
         let script = runtime.getCurrentScript()
         let counter = parseFloat(script.getParameter({ name: 'custscript_execution_counter' })) || 0

         log.audit('-------- [START] --------', counter)

         if (counter >= 3) return []

          // Walkers - Open Credit Notes
         return search.create({
             type: "vendorcredit",
             filters:
             [
                ["type","anyof","VendCred"], 
                "AND", 
                ["amountremaining","greaterthan","0.00"], 
                "AND", 
                ["subsidiary","anyof",IVE_DISTRIBUTION_SUBSIDIARY], 
                "AND", 
                ["vendor.category","anyof",DISTRIBUTION_CONTRACTOR_CATEGORY]
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
          });
     }

     /**
      * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
      * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
      * context.
      * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
      *     is provided automatically based on the results of the getInputData stage.
      * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
      *     function on the current key-value pair
      * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
      *     pair
      * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
      *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
      * @param {string} mapContext.key - Key to be processed during the map stage
      * @param {string} mapContext.value - Value to be processed during the map stage
      * @since 2015.2
      */

     const map = (mapContext) => {
         let newRecord = JSON.parse(mapContext.value)

         let rec = record.load({ type: record.Type.VENDOR_CREDIT, id: newRecord.id })
         let numLines = rec.getLineCount({ sublistId: 'apply' })
         log.debug('Map stage', { id: newRecord.id, numLines })
 
         rec.setValue({ fieldId: 'autoapply', value: true })
         for (let i = 0; i < numLines; i++) 
             rec.setSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true, line: i })
                 
         rec.save({ ignoreMandatoryFields: true })

         // Update bills custom payment status
         search.create({
             type: 'vendorbill',
             filters:
             [
                 ["type","anyof","VendBill"], 
                 "AND", 
                 ["mainline","is","T"], 
                 "AND", 
                 ["applyingtransaction.internalid","anyof",newRecord.id], 
                 "AND", 
                 ["status","anyof","VendBill:B"], // paid in full
                 "AND", 
                 ["custbody_payment_status","noneof","3"] // not processed
              ],
             columns:
             [
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
             } catch(e) {
                 log.debug('Error updating vendorbill', { id: each.id, error: e.message })
             }
             true
         })

         mapContext.write({
             key: newRecord.id,
             value: newRecord
         })
     }

     /**
      * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
      * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
      * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
      *     provided automatically based on the results of the map stage.
      * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
      *     reduce function on the current group
      * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
      * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
      *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
      * @param {string} reduceContext.key - Key to be processed during the reduce stage
      * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
      *     for processing
      * @since 2015.2
      */
     const reduce = (reduceContext) => {

     }


     /**
      * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
      * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
      * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
      * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
      *     script
      * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
      * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
      *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
      * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
      * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
      * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
      *     script
      * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
      * @param {Object} summaryContext.inputSummary - Statistics about the input stage
      * @param {Object} summaryContext.mapSummary - Statistics about the map stage
      * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
      * @since 2015.2
      */
      const summarize = (summaryContext) => {
         let errorStack = logErrors(summaryContext)
         let script = runtime.getCurrentScript()

         let result = []
         summaryContext.output.iterator().each( (key, value) => {
             result.push({ newId: key, data: JSON.parse(value) })
             return true
         })

         if (result.length) {
             log.debug('Restarting...')          
             
             let script = runtime.getCurrentScript()
             let counter = parseFloat(script.getParameter({ name: 'custscript_execution_counter' })) || 0
             counter++

             task.create({
                 taskType: task.TaskType.MAP_REDUCE,
                 scriptId:script.id,
                 params: {
                     custscript_execution_counter: counter
                 }
             }).submit()
         }
     
         log.audit({ title: '-------- [END] --------', details: `Usage: ${summaryContext.usage}; Concurrency: ${summaryContext.concurrency}; Number of yields: ${summaryContext.yields}; Total items processed: ${result.length}` })
     }

     const logErrors = ctx => {
         let errorStack = []
         if (ctx.inputSummary.error) {
             errorStack.push(`Input Error: ${ctx.inputSummary.error}`)
             log.debug('Input Error', ctx.inputSummary.error)
         }
         
         ctx.mapSummary.errors.iterator().each((code, message) => {
             errorStack.push(`Map Error ${code}: ${message}`)
             // if (!(code+message).match(/unexpected error/gi))
                log.debug(`Map Error ${code}`, message)
             return true
         })
         ctx.reduceSummary.errors.iterator().each((code, message) => {
             errorStack.push(`Reduce Error ${code}: ${message}`)
             log.debug(`Reduce Error ${code}`, message)
             return true
         })
         return errorStack
     }

     return {getInputData, map/* , reduce */, summarize}

 });
