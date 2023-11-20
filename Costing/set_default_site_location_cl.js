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
            var rec = scriptContext.currentRecord;
            var subsidiary = rec.getValue({ fieldId: 'subsidiary' });
            log.debug("subsidiary", subsidiary);
            if (subsidiary != '2') {
                return;
            }
            if (scriptContext.fieldId == 'entity') {
                log.debug("fieldChanged", "fieldChanged");
                var rec = scriptContext.currentRecord;
                var user = runtime.getCurrentUser();
                log.debug("user", user);
                var locationEmp = user.location;
                log.debug("locationEmp", locationEmp)
                if (!locationEmp) {
                    return;
                }
                // var subsidary = rec.getValue('subsidiary');
                // log.debug("subsidary", subsidary);
                // if (subsidary != '2') {
                //     return;
                // }
                //var locationEmp=rec.getValue('custbody_ddc_employee_location');
                // search.lookupFields.promise({
                //     type: record.Type.EMPLOYEE,
                //     id: user.id,
                //     columns: ['location']
                // })
                //     .then(item => {
                //         log.debug("item", item);
                //         if (item.location.length > 0) {
                //             search.create.promise({
                //                 type: 'customrecord_ddc_employee_site_loc_map',
                //                 filters: [
                //                     ['custrecord_ddc_eslm_emp_loc', 'anyof', (item.location[0].value).toString()],
                //                 ],
                //                 columns:
                //                     [
                //                         search.createColumn({ name: "custrecord_ddc_eslm_site", label: "Site" }),
                //                         search.createColumn({ name: "custrecord_ddc_eslm_location", label: "Production Location" })
                //                     ]
                //             })
                //                 .then(wcg => {
                //                     log.debug("wcg",wcg)
                //                     wcg.run().each(each => {
                //                         rec.setValue('custbody_ddc_site', parseInt(each.getValue('custrecord_ddc_eslm_site')))
                //                         rec.setValue('location', parseInt(each.getValue('custrecord_ddc_eslm_location')))

                //                     })

                //                 })
                //         }
                //     })
                //     .catch(function onRejected(reason) {
                //        log.debug("reason",reason)
                //         });
                if (locationEmp) {
                    search.create.promise({
                        type: 'customrecord_ddc_employee_site_loc_map',
                        filters: [
                            ['custrecord_ddc_eslm_emp_loc', 'anyof', locationEmp.toString()],
                        ],
                        columns:
                            [
                                search.createColumn({ name: "custrecord_ddc_eslm_site", label: "Site" }),
                                search.createColumn({ name: "custrecord_ddc_eslm_location", label: "Production Location" })
                            ]
                    })
                        .then(wcg => {
                            log.debug("wcg", wcg)
                            wcg.run().each(each => {
                                rec.setValue('custbody_ddc_site', parseInt(each.getValue('custrecord_ddc_eslm_site')))
                                rec.setValue('location', parseInt(each.getValue('custrecord_ddc_eslm_location')))

                                // GR Also set Location-filtered field at the same time.
                                rec.setValue('custbody_ddc_production_loc_filtered', parseInt(each.getValue('custrecord_ddc_eslm_location')))
                            })

                        })
                }

            }

            var rec = scriptContext.currentRecord;
            var lineN = scriptContext.line;
            if (scriptContext.sublistId == 'item' && scriptContext.fieldId == 'item') {
              log.debug("change-detected", "item");
                rec.selectLine({ sublistId: 'item', line: lineN });
                //alert(rec.getValue('location'))
                console.log("dkmddddddddddddddddddddddddddddddddd", rec.getValue('location'))
                rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: rec.getValue('location'), ignoreFieldChange: false });
                var currentLocation = rec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'location' });
                rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'inventorylocation', value: currentLocation, ignoreFieldChange: false });
                rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_site', value: rec.getValue('custbody_ddc_site'), ignoreFieldChange: false });

            }
            if (scriptContext.sublistId == 'item' && scriptContext.fieldId == 'location') {
              log.debug("change-detected", "location");
                rec.selectLine({ sublistId: 'item', line: lineN });
                var currentLocation = rec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'location' });
                rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'inventorylocation', value: currentLocation, ignoreFieldChange: false });

            }
            // if (scriptContext.sublistId=='item'&&scriptContext.fieldId == 'inventorylocation') {
            //     rec.selectLine({ sublistId: 'item', line: lineN });
            //     var currentLocation=rec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'location'});
            //     rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'inventorylocation', value: currentLocation, ignoreFieldChange: true });

            // }
            // if (scriptContext.fieldId == 'custbody_ddc_site') {
            //     var rec = scriptContext.currentRecord;
            //     var site = rec.getValue('custbody_ddc_site');
            //     var lineCount = rec.getLineCount('item');
            //     for (var j = 0; j < lineCount; j++) {
            //         rec.selectLine({
            //             sublistId: 'item',
            //             line: j
            //         });
            //         rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_site', value: site, line: j, ignoreFieldChange: false, forceSyncSourcing: true });
            //         rec.commitLine({
            //             sublistId: 'item'
            //         });
            //     }
            // }
            // if (scriptContext.fieldId == 'location'&&scriptContext.sublistId==null) {
            //     var rec = scriptContext.currentRecord;
            //     var location = rec.getValue('location');
            //     var lineCount = rec.getLineCount('item');
            //     for (var j = 0; j < lineCount; j++) {
            //         rec.selectLine({
            //             sublistId: 'item',
            //             line: j
            //         });
            //         rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: location, line: j, ignoreFieldChange: true });
            //         rec.commitLine({
            //             sublistId: 'item'
            //         });
            //     }
            // }
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

1