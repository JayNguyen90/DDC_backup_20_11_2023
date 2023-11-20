/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 *@NModuleScope Public
 */
define([
	'N/ui/serverWidget',
    'N/record',
    'N/search',
    './ddc_jcs_util.js'
    ],
    function (
    _nUI,
    _nRecord,
    _nSearch,
    util
    )
    {
        var ReturnObj = {};
        function afterSubmit(context) {
            try{
                log.debug({title: 'context', details: context.type });
                if (context.type != 'create') return;

                var rec = context.newRecord;
                _nRecord.submitFields({
                    type: rec.type,
                    id: rec.id,
                    values: {
                        'custrecord_crc_doc_number' : 'CR'+rec.id.toString()
                    }
                });
                return;
            }catch (ex){
                log.debug({
                    title: 'afterSubmit ex',
                    details: ex
                });
            }
        }

        function beforeLoad(context) {
            try{
                log.debug({title: 'context', details: context.type });

                if (context.type == 'create' || context.type == 'copy') {
                    var rec = context.newRecord;
                    rec.setValue({
                        fieldId: 'custrecord_crc_doc_number',
                        value: '',
                        ignoreFieldChange: true
                    });
                    
                }

            }catch (ex){
                log.debug({
                    title: 'beforeLoad ex',
                    details: ex
                });
            }
        }
     
        ReturnObj.afterSubmit = afterSubmit;
        ReturnObj.beforeLoad = beforeLoad;
        
        return ReturnObj;
    });
    