/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/file', 'N/record', 'N/runtime', 'N/search', 'N/task', './lib/ns.utils', './lib/moment.min', './lib/crypto-js'],
    /**
 * @param{file} file
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 * @param{task} task
 */
     (file, record, runtime, search, task, ns_utils, moment, crypto) => {
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
            let sentToFTP = script.getParameter({ name: 'custscript_sent_to_sftp' })
            let billSSId = script.getParameter({ name: 'custscript_bill_search_id' })
            let bankSSId = script.getParameter({ name: 'custscript_bank_search_id' })

            log.debug('-------- [START] --------', { billSSId, bankSSId, sentToFTP })
            if (!billSSId) return

            let billSS = search.load(billSSId)
            billSS = ns_utils.expandSearch(billSS)

            if (sentToFTP)
                return billSS.map(m => m.id) // After txt file sent to sftp, update each billrecs

            let bills = [],
             vendorIDs = []

            billSS.forEach((each, i) => {
                bills.push({
                    i: Number(i)+1,
                    id: each.id,
                    tranid: each.getValue({ name: 'tranid' }),
                    trandate: each.getText({ name: 'trandate' }) || each.getValue({ name: 'trandate' }),
                    transactionNumber: each.getValue({ name: 'transactionnumber' }),
                    vendor: {
                        id: each.getValue({ name: 'entity' }),
                        name: each.getText({ name: 'entity' }),
                        companyname: each.getValue({ name: 'companyname', join: 'vendor' }),
                        zipcode: each.getValue({ name: 'zipcode', join: 'vendor' }),
                        city: each.getValue({ name: 'city', join: 'vendor' }),
                        state: each.getValue({ name: 'state', join: 'vendor' }),
                        country: each.getValue({ name: 'country', join: 'vendor' }) || 'AU',
                        address1: each.getValue({ name: 'address1', join: 'vendor' }),
                        address2: each.getValue({ name: 'address2', join: 'vendor' }),
                        code: each.getValue({ name: 'custentity_entity_code', join: 'vendor' }),
                        email: each.getValue({ name: 'email', join: 'vendor' }),
                        currency: each.getText({ name: 'currency', join: 'vendor' })
                    },
                    amount: parseFloat(each.getValue({ name: 'grossamount' })) || 0,
                    currency: each.getValue({ name: 'name', join: 'Currency' }),
                    bank: {
                        type: '',
                        number: '',
                        branch_no: '',
                        acct_name: '',
                        acct_no: '',
                        payment_desc: '',
                        country: ''
                    }
                })
            })
            vendorIDs = bills.map(m => m.vendor.id)

            if (bankSSId && vendorIDs.length) {
                let bankSS = search.load(bankSSId)
                bankSS.filters.push(search.createFilter({
                    name: 'custrecord_2663_parent_vendor',
                    operator: 'anyof',
                    values: vendorIDs
                }))

                bankSS.run().each(each => {
                    for (bill of bills) {
                        if (bill.vendor.id == each.getValue({ name: 'custrecord_2663_parent_vendor' })) {
                            bill.bank.type = each.getText({ name: 'custrecord_2663_entity_bank_type' })
                            bill.bank.number = each.getValue({ name: 'custrecord_2663_entity_bank_no' })
                            bill.bank.branch_no = each.getValue({ name: 'custrecord_2663_entity_branch_no' })
                            bill.bank.acct_name = each.getValue({ name: 'custrecord_2663_entity_acct_name' })
                            bill.bank.acct_no = each.getValue({ name: 'custrecord_2663_entity_acct_no' })
                            bill.bank.payment_desc = each.getValue({ name: 'custrecord_2663_entity_payment_desc' })
                            bill.bank.country = each.getText({ name: 'custrecord_2663_entity_country' }) || each.getValue({ name: 'custrecord_2663_entity_country' }) || ''
                        }
                    }
                    return true
                })
            }
            
            bills = bills.filter(f => f.bank.acct_no != '')

            log.debug('Vendor IDs', vendorIDs)
            log.debug('getInputData', bills)
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

        const map = (mapContext) => {
            let script = runtime.getCurrentScript()
            let sentToFTP = script.getParameter({ name: 'custscript_sent_to_sftp' })
            
            if (!sentToFTP) 
                mapSSResultDetails(mapContext)
            else if (sentToFTP) 
                updateVendorBillSentBox(mapContext) // After txt file sent to sftp
            
        }

        const mapSSResultDetails = mapContext => {
            let bill = JSON.parse(mapContext.value)
            mapContext.write({ key: mapContext.key, value: bill })
        }

        const updateVendorBillSentBox = mapContext => {
            let id = mapContext.value
            log.debug('Update bill', { id })

            record.submitFields({
                type: 'vendorbill',
                id,
                values: {
                    custbody_sent_to_sftp: true
                },
                options: {
                    ignoreMandatoryFields: true,
                }
            })
            mapContext.write({ key: id, value: id })
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
            let script = runtime.getCurrentScript()
            let sentToFTP = script.getParameter({ name: 'custscript_sent_to_sftp' })
            let transmitFolderId = script.getParameter({ name: 'custscript_sftp_gener_transmit_folder_id' })
            let unEncryptedFolderId = script.getParameter({ name: 'custscript_sftp_gener_unencryp_folder_id' })

            logErrors(summaryContext)

            let bills = [], newId = ''

            if (!sentToFTP) {
                summaryContext.output.iterator().each( (key, value) => {
                    bills.push(JSON.parse(value))
                    return true
                })
                if (bills.length) {
                    let xmlBills = bills.reduce((x, y) => 
                            x + `<CdtTrfTxInf>
                                    <PmtId>
                                        <InstrId>${y.id}</InstrId>
                                        <EndToEndId>${y.id}</EndToEndId>
                                    </PmtId>
                                    <PmtTpInf>
                                    <SvcLvl>
                                        <Cd>NURG</Cd>
                                    </SvcLvl>
                                    <CtgyPurp>
                                        <Cd>CASH</Cd>
                                    </CtgyPurp>
                                    </PmtTpInf>
                                    <Amt>
                                        <InstdAmt Ccy="${y.currency}">${y.amount.toFixed(2)}</InstdAmt>
                                    </Amt>
                                    <CdtrAgt>
                                        <FinInstnId>
                                            <ClrSysMmbId>
                                                <MmbId>${y.bank.number}${y.bank.branch_no}</MmbId>
                                            </ClrSysMmbId>
                                            <Nm>${y.bank.acct_name}</Nm>
                                            <PstlAdr>
                                                <Ctry>AU</Ctry>
                                            </PstlAdr>
                                        </FinInstnId>
                                        <BrnchId>
                                            <Id>${y.bank.number}${y.bank.branch_no}</Id>
                                            <Nm>${y.bank.acct_name}</Nm>
                                            <PstlAdr>
                                                <Ctry>AU</Ctry>
                                            </PstlAdr>
                                        </BrnchId>
                                    </CdtrAgt>
                                    <Cdtr>
                                        <Nm>${y.vendor.companyname}</Nm>
                                        <PstlAdr>
                                            <PstCd>${y.vendor.zipcode}</PstCd>
                                            <TwnNm>${y.vendor.city}</TwnNm>
                                            <CtrySubDvsn>${y.vendor.state}</CtrySubDvsn>
                                            <Ctry>${y.vendor.country}</Ctry>
                                            <AdrLine>${y.vendor.address1}</AdrLine>
                                            <AdrLine>${y.vendor.address2}</AdrLine>
                                        </PstlAdr>
                                        <Id>
                                            <OrgId>
                                                <Othr>
                                                    <Id>${y.vendor.code}</Id>
                                                </Othr>
                                            </OrgId>
                                        </Id>
                                        <CtctDtls>
                                            <EmailAdr>${y.vendor.email}</EmailAdr>
                                        </CtctDtls>
                                    </Cdtr>
                                    <CdtrAcct>
                                    <Id>
                                        <Othr>
                                            <Id>${y.bank.acct_no}</Id>
                                        </Othr>
                                    </Id>
                                    <Tp>
                                        <Cd>SACC</Cd>
                                    </Tp>
                                    <Ccy>${y.vendor.currency}</Ccy>
                                    <Nm>${y.vendor.companyname}</Nm>
                                    </CdtrAcct>
                                    <Purp>
                                        <Prtry>DEP</Prtry>
                                    </Purp>
                                    <RmtInf>
                                        <Strd>
                                            <RfrdDocInf>
                                                <Tp>
                                                    <CdOrPrtry>
                                                    <Cd>SOAC</Cd>
                                                    </CdOrPrtry>
                                                </Tp>
                                                <Nb>${y.transactionNumber}</Nb>
                                                <RltdDt>${moment(y.trandate).format('YYYY-MM-DD')}</RltdDt>
                                            </RfrdDocInf>
                                            <RfrdDocAmt>
                                                <DuePyblAmt Ccy="${y.currency}">${y.amount.toFixed(2)}</DuePyblAmt>
                                                <RmtdAmt Ccy="${y.currency}">${y.amount.toFixed(2)}</RmtdAmt>
                                            </RfrdDocAmt>
                                            <CdtrRefInf>
                                                <Ref>${y.transactionNumber}</Ref>
                                            </CdtrRefInf>
                                        </Strd>
                                    </RmtInf>
                                </CdtTrfTxInf>`, 
                        '')
                    let custRecId = record.create({ type: 'customrecord_sftp_message_id' })
                    // .setValue({ fieldId: 'custrecord_westpac_file', value: newId })
                    .save({ ignoreMandatoryFields: true })

                    log.debug('New customrecord id', custRecId)
                    
                    let xmlStr = xmlStruct()
                        .replace(/{{CtrlSum}}/gi, bills.reduce((x, y) => x + y.amount, 0))
                        .replace(/{{NbOfTxs}}/gi, bills.length)
                        .replace(/{{xmlBills}}/gi, xmlBills)
                        .replace(/{{MsgId}}/gi, custRecId)
                        .replace(/{{CreDtTm}}/gi, moment(ns_utils.dateNowByCompanyTimezone()).format('YYYY-MM-DDThh:mm:ss'))
                        .replace(/{{InitgPty.Nm}}/gi, script.getParameter({ name: 'custscript_xml_wp_grphdr_initgpty_nm' }))
                        .replace(/{{PmtInfId}}/gi, `${custRecId}1`)
                        .replace(/{{PmtMtd}}/gi, script.getParameter({ name: 'custscript_xml_wp_pmtinf_pmtmtd' }))
                        .replace(/{{BtchBookg}}/gi, 'false')
                        .replace(/{{PmtInf.NbOfTxs}}/gi, bills.length)
                        .replace(/{{PmtInf.CtrlSum}}/gi, bills.reduce((x, y) => x + y.amount, 0))
                        .replace(/{{InstrPrty}}/gi, script.getParameter({ name: 'custscript_xml_wp_pmtinf_pmttpinf_instrp' }))
                        .replace(/{{SvcLvl.Cd}}/gi, script.getParameter({ name: 'custscript_xml_wp_pmtinf_pmttpinf_svclvl' }))
                        .replace(/{{ReqdExctnDt}}/gi, script.getParameter({ name: 'custscript_xml_wp_pmtinf_pmttpinf_reqdex' }))
                        .replace(/{{Dbtr.Nm}}/gi, script.getParameter({ name: 'custscript_xml_wp_pmtinf_dbtr_nm' }))
                        .replace(/{{AdrTp}}/gi, script.getParameter({ name: 'custscript_xml_wp_pmtinf_dbtr_pstladr_ad' }))
                        .replace(/{{PstCd}}/gi, script.getParameter({ name: 'custscript_xml_wp_pmtinf_dbtr_pstladr_ps' }))
                        .replace(/{{TwnNm}}/gi, script.getParameter({ name: 'custscript_xml_wp_pmtinf_dbtr_pstladr_tw' }))
                        .replace(/{{CtrySubDvsn}}/gi, script.getParameter({ name: 'custscript_xml_wp_pmtinf_dbtr_pstladr_ct' }))
                        .replace(/{{Ctry}}/gi, script.getParameter({ name: 'custscript_xml_wp_pmtinf_dbtr_pstladr_cr' }))
                        .replace(/{{AdrLine}}/gi, script.getParameter({ name: 'custscript_xml_wp_pmtinf_dbtr_pstladr_a1' }))
                        .replace(/{{AdrLine2}}/gi, script.getParameter({ name: 'custscript_xml_wp_pmtinf_dbtr_pstladr_a2' }))
                        .replace(/{{OrgId.Othr.Id}}/gi, script.getParameter({ name: 'custscript_xml_wp_pmtinf_dbtr_othr_id' }))
                        .replace(/{{OrgId.Othr.Prtry}}/gi, script.getParameter({ name: 'custscript_xml_wp_pmtinf_dbtr_othr_schme' }))
                        .replace(/{{DbtrAcct.Id}}/gi, script.getParameter({ name: 'custscript_xml_wp_pmtinf_dbtracct_id_oth' }))
                        .replace(/{{DbtrAcct.Cd}}/gi, script.getParameter({ name: 'custscript_xml_wp_pmtinf_dbtracct_tp_cd' }))
                        .replace(/{{DbtrAcct.Ccy}}/gi, script.getParameter({ name: 'custscript_xml_wp_pmtinf_dbtracct_ccy' }))
                        .replace(/{{DbtrAcct.Nm}}/gi, script.getParameter({ name: 'custscript_xml_wp_pmtinf_dbtracct_nm' }))
                        .replace(/{{DbtrAgt.BIC}}/gi, script.getParameter({ name: 'custscript_xml_wp_pmtinf_dbtragt_fin_bic' }))
                        .replace(/{{DbtrAgt.MmbId}}/gi, '032326')
                        .replace(/{{DbtrAgt.Nm}}/gi, 'Westpac Banking')
                        .replace(/{{PstlAdr.Ctry}}/gi, 'AU')
                        .replace(/{{DbtrAgt.Id}}/gi, script.getParameter({ name: 'custscript_xml_wp_pmtinf_dbtragt_fin_oth' }))
                        .replace(/{{UltmtDbtr.Nm}}/gi, script.getParameter({ name: 'custscript_xml_wp_pmtinf_ultmtdbtr_nm' }))
                        .replace(/null|undefined/g,'')
                        .replace(/Invalid date/gi, moment(ns_utils.dateNowByCompanyTimezone()).format('YYYY-MM-DD'))

                    xmlStr = removeXMLTagNullValues(xmlStr)

                    // Create text file
                    newId = file.create({
                        name: `EFT_${moment(ns_utils.dateNowByCompanyTimezone()).format('YYYYMMDD-hhmmss')}.xml`,
                        fileType: file.Type.XMLDOC,
                        contents: xmlStr,
                        folder: transmitFolderId/* unEncryptedFolderId */ || -15
                    }).save()
        
                    if (newId) {
                        // let encryptedFileId = encryptToAES(xmlStr, transmitFolderId)
                        
                        record.submitFields({
                            type: 'customrecord_sftp_message_id',
                            id: custRecId,
                            values: {
                                custrecord_westpac_file: newId//encryptedFileId
                            }
                        })

                        task.create({
                            taskType: task.TaskType.MAP_REDUCE,
                            deploymentId: 'customdeploy_ddc_sftp_mr',
                            params: {
                                custscript_sftp_transmit_file_id: newId//encryptedFileId
                            },
                            scriptId: 'customscript_sftp_transmit_mr',
                        }).submit()
                    }
                }
            }

            log.debug('bills', bills)

            log.audit({ title: '-------- [END] --------', details: `Usage: ${summaryContext.usage}; Concurrency: ${summaryContext.concurrency}; 
            Number of yields: ${summaryContext.yields}; Total items processed: ${bills.length}; New ID: ${newId}; Transmit Folder ID: ${transmitFolderId}`})
        }

        const removeXMLTagNullValues = xmlStr => {
            xmlStr = xmlStr.replace(/\n|\t|\r|&#160;|&nbsp;|  /g, '')
            let tags = xmlStr.match(/(<.*?>)/gi)
            if (tags) {
                tags = tags.filter(f => !f.match(/\//g)) // Remove end tags
                for (tag of tags) 
                    xmlStr = xmlStr.replace(`${tag}${tag.replace('<','</')}`, '')
            }
            return xmlStr
        }

        const xmlStruct = () => {
            return `<?xml version="1.0" encoding="utf-8"?>
            <Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
               <CstmrCdtTrfInitn>
                  <GrpHdr>
                     <MsgId>{{MsgId}}</MsgId>
                     <CreDtTm>{{CreDtTm}}</CreDtTm>
                     <NbOfTxs>{{NbOfTxs}}</NbOfTxs>
                     <CtrlSum>{{CtrlSum}}</CtrlSum>
                     <InitgPty>
                        <Nm>{{InitgPty.Nm}}</Nm>
                     </InitgPty>
                  </GrpHdr>
                  <PmtInf>
                     <PmtInfId>{{PmtInfId}}</PmtInfId>
                     <PmtMtd>{{PmtMtd}}</PmtMtd>
                     <BtchBookg>{{BtchBookg}}</BtchBookg>
                     <NbOfTxs>{{PmtInf.NbOfTxs}}</NbOfTxs>
                     <CtrlSum>{{PmtInf.CtrlSum}}</CtrlSum>
                     <PmtTpInf>
                        <InstrPrty>{{InstrPrty}}</InstrPrty>
                        <SvcLvl>
                           <Cd>{{SvcLvl.Cd}}</Cd>
                        </SvcLvl>
                     </PmtTpInf>
                     <ReqdExctnDt>{{ReqdExctnDt}}</ReqdExctnDt>
                     <Dbtr>
                        <Nm>{{Dbtr.Nm}}</Nm>
                        <PstlAdr>
                           <AdrTp>{{AdrTp}}</AdrTp>
                           <PstCd>{{PstCd}}</PstCd>
                           <TwnNm>{{TwnNm}}</TwnNm>
                           <CtrySubDvsn>{{CtrySubDvsn}}</CtrySubDvsn>
                           <Ctry>{{Ctry}}</Ctry>
                           <AdrLine>{{AdrLine}}</AdrLine>
                           <AdrLine>{{AdrLine2}}</AdrLine>
                        </PstlAdr>
                        <Id>
                           <OrgId>
                              <Othr>
                                 <Id>{{OrgId.Othr.Id}}</Id>
                                 <SchmeNm>
                                    <Prtry>{{OrgId.Othr.Prtry}}</Prtry>
                                 </SchmeNm>
                              </Othr>
                           </OrgId>
                        </Id>
                     </Dbtr>
                     <DbtrAcct>
                        <Id>
                           <Othr>
                              <Id>{{DbtrAcct.Id}}</Id>
                           </Othr>
                        </Id>
                        <Tp>
                           <Cd>{{DbtrAcct.Cd}}</Cd>
                        </Tp>
                        <Ccy>{{DbtrAcct.Ccy}}</Ccy>
                        <Nm>{{DbtrAcct.Nm}}</Nm>
                     </DbtrAcct>
                     <DbtrAgt>
                        <FinInstnId>
                           <BIC>{{DbtrAgt.BIC}}</BIC>
                           <ClrSysMmbId>
                              <MmbId>{{DbtrAgt.MmbId}}</MmbId>
                           </ClrSysMmbId>
                           <Nm>{{DbtrAgt.Nm}}</Nm>
                           <PstlAdr>
                              <Ctry>{{PstlAdr.Ctry}}</Ctry>
                           </PstlAdr>
                           <Othr>
                              <Id>{{DbtrAgt.Id}}</Id>
                           </Othr>
                        </FinInstnId>
                     </DbtrAgt>
                     <UltmtDbtr>
                        <Nm>{{UltmtDbtr.Nm}}</Nm>
                     </UltmtDbtr>
                        {{xmlBills}}
                     </PmtInf>
                    </CstmrCdtTrfInitn>
                 </Document>`
        }

        const encryptToAES = (str, folder) => {
            // ENCRYPTION PART
            const PASS_PHRASE = 'DDC2022!!'

            let encrypted = crypto.AES.encrypt(str, PASS_PHRASE).toString();

            let newId2 = file.create({
                name: `EFT_${moment(ns_utils.dateNowByCompanyTimezone()).format('YYYYMMDD-hhmmss')}_encrypted.txt`,
                fileType: file.Type.PLAINTEXT,
                contents: encrypted,
                folder: folder || -15
            }).save()

            return newId2
        }

        const logErrors = summaryContext => {
            if (summaryContext.inputSummary.error)
                log.debug('Input Error', summaryContext.inputSummary.error)
            
            summaryContext.mapSummary.errors.iterator().each((code, message) => {
                log.debug(`Map Error ${code}`, message)
                return true
            })
            summaryContext.reduceSummary.errors.iterator().each((code, message) => {
                log.debug(`Reduce Error ${code}`, message)
                return true
            })
        }

        return {getInputData, map/* , reduce */, summarize}

    });
