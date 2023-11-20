/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * 
 * TBA
 * - Email notif function
 */
 define(['N/runtime', 'N/file', 'N/search', 'N/sftp', 'N/task', 'N/email'],
 /**
* @param{runtime} runtime
* @param{file} file
* @param{search} search
* @param{sftp} sftp
* @param{task} task
* @param{email} email
*/
 (runtime, file, search, sftp, task, email) => {
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

      const getInputData = (inputContext) => {
        let script = runtime.getCurrentScript()
        let fileId = script.getParameter({ name: 'custscript_sftp_transmit_file_id' })
        let transmitFolderId = script.getParameter({ name: 'custscript_sftp_transmit_folder_id' })
        let xFilters = []
        if (fileId)
            xFilters = [
                ["internalid","is",fileId]
            ]
        else
            xFilters = [
                ["folder","is",transmitFolderId]
            ]

        log.debug('-------- [START] --------', { fileId, transmitFolderId, xFilters })

        return transmitFolderId ? search.create({
            type: "file",
            filters: xFilters,
            columns: [
                "folder",
                "name"
            ]
        })/* .run().getRange(0, 1000).map(m => ({
            id: m.id,
            values: {
                name : m.getValue({ name: 'name' }),
                folder : m.getValue({ name: 'folder' })
            }
        })).slice(0, 1) */ : []
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
         let obj = JSON.parse(mapContext.value)
         log.debug('Map obj', obj)
         
         mapContext.write({
            key: obj.values.folder,
            value: {
                id: obj.id,
                name: obj.values.name
            }
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
        let script = runtime.getCurrentScript()
        let folder = reduceContext.key
        let names = reduceContext.values.map(m => JSON.parse(m).name)
        let ids = reduceContext.values.map(m => JSON.parse(m).id)
        let transmitDirectory = script.getParameter({ name: 'custscript_sftp_directory_transmit' })
        let processedDirectory = script.getParameter({ name: 'custscript_sftp_processed_directory' })
        let processFinished = script.getParameter({ name: 'custscript_sftp_process_finished' })

        let _sftp = {}
        _sftp.url           = script.getParameter({ name: 'custscript_sftp_url_transmit' })
        _sftp.username      = script.getParameter({ name: runtime.envType == 'PRODUCTION' ? 'custscript_sftp_username_transmit' : 'custscript_sftp_username_transmit_uat' })
        _sftp.hostKey       = script.getParameter({ name: 'custscript_sftp_hostkey_transmit' })
        _sftp.port          = 22//script.getParameter({ name: 'custscript_sftp_port_transmit' })

        if (!processFinished)
            _sftp.directory = transmitDirectory
        let passwordGuid = script.getParameter({ name: 'custscript_sftp_pwdguid_transmit' })
        if (passwordGuid)
            _sftp.passwordGuid = passwordGuid
        let keyId = script.getParameter({ name: 'custscript_sftp_keyid_transmit' })
        if (keyId)
            _sftp.keyId = keyId

        log.debug('Reduce logs', { folder, names, ids, _sftp, transmitDirectory, processedDirectory, processFinished })
        
        // Transmit files to sftp server
        if (!DEBUG_MODE) {
            let sftpConn = sftp.createConnection(_sftp)
            
            if (!processFinished) {
                for (id of ids) {
                    _file = file.load(id)
                    sftpConn.upload({
                        file        : _file,
                        filename    : _file.name,
                        replaceExisting: true
                    })
                    log.debug('Succesfully uploaded', _file.name)
        
                    // Move transmitted files to sent folder
                    _file.folder = script.getParameter({ name: 'custscript_sftp_sent_folder_id' })
                    _file.save()
                }
            } else {
                // Move processed files to pool folder
                let files = (sftpConn.list({ 
                    path: transmitDirectory,
                    sort: 'DATE' 
                }) || [])
                log.debug('File list', files)
                for (f of files) {
                    let idx = names.findIndex(fi => fi == f.name)
                    let from = `${transmitDirectory}/${f.name}`
                    let to = `${processedDirectory}/${f.name}`
                    log.debug('>>>', { name: f.name, idx, from, to })
                    if (idx > -1) {
                        sftpConn.move({ from, to })
                        log.debug('Succesfully moved', f.name)
                    }
                }
            }
        }
        
        reduceContext.write({
            key: folder,
            value: ids
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
     const summarize = (summaryContext) => {
         let errorStack = logErrors(summaryContext)
         let script = runtime.getCurrentScript()
        let fileId = script.getParameter({ name: 'custscript_sftp_transmit_file_id' })
        let processFinished = script.getParameter({ name: 'custscript_sftp_process_finished' })

         let result = []
         summaryContext.output.iterator().each( (key, value) => {
             result.push({ key: key, data: value })
             return true
         })
        if (errorStack.length) {
            let ftpConnectionError = errorStack.filter(f => f.match(/unexpected suitescript|ftp|no_route|connection_reset|does not exist/gi))
            if (ftpConnectionError.length) {
                errorNotification(ftpConnectionError[0])

                // Retransmitting file
                if (!ftpConnectionError[0].match(/unexpected suitescript|invalid sftp key|does not exist|/gi)) {
                    let params = {
                        custscript_sftp_transmit_file_id: fileId
                    }
                    if (processFinished)
                        params.custscript_sftp_process_finished = 'T'
                    task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        params,
                        scriptId: 'customscript_sftp_transmit_mr',
                    }).submit()
                }
            }
        }

        // Successfully sent > tick checkbox bills
        if (!errorStack.length && fileId && !processFinished) {
            task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId:'customscript_sftp_generate_file_mr',
                params: {
                    custscript_generated_file_id: fileId,
                    custscript_sent_to_sftp: true
                }
            }).submit()
        } else {
            task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId:'customscript_sftp_generate_file_mr'
            }).submit()
        }

        log.debug('Summary processed', { errorStack, result })
         // TBC: EMAIL FUNCTION HERE


         ///////////////////////////////////

         log.audit({ title: '-------- [END] --------', details: `Usage: ${summaryContext.usage}; Concurrency: ${summaryContext.concurrency}; 
         Number of yields: ${summaryContext.yields}; Total items processed: ${result.length}` })
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

    const errorNotification = errorDetails => {
        let script = runtime.getCurrentScript()
        let author = script.getParameter({ name: 'custscript_sftp_email_author' })
        let recipients = (script.getParameter({ name: 'custscript_sftp_email_recipients' }) || '').replace(/ /g,'')
        let subject = 'SFTP Connection Error - Outbound';
        let body = `Dear User,
            <br/><br/>
            SFTP Connection error has occured during outbound process.
            <br/>
            <br/>
            Script ID: ${script.id}<br/>
            Deployment/Instance ID: ${script.deploymentId}
            <br/>
            <br/>
            Error Details: ${errorDetails}
            <br/>
            <br/>
            <br/>
            ${(() => {
                // As per our multiple testing, error below happens due to invalid user/pass/hostkey/invalid directory
                    /* {
                        type: "error.SuiteScriptError",
                        name: "FTP_CONNECT_TIMEOUT_EXCEEDED",
                        message: "Timeout exceeded while establishing SFTP connection",
                        stack: [
                           "Error\n    at Object.execute (/SuiteScripts/sftp_download_files_ss.js:43:33)"
                        ],
                        cause: {
                           type: "internal error",
                           code: "FTP_CONNECT_TIMEOUT_EXCEEDED",
                           details: "Timeout exceeded while establishing SFTP connection",
                           userEvent: null,
                           stackTrace: [
                              "Error\n    at Object.execute (/SuiteScripts/sftp_download_files_ss.js:43:33)"
                           ],
                           notifyOff: false
                        },
                        id: "",
                        notifyOff: false,
                        userFacing: true
                     } */
                    if (errorDetails.match(/invalid sftp key/gi)) 
                        return `${errorDetails}. Please check the key id under Setup > Company > Keys`
                    return ''
            })()}
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
        log.debug('EMAIL SFTP CONNECTION SENT')
    }

     return {getInputData, map, reduce, summarize}

 });
