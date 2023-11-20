/**
 *
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search'],
    function (record, runtime, search) {
        /**
         *  Function definition to be triggered after record is submitted.
         *
         * @param {Object} scriptContextS
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type
         * @param {Form} scriptContext.form - Current form
         * @Since 2015.2
         */
        function afterSubmit(context) {
            try {
                var newRecord = context.newRecord;
                var transactionId = newRecord.id;
                log.debug("transactionId", transactionId);
                log.debug('context.type',context.type);
                if (context.type !== "edit"&& context.type !== 'create') {
                    return;
                }
                var runDetailRec = record.load({
                    type: 'customrecord_ddc_run_detail',
                    id: parseInt(transactionId),
                });
                var itemID = runDetailRec.getValue({ fieldId: 'custrecord_ddc_rd_item' });
                if(!itemID){
                    return;
                }
                var costingFormulaLookup = search.lookupFields({
                    type: "item",
                    id: itemID,
                    columns: ['custitem_ddc_costing_formula']
                });
                log.debug("costingFormulaLookup", costingFormulaLookup);
                var costingFormulaId
                var costingFormulaValue=costingFormulaLookup.custitem_ddc_costing_formula
                if(costingFormulaValue){
                    if(costingFormulaValue.length>0){
                        costingFormulaId=costingFormulaValue[0].value
                    }
                }
                else{
                    costingFormulaId = runDetailRec.getValue({ fieldId: 'custrecord_ddc_rd_costing_formula' });
                }
                if(!costingFormulaId){
                    return ;
                }
                var costingFormulaLookup = search.lookupFields({
                    type: "customrecord_ddc_costing_formula_list",
                    id: costingFormulaId,
                    columns: ['custrecord_ddc_cfl_formula_coded_rd_plan','custrecord_ddc_cfl_formula_coded_rd_act']
                });
                log.debug("costingFormulaLookup", costingFormulaLookup)
                var formulaRunDetailPlan= costingFormulaLookup.custrecord_ddc_cfl_formula_coded_rd_plan;
                log.debug("formulaRunDetailPlan",formulaRunDetailPlan);
                var formulaRunDetailAct= costingFormulaLookup.custrecord_ddc_cfl_formula_coded_rd_act;
                log.debug("formulaRunDetailAct",formulaRunDetailAct);
                if (formulaRunDetailPlan) {
                    var formularRemoveBrackets=formulaRunDetailPlan.replace(/[{}]/g, ''); ;
                    log.debug("formularRemoveBrackets",formularRemoveBrackets);
                    var matches = formulaRunDetailPlan.split('{')
                        .filter(function (v) { return v.indexOf('}') > -1 })
                        .map(function (value) {
                            return value.split('}')[0]
                        })
                    log.debug("matches",matches);
                    var costingRepair = search.lookupFields({
                        type: "customrecord_ddc_run_detail",
                        id: transactionId,
                        columns: matches
                    });
                    log.debug("costingRepair",costingRepair);

                    for (const [key, value] of Object.entries(costingRepair)) {
                        if(!value){
                            return;
                        }
                        formularRemoveBrackets=formularRemoveBrackets.replace(key,value);

                      }
                      log.debug("formularRemoveBrackets1",eval(formularRemoveBrackets));
                      runDetailRec.setValue('custrecord_ddc_rd_planned_calc_cost',eval(formularRemoveBrackets))
    
                }   
                if (formulaRunDetailAct) {
                    var formularRemoveBracketsAct=formulaRunDetailAct.replace(/[{}]/g, ''); ;
                    log.debug("formularRemoveBracketsAct",formularRemoveBracketsAct);
                    var matchesAct = formulaRunDetailAct.split('{')
                        .filter(function (v) { return v.indexOf('}') > -1 })
                        .map(function (value) {
                            return value.split('}')[0]
                        })
                    log.debug("matchesAct",matchesAct);
                    var costingRepairAct = search.lookupFields({
                        type: "customrecord_ddc_run_detail",
                        id: transactionId,
                        columns: matchesAct
                    });
                    log.debug("costingRepairAct",costingRepairAct);

                    for (const [key, value] of Object.entries(costingRepairAct)) {
                        if(!value){
                            return;
                        }
                        formularRemoveBracketsAct=formularRemoveBracketsAct.replace(key,value);

                      }
                      log.debug("formularRemoveBracketsAct",eval(formularRemoveBracketsAct));
                      runDetailRec.setValue('custrecord_ddc_rd_actual_calc_cost',eval(formularRemoveBracketsAct))
                      var recid=runDetailRec.save();
                      log.debug("recid",recid);
                }   




            } catch (e) {
                log.debug("e", e)
            }
        };

        return { afterSubmit: afterSubmit };
    });