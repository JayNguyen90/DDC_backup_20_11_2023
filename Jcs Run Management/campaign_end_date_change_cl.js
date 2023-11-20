/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */


define(['N/currentRecord', 'N/runtime', 'N/search', 'N/record'],
    /**
     * @param{currentRecord} currentRecord
     * @param{runtime} runtime
     * @param{search} search
     * @param{record} record
     */
    (currentRecord, runtime, search, record) => {
        var currentMode;
        /**
        * Function to be executed after page is initialized.
        *
        * @param {Object} scriptContext
        * @param {Record} scriptContext.currentRecord - Current form record
        * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
        *
        * @since 2015.2
        */
        function pageInit(scriptContext) {
            currentMode = scriptContext.mode;

        }

        /**
        * Function to be executed when field is changed.
        *
        * @param {Object} scriptContext
        * @param {Record} scriptContext.currentRecord - Current form record
        * @param {string} scriptContext.sublistId - Sublist name
        * @param {string} scriptContext.fieldId - Field name
        * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
        * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
        *
        * @since 2015.2
        */
        function fieldChanged(scriptContext) {
            if(currentMode=='edit'){
                var rec = scriptContext.currentRecord;
                var subsidiary = rec.getValue({ fieldId: 'subsidiary' });
                log.debug("subsidiary", subsidiary);
                if (subsidiary != '2') {
                    return;
                }
                if (scriptContext.fieldId == 'custbody_ddc_end_date') {
                    var endDate = rec.getText('custbody_ddc_end_date');
                    console.log("endDate",endDate);
                    var record2 = nlapiLoadRecord('salesorder', nlapiGetRecordId(), { recordmode: 'dynamic' });
                    var oldEndDate=record2.getFieldValue('custbody_ddc_end_date')
                    console.log("oldEndDate",oldEndDate);
                    if (endDate!=oldEndDate) {
                        rec.setValue('custbody_ddc_campaign_end_date_changed',true);
                    }
                    else{
                        rec.setValue('custbody_ddc_campaign_end_date_changed',false);
                    }
    
                }
            }
           


        }

        /**
         * Function to be executed when field is slaved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         *
         * @since 2015.2
         */
        function postSourcing(scriptContext) {

        }

        /**
         * Function to be executed after sublist is inserted, removed, or edited.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function sublistChanged(scriptContext) {

        }

        /**
        * Function to be executed after line is selected.
        *
        * @param {Object} scriptContext
        * @param {Record} scriptContext.currentRecord - Current form record
        * @param {string} scriptContext.sublistId - Sublist name
        *
        * @since 2015.2
        */
        function lineInit(scriptContext) {

        }

        /**
         * Validation function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - CurrelocationEmpnt form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @returns {boolean} Return true if field is valid
         *
         * @since 2015.2
         */
        function validateField(scriptContext) {

        }


        /**
         * Validation function to be executed when sublist line is committed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateLine(scriptContext) {

        }

        /**
         * Validation function to be executed when sublist line is inserted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateInsert(scriptContext) {

        }

        /**
         * Validation function to be executed when record is deleted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateDelete(scriptContext) {

        }

        /**
         * Validation function to be executed when record is saved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         */
        function saveRecord(scriptContext) {

        }

        return {
            pageInit,
            fieldChanged,
            /* postSourcing,
            sublistChanged, */
            lineInit,
            /*validateField,
            validateLine,
            validateInsert,
            validateDelete,
            saveRecord */
        };

    });

