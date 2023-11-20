/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * 
 * Processes 1 file per execution
 */
 define(['N/runtime', 'N/search', 'N/file', 'N/record', 'N/xml', 'N/task', 'N/email', './lib/ns.utils', './lib/lodash.min'],
 /**
* @param{runtime} runtime
* @param{search} search
* @param{file} file
* @param{record} record
* @param{xml} xml
* @param{task} task
* @param{email} email
*/
 (runtime, search, file, record, xml, task, email, ns_utils, _) => {
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
    const DEBUG_MODE = false
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
    const STATUS_OBJ = {
        'ACCP': 3,
        'ACSP': 3,
        'RJCT': 2,
        'PDNG': 1,
        'PART': 1,
        'RCVD': 3,
    }

    const getInputData = (inputContext) => {
        let script = runtime.getCurrentScript()
        let processFolderId = script.getParameter({ name: 'custscript_sftp_process_folder_id' })
        let unfinishedBillsParams = script.getParameter({ name: 'custscript_sftp_unfinished_bills' })
        let fileId = script.getParameter({ name: 'custscript_sftp_process_file_id' }) || ''
        let fileName = ''

        log.debug('-------- [START] --------', { unfinishedBillsParams, fileId })

        if (unfinishedBillsParams) {
            let _f = file.load(fileId).getContents() || '[]'
            let unfinishedBills = JSON.parse(_f)
            return unfinishedBills
        }

        let xFilters0 = [
            ['folder','is',processFolderId]
        ]
        if (fileId) {
            xFilters0 = [
                ['internalid','is',fileId]
            ]
        }
        // Search files in downloaded folder
        // Process 1 file at a time
        search.create({
            type: 'file',
            filters: xFilters0,
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
            log.debug('File', { fileId, _f })
 
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
                let statusId = STATUS_OBJ[status]
                let rejectReasons = []
                let addtlInfs = rec.getElementsByTagNameNS({ namespaceURI: '*', localName: 'AddtlInf' }) || []
                if (addtlInfs && addtlInfs.length)
                    for (addtlInf of addtlInfs)
                        rejectReasons.push(addtlInf.textContent)

                rejectReasons = rejectReasons.join('\n')
                
                vendors.push({ id, wpRefId, status, statusId, fileId, fileName, rejectReasons, bills: [], unfinishedBills: [] })
            }
            let vendorIds = vendors.map(m => m.id)
            log.debug('Vendor IDs', vendorIds.length)
            
            // Search and map bill internalids filtered by Westpac Ref ID and vendors
            let xFilters = [
                ['mainline', 'is', 'T'],
                'AND',
                ['custbody_westpac_ref_id', 'is', wpRefId],
                'AND',
                ['custbody_payment_status','is',STATUS_OBJ.PDNG], 
                'AND', 
                ['custbody_sftp_status_file_source','isempty','']
            ]
            let xFilters2 = []
            let chunked = _.chunk(vendorIds, 1000)

            for (chunk of chunked) {
                xFilters2.push(['entity','anyof',chunk])
                xFilters2.push('OR')
            }
            xFilters2.pop()

            xFilters.push('AND')
            xFilters.push(xFilters2)

            log.debug('xFilters', xFilters)

            let s = search.create({
                type: 'vendorbill',
                filters: xFilters,
                columns: [
                    'entity'
                ]
            })
            s = ns_utils.expandSearch(s)
            log.debug('Vendor bill search length', s.length)

            s.forEach(each => {
                let idx = vendors.findIndex(fi => fi.id == each.getValue({ name: 'entity' }))
                if (idx > -1) 
                    vendors[idx].bills.push(each.id)
            })
         }
        vendors = vendors.map(m => {
            m.billsLength = m.bills.length
            return m
        })
        let vendorsWNoBills = vendors.filter(f => !f.bills.length)
        log.debug('Vendors with no bills to process', { length: vendorsWNoBills.length, vendorsWNoBills })

        vendors = vendors.filter(f => f.bills.length)
        log.debug('# of vendors to process', vendors.length)
        return vendors
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
     const map = (mapContext, billId) => {
        let script = runtime.getCurrentScript()
        let unfinishedBillsParams = script.getParameter({ name: 'custscript_sftp_unfinished_bills' })
        let vendor = JSON.parse(mapContext.value)

        if (!billId) {
            // Make payment per file (vendor)
            let bills = []
            if (!unfinishedBillsParams) {
                let newId = makePayment(vendor)
                bills = vendor.bills
            } else {
                bills = vendor.unfinishedBills
            }
            
            for (bill of bills)
                map(mapContext, bill)
            
            mapContext.write({
                key: vendor.id,
                value: vendor
            })
        }
        else {
            // Update bills (TBA: Add a governance usage handling)
            if (script.getRemainingUsage() >= 100) {
                if (!DEBUG_MODE) {
                    record.submitFields({
                        type: record.Type.VENDOR_BILL,
                        id: billId,
                        values: {
                            custbody_payment_status: vendor.statusId || 1,
                            custbody_sftp_status_file_source: vendor.fileName,
                            custbody_reject_reason_details: vendor.rejectReasons
                        },
                        options: {
                            ignoreMandatoryFields: true,
                        }
                    })
                    log.debug('Updated bill', { vendor, remainingUsage: script.getRemainingUsage() })
                }
            } else {
                vendor.unfinishedBills.push(billId)
            }
            mapContext.write({
                key: 'null',
                value: vendor
            })
        }
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
     // The bills update should be in here. But the client wants to update the bills asap once the payment has been created
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
     // Move file to processed folder
     // Rexecute mapreduce script to find another file from the process folder
     const summarize = (summaryContext) => {
        let errorStack = logErrors(summaryContext)
        let script = runtime.getCurrentScript()
        let jsonFolderId = script.getParameter({ name: 'custscript_sftp_json_folder_id' }) || -15
        let processedFolderId = script.getParameter({ name: 'custscript_sftp_processed_folder_id' }) || -15
        let vendors = [] 

        try {
             summaryContext.output.iterator().each( (key, value) => {
                if (value != 'undefined') 
                    vendors = vendors.concat({ key, value: JSON.parse(value || '{}') })
                 return true
             })
            let vendorIds = vendors.filter(f => f.key != 'null').map(m => m.key)
            let unfinishedBills = vendors.filter(f => f.value.unfinishedBills.length)
    
            log.debug('Summary file', { vendorIds: vendorIds.length, unfinishedBills:unfinishedBills.length, processedFolderId, errorStack })
    
            if (errorStack.length) { // Unexpected error handling
                let unexpectedErrors = errorStack.filter(f => f.match(/unexpected error|unexpected_error|sss_app_server_restart/gi))
                log.debug('Unexpected errors', unexpectedErrors.length)
    
                if (unexpectedErrors.length) {
                    log.debug('Restarting...')

                    let params = {}
                    if (vendors.length) 
                        params.custscript_sftp_process_file_id = vendors[0].value.fileId
                        
                    task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        params,
                        scriptId:'customscript_sftp_process_file_mr'
                    }).submit()
                }
            } 
            else if (unfinishedBills.length) { // Map bills update governance handling
                let fileId = ''

                try {
                    fileId = file.create({
                        name: `${unfinishedBills[0].value.wpRefId}.json`,
                        fileType: file.Type.JSON,
                        contents: JSON.stringify(unfinishedBills),
                        folder: jsonFolderId
                    }).save()
                } catch(e) {
                    log.debug('Error saving json file', e.message)
                    // Invalid folder reference key ${jsonFolderId}
                    fileId = file.create({
                        name: `${unfinishedBills[0].value.wpRefId}.json`,
                        fileType: file.Type.JSON,
                        contents: JSON.stringify(unfinishedBills),
                        folder: -15
                    }).save()
                }
                if (fileId) {
                    task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        params: {
                            custscript_sftp_unfinished_bills: 'T',
                            custscript_sftp_process_file_id: fileId
                        },
                        scriptId:'customscript_sftp_process_file_mr'
                    }).submit()
                }
            } 
            else {
                if (!DEBUG_MODE) {
                    let processFolderId = script.getParameter({ name: 'custscript_sftp_process_folder_id' })
                    let xFilters0 = [
                        ['folder','is',processFolderId]
                    ]
                    search.create({
                        type: 'file',
                        filters: xFilters0,
                        columns: ['name']
                    })
                    .run().each(each => {
                        let fileId = each.id
                        let _f;
                        try {
                            _f = file.load(fileId)
                            _f.folder = parseInt(processedFolderId) || 0
                            _f.save()
                        } catch(e) {
                            log.debug('Error moving xml file', e.message)
                            _f = file.load(fileId)
                            _f.folder = -15
                            _f.save()
                        }
                        log.debug('Search for another file..')
                        task.create({
                            taskType: task.TaskType.MAP_REDUCE,
                            scriptId: 'customscript_sftp_process_file_mr',
                        }).submit()
                        return false
                    })
                }
            }
        } catch(e) {
            log.debug('Summary context error', e.message)
            errorNotification(e)
        }
         
        log.audit({ title: '-------- [END] --------', details: `Usage: ${summaryContext.usage}; Concurrency: ${summaryContext.concurrency}; Number of yields: ${summaryContext.yields}; Total items processed: ${vendors.length}`})
     }

     const makePayment = vendor => {
         let newId = ''
         let script = runtime.getCurrentScript()
         let account = script.getParameter({ name: 'custscript_walker_payment_account' })
         let apacct = script.getParameter({ name: 'custscript_walker_ap_account' })
         log.debug('Making payment >>>', { vendor, account, apacct })
         let bool = false
         let rec = record.transform({
             fromType: record.Type.VENDOR,
             fromId: vendor.id,
             toType: record.Type.VENDOR_PAYMENT
         })
         rec.setValue({
            fieldId: 'apacct',
            value: apacct
        })
         rec.setValue({
             fieldId: 'account',
             value: account
         })
         rec.setValue({
             fieldId: 'custbody_sftp_status_file_source',
             value: vendor.fileName
         })
         for (billId of vendor.bills) {
             if (vendor.statusId == 3) { // Apply the accepted bills
                 let line = rec.findSublistLineWithValue({
                     sublistId: 'apply',
                     fieldId: 'internalid',
                     value: billId
                 })
                 if (DEBUG_MODE) log.debug('>>>', { line, id: billId })
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
            storeBankDetails(vendor.id, rec)

            newId = rec.save({
                ignoreMandatoryFields: true
            })
            log.debug('New Vendor Payment', { newId })
         }
        return newId
     }

     const storeBankDetails = (entityId, rec) => {
        let xFilters = [
            ["isinactive","is","F"],
            "AND",
            ["custrecord_2663_entity_bank_type","anyof","1"], // Primary
             'AND',
            ['custrecord_2663_entity_acct_no', 'isnotempty', ''],
            'AND',
            ['custrecord_2663_parent_vendor','anyof',entityId]
        ]
         let bankSS = search.create({
            type: "customrecord_2663_entity_bank_details",
            filters: xFilters,
            columns:
            [
               search.createColumn({
                  name: "internalid",
                  join: "CUSTRECORD_2663_PARENT_VENDOR",
                  label: "Vendor.Internal ID"
               }),
               search.createColumn({name: "custrecord_2663_parent_vendor", label: "Parent Vendor"}),
               search.createColumn({name: "custrecord_2663_entity_bank_type", label: "Type"}),
               search.createColumn({name: "custrecord_2663_entity_bank_no", label: "Bank Number"}),
               search.createColumn({name: "custrecord_2663_entity_branch_no", label: "Branch Number"}),
               search.createColumn({name: "custrecord_2663_entity_acct_name", label: "Bank Account Name"}),
               search.createColumn({name: "custrecord_2663_entity_acct_no", label: "Bank Account Number"}),
               search.createColumn({name: "custrecord_2663_entity_payment_desc", label: "Bank Account Payment Description"}),
               search.createColumn({name: "custrecord_2663_entity_bic", label: "BIC"}),
               search.createColumn({name: "custrecord_2663_entity_country", label: "Country"}),
               search.createColumn({name: "custrecord_2663_entity_country_check", label: "Country Check"}),
               search.createColumn({name: "custrecord_2663_entity_country_code", label: "Country Code"})
            ]
         });

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

     const logErrors = summaryContext => {
        let errorStack = []
        if (summaryContext.inputSummary.error) {
            errorStack.push(`Input Error: ${summaryContext.inputSummary.error}`)
            log.debug('Input Error', summaryContext.inputSummary.error)
            errorNotification(summaryContext.inputSummary.error)
        }
        
        summaryContext.mapSummary.errors.iterator().each((code, message) => {
            errorStack.push(`Map Error ${code}: ${message}`)
            // if (!(code+message).match(/unexpected error|unexpected_error|unexpected suite/gi))
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

    const errorNotification = (errorDetails) => {
        try {
            if (typeof errorDetails != 'string')
                    errorDetails = JSON.stringify(errorDetails)

            let script = runtime.getCurrentScript()
            let author = script.getParameter({ name: 'custscript_sftp_email_author' })
            let recipients = (script.getParameter({ name: 'custscript_sftp_email_recipients' }) || '').replace(/ /g,'')
            let subject = 'Error on processing status file'
            let body = `Dear User,
                <br/><br/>
                Unable to process payment status file due to unexpected error below
                <br/>
                <br/>
                Script ID: ${script.id}<br/>
                Deployment/Instance ID: ${script.deploymentId}
                <br/>
                <br/>
                Error Details: 
                <br/><br/>${errorDetails}
                <br/>
                <br/>
                <br/>
                <br/>
                <br/>
                <i>*** Auto-generated email. Do not reply ***</i>`
            email.send({
                author: author,
                body: body,
                recipients: recipients.split(','),
                subject: subject
            })
            log.debug('ERROR NOTIF SENT')
        } catch(e) {
            log.debug('Error on sending email', e.message)
        }
    }

     return {getInputData, map/* , reduce */, summarize}

 });
