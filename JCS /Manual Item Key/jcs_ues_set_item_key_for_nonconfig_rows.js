function afterSubmit(type) {

    nlapiLogExecution("DEBUG", "START: DDC - Set Item Key for Non Configurator Rows");

        var recId = nlapiGetRecordId();
        var tranType = nlapiGetRecordType();
        if (recId && tranType) {
            var tranRec = nlapiLoadRecord(tranType, recId);

            var itemCount = tranRec.getLineItemCount('item');

            var subsidiary = tranRec.getFieldValue('subsidiary');
            nlapiLogExecution("DEBUG", "subsidiary", subsidiary);
            if (subsidiary != 2){
              return true;
            }
            for (var i = 1; i <= itemCount; i++) {
                var itemKey = tranRec.getLineItemValue('item','custcol_scpq_item_col_config_data', i)
                var lineUniqueKey = tranRec.getLineItemValue('item','lineuniquekey', i)
                nlapiLogExecution("DEBUG", "itemKey: ", itemKey + ', lineUniqueKey:' + lineUniqueKey);
                if (!itemKey) {            

                    var manualItemKey = recId + '_' + lineUniqueKey;

                    nlapiLogExecution("DEBUG", "Adding a manualItemKey", 'Line #: ' + i + '; Manual Item Key: ' + manualItemKey);
                    
                    tranRec.setLineItemValue('item', 'custcol_ddc_item_key_scpq', i, manualItemKey);
                }
            }
            nlapiLogExecution("DEBUG", "END: DDC - Set Item Key for Non Configurator Rows");

            nlapiSubmitRecord(tranRec,false,true);
        }


    return true;
}