/**
 * 
 * @name:                                       convert_to_po_ue.js

 * @author:                                     Patrick Lising

 * @summary:                                    The script is used to add a button to convert the RFQ Response to a Purchase Order.

 * @copyright:                                  © Copyright by Jcurve Solutions

 * Date Created:                                09/14/2022

 * Change Log:

 *  09/14/2022 -- Patrick Lising -- Initial version

 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */



define(['N/runtime'], function (runtime) {

    function jcs_beforeLoad(context) {
        var currentUser = runtime.getCurrentUser();
        var subsidiary = currentUser.subsidiary
        if (subsidiary == '2') {
            var currForm = context.form;

            //define call_suitelet_cs.js

            currForm.clientScriptFileId = '12649'

            currForm.addButton({
                id: 'custpage_convert_to_po',
                label: "Convert to PO",
                functionName: "callSuitelet()"
            })
        }
    }


    return {
        beforeLoad: jcs_beforeLoad
    }
});
