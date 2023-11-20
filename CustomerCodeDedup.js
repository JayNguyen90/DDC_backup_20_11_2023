/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/search','N/ui/dialog','N/currentRecord'],
function(record, search, dialog,currentRecord) {
    function validateField(context) {
    	var currentRecord = context.currentRecord;
    	if (context.fieldId === 'custentity_entity_code') { 
     	var custCode = (currentRecord.getValue({
    		fieldId: 'custentity_entity_code'    		
    	}) || '').trim();

		if (!isEmpty(custCode)) {
			if (custCode !== (currentRecord.getValue({ fieldId: 'custentity_entity_code' }) || '')) {
				currentRecord.setValue({ fieldId: 'custentity_entity_code', value: custCode, ignoreFieldChange: true });
			}
				if (HasDupe(null, custCode)) {
				var options = {
					title: 'Warning',
					message: custCode +' is already in use. Please use another code.'
				}
				dialog.alert(options);
				return true;
			}
		}
		
     	var custCodeLength = custCode.length;
               	  	 if (custCodeLength >8) {          	  		 
               	  	 var options = {
                         title: 'Customer Code is too long',
                         message: 'CUSTOMER CODE must be eight (8) characters long or less'
               		    };
               		function success(result) { console.log('Success with value: ' + result) }
               		function failure(reason) { console.log('Failure: ' + reason) }	 
               		dialog.create(options).then(success).catch(failure);
               	 
               		}
              }
    	return true;
	}
	
	function saveRecord(context){
	try{
		var rec = currentRecord.get();
     	var custCode = rec.getValue({
    		fieldId: 'custentity_entity_code'    		
		});

		if (isEmpty(custCode) || custCode.trim().length > 8 ){
			var options = {
				title: 'Warning',
				message: 'CUSTOMER CODE must be eight (8) characters long or less.'
			}
			dialog.alert(options);
			return false;
		}

		if (!HasDupe(rec.id,custCode)) return true;

		var options = {
			title: 'Warning',
			message: custCode +' is already in use. Please use another code.'
		}
		dialog.alert(options);
		return false;
	
	}catch(ex){
		console.log('saveRecord ex: '+ex);
	}
	}

	function HasDupe(recid,custCode){
	try{
		var filters = [];
		if (isEmpty(recid)) 
		var filters = [];
		
		var filters = [];
		filters.push(search.createFilter({name: 'custentity_entity_code', operator: search.Operator.IS, values: custCode.trim() }));
		if (!isEmpty(recid)) 
			filters.push(search.createFilter({name: 'custentity_entity_code', operator: search.Operator.NONEOF, values: recid }));

		var customerSearchObj = search.create({
			type: "customer",
			filters: filters
		 });
		 var searchResultCount = customerSearchObj.runPaged().count;
		 log.debug("customerSearchObj result count",searchResultCount);
		 console.log('searchResultCount: '+searchResultCount);
		 return (searchResultCount > 0 ? true : false);

	}catch(ex){
		console.log('HasDupe ex: '+ex);
	}
	}
	
	function isEmpty(val) {
		if (val==null || val== 'null' ||val==undefined||val=='' ||val==' ' ||val==0 ||val=='undefined' ||val==='undefined' ||val===undefined) {
			return true;
		}
		return false;
	}

	   return {
		   validateField: validateField,
		   saveRecord : saveRecord
	   };
});