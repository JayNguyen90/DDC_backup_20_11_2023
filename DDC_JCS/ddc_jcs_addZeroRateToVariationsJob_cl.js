/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 *
 * Written by JCurve for DDC only.
 *
 * Purpose: This will add $0 to Rate column when line belongs to a DDC Variation on a Job (Sales Order) to save user from entering 0 to save, then script to calculate rate triggered on save
 */

define(['N/currentRecord', 'N/ui/message'], function(currentRecord, message) {
  function validateLine(context) {
    var currentRec = context.currentRecord;
    var variationChecked = currentRec.getCurrentSublistValue({
      sublistId: 'item',
      fieldId: 'custcol_ddc_variation'
    });
	var subsidiary = currentRec.getValue({
      fieldId: 'subsidiary'
    });

    if (subsidiary != 2) {return true};
    
    if (variationChecked) {
          log.debug({
                    title: 'Variation, Sub',
                    details: "Var: " + variationChecked + ", Sub: " + subsidiary
                })
      var rateValue = currentRec.getCurrentSublistValue({
        sublistId: 'item',
        fieldId: 'rate'
      });

              log.debug({
                    title: 'Rate',
                    details: "Rate: " + rateValue
                })
      
      if (rateValue === '') {

        currentRec.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'rate',
          value: 0
        });


      }
    }
    return true;
  }

  return {
    validateLine: validateLine
  };
});