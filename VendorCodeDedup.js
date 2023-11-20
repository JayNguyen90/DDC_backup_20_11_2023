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
     	var venCode = currentRecord.getValue({
    		fieldId: 'custentity_entity_code'    		
    	});
     	var venCodeLength = venCode.length;
               	  	 if (venCodeLength >6) {          	  		 
               	  	 var options = {
                         title: 'Vendor code is too long',
                         message: 'Vendor code has to be maximum 6 digits long. Please check and re-enter vendor code for this vendor'
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
     	var venCode = rec.getValue({
    		fieldId: 'custentity_entity_code'    		
		});

		if (isEmpty(venCode) || venCode.trim().length > 6 ){
			var options = {
				title: 'Warning',
				message: 'Vendor code must be six (6) characters long.'
			}
			dialog.alert(options);
			return false;
		}

		if (!HasDupe(rec.id,venCode)) return true;

		var options = {
			title: 'Warning',
			message: 'Vendor code ' + venCode +' is already in use. Please use another code.'
		}
		dialog.alert(options);
		return false;
	
	}catch(ex){
		console.log('saveRecord ex: '+ex);
	}
	}

	function HasDupe(recid,venCode){
	try{
		var filters = [];
		if (isEmpty(recid)) 
		var filters = [];
		
		var filters = [];
		filters.push(search.createFilter({name: 'custentity_entity_code', operator: search.Operator.IS, values: venCode.trim() }));
		if (!isEmpty(recid)) 
			filters.push(search.createFilter({name: 'custentity_entity_code', operator: search.Operator.NONEOF, values: recid }));

		var vendorSearchObj = search.create({
			type: "vendor",
			filters: filters
		 });
		 var searchResultCount = vendorSearchObj.runPaged().count;
		 log.debug("vendorSearchObj result count",searchResultCount);
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
