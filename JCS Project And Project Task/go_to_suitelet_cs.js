/**
 * @name:                                       go_to_suitelet_cs.js
 * @author:                                     Patrick Lising
 * @summary:                                    Script Description
 * @copyright:                                  © Copyright by Jcurve Solutions
 * Date Created:                                Thu Sep 22 2022 9:27:42 AM
 * Change Logs:
 * Date                          Author               Description
 * Thu Sep 22 2022 9:27:42 AM -- Patrick Lising -- Initial Creation
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */

define(['N/url','N/https'], function(url, https) {

    function pageInit(context){

    }

    function goToSuitelet(recId){

        console.log(recId)

        var suiteletUrl = url.resolveScript({
            scriptId: 'customscript_jcs_create_prelim_proj_sl',
            deploymentId: 'customdeploy_jcs_create_prelim_proj_sl'
        });

        console.log(suiteletUrl)

        var callSuiteletUrl = https.get({
            url: suiteletUrl+"&recId="+recId
        });

        console.log('Called Suitelet result: '+ callSuiteletUrl)
        
        window.location.reload()
    }

    return {
        pageInit:pageInit,
        goToSuitelet: goToSuitelet
    }
});

