/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/format', 'N/record', 'N/search', 'N/runtime'],
    /**
     * @param {record} record
     * @param {search} search
     */
    function (format, record, search, runtime) {

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
            //var ret=[];
            var ssid = "customsearch_jcs_ddc_deployment_search";
            var arrValue = [];
            var pgSize = 1000;
            var s = search.load(ssid);
            var r = s.runPaged({ pageSize: pgSize });
            var numPage = r.pageRanges.length;
            var searchPage, tempData, numTemp;
            for (var np = 0; np < numPage; np++) {
                searchPage = r.fetch({ index: np });
                tempData = searchPage.data;
                if (hasValue(tempData)) {
                    numTemp = tempData.length;
                    for (var i = 0; i < numTemp; i++) {
                        var transactionId = tempData[i].id;
                        arrValue.push({
                            transactionId: transactionId,
                        });
                    }
                }
            }
            log.debug('Line Total: ', arrValue.length);
            //ret.push(arrValue[2]);
            return arrValue;
        }

        /**
         * Executes when the map entry point is triggered and applies to each key/value pair.
         *
         * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
         * @since 2015.1
         */
        function map(context) {
            var valueS = JSON.parse(context.value);
            var transactionId = valueS.transactionId;
            log.debug("scriptdeployment ID ", transactionId);

            try {

                var scriptDeployment = record.load({
                    type: "scriptdeployment",
                    id: transactionId,
                    isDynamic: true,

                });
                scriptDeployment.setValue({
                     fieldId: 'status',
                     value: 'RELEASED'
                });
                //Testing

                //scriptDeployment.setValue({
                //    fieldId: 'status',
                //    value: 'TESTING'
                //});
                //scriptDeployment.setValue({
                //   fieldId: 'audsubsidiary',
                //    value: []
                //}); 
                scriptDeployment.setValue({
                     fieldId: 'audsubsidiary',
                     value: '2'
                });
                var recId = scriptDeployment.save();
                log.debug("recid", recId)

            } catch (error) {
                log.error('ERROR POD ID: ' + transactionId, error.message);
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
        function summarize(summary) {

        }
    
        function hasValue(value) {
            var isContain = false;
            if (value != undefined && value != null && value != '') {
                isContain = true;
            }
            return isContain;
        }
        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };

    });