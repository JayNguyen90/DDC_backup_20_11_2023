/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/https', 'N/http', 'N/log', 'N/runtime'], function (https, http, log, runtime) {

    function afterSubmit(context) {
        var url = '';
        var action = '';
        var accountId = runtime.accountId;
        var environment = runtime.envType;      

        switch(accountId) {
          case '5281669':
            url = 'https://mq.ivegroup.com.au/mq/finance/trigger/mq'
            break;

          case '5281669_SB2':
            url = 'https://uatmq.ivegroup.com.au/mq/finance/trigger/mq'
            break;

          default:
            url = 'https://devmq.ivegroup.com.au/mq/finance/trigger/mq'
            break;
        }
      
        switch (context.type) {
          case context.UserEventType.CREATE:
            action = 'Add';
            break;
            
          case context.UserEventType.EDIT:
          case context.UserEventType.XEDIT:
            action = 'Edit';
            break;
        }

        log.debug({ title: 'context.newRecord.type', details: context.newRecord.type });
        log.debug({ title: 'context.type', details: context.type });
        log.debug({ title: 'runtime.accountid', details: accountId });
        log.debug({ title: 'action', details: action });
        log.debug({ title: 'url', details: url });

        log.debug({ title: 'finance trigger', details: action != '' ? 'SENT' : 'IGNORED' });
        if (action !== '') {
            var headers = ({
                'content-type': 'application/json',
                'accept': 'application/json'
            });
    
            var body = {
                'Company': 'IVE Group',
                'DataObject': context.newRecord.type,
                'Action': action,
                'ID': context.newRecord.id,
                'User': runtime.getCurrentUser().email
            };
    
            log.debug({ title: 'headers', details: headers });
            log.debug({ title: 'body', details: body });
    
            var jsonBody = JSON.stringify(body);
           	
          	var response1 = https.post({
                url: url,
                body: jsonBody,
                headers: headers
            });

            log.debug({ title: 'trigger response', details: JSON.stringify(response1) });
        }
    }

    return {
        afterSubmit: afterSubmit
    }
});
