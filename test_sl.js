/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/runtime','N/xml','N/file','N/sftp'],
    /**
 * @param{xml} xml
 */
    (runtime, xml, file, sftp) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            let script = runtime.getCurrentScript()
            let transmitDirectory = script.getParameter({ name: 'custscript_sftp_directory_transmit' })
            let processedDirectory = script.getParameter({ name: 'custscript_sftp_processed_directory' })
            let processFinished = script.getParameter({ name: 'custscript_sftp_process_finished' })

            let _sftp = {}
            _sftp.url           = script.getParameter({ name: 'custscript_sftp_url_transmit' })
            _sftp.username      = script.getParameter({ name: runtime.envType == 'PRODUCTION' ? 'custscript_sftp_username_transmit' : 'custscript_sftp_username_transmit_uat' })
            _sftp.hostKey       = script.getParameter({ name: 'custscript_sftp_hostkey_transmit' })
            // _sftp.directory     = transmitDirectory
            _sftp.port          = 22
            _sftp.keyId         = 'custkey_westpac_ppk'

            log.debug('_sftp', _sftp)

            let sftpConn = sftp.createConnection(_sftp)
            let files = (sftpConn.list({
                path: transmitDirectory,
                sort: 'DATE' 
            }) || [])
            let name = 'EFT_20220819-062051_TEST.xml'
            let from = `${transmitDirectory}/${name}`
            let to = `${processedDirectory}/${name}`
            log.debug('>>>', { name, from, to })
            sftpConn.move({ from, to })
            log.debug('Succesfully moved', name)
            /* let fileId = '19742' // EFT_20220505-022817.xml
            let _f = file.load(fileId)
            let xmlDocument = xml.Parser.fromString({ 
                text : _f.getContents() 
            })
            let recordList = xmlDocument.getElementsByTagNameNS({ 
                namespaceURI: '*',
                localName: 'CdtTrfTxInf' 
            })
            let vendorIds = []
            for (record of recordList) {
                let InstrId = record.getElementsByTagNameNS({ 
                    namespaceURI: '*',
                    localName: 'InstrId' 
                })[0].textContent
                log.debug('InstrId', InstrId)
                vendorIds.push(InstrId)
            }
            scriptContext.response.write(JSON.stringify(vendorIds)) */

            
            /* try {
                let _f = file.load(20842)
                _f.folder = 123124561231231232
                _f.save()
            } catch(e) {
                let _f = file.load(20842)
                _f.folder = -15
                _f.save()
            } */
            // let _f = file.load(20842)
            //     _f.folder = 123124561231231232
            //     _f.save()
            scriptContext.response.write(JSON.stringify(files))
        }

        return {onRequest}

    });
