/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * 
 * 
    1. search {SEARCH_LIMIT} vendors 
    2. filter out vendors with no bank details
    3. if has vendors left, proceed else end
    4. generate xml file
    5. send to sftp 
    6. update bills (these bills will automatically be removed from the search in number 1)
    7. repeat step 1
 */
    define(['N/file', 'N/record', 'N/runtime', 'N/search', 'N/task', 'N/xml', 'N/email', './lib/ns.utils', './lib/moment.min', './lib/lodash.min'],
    /**
   * @param{file} file
   * @param{record} record
   * @param{runtime} runtime
   * @param{search} search
   * @param{task} task
   * @param{xml} xml
   * @param{email} email
   */
     (file, record, runtime, search, task, xml, email, ns_utils, moment, _) => {
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
        const DISTRIBUTION_CONTRACTOR_CATEGORY = 8
        const SEARCH_LIMIT = 5000
   
        const getInputData = (inputContext) => {
            let script = runtime.getCurrentScript()
            let fileId = script.getParameter({ name: 'custscript_generated_file_id' })
            let sentToFTP = script.getParameter({ name: 'custscript_sent_to_sftp' })
            let vendorIds = []
   
            log.debug('-------- [START] --------', { sentToFTP })
   
            if (SFTPScriptInstances() > 2) {
               log.debug('Cannot process at this time.', 'One of the SFTP Scheduled/MapReduce script instance is still in progress.')
               return
           }
   
           let xFilters = !DEBUG_MODE ? [
               ["type","anyof","VendBill"], 
               "AND", 
                ["vendor.isinactive","is","F"],
               "AND", 
               ["vendor.category","anyof",DISTRIBUTION_CONTRACTOR_CATEGORY], // Distribution Contractors
               "AND", 
               ["mainline","is","T"], 
               "AND", 
               ["custbody_sent_to_sftp","is","F"], 
               "AND", 
               ["amountremainingisabovezero","is","T"], 
               "AND", 
               ["memorized","is","F"], 
               "AND", 
               ["custbody_payment_status","anyof","1"], // Pending
               'AND', 
               ['custbody_sftp_status_file_source','isempty','']
            ] : [
                ["type","anyof","VendBill"], 
                "AND", 
                ["vendor.isinactive","is","F"],
                "AND", 
                ["vendor.category","anyof",DISTRIBUTION_CONTRACTOR_CATEGORY], // Distribution Contractors
                "AND", 
                ["mainline","is","T"], 
                /* "AND", 
                ["custbody_sent_to_sftp","is","F"], 
                "AND", 
                ["amountremainingisabovezero","is","T"],  */
                "AND", 
                ["memorized","is","F"], /* 
                "AND", 
                ["custbody_payment_status","anyof","1"] // Pending */
             ]
   
           if (!sentToFTP) {
               let billSS2 = search.create({
                   type: "vendorbill",
                   filters: xFilters,
                   columns:
                   [
                      search.createColumn({
                         name: "tranid",
                         summary: "COUNT",
                         sort: search.Sort.ASC,
                         label: "Invoices per Vendor"
                      }),
                      search.createColumn({
                         name: "entity",
                         summary: "GROUP",
                         label: "Name"
                      }),
                      search.createColumn({
                         name: "name",
                         join: "Currency",
                         summary: "GROUP",
                         label: "Name"
                      }),
                      search.createColumn({
                         name: "companyname",
                         join: "vendor",
                         summary: "GROUP",
                         label: "Company Name"
                      }),
                      search.createColumn({
                         name: "zipcode",
                         join: "vendor",
                         summary: "GROUP",
                         label: "Postal Code"
                      }),
                      search.createColumn({
                         name: "city",
                         join: "vendor",
                         summary: "GROUP",
                         label: "Town/City"
                      }),
                      search.createColumn({
                         name: "state",
                         join: "vendor",
                         summary: "GROUP",
                         label: "State/Province"
                      }),
                      search.createColumn({
                         name: "country",
                         join: "vendor",
                         summary: "GROUP",
                         label: "Country"
                      }),
                      search.createColumn({
                         name: "address1",
                         join: "vendor",
                         summary: "GROUP",
                         label: "Address 1"
                      }),
                      search.createColumn({
                         name: "address2",
                         join: "vendor",
                         summary: "GROUP",
                         label: "Address 2"
                      }),
                      search.createColumn({
                         name: "custentity_entity_code",
                         join: "vendor",
                         summary: "GROUP",
                         label: "Entity Code"
                      }),
                      search.createColumn({
                         name: "email",
                         join: "vendor",
                         summary: "GROUP",
                         label: "Email"
                      }),
                      search.createColumn({
                         name: "currency",
                         join: "vendor",
                         summary: "GROUP",
                         label: "Currency"
                      }),
                      /* search.createColumn({
                         name: "custbody_sent_to_sftp",
                         summary: "GROUP",
                         label: "SENT TO SFTP"
                      }), */
                      search.createColumn({
                         name: "amountremaining",
                         summary: "SUM",
                         label: "Amount Remaining"
                      }),
                      /* search.createColumn({
                         name: "custbody_westpac_ref_id",
                         summary: "GROUP",
                         label: "WESTPAC REF ID"
                      }) */
                   ]
                });
       
               billSS2 = !DEBUG_MODE ? expandSearchToLimit(billSS2) : billSS2.run().getRange(0, 2)
               
               let bills = [],
                   trandate = moment(ns_utils.dateNowByCompanyTimezone()).format('YYYY-MM-DD');
                   
                 billSS2.forEach((each, i) => {
                     let vendorId = each.getValue({ name: 'entity', summary: search.Summary.GROUP })
                    bills.push({
                        i: Number(i)+1,
                        id: '',
                        tranid: vendorId,
                        trandate,
                        transactionNumber: vendorId,
                        vendor: {
                            id: vendorId,
                            name: each.getText({ name: 'entity', summary: search.Summary.GROUP }),
                            companyname: each.getValue({ name: 'companyname', join: 'vendor', summary: search.Summary.GROUP }),
                            zipcode: each.getValue({ name: 'zipcode', join: 'vendor', summary: search.Summary.GROUP }),
                            city: each.getValue({ name: 'city', join: 'vendor', summary: search.Summary.GROUP }),
                            state: each.getValue({ name: 'state', join: 'vendor', summary: search.Summary.GROUP }),
                            country: each.getValue({ name: 'country', join: 'vendor', summary: search.Summary.GROUP }),
                            address1: each.getValue({ name: 'address1', join: 'vendor', summary: search.Summary.GROUP }),
                            address2: each.getValue({ name: 'address2', join: 'vendor', summary: search.Summary.GROUP }),
                            code: each.getValue({ name: 'custentity_entity_code', join: 'vendor', summary: search.Summary.GROUP }),
                            email: each.getValue({ name: 'email', join: 'vendor', summary: search.Summary.GROUP }),
                            currency: each.getText({ name: 'currency', join: 'vendor', summary: search.Summary.GROUP })
                        },
                        amount: parseFloat(each.getValue({ name: 'amountremaining', summary: search.Summary.SUM })) || 0,
                        currency: each.getValue({ name: 'name', join: 'Currency', summary: search.Summary.GROUP }),
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
               vendorIds = bills.map(m => m.vendor.id)
       
                log.debug('Vendor IDs', vendorIds.length)
       
                if (vendorIds.length) {
                   let chunked = _.chunk(vendorIds, 1000)
       
                   let xFilters2 = []
                    for (chunk of chunked) {
                        xFilters2.push(['custrecord_2663_parent_vendor','anyof',chunk])
                        xFilters2.push('OR')
                    }
                    xFilters2.pop()
       
                   let xFilters3 = [
                       ["isinactive","is","F"],
                       "AND",
                       ["custrecord_2663_entity_bank_type","anyof","1"], // Primary
                        'AND',
                       ['custrecord_2663_entity_acct_no', 'isnotempty', '']
                   ]
                   xFilters3.push('AND')
                   xFilters3.push(xFilters2)
                    
                   let bankSS = search.create({
                       type: "customrecord_2663_entity_bank_details",
                       filters: xFilters3,
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
                   bankSS = ns_utils.expandSearch(bankSS)
                   log.debug('Bank details search length', bankSS.length)
       
                   bankSS.forEach(each => {
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
                    })
                }
                
                bills = bills.filter(f => f.bank.acct_no != '')
       
                log.debug('getInputData', bills.length)
   
                return bills
   
           } else {
               if (fileId) {
                   let _f = file.load(fileId)
                   let xmlDocument = xml.Parser.fromString({ 
                       text : _f.getContents() 
                   })
                   let recordList = xmlDocument.getElementsByTagNameNS({ 
                       namespaceURI: '*',
                       localName: 'CdtTrfTxInf' 
                   })
                   let vendorIds = []
                   for (rec of recordList) {
                       let InstrId = rec.getElementsByTagNameNS({ 
                           namespaceURI: '*',
                           localName: 'InstrId' 
                       })[0].textContent
                       vendorIds.push(InstrId)
                   }
   
                   let chunked = _.chunk(vendorIds, 1000)
   
                   let xFilters1 = []
                   for (chunk of chunked) {
                       xFilters1.push(['entity','anyof',chunk])
                       xFilters1.push('OR')
                   }
                   xFilters1.pop()
                   xFilters.push('AND')
                   xFilters.push(xFilters1)
                   let billSS = ns_utils.expandSearch(search.create({
                       type: 'vendorbill',
                       filters: xFilters
                  }))
                   let billIds = billSS.map(m => m.id)
                   log.debug('# of bills to update', billIds.length)
                   return billIds // After xml file sent to sftp, update each bill
               }
           }
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
                updateVendorBillFields(mapContext) // After txt file sent to sftp
            
        }
   
        const mapSSResultDetails = mapContext => {
           //  log.debug('Map context', mapContext)
            let bill = JSON.parse(mapContext.value)
            mapContext.write({ key: mapContext.key, value: bill })
        }
   
        const updateVendorBillFields = mapContext => {
           let script = runtime.getCurrentScript()
           let fileId = script.getParameter({ name: 'custscript_generated_file_id' })
           let _f = file.load(fileId)
           let wpRefId = _f.name.replace(/eft_|.xml/gi,'')
   
            let id = mapContext.value
            log.debug('Update bill', { id, key: mapContext.key })
            
            if (!DEBUG_MODE) {
                record.submitFields({
                    type: 'vendorbill',
                    id,
                    values: {
                       custbody_westpac_ref_id: wpRefId,
                        custbody_sent_to_sftp: true
                    },
                    options: {
                        ignoreMandatoryFields: true,
                    }
                })
            }
            
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
           let errorStack = logErrors(summaryContext)
            let script = runtime.getCurrentScript()
            let fileId = script.getParameter({ name: 'custscript_generated_file_id' })
            let sentToFTP = script.getParameter({ name: 'custscript_sent_to_sftp' })
            let transmitFolderId = script.getParameter({ name: 'custscript_sftp_gener_transmit_folder_id' }) || -15
            let processFinished = script.getParameter({ name: 'custscript_process_finished' })
            let bills = [], newId = ''
   
            try {
                summaryContext.output.iterator().each( (key, value) => {
                    bills.push(JSON.parse(value))
                    return true
                })

                if (!sentToFTP) {
                    if (bills.length) {
                        let xmlBills = bills.reduce((x, y) => 
                                x + `<CdtTrfTxInf>
                                        <PmtId>
                                            <InstrId>${y.vendor.id}</InstrId>
                                            <EndToEndId>${y.vendor.id}</EndToEndId>
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
                                                    <RltdDt>${y.trandate}</RltdDt>
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
                        let wpRefId = `${moment(ns_utils.dateNowByCompanyTimezone()).format('YYYYMMDD-hhmmss')}`
                        if (runtime.envType != 'PRODUCTION')
                            wpRefId += `_${runtime.accountId}`

                       let sumAmt = bills.reduce((x, y) => x + y.amount, 0)
       
                        let xmlStr = xmlStruct()
                            .replace(/{{CtrlSum}}/gi, sumAmt)
                            .replace(/{{NbOfTxs}}/gi, bills.length)
                            .replace(/{{xmlBills}}/gi, xmlBills)
                            .replace(/{{MsgId}}/gi, wpRefId)
                            .replace(/{{CreDtTm}}/gi, moment(ns_utils.dateNowByCompanyTimezone()).format('YYYY-MM-DDThh:mm:ss'))
                            .replace(/{{InitgPty.Nm}}/gi, script.getParameter({ name: 'custscript_xml_wp_grphdr_initgpty_nm' }))
                            .replace(/{{PmtInfId}}/gi, wpRefId)
                            .replace(/{{PmtMtd}}/gi, script.getParameter({ name: 'custscript_xml_wp_pmtinf_pmtmtd' }))
                            .replace(/{{BtchBookg}}/gi, 'false')
                            .replace(/{{PmtInf.NbOfTxs}}/gi, bills.length)
                            .replace(/{{PmtInf.CtrlSum}}/gi, sumAmt)
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
                            .replace(/null|undefined|- none -/gi,'')
                            .replace(/invalid date/gi, moment(ns_utils.dateNowByCompanyTimezone()).format('YYYY-MM-DD'))
       
                        xmlStr = removeXMLTagNullValues(xmlStr)
                        xmlStr = xmlStr.replace(/&amp;/g, '&').replace(/&/g, '&amp;')
       
                        // Create text file
                        try {
                           newId = file.create({
                               name: `EFT_${wpRefId}.xml`,
                               fileType: file.Type.XMLDOC,
                               contents: xmlStr,
                               folder: transmitFolderId
                           }).save()
                        } catch(e) {
                            newId = file.create({
                                name: `EFT_${wpRefId}.xml`,
                                fileType: file.Type.XMLDOC,
                                contents: xmlStr,
                                folder: -15
                            }).save()
                        }
            
                        if (newId) {
                            xml.Parser.fromString({ 
                                text : xmlStr
                            }) // Validate xml contents before sending to sftp
                            task.create({
                                taskType: task.TaskType.MAP_REDUCE,
                                params: {
                                    custscript_sftp_transmit_file_id: newId
                                },
                                scriptId: 'customscript_sftp_transmit_mr',
                            }).submit()
                        }
                    }
                } else {
                   if (errorStack.length) {
                       let unexpectedErrors = errorStack.filter(f => f.match(/unexpected error|unexpected_error|sss_app_server_restart/gi))
                       log.debug('Unexpected errors', unexpectedErrors.length)
                       
                       if (unexpectedErrors.length) {
                           log.debug('Restarting...')
       
                           task.create({
                               taskType: task.TaskType.MAP_REDUCE,
                               scriptId:'customscript_sftp_generate_file_mr',
                               params: {
                                   custscript_generated_file_id: fileId,
                                   custscript_sent_to_sftp: true
                               }
                           }).submit()
                       }
                   } else {
                       if (!DEBUG_MODE) {
                           /* task.create({
                               taskType: task.TaskType.MAP_REDUCE,
                               scriptId:'customscript_sftp_generate_file_mr'
                           }).submit() */
                           if (fileId)
                                task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    params: {
                                        custscript_sftp_transmit_file_id: fileId,
                                        custscript_sftp_process_finished: 'T'
                                    },
                                    scriptId: 'customscript_sftp_transmit_mr',
                                }).submit()
                       }
                   }
                }
            } catch(e) {
                log.debug('Summary context error', e.message)
                errorNotification(e)
            }
   
            log.debug('bills', bills.length)
   
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
       
       const expandSearchToLimit = set => {
           let results = set.run(), index = 0, range = 1000, resultSet = 0, sets = []
           do {
               resultSet = results.getRange(index, index + range)
               sets = sets.concat(resultSet)
               index += range
           } while (resultSet.length > 0 && sets.length < SEARCH_LIMIT)
           return sets
       }
       
       const SFTPScriptInstances = () => {
           var scheduledscriptinstanceSearchObj = search.create({
               type: "scheduledscriptinstance",
               filters:
               [
                  [["script.scriptid","contains","CUSTOMSCRIPT_SFTP_GENERATE_FILE_MR"],"OR",["script.scriptid","contains","CUSTOMSCRIPT_SFTP_TRANSMIT_MR"],"OR",["script.scriptid","contains","CUSTOMSCRIPT_SFTP_DOWNLOAD_SS"],"OR",["script.scriptid","contains","CUSTOMSCRIPT_SFTP_PROCESS_FILE_MR"]], 
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
   
       const logErrors = summaryContext => {
            let errorStack = []
            if (summaryContext.inputSummary.error) {
                errorStack.push(`Input Error: ${summaryContext.inputSummary.error}`)
                log.debug('Input Error', summaryContext.inputSummary.error)
                errorNotification(summaryContext.inputSummary.error)
            }
            
            summaryContext.mapSummary.errors.iterator().each((code, message) => {
                errorStack.push(`Map Error ${code}: ${message}`)
                if (!(code+message).match(/unexpected error|unexpected_error|unexpected suite/gi))
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
                let sentToFTP = script.getParameter({ name: 'custscript_sent_to_sftp' })
                let author = script.getParameter({ name: 'custscript_sftp_email_author' })
                let recipients = (script.getParameter({ name: 'custscript_sftp_email_recipients' }) || '').replace(/ /g,'')
                let subject = !sentToFTP ? 'Generating XML file error' : 'Error on updating bills';
                let body = `Dear User,
                    <br/><br/>
                    ${!sentToFTP ? 'Unable to generate XML file due to unexpected error below.' : 'Unable to proceed updating bills due to unexpected error below.'}
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
   