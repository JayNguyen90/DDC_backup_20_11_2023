/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
/*
* @name:                                       AddPrintButton_UE.js
* @author:                                     Kamlesh Patel
* @summary:                                    Script Description
* @copyright:                                  © Copyright by Jcurve Solutions
* Date Created:                                Mon May 26 2023 12:33:42
* Change Logs:
* Date                          Author               Description
* Mon May 26 2023 12:33:42 -- Kamlesh Patel -- Initial Creation
*/

define(['N/url'],
/**
* @param{url} url
*/
(url) => {
    /**
    * Defines the function definition that is executed before record is loaded.
    * @param {Object} scriptContext
    * @param {Record} scriptContext.newRecord - New record
    * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
    * @param {Form} scriptContext.form - Current form
    * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
    * @since 2015.2
    */
    const beforeLoad = (scriptContext) => {
        if(scriptContext.type == 'view'){
            var formObj = scriptContext.form;
            var RecObj = scriptContext.newRecord;
            if(RecObj.type == 'ITEM_RECEIPT'){
                try {
                    var internalId = RecObj.id;
                    var button = formObj.addButton({
                        id : 'custpage_irlabelprint',
                        label : 'Print Stock Labels',
                        functionName : "IR_PrintButton_Click('"+internalId+"');"
                    });
                }catch (exception) {
                    nlapiLogExecution('DEBUG', 'Error', exception);
                }
            }else if(RecObj.type == 'BIN_TRANSFER'){
                try {
                    var internalId = RecObj.id;
                    var button = formObj.addButton({
                        id : 'custpage_btlableprint',
                        label : 'Print Bin Transfer Request',
                        functionName : "BT_PrintButton_Click('"+internalId+"');"
                    });
                }catch (exception) {
                    nlapiLogExecution('DEBUG', 'Error', exception);
                }
            }
            formObj.clientScriptModulePath = 'SuiteScripts/CustomLabelPrint/HandlePrintButton_CS.js';
            
        }
    }
    
    return {beforeLoad}
    
});
