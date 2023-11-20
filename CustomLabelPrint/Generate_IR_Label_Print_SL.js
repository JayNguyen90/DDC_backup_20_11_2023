/**
* @NApiVersion 2.1
* @NScriptType Suitelet
*/
/*
 * @name:                                       Generate_IR_Label_Print_SL.js
 * @author:                                     Kamlesh Patel
 * @summary:                                    Script Description
 * @copyright:                                  © Copyright by Jcurve Solutions
 * Date Created:                                Thu June 01 2023 09:21:37
 * Change Logs:
 * Date                          Author               Description
 * Thu June 01 2023 09:21:37 -- Kamlesh Patel -- Initial Creation
 */

define(['N/record', 'N/search', 'N/runtime', 'N/render'],
/**
* @param{record} record
* @param{search} search
*/
(record, search, runtime, render) => {
    /**
    * Defines the Suitelet script trigger point.
    * @param {Object} scriptContext
    * @param {ServerRequest} scriptContext.request - Incoming request
    * @param {ServerResponse} scriptContext.response - Suitelet response
    * @since 2015.2
    */
    const onRequest = (scriptContext) => {
        var loggedUser = runtime.getCurrentUser();
        var request = scriptContext.request;
        var method = scriptContext.method;
        var dataJSON = JSON.parse(request.parameters.dataJson || '[]');
        var OpType = request.parameters.type || 'generate';
        log.debug('method', method);
        log.debug('dataJSON', dataJSON);  
        log.debug('OpType', OpType);  
        
        if (/*method == 'POST'*/true) {
            if(dataJSON.length > 0){//data ready to print
                var myFile = render.create();
                //create temp rec to pass to pdf render
                var recObj = record.create({
                    type: 'itemreceipt',
                    isDynamic: true
                });
                recObj.setValue({
                    fieldId: 'custpage_data',
                    value: JSON.stringify(dataJSON)
                });
                myFile.addRecord('record', recObj);
                myFile.setTemplateByScriptId("CUSTTMPL_JCS_IR_CUST_LBL_PRINT_TMPL");
                
                var Pdf = myFile.renderAsPdf();
                /*var Pdf = myFile.renderPdfToResponse({
                    response: scriptContext.response 
                });*/
                
                
                
                scriptContext.response.addHeader({
                    name : 'Content-Type',
                    value : 'application/pdf'
                });
                if(OpType == 'download'){
                    scriptContext.response.addHeader({
                        name : 'Content-Disposition',
                        value : 'attachment; filename=CustomLabels.pdf'
                    });
                }else{
                    scriptContext.response.addHeader({
                        name : 'Content-Disposition',
                        value : 'inline; filename=CustomLabels.pdf'
                    });
                }
                
                scriptContext.response.writeFile(Pdf);
            }else{//no data received to print, display error message
                
            }
        }
    }
    
    return {onRequest}
    
});
