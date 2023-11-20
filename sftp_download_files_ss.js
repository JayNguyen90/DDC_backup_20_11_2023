/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
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
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {
            if (SFTPScriptInstances() > 1) {
                log.debug('Cannot process at this time.', 'One of the SFTP Scheduled/MapReduce script instance is still in progress.')
                return
            }
            let script = runtime.getCurrentScript()
           
            let _sftp = {}
            _sftp.url           = script.getParameter({ name: 'custscript_sftp_url_transmit' })
            _sftp.username      = script.getParameter({ name: runtime.envType == 'PRODUCTION' ? 'custscript_sftp_username_transmit' : 'custscript_sftp_username_transmit_uat' })
            _sftp.hostKey       = script.getParameter({ name: 'custscript_sftp_hostkey_transmit' })
            _sftp.port          = 22//script.getParameter({ name: 'custscript_sftp_port_download' })
            
            let passwordGuid  = script.getParameter({ name: 'custscript_sftp_pwdguid_download' })
            if (passwordGuid)
                _sftp.passwordGuid = passwordGuid
            let keyId = script.getParameter({ name: 'custscript_sftp_keyid_download' })
            if (keyId)
                _sftp.keyId = keyId

            log.debug('-------- [START] --------', _sftp)

            let _files = []

            try {
                let sftpConn = sftp.createConnection(_sftp)
                let dir = script.getParameter({ name: 'custscript_sftp_directory_download' })
                
                let files = (sftpConn.list({ 
                    path: dir,
                    sort: 'DATE' 
                }) || []).filter(f => !f.directory && f.size > 0 && f.name.match(/.xml/gi))
                // file = file.slice(0, 10) // Temporary set to max per batch
                log.debug('SFTP dir files', files)
    
                if (files.length) {
                    let nsFolderId = script.getParameter({ name: 'custscript_sftp_download_folder_id' }) || -15
                    let searchNSFileNames = _searchNSFileNames(nsFolderId)
        
                    for (f of files) {
                        let _file = JSON.parse(JSON.stringify(f))
        
                        if (searchNSFileNames[f.name]) continue

                        let downloadedFile = sftpConn.download({
                            directory: dir,
                            filename: f.name
                        })
                        downloadedFile.folder = nsFolderId // SFTP Downloaded Files
                        _file.id = downloadedFile.save()
                        log.debug('File downloaded', `${dir}/${f.name}`)
                        _files.push(_file)
        
                        sftpConn.removeFile({ // Remove sftp files after saving in ns
                            path: `${dir}/${f.name}`
                        })
                        log.debug('File removed', `${dir}/${f.name}`)
                    }
                }
            } catch(e) {
                log.debug('Error catched', e)
                // if (e.name.match(/ftp|no_route|connection_reset/gi)) {
                    errorNotification(e.message)
                // }
            }

            if (_files.length) {
                task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_sftp_process_file_mr',
                }).submit()
            }

            log.debug('-------- [END] --------', _files)
        }

        const SFTPScriptInstances = () => {
            var scheduledscriptinstanceSearchObj = search.create({
                type: "scheduledscriptinstance",
                filters:
                [
                   [["script.scriptid","contains","CUSTOMSCRIPT_SFTP_TRANSMIT_MR"],"OR",["script.scriptid","contains","CUSTOMSCRIPT_SFTP_DOWNLOAD_SS"],"OR",["script.scriptid","contains","CUSTOMSCRIPT_SFTP_PROCESS_FILE_MR"]], 
                   "AND", 
                   ["status","anyof","PENDING","PROCESSING","RESTART"]
                ],
                columns:
                [
                   search.createColumn({
                      name: "datecreated",
                      sort: search.Sort.ASC,
                      label: "Date Created"
                   }),
                   search.createColumn({name: "startdate", label: "Start Date"}),
                   search.createColumn({name: "enddate", label: "End Date"}),
                   search.createColumn({name: "queue", label: "Queue"}),
                   search.createColumn({name: "status", label: "Status"}),
                   search.createColumn({name: "percentcomplete", label: "Percent Complete"}),
                   search.createColumn({name: "queueposition", label: "Queue Position"})
                ]
             });
             var searchResultCount = scheduledscriptinstanceSearchObj.runPaged().count;
             log.debug("scheduledscriptinstanceSearchObj result count",searchResultCount);
             scheduledscriptinstanceSearchObj.run().each(function(result){
                log.debug('>>>>', result)
                return true;
             });
            return searchResultCount
        }

        const _searchNSFileNames = folderId => {
            let fileName = {}
            search.create({
                type: 'file',
                filters: [
                    ['folder','is',folderId]
                ],
                columns: ['name']
            })
            .run().each(each => {
                fileName[each.getValue({ name: 'name' })] = each.id
                return true
            })
            log.debug('NS File Names', fileName)
            return fileName
        }

        const errorNotification = errorDetails => {
            let script = runtime.getCurrentScript()
            let author = script.getParameter({ name: 'custscript_sftp_email_author' })
            let recipients = (script.getParameter({ name: 'custscript_sftp_email_recipients' }) || '').replace(/ /g,'')
            let subject = 'SFTP Connection Error - Inbound';
            let body = `Dear User,
                <br/><br/>
                SFTP Connection error has occured during inbound process.
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

        return {execute}

    });
