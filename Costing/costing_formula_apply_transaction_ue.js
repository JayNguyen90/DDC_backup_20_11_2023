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
        function beforeSubmit(context) {
            try {
                log.debug("context", context);
                var newRecord = context.newRecord;
                if (context.type !== "edit" && context.type !== 'create') {
                    return;
                }
                var formularCosting = getFormularCosting();
                log.debug("formularCosting", formularCosting)
                var lineNumber = newRecord.getLineCount('item');
                log.debug("lineNumber", lineNumber)
                for (var i = 0; i < lineNumber; i++) {
                    var itemID = newRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                    var excludeCosting = newRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_exclude_from_costing', line: i });
                    if (excludeCosting) {
                        newRecord.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_ddc_total_cost',
                            line: i,
                            value: 0
                        });
                    }
                    else {
                        var costingFormulaLookup = search.lookupFields({
                            type: "item",
                            id: itemID,
                            columns: ['custitem_ddc_costing_formula']
                        });
                        log.debug("costingFormulaLookup", costingFormulaLookup);
                        if (costingFormulaLookup.custitem_ddc_costing_formula) {
                            if (costingFormulaLookup.custitem_ddc_costing_formula.length > 0) {
                                var costingFormulaId = costingFormulaLookup.custitem_ddc_costing_formula[0].value;
                                log.debug("costingFormulaId", costingFormulaId);
                                if (costingFormulaId) {
                                    var formulaCodeTransaction = formularCosting[costingFormulaId];
                                    log.debug("formulaCodeTransaction", formulaCodeTransaction);
                                    if (formulaCodeTransaction) {
                                        var formularRemoveBrackets = formulaCodeTransaction.replace(/[{}]/g, '');;
                                        log.debug("formularRemoveBrackets", formularRemoveBrackets);
                                        var matches = formulaCodeTransaction.split('{')
                                            .filter(function (v) { return v.indexOf('}') > -1 })
                                            .map(function (value) {
                                                return value.split('}')[0]
                                            })
                                        log.debug("matches", matches);
                                        var costingRepair = {};
                                        for (var j = 0; j < matches.length; j++) {
                                            costingRepair[matches[j]] = newRecord.getSublistValue({ sublistId: 'item', fieldId: matches[j], line: i });
                                        }
                                        log.debug("costingRepair", costingRepair);
                                        for (const [key, value] of Object.entries(costingRepair)) {
                                            if (!value) {
                                                return;
                                            }
                                            formularRemoveBrackets = formularRemoveBrackets.replace(key, value);

                                        }
                                        log.debug("total Cost value", eval(formularRemoveBrackets));
                                        newRecord.setSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_ddc_total_cost',
                                            line: i,
                                            value: eval(formularRemoveBrackets)
                                        });
                                    }
                                }
                            }
                        }
                    }



                }

            } catch (e) {
                log.debug("error", e)
            }
        };
        function getFormularCosting() {
            var ret = {};
            var costingFormulaSearch = search.create({
                type: "customrecord_ddc_costing_formula_list",
                filters:
                    [
                    ],
                columns:
                    [
                        search.createColumn({ name: "custrecord_ddc_cfl_formula_coded_tx", label: "Formula Coded - Transaction" }),
                    ]
            });
            var searchResultCount = costingFormulaSearch.runPaged().count;
            log.debug("costingFormulaSearch result count", searchResultCount);
            costingFormulaSearch.run().each(function (result) {
                var internalId = parseInt(result.id);
                var forumlarCode = result.getValue('custrecord_ddc_cfl_formula_coded_tx');
                ret[internalId] = forumlarCode;
                return true;
            });
            return ret;
        }
        return { beforeSubmit: beforeSubmit };
    });