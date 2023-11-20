/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 *@NModuleScope Public
 */
define([
    'N/record',
    'N/search',
    'N/task',
    './ddc_jcs_util.js'
    ],
    function (
    _nRecord,
    _nSearch,
    _nTask,
    util
    )
    {
        var ReturnObj = {};
        const PROJECTTYPE = 'job';
        const ESTIMATETYPE = 'estimate';
        const JOBFIELDS = ['custentity_project_task_created','custentity_created_from_quote'];
        function afterSubmit(context) {
            try{
                log.debug({title: 'context', details: context.type });
                var rec = context.newRecord;

                if (rec.type == PROJECTTYPE && context.type == 'create') {
                    setCreatedFrom(rec);
                }

                if (rec.type == ESTIMATETYPE && context.type == 'edit'){
                    var quoteId = rec.id;
                    var projid =rec.getValue({fieldId: 'job'});
                    log.debug({title: 'projid', details:projid });
                    if (util.isEmpty(projid)) return;
                    var jobVals = util.lookupFields('JOB',projid,JOBFIELDS);
                    var createdFrom = jobVals.custentity_created_from_quote[0].value;
                    log.debug({title: 'createdFrom', details:createdFrom });
                    if (quoteId!=createdFrom) return;

                    var taskCreated = jobVals.custentity_project_task_created;

                    log.debug({title: 'taskCreated', details:taskCreated });
                    if (util.isEmpty(taskCreated)) startProjectTaskProcess(rec);             
                    
                }

            }catch (ex){
                log.debug({
                    title: 'afterSubmit ex',
                    details: ex
                });
            }
        }

        function startProjectTaskProcess(rec){
        try{

            log.debug({
                title: 'startProjectTaskProcess ',
                details: 'rec.id: '+rec.id
            });
            log.debug({title: 'startProjectTaskProcess',details: 'Call script mapreduce'});	
						var mrTask = _nTask.create({taskType: _nTask.TaskType.MAP_REDUCE});
						mrTask.scriptId = 'customscript_quote_to_proj_mr'; //name: Quote to Project Task MR
						mrTask.deploymentId = 'customdeploy_quote_to_proj_mr';
						mrTask.params = {'custscript_quote_to_proj_recid': rec.id}; //defined in the MR script
						var mrTaskId = mrTask.submit();
        }catch (ex){
            log.debug({
                title: 'startProjectTaskProcess ex',
                details: ex
            });
        }
        }

        function setCreatedFrom(rec){
        try{
            var whence =rec.getValue({fieldId: 'whence'});
            if (util.isEmpty(whence)) return;
            if (whence.search('estimate.nl')==-1) return;
            var n1 = whence.search("id=");
            var n2 = whence.search("&");
            var quoteId = whence.substring(n1+3,n2)
            if (util.isEmpty(quoteId)) return;
            _nRecord.submitFields({
                type: PROJECTTYPE,
                id: rec.id,
                values: {
                    'custentity_created_from_quote': quoteId
                }
            });


            log.debug({
                title: 'setCreatedFrom SUCCESS',
                details: 'quoteId: '+quoteId
            });

        }catch (ex){
            log.debug({
                title: 'afterSubmit ex',
                details: ex
            });
        }
        }
     
        ReturnObj.afterSubmit = afterSubmit;
        return ReturnObj;
    });
   