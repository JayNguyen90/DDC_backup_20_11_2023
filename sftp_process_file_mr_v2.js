/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * 
 * Processes 1 file per execution
 */
 define(['N/runtime', 'N/search', 'N/file', 'N/record', 'N/xml', 'N/task', './lib/ns.utils'],
 /**
* @param{runtime} runtime
* @param{search} search
* @param{file} file
* @param{record} record
* @param{xml} xml
* @param{task} task
*/
 (runtime, search, file, record, xml, task, ns_utils) => {
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

     const getInputData = (inputContext) => {
         let script = runtime.getCurrentScript()
         let processFolderId = script.getParameter({ name: 'custscript_sftp_process_folder_id' })
         let fileId = ''//script.getParameter({ name: 'custscript_sftp_process_file_id' })
         let fileName = ''

         // Search files in downloaded folder
         // Process 1 file at a time
         search.create({
             type: 'file',
             filters: [
                 ['folder','is',processFolderId]
             ],
             columns: ['name']
         })
         .run().each(e => {
             fileId = e.id
             fileName = e.getValue({ name: 'name' })
             return false
         })

         let vendors = []

         if (fileId) {
             let _f = file.load(fileId)
             log.debug('-------- [START] --------', { fileId, _f })
 
             let xmlDocument = xml.Parser.fromString({ 
                 text : _f.getContents() 
             })
            let wpRefId = xmlDocument.getElementsByTagNameNS({ namespaceURI: '*', localName: 'OrgnlMsgId' })[0].textContent
             let recordList = xmlDocument.getElementsByTagNameNS({ 
                 namespaceURI: '*',
                 localName: 'TxInfAndSts' 
             })
             for (rec of recordList) {
                 let id = rec.getElementsByTagNameNS({ namespaceURI: '*', localName: 'OrgnlInstrId' })[0].textContent
                 let status = rec.getElementsByTagNameNS({ namespaceURI: '*', localName: 'TxSts' })[0].textContent
                 vendors.push({ id, status, bills: [] })
             }
            let vendorIds = vendors.map(m => m.id)
            log.debug('Vendors', vendors)
            
            // Search and map bill internalids filtered by Westpac Ref ID and vendors
            search.create({
                type: 'vendorbill',
                filters: [
                    ['mainline', 'is', 'T'],
                    'AND',
                    ['custbody_westpac_ref_id', 'is', wpRefId],
                    'AND',
                    ['entity', 'is', vendorIds]
                ],
                columns: [
                    'entity'
                ]
            })
            .run().each(each => {
                let idx = vendors.findIndex(fi => fi.id == each.getValue({ name: 'entity' }))
                if (idx > -1) 
                    vendors[idx].bills.push(each.id)
                return true
            })
         }
        
        let bills = []
        for (vendor of vendors) {
            for (bill of vendor.bills) {
                bills.push({
                    id: bill,
                    entity: vendor.id,
                    status: vendor.status,
                    fileId,
                    fileName
                })
            }
        }

         log.debug('Bills', bills)

         return bills
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
     // Status update
     const map = (mapContext) => {
         let bill = JSON.parse(mapContext.value)
         /* Payment Status List
         1	Pending
         3	Processed
         2	Rejected */

         /* Status descriptions
         ACCP	Accepted
         ACSP	Accepted
         RJCT	Rejected
         PDNG	Pending
         PART	Partial
         RCVD	Received */
         let statusObj = {
             'ACCP': 3,
             'ACSP': 3,
             'RJCT': 2,
             'PDNG': 1,
             'PART': 1,
             'RCVD': 3,
         }


         let rec = record.load({ type: record.Type.VENDOR_BILL, id: bill.id })
         bill.statusId =  statusObj[bill.status] || 1 // Default

         rec.setValue({ fieldId: 'custbody_payment_status', value: bill.statusId })
         rec.setValue({ fieldId: 'custbody_sftp_status_file_source', value: bill.fileName })
         rec.save({ ignoreMandatoryFields: true })/* 


         record.submitFields({
             type: record.Type.VENDOR_BILL,
             id: bill.id,
             values: {
                 custbody_payment_status: bill.statusId
             },
             options: {
                 ignoreMandatoryFields: true,
             }  
         }) */

         /* if (bill.statusId == 3) { // If accepted
             record.transform({
                 fromType: record.Type.VENDOR_BILL,
                 fromId: bill.id,
                 toType: record.Type.VENDOR_PAYMENT
             }).save({
                 ignoreMandatoryFields: true
             })
         } */
         
         mapContext.write({
             key: bill.entity,
             value: bill
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
     // Make payment
     const reduce = (reduceContext) => {
         let entityId = reduceContext.key
         let bills = reduceContext.values.map(m => JSON.parse(m))

         log.debug(entityId, bills)

         // Make payment per file (vendor)
         makePayment(entityId, bills)

         reduceContext.write({
             key: entityId,
             value: bills
         })
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
     // Move file to processed folder
     // Rexecute mapreduce script to find another file from the process folder
     const summarize = (summaryContext) => {
         let errorStack = logErrors(summaryContext)
         let script = runtime.getCurrentScript()
         let processedFolderId = script.getParameter({ name: 'custscript_sftp_processed_folder_id' })
         let fileId = script.getParameter({ name: 'custscript_sftp_process_file_id' })
         let bills = []

         summaryContext.output.iterator().each( (key, value) => {
             bills = bills.concat(JSON.parse(value))
             return true
         })
         log.debug('Summary file', { bills, processedFolderId, errorStack })

         if (bills.length) {
             let _f = file.load(bills[0].fileId)
             _f.folder = processedFolderId
             _f.save()

             task.create({
                 taskType: task.TaskType.MAP_REDUCE,
                 scriptId: 'customscript_sftp_process_file_mr',
             }).submit()
         }
         
         log.debug('-------- [END] --------', { remainingUsage: script.getRemainingUsage() })
     }

     const makePayment = (entityId, bills) => {
         let script = runtime.getCurrentScript()
         let account = script.getParameter({ name: 'custscript_walker_payment_account' })
         let bool = false
         let rec = record.transform({
             fromType: record.Type.VENDOR,
             fromId: entityId,
             toType: record.Type.VENDOR_PAYMENT
         })
         rec.setValue({
             fieldId: 'account',
             value: account
         })
         rec.setValue({
             fieldId: 'custbody_sftp_status_file_source',
             value: bills.length?bills[0].fieldId:''
         })
         for (bill of bills) {
             if (bill.statusId == 3) { // Apply the accepted bills
                 let line = rec.findSublistLineWithValue({
                     sublistId: 'apply',
                     fieldId: 'internalid',
                     value: bill.id
                 })
                 // log.debug('>>>', { line, id: bill.id })
                 if (line > -1) {
                     rec.setSublistValue({
                         sublistId: 'apply',
                         fieldId: 'apply',
                         line,
                         value: true
                     })
                     bool = true
                 }
             }
         }
         if (bool) {
             // Store bank details to the payment record (should be 1 bank details tagged per vendor)
             storeBankDetails(entityId, rec)

             let newId = rec.save({
                 ignoreMandatoryFields: true
             })
             log.debug('New Vendor Payment', { newId })
         }
     }

     const storeBankDetails = (entityId, rec) => {
         let script = runtime.getCurrentScript()
         let bankSSId = script.getParameter({ name: 'custscript_bank_search_id' })
         if (bankSSId) {
             let bankSS = search.load(bankSSId)
             bankSS.filters.push(search.createFilter({
                 name: 'custrecord_2663_parent_vendor',
                 operator: 'anyof',
                 values: entityId
             }))
             bankSS.run().each(each => {
                 rec.setValue({ 
                     fieldId: 'custbody_bank_no',
                     value: each.getValue({ name: 'custrecord_2663_entity_bank_no' })
                  })
                 rec.setValue({ 
                     fieldId: 'custbody_branch_no',
                     value: each.getValue({ name: 'custrecord_2663_entity_branch_no' })
                  })
                 rec.setValue({ 
                     fieldId: 'custbody_bank_acc_name',
                     value: each.getValue({ name: 'custrecord_2663_entity_acct_name' })
                  })
                 rec.setValue({ 
                     fieldId: 'custbody_bank_acc_number',
                     value: each.getValue({ name: 'custrecord_2663_entity_acct_no' })
                  })
                 rec.setValue({ 
                     fieldId: 'custbody_bank_acc_pmt_desc',
                     value: each.getValue({ name: 'custrecord_2663_entity_payment_desc' })
                  })
                 return false
             })
         }
     }

     const logErrors = summaryContext => {
         let errorStack = []
         if (summaryContext.inputSummary.error) {
             errorStack.push(`Input Error: ${summaryContext.inputSummary.error}`)
             log.debug('Input Error', summaryContext.inputSummary.error)
         }
         
         summaryContext.mapSummary.errors.iterator().each((code, message) => {
             errorStack.push(`Map Error ${code}: ${message}`)
             log.debug(`Map Error ${code}`, message)
             return true
         })
         summaryContext.reduceSummary.errors.iterator().each((code, message) => {
             errorStack.push(`Reduce Error ${code}: ${message}`)
             log.debug(`Reduce Error ${code}`, message)
             return true
         })
         return errorStack
     }

     return {getInputData, map, reduce, summarize}

 });
