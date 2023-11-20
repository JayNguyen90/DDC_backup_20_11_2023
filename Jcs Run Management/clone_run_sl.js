/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/record", 'N/search', 'N/task','N/error'], function (record, search, task,error) {
    var objScheduleScript = {
        SCRIPT_ID:'customscript_jcs_clone_run_mr',
        DEPLOYMENT_PREFIX: 'clone_run_',
        AUTOMATED_RECORD_ID: 'custscript_mr_internalid_run'
    };
    function onRequest(context) {
        log.debug("start", "start");
        var result = {};
        var recid = context.request.parameters.recid;
        var type = context.request.parameters.type;
        log.debug("recid", recid);
        try {
            var taskSumbit = scheduleScript(recid);
            if (taskSumbit) {
                result = { status: true }
            }
        }
        catch (e) {
            result = { status: false }
        }
        log.debug("result", result)
        context.response.setHeader({
            name: 'Content-Type',
            value: 'application/json; charset=utf-8'
        });
        context.response.write({
            output: JSON.stringify(result)
        });
        log.debug("finish", "finish");
    }

    function scheduleScript(recordId) {
        var ssTask = task.create({ taskType: task.TaskType.MAP_REDUCE });
        try {
            log.debug('Invoking on adhoc schedule deployment');
            ssTask.scriptId = objScheduleScript.SCRIPT_ID;
            ssTask.deploymentId = createScriptDeployment(recordId);
            ssTask.params = {};
            ssTask.params[objScheduleScript.AUTOMATED_RECORD_ID] = recordId;
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

        //var deploymentId = '_clone_run_' +recordId+"_"+new Date().getTime();
        var date=new Date()
        var deploymentId = '_clone_run_' +recordId+"_"+(date.getTime()).toString().slice(-5);
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
    return {
        onRequest: onRequest
    }
})