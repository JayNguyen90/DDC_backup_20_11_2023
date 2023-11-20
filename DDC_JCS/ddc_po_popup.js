/**
* @NApiVersion 2.x
* @NScriptType ClientScript
*/

define([
    'N/ui/message',
    'N/ui/dialog',
    'N/currentRecord',
    'N/record',
    'N/search',
    './ddc_jcs_util.js'],
    function(
    _nMessage,
    _nDialog,
    _nCurrentRecord,
    _nRecord,
    _nSearch,
    util
    ) {
    
        function validateLine(context){
            var currentRecord = context.currentRecord;
            var sublistName = context.sublistId;
            if (sublistName === 'item'){
    
                var item = currentRecord.getCurrentSublistValue({
                    sublistId: sublistName,
                    fieldId: 'item'
                });

                var lineuniquekey = currentRecord.getCurrentSublistValue({
                    sublistId: sublistName,
                    fieldId: 'lineuniquekey'
                });

                if (util.isEmpty(lineuniquekey)) return true;
    
                var poQty = currentRecord.getCurrentSublistValue({
                    sublistId: sublistName,
                    fieldId: 'quantity'
                });
    
                var poid = currentRecord.id;
                var soObj = getSO(poid,item);
                if (util.isEmpty(soObj)) return true;
                poQty = parseFloat(poQty);
                var returnVal = false;
                var tickThis = false;
                var soLineKey = null;
                if (poQty != soObj.qty){
                    //alert here
                    var action = confirm('Items on this line have been dropshipped or special ordered.\n'+
                                        'Are you sure you want to modify it?');
                    if (action){
                        //collect SO details for saving later
                        //collectSODetails(soObj,currentRecord,poQty);
                        returnVal = true;
                    }else{
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistName,
                            fieldId: 'quantity',
                            value: poQty,
                            ignoreFieldChange: true
                        });
                        returnVal =  false;
                    }
                }else{
                    returnVal =  true;
                }

                /*
                currentRecord.setCurrentSublistValue({
                    sublistId: sublistName,
                    fieldId: 'custcol_solinekey',
                    value: soLineKey,
                    ignoreFieldChange: true
                });
                */

                return returnVal;
            }
        }
    
        function getSO(poid,item){
        try{
            var filters = [];
            filters.push(_nSearch.createFilter({name: 'purchaseorder', operator: _nSearch.Operator.ANYOF, values: poid }));
            filters.push(_nSearch.createFilter({name: 'item', operator: _nSearch.Operator.ANYOF, values: item }));
            var res = util.LoadSearch('customsearch_j_special_orders', 'salesorder', filters) //searchid, recordtype, filters
            if (util.isEmpty(res)) return null;
            var soObj = {};
            soObj.qty = parseFloat(res[0].getValue('quantity'));
            soObj.lineuniquekey = res[0].getValue('lineuniquekey');
            soObj.soid = res[0].id;
            return soObj;
                
        }catch(ex){
            console.log('getSO exception: '+ex);
        }
        }
    
        /**
         * 
         * @param {*} soObj sales order details
         */
        function collectSODetails(soObj,currentRecord,poQty){
        try{
            var soFld = currentRecord.getValue('custbody_so_obj_on_po');
            if (util.isEmpty(soFld))
                soFld = {};
            else
                soFld = JSON.parse(soFld);
    
            if (soFld[soObj.soid]===undefined)
                soFld[soObj.soid] = {};
            
            if (soFld[soObj.soid][soObj.lineuniquekey]===undefined)
                soFld[soObj.soid][soObj.lineuniquekey] = {};
            
                soFld[soObj.soid][soObj.lineuniquekey].qty = poQty;
    
            currentRecord.setValue({fieldId: 'custbody_so_obj_on_po', value: JSON.stringify(soFld) });
    
        
        }catch(ex){
            console.log('collectSODetails exception: '+ex);
        }
        }
    
        function validateInsert(context){
        }
    
        function validateDelete(context) {
        }
    
        
        function pageInit(context) {
            
        }
    
        
        function fieldChanged(context){
        }
        function success2(res){
        }
    
        function failure (res){
    
        }
        
        function saveRecord(context){
        try{
            
        }catch(ex){
            console.log('saveRecord exception: '+ex);
        }
        }
        
        
        
        function lineInit(context) {
           
        }
        return {
            validateLine : validateLine
        };
    });