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
            var data = scriptObj.getParameter({ name: 'custscript_jcs_run_detail_internalid' });
            log.debug("data",data);
            data=JSON.parse(data);
            return data
        }

        /**
         * Executes when the map entry point is triggered and applies to each key/value pair.
         *
         * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
         * @since 2015.1
         */
        function map(context) {
            var valueS = JSON.parse(context.value);
            log.debug("valueS",valueS);
            try {
                var internalIdRd = valueS.internalID;
                log.debug("internalIdRd", internalIdRd);
                var site=valueS.site;
                log.debug("site", site);
                //custrecord_ddc_rd_site
                var siteRd = record.submitFields({
                    type: 'customrecord_ddc_run_detail',
                    id: internalIdRd,
                    values: {
                        custrecord_ddc_rd_site: site,
                      
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields : true
                    }
                });
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
                filters: [['script.scriptid', 'is', 'customscript_jcs_set_site_run_detail_mr']]
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
    
        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };

    });