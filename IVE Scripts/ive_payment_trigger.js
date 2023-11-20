/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */
define(['N/https', 'N/http', 'N/log', 'N/runtime'], function (https, http, log, runtime) {
	
	function getWeekNumber() {
		var currentDate = new Date();
		var firstDay = new Date(currentDate.getFullYear(), 0, 1).getDay();
		var firstWeek = new Date(currentDate.getFullYear(), 0, (2  - firstDay));

		var days = Math.floor((currentDate - firstWeek)/(1000 * 60 * 60 * 24));

		return Math.ceil(days / 7);
	}
	

    function executePayment(invocationType) {

		var ID = "";

        log.debug({ title: 'Invocation Type', details: invocationType });

		// Only run if Scheduled or through the UI
		if ((invocationType.type !== "scheduled") && (invocationType.type !== "userinterface")) {
	        log.debug({ title: 'Stop', details: 'Incorrect Invocation type' });
          	return;
		}

        // if UI then pick up the ID from the script parameters
        if (invocationType.type === "userinterface")
        {
			ID = runtime.getCurrentScript().getParameter("custscript_batchid");
        } else {
			ID = "W" + getWeekNumber();
        }

        log.debug({ title: 'ID', details: ID });

        var headers = ({
            'content-type': 'application/json',
            'accept': 'application/json'
        });

        var body = {
            'Company': 'ive',
            'DataObject': 'payment',
            'Action': '0',
            'ID': ID,
            'User': runtime.getCurrentUser().email
        };

        log.debug({ title: 'headers', details: headers });
        log.debug({ title: 'body', details: body });

        var jsonBody = JSON.stringify(body);

        var response1 = https.post({
            url: 'https://uatmq.ivegroup.com.au/mq/finance/trigger/mq',
            body: jsonBody,
            headers: headers
        });

        log.debug({
            title: 'Response - Payment',
            details: JSON.stringify(response1)
        });
    }
	
	return { 
        execute: executePayment 
    }
});
