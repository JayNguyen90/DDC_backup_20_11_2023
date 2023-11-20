/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 *@NModuleScope Public
 */
define([
    'N/record',
    'N/search',
    'N/task',
    'N/runtime',
    './ddc_jcs_util.js',
    './ive_intercompany_po_util.js'
    ],
    function (
    _nRecord,
    _nSearch,
    _nTask,
    _nRuntime,
    util,
    icutil
    )
    {
        var ReturnObj = {};
        const LINECOUNT = 4;

        function afterSubmit(context) {
            try{
                log.debug({title: 'context.type', details: context.type });
                if (context.type !='create' && context.type !='edit') return; //do nothing
                //var thisrec = context.newRecord;
                log.debug('id', context.newRecord.id)
                var thisrec = _nRecord.load({
                    type: 'invoice',
                    id: context.newRecord.id,
                    isDynamic: true,
                });
                var poID = thisrec.getValue({fieldId: 'custbody_ive_interco_po'});
                var tranid=thisrec.getValue('tranid');
                log.debug('tranid dkm',tranid)
                if (util.isEmpty(poID)) return true; //do nothing

                var poVals = _nSearch.lookupFields({
                    type:  'purchaseorder',
                    id : poID,
                    columns : 'total'
                });

                log.debug({title: 'poVals', details: poVals.total });
                var invTotal = thisrec.getValue({fieldId: 'total'});
                log.debug({
                    title: 'equal?',
                    details: parseFloat(invTotal) +' ? '+parseFloat(poVals.total)
                });
                if (parseFloat(invTotal) != parseFloat(poVals.total)) return true; //do nothing

                var vbID = CreateVB(poID,thisrec.id,tranid);
                if (util.isEmpty(vbID)) return true; //do nothing

                var invSubs = thisrec.getValue({fieldId: 'subsidiary'});
                var invCust = thisrec.getValue({fieldId: 'entity'});
                var params={};
                params.invID = thisrec.id;
                params.vbID = vbID;
                params.invTotal = invTotal;
                params.invSubs = invSubs;
                params.invCust = invCust;
                //params.tranid = tranid;

                var jeID = CreateJE(params);

                if (util.isEmpty(jeID))
                    return;
                
                //update vb
                _nRecord.submitFields({
                    type: 'vendorbill',
                    id: vbID,
                    values: {
                        'custbody_paired_je' : jeID
                    }
                });
                
                log.debug({
                    title: 'afterSubmit',
                    details: '--- end ---'
                });
                
            }catch (ex){
                log.debug({
                    title: 'afterSubmit ex',
                    details: ex
                });
            }
        }

        function CreateVB(poID,invID,tranid){

        try{
            log.debug("tranid",tranid)
            var vendBill = _nRecord.transform({
                fromType: _nRecord.Type.PURCHASE_ORDER,
                fromId: poID,
                toType: _nRecord.Type.VENDOR_BILL,
                isDynamic: true,
            });
            vendBill.setValue({
                fieldId: 'custbody_ive_intercompany_invoice',
                value: invID,
                ignoreFieldChange: true
            });
            vendBill.setValue({
                fieldId: 'tranid',
                value: tranid,
                ignoreFieldChange: true
            });

            var vbID = vendBill.save();
            log.debug({
                title: 'vbID',
                details: vbID
            });
            return vbID;
        }catch (ex){
            log.debug({
                title: 'CreateVB ex',
                details: ex
            });
            return null;
        }
        }

        function CreateJE(params){
        try{
            var vbID = params.vbID;
            var vbVals = _nSearch.lookupFields({
                type:  _nRecord.Type.VENDOR_BILL,
                id : vbID,
                columns : ['subsidiary','entity']
            });
            var objRecord = _nRecord.create({
                type: 'advintercompanyjournalentry',
                isDynamic: true
            });
            objRecord.setValue('custbody_paired_vendor_invoice',vbID);
            objRecord.setValue('subsidiary',vbVals.subsidiary[0].value);

            params.vbSubs = vbVals.subsidiary[0].value;
            params.vbEntity = vbVals.entity[0].value;
            for (var l=1; l<=LINECOUNT; l++){
                var lineobj = icutil.getLineValue(l,params);
                log.debug({
                    title: 'lineobj'+l,
                    details: lineobj
                });

                objRecord.selectNewLine({
                    sublistId: 'line'
                });

                for (key in lineobj){
                    objRecord.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: key,
                        value: lineobj[key],
                        ignoreFieldChange: false
                    });
                }

                objRecord.commitLine({
                    sublistId: 'line'
                });    
            }

            

            var jeID = objRecord.save();
            log.debug({
                title: 'success jeID',
                details: jeID
            });
            return jeID;

        }catch (ex){
            log.debug({
                title: 'CreateJE ex',
                details: ex
            });
            return null;
        }
        }


     
        ReturnObj.afterSubmit = afterSubmit;
        return ReturnObj;
    });
   