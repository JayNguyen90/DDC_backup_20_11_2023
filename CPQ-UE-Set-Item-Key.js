function cpqSetItemKeyAfterSubmit(type) {
  return true;
    nlapiLogExecution("DEBUG", "Update Transaction", 'Type: ' + type);
    if (type == 'create') {

        var tranId = nlapiGetRecordId();
        var tranType = nlapiGetRecordType();
        if (tranId && tranType) {
            var tranRec = nlapiLoadRecord(tranType, tranId);
            if (!tranRec) {
                nlapiLogExecution("DEBUG", "Update Transaction", 'Transaction Record not loaded');
                return true;
            }

            nlapiLogExecution("DEBUG", "Update Transaction", 'Transaction ID: ' + tranId + '; Transaction Type: ' + tranType);

            var itemCount = tranRec.getLineItemCount('item');
            for (var i = 0; i < itemCount; i++) {
                var itemLine = i + 1;
                // var itemId = tranId + '_' + itemLine;
                var itemId = tranRec.getLineItemValue('item', 'id', itemLine);
                nlapiLogExecution("DEBUG", "Update Transaction", 'Item Line: ' + itemLine + '; Item ID: ' + itemId);
                tranRec.setLineItemValue('item', 'custcol_ddc_item_key_scpq', itemLine, itemId);
            }
            nlapiLogExecution("DEBUG", "Update Transaction", 'Item IDs Updated');

            nlapiSubmitRecord(tranRec,false,true);
        }

    }

    return true;
}