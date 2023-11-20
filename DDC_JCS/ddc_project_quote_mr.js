/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define([
'N/record',
'N/runtime',
'N/search',
'N/format',
'./ddc_jcs_util.js'],

function(
    _nRecord,
    _nRuntime,
    _nSearch,
    _nFormat,
    util) {


	/**
     * Marks the beginning of the Map/Reduce process and generates input data.
     *
     * @typedef {Object} ObjectRef
     * @property {number} id - Internal ID of the record instance
     * @property {string} type - Record type id
     *
     * @return {Array|Object|Search|RecordRef} inputSummary
     * @since 2015.1
     */

    const defaultTaskStatus = 'NOTSTART';
    const defaultTaskContraint = 'ASAP';
    const PROJECTTYPE = 'job';
    function getInputData() {

    	try {
            var quoteid = _nRuntime.getCurrentScript().getParameter({name: 'custscript_quote_to_proj_recid'});
            log.debug({
                title: 'quoteid',
                details: quoteid
            });

            if (util.isEmpty(quoteid)) return null;


            var res = getQuoteValues(quoteid);
            if (util.isEmpty(res)) return null;

            var projid;
            var obj = {};
            for (each in res){
                var item = res[each].getValue('item');
                var itemname = res[each].getText('item');
                var lineuniquekey = res[each].getValue('lineuniquekey');
                var quantity = res[each].getValue('quantity');

                if (util.isEmpty(projid)){
                    projid = res[each].getValue({
                        name: 'internalid',
                        join: 'job'
                    });
                }

                obj[item] = {
                    'lineuniquekey' : lineuniquekey,
                    'projid' : projid,
                    'quoteid' : quoteid,
                    'itemname' : itemname,
                    'quantity' : quantity
                };
            }


            var resource = getResourceValues(projid);
            if (util.isEmpty(resource)) return obj;

            for (each in obj){
                obj[each].resources = resource;
            }

            return obj;
    		//if (util.isEmpty(emps)) return;
    		//return emps;

		} catch (err) { log.error(err.name, err.message + ' | Stack: '+err.stack ) }
    }

    /**
     * 
     * @param {integer} id quote id 
     */
    function getQuoteValues(id){
    try{
        var filters = [];
        filters.push(_nSearch.createFilter({name: 'internalid', operator: _nSearch.Operator.ANYOF, values: id }));
        var res = util.LoadSearch('customsearch_service_items_on_quote', 'estimate', filters) //searchid, recordtype, filters
        return res;

    } catch (err) {
        log.debug({
            title: 'getQuoteValues ex',
            details: err
        });
     }
    }

    /**
     * 
     * @param {integer} id project id 
     */
    function getResourceValues(id){
    try{
        var filters = [];
        filters.push(_nSearch.createFilter({name: 'project', operator: _nSearch.Operator.ANYOF, values: id }));
        var res = util.LoadSearch('customsearch_quote_resource_allocation', 'resourceallocation', filters) //searchid, recordtype, filters
        if (util.isEmpty(res)) return null;

        var obj = [];
        for (each in res){
            var resobj = {};
            resobj.resourceid = res[each].getValue('resource');
            resobj.laborcost = res[each].getValue({
                name: 'laborcost',
                join: 'employee'
            });

            resobj.billingclass = res[each].getValue({
                name: 'billingclass',
                join: 'employee'
            });
            
            obj.push(resobj);
        }

        return obj;

    } catch (err) {
        log.debug({
            title: 'getResourceValues ex',
            details: err
        });
     }
    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
    	try {
            if (util.isEmpty(context)) return;

            var key = JSON.parse(context.key);
            var val = JSON.parse(context.value);

            log.debug({
                title: 'key:'+key,
                details: JSON.stringify(val)
            });

            createProjectTask(context);
		} catch (err) {
            log.debug({
                title: 'map ex',
                details: err
            });
         }
    }

    function createProjectTask(context){
    try{
        var itemid = JSON.parse(context.key);
        var itemvals = JSON.parse(context.value);
        var quoteid = itemvals.quoteid;
        var projid = itemvals.projid;
        
        var taskFlds = taskFields(itemvals);
       

        var rec = _nRecord.create({
            type: 'projecttask',
            isDynamic: true
        });

        //set body fields
        for (var fldName in taskFlds){
            log.debug({
                title: 'fldName: '+fldName,
                details: 'taskFlds[fldName]: '+ taskFlds[fldName]
            });
            rec.setValue(fldName, taskFlds[fldName]);
        }
        rec.setValue('custentity_created_from_quote', quoteid);

        //set resource fields
        var resources = itemvals.resources; 
        for (each in resources){
            rec.selectNewLine({
                    sublistId: 'assignee'
                });

            rec.setCurrentSublistValue({
                sublistId: 'assignee',
                fieldId: 'resource',
                value: resources[each].resourceid,
                ignoreFieldChange: true
            });

            rec.setCurrentSublistValue({
                sublistId: 'assignee',
                fieldId: 'unitcost',
                value: resources[each].laborcost,
                ignoreFieldChange: true
            });

            rec.setCurrentSublistValue({
                sublistId: 'assignee',
                fieldId: 'plannedwork',
                value: itemvals.quantity,
                ignoreFieldChange: true
            });

            rec.setCurrentSublistValue({
                sublistId: 'assignee',
                fieldId: 'serviceitem',
                value: itemid,
                ignoreFieldChange: true
            });

            rec.setCurrentSublistValue({
                sublistId: 'assignee',
                fieldId: 'billingclass',
                value: resources[each].billingclass,
                ignoreFieldChange: true
            });

            rec.commitLine({
                sublistId: 'assignee'
            });
        }
        
        
        var recordId = rec.save();
         log.debug({
            title: 'createProjectTask record created',
            details: 'recordId: '+recordId
        });

        //update project
        _nRecord.submitFields({
            type: PROJECTTYPE,
            id: projid,
            values: {
                'custentity_project_task_created': true
            }
        });


    } catch (err) {
        log.debug({
            title: 'createProjectTask ex',
            details: err
        });
     }
    }

    function taskFields(vals){
        var obj = {};
        obj.title = vals.itemname;
        obj.status = defaultTaskStatus;
        obj.constrainttype = defaultTaskContraint;
        obj.plannedwork = vals.quantity ;//sourced from Quote Qty
        obj.company = vals.projid;
        return obj;
    }
    
    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {
    	try {
    	} catch (err) { log.error(err.name, err.message + ' | '+ err.stack); }
    }

    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(context) {
    	
    	
//    	var type = context.toString();
//        log.audit(type + ' Usage Consumed', context.usage);
//        log.audit(type + ' Concurrency Number ', context.concurrency);
//        log.audit(type + ' Number of Yields', context.yields);
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce : reduce,
        summarize: summarize
    };

});
