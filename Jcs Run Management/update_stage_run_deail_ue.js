/**
 *
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search'],
    function (record, runtime, search) {



        /**
         *  Function definition to be triggered after record is submitted.
         *
         * @param {Object} scriptContextS
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type
         * @param {Form} scriptContext.form - Current form
         * @Since 2015.2
         */
        function afterSubmit(context) {
            try {
                if (context.type == 'delete') {
                    return;
                }
                var newRecord = context.newRecord;
                var oldRecord = context.oldRecord;
                var transactionId = newRecord.id;
                log.debug("transactionId", transactionId);
                // var rec = record.load({
                //     type: "customrecord_ddc_run_detail",
                //     id: transactionId,

                // })
                var parentRun = newRecord.getValue({ fieldId: 'custrecord_ddc_rd_parent_run' });
                log.debug("parentRun", parentRun);
                if (!parentRun) {
                    return;
                }
                var streamNumberRec = newRecord.getValue({ fieldId: 'custrecord_ddc_rd_stream_number' });
                var statusRunNew = newRecord.getValue({ fieldId: 'custrecord_ddc_rd_status' });
                log.debug("statusRunNew", statusRunNew);
                var statusRunOld = oldRecord.getValue({ fieldId: 'custrecord_ddc_rd_status' });
                log.debug("statusRunOld", statusRunOld);
                if (statusRunNew == statusRunOld) {
                    log.debug("nothing todo", 'nothing todo')
                    return;
                }
                log.debug("parentRun", parentRun);
                //Completed  5
                //Cancelled 8
                var runDetailArr = getRunDetail(parentRun);
                log.debug("runDetailArr", runDetailArr);
                runDetailArr = runDetailArr.filter(x => x.streamNumber == streamNumberRec)
                log.debug("runDetailArr dkm", runDetailArr);
                runDetailArr1 = runDetailArr.filter(x => x.statusRunDetail !== "Completed" && x.statusRunDetail !== "Cancelled")
                runDetailArr2 = runDetailArr.filter(x => x.statusRunDetail == "Completed" ||x.statusRunDetail == "Cancelled")
                log.debug("runDetailArr2", runDetailArr2);
                runDetailArr2=runDetailArr2.filter(x=>x.internalId!=transactionId);
                log.debug("runDetailArr2", runDetailArr2);
                runDetailArr1 = runDetailArr1.sort((a, b) => {
                    return a.scheduleSequence - b.scheduleSequence;
                });
                log.debug("item sort ", runDetailArr1);
                if (runDetailArr1.length > 0) {
                    var itemCategory = runDetailArr1[0].itemCategory;
                    log.debug("iitemCategory ", itemCategory);
                    var statusRunDetail = runDetailArr1[0].statusRunDetail;
                    log.debug("statusRunDetail ", statusRunDetail);
                    record.submitFields({
                        type: 'customrecord_ddc_run_detail',
                        id: transactionId,
                        values: {
                            'custrecord_ddc_rd_stage': itemCategory,
                            "custrecord_ddc_rd_next_pending_rd_status": statusRunDetail
                        }

                    })
                    for (var i = 0; i < runDetailArr1.length; i++) {
                        record.submitFields({
                            type: 'customrecord_ddc_run_detail',
                            id: runDetailArr1[i].internalId,
                            values: {
                                'custrecord_ddc_rd_stage': itemCategory,
                                "custrecord_ddc_rd_next_pending_rd_status": statusRunDetail
                            }

                        })
                    }
                    for (var j= 0; j < runDetailArr2.length; j++) {
                        record.submitFields({
                            type: 'customrecord_ddc_run_detail',
                            id: runDetailArr2[j].internalId,
                            values: {
                                'custrecord_ddc_rd_stage': itemCategory,
                                "custrecord_ddc_rd_next_pending_rd_status": statusRunDetail
                            }

                        })
                    }
                }
                else{
                    for (var j= 0; j < runDetailArr.length; j++) {
                        record.submitFields({
                            type: 'customrecord_ddc_run_detail',
                            id: runDetailArr[j].internalId,
                            values: {
                                'custrecord_ddc_rd_stage': "",
                                "custrecord_ddc_rd_next_pending_rd_status": ""
                            }

                        })
                    }
                }






            } catch (error) {
                log.debug("error", error)
            }

        };
        function getRunDetail(runParent) {
            var ret = [];
            var runDetailSearch = search.create({
                type: "customrecord_ddc_run_detail",
                filters:
                    [
                        ["custrecord_ddc_rd_parent_run", "anyof", runParent]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" }),
                        search.createColumn({ name: "custrecord_ddc_rd_sched_seq", label: "Schedule Sequence" }),
                        search.createColumn({ name: "custrecord_ddc_rd_stream_number", label: "Stream Number" }),
                        search.createColumn({ name: "custrecord_ddc_rd_item_category", label: "Item Category" }),
                        search.createColumn({ name: "custrecord_ddc_rd_status", label: "Run Detail Status" })
                    ]
            });
            var searchResultCount = runDetailSearch.runPaged().count;
            log.debug("customrecord_ddc_run_detailSearchObj result count", searchResultCount);
            if (runDetailSearch) {
                var ssResult = getAllResults(runDetailSearch);
                for (var i = 0; i < ssResult.length; i++) {
                    var internalId = ssResult[i].id;
                    var scheduleSequence = parseInt(ssResult[i].getValue('custrecord_ddc_rd_sched_seq'));
                    var streamNumber = parseInt(ssResult[i].getValue('custrecord_ddc_rd_stream_number'));
                    var itemCategory = parseInt(ssResult[i].getValue('custrecord_ddc_rd_item_category'));
                    var statusRunDetail = (ssResult[i].getText('custrecord_ddc_rd_status'));
                    ret.push({
                        internalId: internalId,
                        scheduleSequence: scheduleSequence,
                        streamNumber: streamNumber,
                        itemCategory: itemCategory,
                        statusRunDetail: statusRunDetail

                    });
                }
            }
            else {
                log.debug(waJcurce, ' Return Null, Search issue');
                return [];
            }
            return ret;
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
        return { afterSubmit: afterSubmit };
    });
1