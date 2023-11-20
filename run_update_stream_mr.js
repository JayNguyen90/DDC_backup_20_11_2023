/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define(['N/record', 'N/runtime', 'N/search', 'N/xml', 'N/task', './run_creation_cm', './lib/moment.min', './lib/ns.utils'],
    /**
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 * @param{task} task
 * 
 * - Summary > consolidate run objects > filterout > reexecute
 */
    (record, runtime, search, xml, task, cm, moment, ns_utils) => {
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
            var scriptParam = scriptParams()
            log.debug("scriptParam", scriptParam)
            var runDetailData = scriptParam.rundetail
            log.debug("runDetailData", runDetailData)
            runDetailData = JSON.parse(runDetailData)
            return runDetailData
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
        // Create runs
        const map = (mapContext) => {
            log.debug("mapContext", mapContext);
            try {
                var rundetail = JSON.parse(mapContext.value)
                var jobId = rundetail.jobId;
                var streamName = rundetail.streamName;
                var runInternalId = rundetail.runInternalId;
                var startDate = rundetail.startDate;
                var endDate = rundetail.endDate;
                var runDetailStatus = rundetail.runDetailStatus;
                var productioApprovalStatus = rundetail.productioApprovalStatus;
                var runDetailUpdateArr = getDataRunDetail(runInternalId, streamName, jobId)
                for (var i = 0; i < runDetailUpdateArr.length; i++) {
                    mapContext.write({
                        key: runDetailUpdateArr[i].internalIdRunDetail,
                        value: {
                            startDate: startDate,
                            endDate: endDate,
                            runDetailStatus: runDetailStatus,
                            productioApprovalStatus: productioApprovalStatus
                        }
                    });
                }
                log.debug("runDetailUpdateArr", runDetailUpdateArr)
            } catch (e) {
                log.debug("e", e)
            }
        }
        function getDataRunDetail(runInternalId, streamName, jobId) {
            var ret = [];
            var runDetailSearch = search.create({
                type: "customrecord_ddc_run_detail",
                filters:
                    [
                        ["custrecord_ddc_rd_parent_run.internalid", "anyof", runInternalId],
                        "AND",
                        ["custrecord_ddc_rd_stream_name", "is", streamName],
                        "AND",
                        ["custrecord_ddc_rd_parent_run.custrecord_ddc_run_job", "anyof", jobId]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "custrecord_ddc_run_id",
                            join: "CUSTRECORD_DDC_RD_PARENT_RUN",
                            label: "DDC Run ID"
                        }),
                        search.createColumn({ name: "custrecord_ddc_rd_stream_name", label: "Stream Name" }),
                        search.createColumn({ name: "custrecord_ddc_rd_stream_number", label: "Stream Number" }),
                        search.createColumn({ name: "custrecord_ddc_rd_planned_startdate", label: "Planned Start Date" }),
                        search.createColumn({ name: "custrecord_ddc_rd_planned_enddate", label: "Planned End Date" }),
                        search.createColumn({ name: "custrecord_ddc_rd_status", label: "Run Detail Status" }),
                        search.createColumn({ name: "custrecord_ddc_rd_prod_approval_status", label: "Run Detail Production Approval Status" })
                    ]
            });
            var searchResultCount = runDetailSearch.runPaged().count;
            var cols = runDetailSearch.columns;
            log.debug("customrecord_ddc_run_detailSearchObj result count", searchResultCount);
            if (runDetailSearch) {
                var ssResult = getAllResults(runDetailSearch);
                for (var i = 0; i < ssResult.length; i++) {
                    var internalIdRunDetail = ssResult[i].id
                    var rundId = ssResult[i].getValue(cols[0]);
                    var streamName = ssResult[i].getValue('custrecord_ddc_rd_stream_name');
                    var streamNumber = ssResult[i].getValue('custrecord_ddc_rd_stream_number');
                    var startDate = ssResult[i].getValue('custrecord_ddc_rd_planned_startdate');
                    var endDate = ssResult[i].getValue('custrecord_ddc_rd_planned_enddate');
                    var runDetailStatus = ssResult[i].getValue('custrecord_ddc_rd_status');
                    var runDetailStatusText = ssResult[i].getText('custrecord_ddc_rd_status');
                    var productionApprovalStatus = ssResult[i].getValue('custrecord_ddc_rd_prod_approval_status');
                    var productionApprovalStatusText = ssResult[i].getText('custrecord_ddc_rd_prod_approval_status');
                    ret.push({
                        internalIdRunDetail: internalIdRunDetail,
                        rundId: rundId,
                        streamName: streamName,
                        streamNumber: streamNumber,
                        startDate: startDate,
                        endDate: endDate,
                        runDetailStatus: runDetailStatus,
                        runDetailStatusText: runDetailStatusText,
                        productionApprovalStatus: productionApprovalStatus,
                        productionApprovalStatusText: productionApprovalStatusText
                    })
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
        // Create run details
        const reduce = (reduceContext) => {
            try {
                log.debug("reduceContext",reduceContext)
                var internalIdRunDetail = reduceContext.key
                log.debug("internalIdRunDetail", internalIdRunDetail);
                log.debug("context.values", reduceContext.values);
                var values = JSON.parse(reduceContext.values);
                log.debug("values", reduceContext.values);

                var startDate = values.startDate;
                log.debug("startDate",startDate);
                var endDate = values.endDate;
                log.debug("endTime",endDate);
                var runDetailStatus = values.runDetailStatus;
                log.debug("runDetailStatus",runDetailStatus);
                var productioApprovalStatus = values.productioApprovalStatus;
                log.debug("productioApprovalStatus",productioApprovalStatus);
                var objectUpdate={};
                objectUpdate.startDate=startDate;
                objectUpdate.endDate=endDate;
                objectUpdate.runDetailStatus=runDetailStatus;
                objectUpdate.productioApprovalStatus=productioApprovalStatus;
                cm.parseDateValueFields(objectUpdate)
                log.debug("objectUpdate",objectUpdate)
                var rec = record.load(
                    {
                        type: 'customrecord_ddc_run_detail',
                        id: internalIdRunDetail,
                        isDynamic: true
                    });
                if(startDate){
                    rec.setValue('custrecord_ddc_rd_planned_startdate',objectUpdate.startDate)
                }
                if(endDate){
                    rec.setValue('custrecord_ddc_rd_planned_enddate',objectUpdate.endDate)
                }
                if(runDetailStatus){
                    rec.setValue('custrecord_ddc_rd_status',objectUpdate.runDetailStatus)
                }
                if(productioApprovalStatus){
                    rec.setValue('custrecord_ddc_rd_prod_approval_status',objectUpdate.productioApprovalStatus)
                }
                var recId=rec.save();
                log.debug("recid run detail update ",recId)
            }
            catch (e) {
                log.debug("e", e)
            }
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

        }

        const scriptParams = () => {
            let script = runtime.getCurrentScript()
            return {
                rundetail: script.getParameter({ name: 'custscript_jcs_data_run_detail_process' }),

            }
        }



        return { getInputData, map, reduce, summarize }

    });
