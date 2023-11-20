/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/format', 'N/record', 'N/search', 'N/runtime', 'N/https', 'N/http', 'N/file', 'N/runtime', 'N/email', 'N/url', 'N/workflow'],
    /**
     * @param {record} record
     * @param {search} search
     */
    function (format, record, search, runtime, https, http, file, runtime, email, url, workflow) {

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
            var scriptObj = runtime.getCurrentScript();
            var internalIdRun = scriptObj.getParameter({ name: 'custscript_internalid_close_run' });
            log.debug("internalIdRun", internalIdRun);
            var runRec = record.load({ type: "customrecord_ddc_run", id: internalIdRun, isDynamic: false });
            runRec.setValue('custrecord_ddc_run_status',7);
            var reasonCancel=runRec.getValue('custrecord_ddc_run_status_reason');
            var runRecId=runRec.save();
            log.debug("update status Cancel",runRecId);
            var runDetail = getRunDetail(internalIdRun,reasonCancel);
            log.debug("run Detail", runDetail);
            return runDetail
        }

        /**
         * Executes when the map entry point is triggered and applies to each key/value pair.
         *
         * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
         * @since 2015.1
         */
        function map(context) {
            var valueS = JSON.parse(context.value);
            var internalidRun = valueS.internalid;
            log.debug("internalidRun", internalidRun);
            var reasonCancel=valueS.reasonCancel;
            log.debug("reasonCancel", reasonCancel);
            try {
                var rec = record.load({ type: "customrecord_ddc_run_detail", id: internalidRun, isDynamic: false });
                rec.setValue('custrecord_ddc_rd_status',8);
                rec.setValue('custrecord_ddc_rd_actual_qty_completed', "");
                rec.setValue('custrecord_ddc_rd_baseline_qty',0);
                rec.setValue('custrecord_ddc_rd_status_reason',reasonCancel);
                var recID = rec.save();
                log.debug("Run Detail Cancel", recID);

            } catch (error) {
                log.debug("error", error);
            }


        }

        /**
         * Executes when the reduce entry point is triggered and applies to each group.
         *
         * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
         * @since 2015.1
         */
        function reduce(context) {


        }

        /**
         * Executes when the summarize entry point is triggered and applies to the result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
         * @since 2015.1
         */
        function summarize(context) {
            var deploymentId = runtime.getCurrentScript().deploymentId
            log.debug("deploymentId",deploymentId)
            deleteDeployments(deploymentId);
        }
        function deleteDeployments(deploymentId) {
            log.debug("start delete","start delete");
            search.create({
                type: search.Type.SCRIPT_DEPLOYMENT,
                filters: [['script.scriptid', 'is', 'customscript_jcs_close_run_mr']]
            }).run().each(function (result) {
                try {
                    record.delete({
                        type: record.Type.SCRIPT_DEPLOYMENT,
                        id: result.id
                    })

                } catch (error) {
                    log.debug("keep running deloy","keep running deloy ");
                }
                return true;
            });
            log.debug("finish delete","finish delete");
        }
        function getRunDetail(internalIdRun,reasonCancel) {
            var waJcurce = 'mr_clone_run:getRunDetail';
            var runDetailArr = [];
            try {
                log.debug(waJcurce, '->START');
                var rundDetailSearch = search.create({
                    type: "customrecord_ddc_run_detail",
                    filters:
                        [
                            ["custrecord_ddc_rd_parent_run", "anyof", internalIdRun]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "name",
                                sort: search.Sort.ASC,
                                label: "ID"
                            }),
                        ]
                });
                if (rundDetailSearch) {
                    var cols = rundDetailSearch.columns;
                    var ssResult = getAllResults(rundDetailSearch);
                    for (var i = 0; i < ssResult.length; i++) {
                        var internalid = ssResult[i].id;
                        runDetailArr.push({
                            internalid:internalid,
                            reasonCancel:reasonCancel
                        })
                    }
                }
                else {
                    log.debug(waJcurce, ' Return Null, Search issue');
                    return [];
                }
                log.debug(waJcurce, '<-END');

            } catch (e) {
                log.error(waJcurce + '- System error', e.code + '\n' + e.message);
                log.error(waJcurce + '- Global error', e + '\nStack: ' + e.stack);
            }
            return runDetailArr;



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