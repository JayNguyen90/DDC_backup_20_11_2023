/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/email', 'N/log', 'N/record', 'N/runtime', 'N/search', 'N/format'],
    /**
     * @param {currentRecord} currentRecord
     * @param {email} email
     * @param {log} log
     * @param {record} record
     * @param {runtime} runtime
     * @param {search} search
     */
    function (currentRecord, email, log, record, runtime, search, format) {

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type
         * @param {Form} scriptContext.form - Current form
         * @Since 2015.2
         */
        function beforeLoad(scriptContext) {
            log.debug("beforeLoad", 'beforeLoad');
            var tgType = scriptContext.type;
            var form = scriptContext.form;
            var readyForInvoiceStatus=3;
            var invoiceStatus=5;
            var paymentCompleteStatus=6;
            var cancelStatus=8;
            var currentRec = scriptContext.newRecord;
            var recId=currentRec.id
            log.debug("recId",recId)
            var jobParent = currentRec.getValue({
                fieldId: "custbody_ddc_linked_parent_job"
            })
            var subsidiary = currentRec.getValue({
                fieldId: "subsidiary"
            })
            var statusJob=currentRec.getValue({
                fieldId: "status"
            })
            log.debug("statusJob",statusJob);
            if(subsidiary!=2){
                return;
            }
            if(!jobParent&&tgType == 'view'&&(statusJob=='Pending Billing'||statusJob=='Pending Fulfillment'||statusJob=='Partially Fulfilled'||statusJob=='Closed'||statusJob=='Pending Billing/Partially Fulfilled'
            )){
                form.addButton({
                    id: "custpage_create_variation_job",
                    label: 'Create Variation Job',
                    functionName: 'createVariationJob(' + recId + ')'
                });
                form.clientScriptModulePath = "SuiteScripts/Jcs Run Management/create_runs_streams_cl.js";
            }
            var jobStatus = currentRec.getValue({
                fieldId: "custbody_ddc_job_status"
            })
            log.debug("jobStatus",jobStatus);
            var isCreateRuns=currentRec.getValue({
                fieldId: "custbody_ddc_runs_created"
            })
            log.debug("isCreateRuns",isCreateRuns);
          
            if(jobStatus==readyForInvoiceStatus||jobStatus==invoiceStatus||jobStatus==paymentCompleteStatus||jobStatus==cancelStatus){
                log.debug("runs status ",jobStatus);
                return;
            }
            if(!isCreateRuns){
                if(tgType == 'view'){
                    form.addButton({
                        id: "custpage_create_run_stream",
                        label: 'Create Runs/Streams',
                        functionName: "popupButton_OnClick"
                    });
                    form.clientScriptModulePath = "SuiteScripts/Jcs Run Management/create_runs_streams_cl.js";
                }
            }
            else{
                if(tgType == 'view'){
                    form.addButton({
                        id: "custpage_create_run_stream",
                        label: 'Update Runs/Streams',
                        functionName: "popupButton_OnClick_Update"
                    });
                    form.clientScriptModulePath = "SuiteScripts/Jcs Run Management/create_runs_streams_cl.js";
                }
            }
            
        }

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function beforeSubmit(scriptContext) {
            log.debug("beforeSubmit", beforeSubmit);
        }

  
        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit,

        };

    });
