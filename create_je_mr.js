/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/format', 'N/record', 'N/search', 'N/runtime', 'N/format', '/SuiteScripts/moment.js'],
    /**
     * @param {record} record
     * @param {search} search
     */
    function (format, record, search, runtime, format, moment) {

        /**
         * Marks the beginning of the Map/Reduce process and generates input data.
         *
         * @typedef {Object} ObjectRef
         * @property {number} id - Internal ID of the record instance
         * @property {string} type - Record type id
         *
         * @return {Array|Object|Search|RecordRef} inputSummary
         * @since 2015.1
         */
        function getInputData() {
            var vendorPaymentArr = getVendorPayment();
            log.debug('Line Total: ', vendorPaymentArr.length);
            return vendorPaymentArr;
        }

        /**
         * Executes when the map entry point is triggered and applies to each key/value pair.
         *
         * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
         * @since 2015.1
         */
        function map(context) {
            try {
                log.debug('context', context)
                var valueS = context.value;
                log.debug("valueS", valueS);
                var data = JSON.parse(context.value).data;
                log.debug("data", data);
                var vendorPayment = record.load({
                    type: "vendorpayment",
                    id: data[0].internalId,
                })
                var accountDebitJe = vendorPayment.getValue("account");
                log.debug("accountDebitJe", accountDebitJe);
                var accountObj = record.load({
                    type: 'account',
                    id: accountDebitJe
                });
                var creditAccJE = accountObj.getValue('custrecord_eft_payt_clearing_acct');
                log.debug("creditAccJE", creditAccJE)
                if (!creditAccJE) {
                    log.debug("dont setup creditAccJE", "dont setup creditAccJE")
                    return;
                }
                var sourseFile = JSON.parse(context.value).sourseFile;
                log.debug("sourseFile", sourseFile);
                var transDateArr = data.map(x => x.transDate)
                var sumAmount = data.map(item => Math.abs(item.amount)).reduce((prev, curr) => prev + curr, 0);
                log.debug("sumAmount", sumAmount);
                log.debug("transDateArr", transDateArr);
                var transDate = transDateArr.sort((a, b) => moment(a, 'DD-MM-YYYY').diff(moment(b, 'DD-MM-YYYY')))
                log.debug("transDate sort ", transDateArr);
                var tranDateJE = transDate[0];
                log.debug("tranDateJE", tranDateJE);
                if (tranDateJE) {
                    tranDateJE = format.parse({
                        value: tranDateJE,
                        type: format.Type.DATE
                    });

                }
                var objRecord = record.create({
                    type: 'journalentry',
                    isDynamic: true,
                    defaultValue: false
                });
                objRecord.setValue({
                    fieldId: 'subsidiary',
                    value: 10
                })
                objRecord.setValue({
                    fieldId: 'trandate',
                    value: tranDateJE
                })
                objRecord.setValue({
                    fieldId: 'approvalstatus',
                    value: 2
                })
                objRecord.selectNewLine({
                    sublistId: 'line'
                });
                objRecord.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    value: accountDebitJe
                })
                objRecord.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'debit',
                    value: sumAmount
                })
                objRecord.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'memo',
                    value: sourseFile
                })
                objRecord.commitLine({
                    sublistId: 'line'
                })

                objRecord.selectNewLine({
                    sublistId: 'line'
                });

                objRecord.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    value: creditAccJE
                })
                objRecord.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'credit',//credit
                    value: sumAmount
                })
                objRecord.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'memo',
                    value: sourseFile
                })

                objRecord.commitLine({
                    sublistId: 'line'
                })
                var recJe = objRecord.save();
                log.debug("recJe", recJe);
                if (recJe) {
                    for (i = 0; i < data.length; i++) {
                        var key = data[i].internalId
                        context.write(key, recJe);
                    }

                }

            } catch (error) {
                log.debug("error", error)
            }

        }
        /**
         * Executes when the reduce entry point is triggered and applies to each group.
         *
         * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
         * @since 2015.1
         */
        function reduce(context) {
            try {
                var vendorPaymentId = context.key;
                log.debug("vendorPaymentId", vendorPaymentId);
                var JecRec = JSON.parse(context.values);
                log.debug("JecRec", JecRec);
                var invId = record.submitFields({
                    type: 'vendorpayment',
                    id: vendorPaymentId,
                    values: {
                        'custbody_eft_summarised_jnl': JecRec
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });

            } catch (error) {
                log.debug("error", error)
            }

        }
        /**
         * Executes when the summarize entry point is triggered and applies to the result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
         * @since 2015.1
         */
        function summarize(summary) {

        }
        function getVendorPayment() {
            var ret = [];
            try {
                var vendorpaymentSearchObj = search.load({
                    id: 'customsearch_eft_walker_payment_summary',
                })
                if (vendorpaymentSearchObj) {
                    var cols = vendorpaymentSearchObj.columns;
                    var ssResult = getAllResults(vendorpaymentSearchObj);
                    for (var i = 0; i < ssResult.length; i++) {
                        var internalId = ssResult[i].getValue(cols[0]);
                        var transactionNumber = ssResult[i].getValue(cols[1]);
                        var amount = ssResult[i].getValue(cols[3]);
                        var fileSoure = ssResult[i].getValue(cols[4]);
                        var transDate = ssResult[i].getValue(cols[5]);
                        ret.push({
                            internalId: internalId,
                            transactionNumber: transactionNumber,
                            amount: amount,
                            fileSoure: fileSoure,
                            transDate: transDate
                        })
                    }
                }
                var groupBySourceFile = groupBy(ret, function (item) {
                    return [item.fileSoure];
                });
                var data = [];
                for (var i = 0; i < groupBySourceFile.length; i++) {
                    var item = groupBySourceFile[i];
                    log.debug("item", item);
                    data.push({
                        sourseFile: item[0].fileSoure,
                        data: item
                    })
                }
                return data


            } catch (e) {
                log.error('- System error', e.code + '\n' + e.message);
                log.error('- Global error', e + '\nStack: ' + e.stack);
            }


        }
        function groupBy(array, f) {
            var groups = {};
            array.forEach(function (o) {
                var group = JSON.stringify(f(o));
                groups[group] = groups[group] || [];
                groups[group].push(o);
            });
            return Object.keys(groups).map(function (group) {
                return groups[group];
            })
        }

        function getAllResults(search) {
            var results = [];
            var pgSize = 1000;
            var r = search.runPaged({ pageSize: pgSize });
            var numPage = r.pageRanges.length;
            var searchPage;
            var ssResult;
            for (var np = 0; np < numPage; np++) {
                searchPage = r.fetch({ index: np });
                ssResult = searchPage.data;
                if (ssResult != undefined && ssResult != null && ssResult != '') {
                    results = results.concat(ssResult);
                }
            }
            return results;

        }
        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };

    });