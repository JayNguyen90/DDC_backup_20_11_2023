/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/record", 'N/search', 'N/task','N/error','N/redirect'], function (record, search, task,error,redirect) {

    function onRequest(context) {
        log.debug("start", "start");
        var recid = context.request.parameters.recid;
        var type = context.request.parameters.type;
        log.debug("recid", recid);
        
        var jobVariation = record.copy({
            type: 'salesorder',
            id:  recid,
            isDynamic: true,
        });
        var parentJob=record.load({
            type: 'salesorder',
            id: recid,
            isDynamic: true,
        })
        var countJobVariations=parseInt(parentJob.getValue('custbody_ddc_linked_variations_count'))||0
        var jobNo=parentJob.getValue('custbody_ddc_job_no_without_prefix');
        log.debug("jobNo0",jobNo);
        var tranid=parentJob.getValue('tranid');
        countJobVariations+=1;
        log.debug("countJobVariations",countJobVariations)
        //parentJob.setValue('custbody_ddc_linked_variations_count',countJobVariations);
        //parentJob.setValue('custbody_ddc_linked_parent_job',jobVariationRec);
        // record.submitFields({
        //     type: record.Type.SALES_ORDER,
        //     id:recid,
        //     values: {
        //         'custbody_ddc_linked_variations_count': countJobVariations,
        //     }
        // })
        //var recParentJob=parentJob.save();
        //log.debug("recParentJob",recParentJob)
        jobVariation.setValue('tranid', tranid+' var '+countJobVariations);
        jobVariation.setValue('custbody_ddc_job_no_without_prefix', jobNo);
        jobVariation.setValue('custbody_ddc_job_status', 1);
        jobVariation.setValue('custbody_ddc_linked_variations_count','');
        jobVariation.setValue('custbody_ddc_linked_parent_job',recid);
        jobVariation.setValue('custbody_ddc_production_approvalstatus','');
        jobVariation.setValue('custbody_ddc_next_pick_date','');

        jobVariation.setValue('custbody_ddc_job_project_id','');
        jobVariation.setValue('custbody_ddc_projid_projname','');
        jobVariation.setValue('job','');

        jobVariation.setValue('custbody_ddc_run_schedule_dates','');
        jobVariation.setValue('custbody_ddc_job_ops_ins_link','');
        jobVariation.setValue('custbody_ddc_ops_job_instructions_code','');
        jobVariation.setValue('custbody_ddc_postage_lodgement_account',false);
        jobVariation.setValue('custbody_ddc_postage_mgt_fee_inclusive',false);
        jobVariation.setValue('custbody_ddc_postage_mgt_fee_rate','');
        jobVariation.setValue('custbody_ddc_latest_variation_no','');
        jobVariation.setValue('custbody_ddc_variation_quote_expiry','');
        jobVariation.setValue('custbody_ddc_variation_quote_no','');
        jobVariation.setValue('custbody_ddc_runs_created',false);
        jobVariation.setValue('custbody_ddc_campaign_end_date_changed',false);
        //Quote Financials
        jobVariation.setValue('custbody_ddc_q_outwork_ext_total','');
        jobVariation.setValue('custbody_ddc_q_outwork_ext_total_cost','');
        jobVariation.setValue('custbody_ddc_q_outwork_ext_margin','');

        jobVariation.setValue('custbody_ddc_q_outwork_digital_total','');
        jobVariation.setValue('custbody_ddc_q_outwork_digi_total_cost','');
        jobVariation.setValue('custbody_ddc_q_outwork_digital_margin','');

        jobVariation.setValue('custbody_ddc_q_outwork_group_total','');
        jobVariation.setValue('custbody_ddc_q_outwork_grp_total_cost','');
        jobVariation.setValue('custbody_ddc_q_outwork_group_margin','');

        jobVariation.setValue('custbody_ddc_q_processing_total','');
        jobVariation.setValue('custbody_ddc_q_processing_total_cost','');
        jobVariation.setValue('custbody_ddc_q_processing_margin','');

        jobVariation.setValue('custbody_ddc_q_postage_total','');
        jobVariation.setValue('custbody_ddc_q_postage_total_cost','');
        jobVariation.setValue('custbody_ddc_q_postage_margin','');

        jobVariation.setValue('custbody_ddc_quote_total','');
        jobVariation.setValue('custbody_ddc_quote_direct_cost_total','');
        jobVariation.setValue('custbody_ddc_quote_total_margin','');
        jobVariation.setValue('custbody_ddc_quote_oh_cost_total','');
        jobVariation.setValue('custbody_ddc_quote_total_cost','');
        var jobVariationRec=jobVariation.save();
        var jobVariationCloneRec=record.load({
            type: 'salesorder',
            id: jobVariationRec,
            isDynamic: true,
        })
        var lineCount = jobVariationCloneRec.getLineCount({
            sublistId: 'item'
        })

        for (var i =lineCount-1; i>=0 ;i--) {
            jobVariationCloneRec.selectLine({
                sublistId: 'item',
                line: i
            });
            var configData = jobVariationCloneRec.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_scpq_item_col_config_data',
                line: i
            })

            if(!configData){
                jobVariationCloneRec.removeLine({
                    sublistId: 'item',
                    line: i
                });
            }

           

        }
        var recId=jobVariationCloneRec.save();
        log.debug("recId jobVariationCloneRec",recId)
        log.debug("jobVariationRec",jobVariationRec)
        if(jobVariationRec){
      
            redirect.toRecord({
                id: jobVariationRec,
                type: 'salesorder',
            })
            log.debug("finish", "finish");
        }
      
        
    }

    return {
        onRequest: onRequest
    }
})