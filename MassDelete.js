/**
 *  NetSuite will loop through each record in your search 
 *  and pass the record type and id for deletion
 *  Try / Catch is useful if you wish to handle potential errors
 */

function MassDelete(record_type, record_id)
{
    try
    {
        nlapiDeleteRecord(record_type, record_id)
    }
    catch (err)
    {
        var errMessage = err;
        if(err instanceof nlobjError)
        {
            errMessage = errMessage + ' ' + err.getDetails() + ' ' + 'Failed to Delete ID : ' + record_id;
        }
        nlapiLogExecution('ERROR', 'Error', errMessage);
        return err
    }
}