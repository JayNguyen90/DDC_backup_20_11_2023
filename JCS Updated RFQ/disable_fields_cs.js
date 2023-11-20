/**
 * @name:                                       disable_fields_cs.js
 * @author:                                     Patrick Lising
 * @summary:                                    Script Description
 * @copyright:                                  © Copyright by Jcurve Solutions
 * Date Created:                                Fri Dec 16 2022 9:04:56 AM
 * Change Logs:
 * Date                          Author               Description
 * Fri Dec 16 2022 9:04:56 AM -- Patrick Lising -- Initial Creation
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define([], function() {

     function pageInit(context) {
        var currRec = context.currentRecord
        var subsidiary = currRec.getValue({
            fieldId: 'subsidiary'
        })
        if (subsidiary != '2') {
            return;
        }
        var prefVend1 = currRec.getValue({
            fieldId: 'custbody_ddc_rec_rfq_supplier1_pref'
        })

        var prefVend2 = currRec.getValue({
            fieldId: 'custbody_ddc_rec_rfq_supplier2_pref'
        })

        var prefVend3 = currRec.getValue({
            fieldId: 'custbody_ddc_rec_rfq_supplier3_pref'
        })

        var supplier1 = currRec.getField({
            fieldId: 'custbody_ddc_rfq_supplier1'
        })

        var supplier2 = currRec.getField({
            fieldId: 'custbody_ddc_rfq_supplier2'
        })

        var supplier3 = currRec.getField({
            fieldId: 'custbody_ddc_rfq_supplier3'
        })

        var disablePrefVend1 = currRec.getField({
            fieldId: 'custbody_ddc_rec_rfq_supplier1_pref'
        })

        var disablePrefVend2 = currRec.getField({
            fieldId: 'custbody_ddc_rec_rfq_supplier2_pref'
        })

        var disablePrefVend3 = currRec.getField({
            fieldId: 'custbody_ddc_rec_rfq_supplier3_pref'
        })

        if(prefVend1){
            supplier1.isDisabled = true;
            disablePrefVend2.isDisabled = true;
            disablePrefVend3.isDisabled = true;
        }else if(prefVend2){
            supplier2.isDisabled = true;
            disablePrefVend1.isDisabled = true;
            disablePrefVend3.isDisabled = true;
        }else if(prefVend3){
            supplier3.isDisabled = true;
            disablePrefVend1.isDisabled = true;
            disablePrefVend2.isDisabled = true;
        }

    }

    function fieldChanged(context) {
        var currRec = context.currentRecord
        var changedField = context.fieldId
        var subsidiary = currRec.getValue({
            fieldId: 'subsidiary'
        })
        if (subsidiary != '2') {
            return;
        }
        if (changedField == 'custbody_ddc_rec_rfq_supplier1_pref') {

            var prefVend1 = currRec.getValue({
                fieldId: 'custbody_ddc_rec_rfq_supplier1_pref'
            })

            var supplier1 = currRec.getField({
                fieldId: 'custbody_ddc_rfq_supplier1'
            })

            var disablePrefVend2 = currRec.getField({
                fieldId: 'custbody_ddc_rec_rfq_supplier2_pref'
            })

            var disablePrefVend3 = currRec.getField({
                fieldId: 'custbody_ddc_rec_rfq_supplier3_pref'
            })

            if(prefVend1){
                supplier1.isDisabled = true;
                disablePrefVend2.isDisabled = true;
                disablePrefVend3.isDisabled = true;
            }else{
                supplier1.isDisabled = false;
                disablePrefVend2.isDisabled = false;
                disablePrefVend3.isDisabled = false;
            }
        }else if(changedField == 'custbody_ddc_rec_rfq_supplier2_pref'){

            var prefVend2 = currRec.getValue({
                fieldId: 'custbody_ddc_rec_rfq_supplier2_pref'
            })

            var supplier2 = currRec.getField({
                fieldId: 'custbody_ddc_rfq_supplier2'
            })

            var disablePrefVend1 = currRec.getField({
                fieldId: 'custbody_ddc_rec_rfq_supplier1_pref'
            })
           
            var disablePrefVend3 = currRec.getField({
                fieldId: 'custbody_ddc_rec_rfq_supplier3_pref'
            })

            if(prefVend2){
                supplier2.isDisabled = true;
                disablePrefVend1.isDisabled = true;
                disablePrefVend3.isDisabled = true;
            }else{
                supplier2.isDisabled = false;
                disablePrefVend1.isDisabled = false;
                disablePrefVend3.isDisabled = false;
            }
        }else if(changedField == 'custbody_ddc_rec_rfq_supplier3_pref'){
            var prefVend3 = currRec.getValue({
                fieldId: 'custbody_ddc_rec_rfq_supplier3_pref'
            })

            var supplier3 = currRec.getField({
                fieldId: 'custbody_ddc_rfq_supplier3'
            })

            var disablePrefVend1 = currRec.getField({
                fieldId: 'custbody_ddc_rec_rfq_supplier1_pref'
            })
            
            var disablePrefVend2 = currRec.getField({
                fieldId: 'custbody_ddc_rec_rfq_supplier2_pref'
            })

            if(prefVend3){
                supplier3.isDisabled = true;
                disablePrefVend1.isDisabled = true;
                disablePrefVend2.isDisabled = true;
            }else{
                supplier3.isDisabled = false;
                disablePrefVend1.isDisabled = false;
                disablePrefVend2.isDisabled = false;
            }
        }

    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged
    }
});
