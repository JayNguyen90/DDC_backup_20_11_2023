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
            var currentRecord = context.currentRecord;
            var custOwned = currentRecord.getValue({fieldId: 'custitem_ddc_is_cust_owned'});//custitem_ive_item_customer_owned
            if (!custOwned) return true;
            var custid = currentRecord.getValue({fieldId: 'custitem_ddc_owned_by_cust'});//custitem_ive_item_intended_customer
            if (!util.isEmpty(custid)) return true;
            //var msg = 'You have marked this item as Customer Owned but did not select Intended Customer. Proceed to Item Details subtab to correct.';
            var msg='You have marked this item as Customer Owned but did not select the intended Customer. Edit and update the "Owned by Customer" field to correct it.'
            alert(msg); return false;


        }catch(ex){
            console.log('saveRecord exception: '+ex);
        }
        }
        
        
        
        function lineInit(context) {
           
        }
        return {
            saveRecord : saveRecord
        };
    });