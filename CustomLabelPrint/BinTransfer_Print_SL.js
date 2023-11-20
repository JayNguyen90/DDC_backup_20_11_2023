/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
/*
 * @name:                                       BinTransfer_Print_SL.js
 * @author:                                     Kamlesh Patel
 * @summary:                                    Script Description
 * @copyright:                                  © Copyright by Jcurve Solutions
 * Date Created:                                Thu June 01 2023 09:21:37
 * Change Logs:
 * Date                          Author               Description
 * Thu June 01 2023 09:21:37 -- Kamlesh Patel -- Initial Creation
 */

define(['N/record', 'N/runtime', 'N/render'],
    /**
 * @param{record} record
 */
    (record, runtime, render) => {
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
		    var method = request.method;
            var recId = request.parameters.recId || '';
            if (method == 'GET') {
                if(recId != ''){//data ready to print
                    var myFile = render.create();
                    //create temp rec to pass to pdf render
                    var recObj = record.load({
                        type: 'bintransfer',
                        id: recId,
                        isDynamic: true
                    });

                    myFile.addRecord('record', recObj);
                    myFile.setTemplateByScriptId("CUSTTMPL_JCS_BIN_TRNSF_TMLP");
                    
                    var Pdf = myFile.renderAsPdf();
		
                    scriptContext.response.addHeader({
                        name : 'Content-Type',
                        value : 'application/pdf'
                    });
                    scriptContext.response.addHeader({
                        name : 'Content-Disposition',
                        value : 'inline; filename="bin transfer.pdf"'
                    });
                    scriptContext.response.writeFile(Pdf);
                }else{//no data received to print, display error message

                }
            }
        }

        return {onRequest}

    });
