function setUniqKey(event) {

    var recId = nlapiGetRecordId();
    var soRecord = nlapiLoadRecord('estimate', recId);

    var lines = lineItems = soRecord.getLineItemCount('item');
    for (var i = 1; i <= lines; i++) {
        
        item_id = soRecord.getLineItemValue('item', 'id', i);
        item_key = soRecord.getLineItemValue('item', 'custcol_ddc_item_key_scpq', i);

        if(!item_key)
            soRecord.setLineItemValue('item', 'custcol_ddc_item_key_scpq', i, item_id);

    }

    nlapiSubmitRecord(soRecord, true);

}