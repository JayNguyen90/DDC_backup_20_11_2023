/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 *@NModuleScope Public
 */
define([
    'N/record',
    'N/search',
    'N/ui/serverWidget',
    './ddc_jcs_util.js'
    ],
    function (
    _nRecord,
    _nSearch,
    _nUI,
    util
    )
    {
        function beforeLoad(context) {
            try{
            }catch (ex){
                log.debug({
                    title: 'beforeLoad ex',
                    details: ex
                });
            }
        }

        function afterSubmit(context) {
            try{
                log.debug({title: 'context', details: context.type });
                if (context.type != 'edit' ) return;

                var rec = context.newRecord;
                
                var createdfrom = rec.getValue({fieldId: 'createdfrom'});
                if (util.isEmpty(createdfrom)) return true;

                var lineCnt = rec.getLineCount('item');
                var obj = {};
                for (var l=0; l<lineCnt; l++){
                    var item = rec.getSublistValue({ sublistId: 'item', fieldId: 'item', line:l});
                    var quantity = rec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line:l});
                    var soLineKey = rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_solinekey', line:l});
                    obj[soLineKey] = quantity;
                }
                log.debug({title: 'obj', details: JSON.stringify(obj) });

                updateSO(createdfrom,obj);
            }catch (ex){
                log.debug({
                    title: 'afterSubmit ex',
                    details: ex
                });
            }
        }


        /**
         * 
         * @param {object} param sales order values
         */
        function updateSO(soid,soLines){
            try{
                var soRec = _nRecord.load({type: 'salesorder', id: soid });
                var lineCnt = soRec.getLineCount({
                    sublistId: 'item'
                });
        
                for (var l=0; l<lineCnt; l++){
                    soRec.selectLine({
                        sublistId: 'item',
                        line: l
                    });
        
                    var soUniqueKey = soRec.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'lineuniquekey'
                    });
        
                    if (soLines[soUniqueKey]===undefined) continue;
        
                    soRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        value: parseFloat(soLines[soUniqueKey]),
                        ignoreFieldChange: true
                    });
                    
                    soRec.commitLine({
                        sublistId: 'item'
                    });
        
                    break;
                }
        
                soRec.save();
                log.debug({
                    title: 'So Updated',
                    details: param.soid 
                });
                
            }catch(ex){
                console.log('updateSO exception: '+ex);
            }
            }
     
        var ReturnObj = {};
        ReturnObj.beforeLoad = beforeLoad;
        ReturnObj.afterSubmit = afterSubmit;
        
        return ReturnObj;
    });
    