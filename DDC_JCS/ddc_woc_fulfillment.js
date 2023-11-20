/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 *@NModuleScope Public
 */
define([
    'N/record',
    'N/search',
    './ddc_jcs_util.js'
    ],
    function (
    _nRecord,
    _nSearch,
    util
    )
    {
        var ReturnObj = {};
        const WOFlds = ['createdfrom'];
        const WOCFlds = ['createdfrom','item','quantity','cseg_legal_entity','inventorydetail','location','units'];
        function afterSubmit(context) {
            try{
                log.debug({title: 'context', details: context.type });
                //if (context.type != 'create') return;

                var rec = context.newRecord;
                rec = _nRecord.load({ type: rec.type, id: rec.id });

                var wocVals = getWOCValues(rec);

                if (util.isEmpty(wocVals.createdfrom)) return;

                var woVals = util.lookupFields('WORK_ORDER',wocVals.createdfrom,WOFlds);
                if (util.isEmpty(woVals.createdfrom[0].value)) return; 

                if (parseFloat(woVals.built)<= 0 ) return; 

                var comps = getItemComponents(rec.type , rec.id );
                var compDetails = getInventoryDetails(rec,comps,false); //get member component inventory details
                var assemblyDetails = getInventoryDetails(rec,wocVals.item,true); //get assembly item inventory details
                CreateFulfillment(woVals,wocVals,compDetails,assemblyDetails);
                /*
                log.debug({
                    title: 'createdfrom id: '+wocVals.createdfrom,
                    details: 'so id: '+ woVals.createdfrom[0].value+', woVals.built: '+woVals.built
                });
                */

            }catch (ex){
                log.debug({
                    title: 'afterSubmit ex',
                    details: ex
                });
            }
        }

        /**
         * 
         * @param {NS record} rec current woc record
         * @param {array} itemID object containg item components and its associated non-inv items
         * @param {boolean} isParent is parent assembly or member component
         */
        function getInventoryDetails(rec,itemID,isParent){
        try{
            var lineCnt = 1;
            if (!isParent){
                var lineCnt = rec.getLineCount('component');
            }
            var obj = {};
            for (var l=0; l<lineCnt; l++){
                if (!isParent){

                    //swap line item to real non-inv component item
                    var tempItem = rec.getSublistValue({ sublistId: 'component', fieldId: 'item', line:l});
                    var lItem = itemID[tempItem];
                    var subrec = rec.getSublistSubrecord({ sublistId: 'component', fieldId: 'componentinventorydetail', line:l });
                    var qty  = rec.getSublistValue({ sublistId: 'component', fieldId: 'quantity', line:l});
                }else{

                    var lItem = itemID;
                    var tempItem = null;
                    var subrec = rec.getSubrecord({ fieldId: 'inventorydetail'});
                    var qty = subrec.getValue({fieldId:'quantity'});
                }

                if (obj[lItem]===undefined)
                    obj[lItem] = {};
                obj[lItem].tempitem = tempItem;
                obj[lItem].qty  = qty;

                if (!util.isEmpty(subrec)){//get inventory details
                    var subrecLine = subrec.getLineCount({ sublistId: 'inventoryassignment' });
                    var lotObj = [];
                    for (var m=0; m<subrecLine; m++){
                        if (lotObj[m] === undefined)
                            lotObj[m] = {};
                        
                        if (!isParent){
                            lotObj[m].lotTxt = subrec.getSublistText({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', line:m });
                            lotObj[m].lotid = subrec.getSublistValue({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', line:m });
                            lotObj[m].binnumber  = subrec.getSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', line:m });
                        }else{
                            lotObj[m].lotTxt = subrec.getSublistText({ sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber', line:m });
                            lotObj[m].lotid = subrec.getSublistValue({ sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber', line:m });
                        }
                        lotObj[m].expiry  = subrec.getSublistText({ sublistId: 'inventoryassignment', fieldId: 'expirationdate', line:m });
                        lotObj[m].qty  = subrec.getSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', line:m });
                    }

                    if (obj[lItem].lot === undefined)
                        obj[lItem].lot = {};
                    obj[lItem].lot = lotObj;

                }
            }

            log.debug({
                title: 'getInventoryDetails obj',
                details: obj
            });

            return obj;

        }catch (ex){
            log.debug({
                title: 'getInventoryDetails ex',
                details: ex
            });
        }
        }

        /**
         * 
         * @param {integer} item assembly item id
         */
        function getItemComponents(rectype, recid){
        try{
            var thisrec = _nRecord.load({
                type: rectype,
                id: recid,
                isDynamic: true,
            });

            var lineCnt = thisrec.getLineCount({
                sublistId: 'component'
            });

            var comps = [];
            for (var l=0; l<lineCnt; l++){
                thisrec.selectLine({
                    sublistId: 'component',
                    line: l
                });
                comps.push(thisrec.getCurrentSublistValue('component','item'));
            }

            log.debug({
                title: 'getItemComponents comps',
                details: comps
            });

            comps = searchNonInv(comps);
            return comps;
            
        }catch (ex){
            log.debug({
                title: 'getItemComponents ex',
                details: ex
            });
        }
        }

        /**
         * 
         * @param {integer} item assembly item id
         */
        function searchNonInv(item){
        try{
            
            var filters = [];
            filters.push(_nSearch.createFilter({name: 'internalid', operator: _nSearch.Operator.ANYOF, values: item }));
            var res = util.LoadSearch('customsearch_member_item_n', 'item', filters) //searchid, recordtype, filters
           
            if (util.isEmpty(res)) return null;
            var comps = {};
            for (each in res){
                var invItem = res[each].id;
                var nonInvItem = res[each].getValue('custitem_ive_item_noninv_item_match');
                comps[invItem] = nonInvItem;
                
            }

            log.debug({
                title: 'comps',
                details: comps
            });

            return comps;
        }catch (ex){
            log.debug({
                title: 'searchNonInv ex',
                details: ex
            });
        }
        }

        function getWOCValues(rec){
        try{

            var obj = {};
            for (each in WOCFlds){
                obj[WOCFlds[each]] = rec.getValue({
                    fieldId: WOCFlds[each]
                });
            }

            log.debug({
                title: 'getWOCValues',
                details: obj
            });
            return obj;

        }catch (ex){
            log.debug({
                title: 'getWOCValues ex',
                details: ex
            });
        }
        }

        /**
         * 
         * @param {object} woVals work order field values
         * @param {object} wocVals work order completion field values
         * @param {object} compDetails assembly item component ids and inventory details
         * @param {object} assemblyDetails assembly item inventory details
         */
        function CreateFulfillment(woVals,wocVals,compDetails,assemblyDetails){
        try{
            
            log.debug({
                title: 'compDetails',
                details: compDetails
            });
            log.debug({
                title: 'wocVals',
                details: wocVals
            });
            
            log.debug({
                title: 'woVals',
                details: woVals
            });

           var ifRec = _nRecord.transform({
                fromType: _nRecord.Type.SALES_ORDER,
                fromId: woVals.createdfrom[0].value,
                toType: 'itemfulfillment',
                isDynamic: true,
                defaultValues : {inventorylocation : wocVals.location}
            });
            
            
            var lineCnt = ifRec.getLineCount({
                sublistId: 'item'
            });
            
            
            log.debug({
                title: 'lineCnt',
                details: lineCnt
            });

            var lotStatus;
            for (var l=0; l<lineCnt; l++){
                var recieveLine = false;
                ifRec.selectLine({
                    sublistId: 'item',
                    line: l
                });

                var lItem = ifRec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item'
                });

                var qty = 1;

                ifRec.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'cseg_legal_entity',
                    value: wocVals.cseg_legal_entity,
                    ignoreFieldChange: true
                });

                ifRec.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'units',
                    value: wocVals.units,
                    ignoreFieldChange: true
                });

                ifRec.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'location',
                    value: wocVals.location,
                    ignoreFieldChange: true
                });
                
                // check if assembly or component item
                if (lItem==wocVals.item){//assembly
                    if (!util.isEmpty(assemblyDetails[lItem])){
                        var lots = assemblyDetails[lItem].lot;
                        if (!util.isEmpty(lots)) {
                            lotStatus = insertInventoryDetail(ifRec,lots,wocVals.location);
                        }
                    }
                    
                    qty = wocVals.quantity;
                    //tick
                    recieveLine= true;
                }else {
                    //find component id
                    if (!util.isEmpty(compDetails[lItem])){
                        //var lots = compDetails[lItem].lot;
                        //lotStatus = insertInventoryDetail(ifRec,lots);
                        recieveLine = true;
                        qty = compDetails[lItem].qty;
                    }
                }

                
                ifRec.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    value: qty,
                    ignoreFieldChange: true
                });

                ifRec.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'itemreceive',
                    value: recieveLine,
                    ignoreFieldChange: true
                });

                ifRec.commitLine({
                    sublistId: 'item'
                });

                if (util.isEmpty(lotStatus)) continue;
                if (lotStatus.status == 'fail') break;
            }//end for loop itemline

            if (!util.isEmpty(lotStatus)){
                if (lotStatus.status == 'fail'){
                    throw new Error(lotStatus.error); 
                }
            }

            ifRec.save();
            log.debug({
                title: 'IF ID',
                details: ifRec.id
            });


        }catch (ex){
            log.debug({
                title: 'CreateFulfillment ex',
                details: ex
            });
        }
        }

        /**
         * 
         * @param {NS record} ifRec 
         * @param {object} lots r
         * return: true if no error
         */
        function insertInventoryDetail(ifRec,lots,location){
            try{
                var subRec = ifRec.getCurrentSublistSubrecord({
                    sublistId: 'item',
                    fieldId: 'inventorydetail'
                });
                
                var subrecLine = subRec.getLineCount({ sublistId: 'inventoryassignment' });
               
                
                /*
                if (subRec){ //remove all lines
                    var subrecLine = subRec.getLineCount({ sublistId: 'inventoryassignment' });
                    for (var m=0; m<subrecLine; m++){
                        subRec.removeLine({
                            sublistId: 'inventoryassignment',
                            line: 0,
                            ignoreRecalc: true
                        });
                    }
                }
                */
                
                var idx = [];
                for (var s=0; s<subrecLine; s++){
                    subRec.selectLine({
                        sublistId: 'inventoryassignment',
                        line: s
                    });

                    var lineLotId =  subRec.getCurrentSublistText({
                        sublistId: 'inventoryassignment',
                        fieldId: 'issueinventorynumber'
                    });

                    for (each in lots){
                        if (lineLotId!=lots[each].lotTxt) continue;
                        log.debug({
                            title: 'pasok lineLotId: '+lineLotId,
                            details: 'qty: '+lots[each].qty
                        });
                        subRec.setCurrentSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'quantity',
                            value: parseFloat(lots[each].qty)
                        });

                        subRec.setCurrentSublistText({
                            sublistId: 'inventoryassignment',
                            fieldId: 'expirationdate',
                            value: lots[each].expiry
                        });

                        subRec.commitLine({
                            sublistId: 'inventoryassignment'
                        });

                        idx.push(s);

                        break;
                    }
                }

                var deleteIdx = 0;
                for (var s=0; s<subrecLine; s++){
                    if (idx.indexOf(s) != -1 ){
                        deleteIdx++;
                        continue;
                    }
                    
                    subRec.removeLine({
                        sublistId: 'inventoryassignment',
                        line: deleteIdx
                    });
                }

                log.debug({
                    title: 'subrecLine ilan pa ',
                    details: subrecLine
                });

                /*
                for (each in lots){
                    subRec.selectNewLine({
                        sublistId: 'inventoryassignment'
                    });
            
                    subRec.setCurrentSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'issueinventorynumber',
                        value:  lots[each].lotid
                    });

                    subRec.setCurrentSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'quantity',
                        value: parseFloat(lots[each].qty)
                    });

                    subRec.setCurrentSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'location',
                        value: location
                    });
                    
                    
                    subRec.setCurrentSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'binnumber',
                        value: lots[each].binnumber
                    });
                    

                    subRec.setCurrentSublistText({
                        sublistId: 'inventoryassignment',
                        fieldId: 'expirationdate',
                        value: lots[each].expiry
                    });
                    
                    log.debug({title: 'location', details: location});

                    subRec.commitLine({
                        sublistId: 'inventoryassignment'
                    });
                    log.debug({title: 'insertInventoryDetail',details: 'Lot Nos. Added'});
                }
                */
                return {
                    'status' : 'success',
                    'error' : null
                };

            }catch(ex){
                log.debug({title: 'insertInventoryDetail Exception',details: ex});
                return {
                    'status' : 'fail',
                    'error' : ex
                };
            }
            }
     
        ReturnObj.afterSubmit = afterSubmit;
        return ReturnObj;
    });
    