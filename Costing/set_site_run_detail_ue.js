/**
 *
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search','N/task'],
    function (record, runtime, search,task) {

        var objScheduleScript = {
            SCRIPT_ID:'customscript_jcs_set_site_run_detail_mr',
            DEPLOYMENT_PREFIX: '_site_rd_',
            AUTOMATED_RECORD_ID: 'custscript_jcs_run_detail_internalid'
        };

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
                if(context.type=="edit"){
                    var newRecord = context.newRecord;
                    var transactionId = newRecord.id;
                    log.debug("transactionId", transactionId);
                    var site=parseInt(newRecord.getValue('custrecord_ddc_run_site'));
                    if(!site){
                        return;
                    }
                    var runDetailArr=getRunDetail(transactionId,site);
                    log.debug("runDetailArr",runDetailArr);
                    if(runDetailArr.length>0){
                        var taskSumbit = scheduleScript(transactionId,runDetailArr);
                    }
                }
               
            
            } catch (e) {
                log.debug("e",e)
            }
        };
        
    function scheduleScript(transactionId,runDetailArr) {
        var ssTask = task.create({ taskType: task.TaskType.MAP_REDUCE });
        try {
            log.debug('Invoking on adhoc schedule deployment');
            ssTask.scriptId = objScheduleScript.SCRIPT_ID;
            ssTask.deploymentId = createScriptDeployment(transactionId);
            ssTask.params = {};
            ssTask.params[objScheduleScript.AUTOMATED_RECORD_ID] = runDetailArr;
            var submitTask = ssTask.submit();
            log.debug("submitTask", submitTask);
            log.debug('Invoked schedule script with deployment id ' + ssTask.deploymentId);
            return submitTask;

        }
        catch (e) {
            log.debug(e);
            return null;
        }
    }
    function createScriptDeployment(recordId) {
        var scriptId = getScriptId();
        log.debug("scriptId",scriptId)
        var scriptDeployment = record.create({
            type: record.Type.SCRIPT_DEPLOYMENT,
            isDynamic: true,
            defaultValues: { script: scriptId }
        });
        scriptDeployment.setValue({
            fieldId: 'title',
            value: objScheduleScript.DEPLOYMENT_PREFIX + recordId
        });

        var deploymentId = '_site_rd' +recordId+"_"+new Date().getTime();
        log.debug("deploymentId",deploymentId)
        scriptDeployment.setValue({
            fieldId: 'scriptid',
            value: deploymentId
        });

        scriptDeployment.setValue({
            fieldId: 'status',
            value: 'NOTSCHEDULED'
        });

        var recId = scriptDeployment.save();
        log.debug("recId deloy",recId)
        return "customdeploy"+deploymentId
    }
    function getScriptId() {
        var result = search.create({type: "mapreducescript",
            filters: ['scriptid', search.Operator.IS, objScheduleScript.SCRIPT_ID]}).run().getRange(0,1);
        log.debug("result",result);
        if( result.length) {
            return parseInt(result[0].id);
        }
        else {
            throw error.create({
                name: 'Schedule Script Missing',
                message: 'Schedule Script for Rebate Net Cost does not exist.',
                notifyOff: true});
        }
    }
        function getRunDetail(rundid,site){
            var ret=[];
            var runDetailSearch = search.create({
                type: "customrecord_ddc_run_detail",
                filters:
                [
                   ["custrecord_ddc_rd_parent_run","anyof",rundid.toString()]
                ],
                columns:
                [
                   search.createColumn({name: "custrecord_ddc_rd_item", label: "Item"}),
                   search.createColumn({name: "custrecord_ddc_rd_actual_qty_completed", label: "Actual Qty Completed"}),
                   search.createColumn({name: "custrecord_ddc_rd_status", label: "Run Detail Status"}),
                   search.createColumn({name: "custrecord_ddc_rd_lineid", label: "Line ID"}),
                   search.createColumn({name: "custrecord_ddc_rd_actual_machine_hr", label: "Actual Machine Hours"}),
                   search.createColumn({name: "custrecord_ddc_rd_actual_labour_hr", label: "Actual Labour Hours"}),
                   search.createColumn({name: "custrecord_ddc_rd_actual_calc_cost", label: "Actual Calculated Cost"})
                ]
             });
             var searchResultCount = runDetailSearch.runPaged().count;
             log.debug("customrecord_ddc_run_detailSearchObj result count",searchResultCount);
             if (runDetailSearch) {
                var ssResult = getAllResults(runDetailSearch);
                for (var i = 0; i < ssResult.length; i++) {
                    var internalID = parseInt(ssResult[i].id);
                    ret.push({
                        internalID:internalID,
                        site:site
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