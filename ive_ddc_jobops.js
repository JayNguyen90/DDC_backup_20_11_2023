/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/https', 'N/http', 'N/log', 'N/runtime', "N/encode"], function (https, http, log, runtime, encode) {

    function beforeSubmit(context) {
        var url = '';
        var accountId = runtime.accountId;
        var environment = runtime.envType;      

        switch(accountId) {
          case '5281669':
            url = 'https://mq.ivegroup.com.au/mq/ddcerp/netsuite/jobops'
            break;

          case '5281669_SB2':
            url = 'https://uatmq.ivegroup.com.au/mq/ddcerp/netsuite/jobops'
            break;

          default:
            url = 'https://devmq.ivegroup.com.au/mq/ddcerp/netsuite/jobops'
            break;
        }

        log.debug({ title: 'context.newRecord.type', details: context.newRecord.type });
        log.debug({ title: 'context.type', details: context.type });
        log.debug({ title: 'runtime.accountid', details: accountId });
        log.debug({ title: 'url', details: url });

/*
        log.debug({ title: 'context.oldRecord.opsInstructions', details: context.oldRecord ? context.oldRecord.getText('custbody_ddc_ops_job_instructions_code') : 'null' });
        log.debug({ title: 'context.newRecord.opsInstructions', details: context.newRecord ? context.newRecord.getText('custbody_ddc_ops_job_instructions_code') : 'null' });
*/
        var jobops = context.newRecord ? context.newRecord.getText('custbody_ddc_ops_job_instructions_code') : '';
        var opsInstructionsChanged = (context.oldRecord ? context.oldRecord.getText('custbody_ddc_ops_job_instructions_code') : '') !== (context.newRecord ? context.newRecord.getText('custbody_ddc_ops_job_instructions_code') : '');
        log.debug({ title: 'opsInstructionsChanged', details: opsInstructionsChanged });
      
        log.debug({ title: 'Job Ops', details: opsInstructionsChanged ? 'CREATED' : 'IGNORED' });

        if (opsInstructionsChanged) {
           var auth = encode.convert({
             string:'mq_quadient:pUfwDr<36', 
             inputEncoding: encode.Encoding.UTF_8,
             outputEncoding: encode.Encoding.BASE_64
            });

            var headers = ({
                'content-type': 'application/json',
                'accept': 'application/json',
/*				'authorization': 'Basic ' + auth */
            });
    
            var body = {
              'JobID': context.newRecord.id,
              'JobOpsInstructions': jobops
            }
    
            log.debug({ title: 'headers', details: headers });
            log.debug({ title: 'body', details: body });
    
            var jsonBody = JSON.stringify(body);

            var response = https.post({
                url: url,
                body: jsonBody,
                headers: headers
            });

            log.debug({
                title: 'Response',
                details: JSON.stringify(response)
            });

            if (context.newRecord.getValue('custbody_ddc_job_ops_ins_link') === "") {
              var responseBody = JSON.parse(response.body);
              context.newRecord.setValue('custbody_ddc_job_ops_ins_link', responseBody.jobOpsFileURL);
              log.debug({ title: 'Job Ops File URL', details: responseBody.jobOpsFileURL });
            }
        }
    }

    return {
        beforeSubmit: beforeSubmit
    }
});
