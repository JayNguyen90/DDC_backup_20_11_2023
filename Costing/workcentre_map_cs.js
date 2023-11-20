/**
* @NApiVersion 2.1
* @NScriptType ClientScript
* @NModuleScope SameAccount
*/
/*
* @name:                                       run_creation_cs.js
* @author:                                     LC
* @summary:                                    Script Description
* @copyright:                                  © Copyright by Jcurve Solutions
* Date Created:                                Fri Oct 07 2022 11:58:04 AM
*
* Change Logs:
*
* Fri Oct 07 2022 11:58:04 AM       LC      Initial Creation
* Tue Aug 22 2023 09:45:00 AM       Junnel  Added preferred and alternate fulfillment bin to sourcing. - v1.2.0
*/

define(['N/currentRecord', 'N/runtime', 'N/search', 'N/record'],
    /**
    * @param{currentRecord} currentRecord
    * @param{runtime} runtime
    * @param{search} search
    * @param{record} record
    */
    (currentRecord, runtime, search, record) => {

        var MODE = ''
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
            MODE = scriptContext.mode

            if (MODE == 'create') {
                let rec = scriptContext.currentRecord
                var subsidiary = rec.getValue({ fieldId: 'subsidiary' });
                log.debug("subsidiary", subsidiary);
                if (subsidiary != '2') {
                    return;
                }
                let user = runtime.getCurrentUser()

                search.lookupFields.promise({
                    type: record.Type.EMPLOYEE,
                    id: user.id,
                    columns: ['custentity_ddc_site']
                })
                    .then(look => {
                        if (look.custentity_ddc_site.length) {
                            rec.setValue({
                                fieldId: 'custbody_ddc_site',
                                value: look.custentity_ddc_site[0].value,
                                ignoreFieldChange: true
                            })
                        }
                    })
            }
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
            // if (MODE == 'edit') {
            let rec = scriptContext.currentRecord
            var subsidiary = rec.getValue({ fieldId: 'subsidiary' });
            log.debug("subsidiary", subsidiary);
            if (subsidiary != '2') {
                return;
            }
            // Upon site change, search work centre customrecord by site and workcentre group
            if (scriptContext.fieldId == 'custcol_ddc_site') {
                let siteSub = rec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_site' })
                let workCentreGroup = rec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_work_centre_group' })
                console.log('Transaction Line Sourcing CS > fieldChanged', { fieldId: scriptContext.fieldId, siteSub, workCentreGroup })

                if (!siteSub || !workCentreGroup) {
                    console.log('custcol_ddc_site || !machine || !workCentreGroup: ')
                    rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_work_centre', value: '', ignoreFieldChange: false })
                    rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_planned_machine', value: '', ignoreFieldChange: true })
                    refreshSublist()
                } else {
                    let wcg = search.create({
                        type: 'customrecord_ddc_work_centre',
                        filters: [
                            ['custrecord_ddc_wcl_work_centre_group', 'is', workCentreGroup],
                            'AND',
                            ['custrecord_ddc_wcl_site', 'is', siteSub],
                            'AND',
                            ['custrecord_ddc_wcl_default_at_site', 'is', 'T']
                        ],
                        columns: ['custrecord_ddc_wcl_machine']
                    })
                    let results = wcg.run().getRange({ start: 0, end: 1 })
                    console.log('RESULTS', results)
                    let workCentreId = '', machine = ''
                    if (results.length) {
                        workCentreId = results[0].id
                        machine = results[0].getValue({ name: 'custrecord_ddc_wcl_machine' })
                    }
                    console.log('custcol_ddc_site || else !machine || !workCentreGroup: ' + workCentreId)
                    rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_work_centre', value: workCentreId, ignoreFieldChange: true })
                    rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_planned_machine', value: machine, ignoreFieldChange: true })
                    populateWorkCentreFields(rec, workCentreId)
                    refreshSublist()
                }
            }
            // Upon machine change, search work centre customrecord by machine and workcentre group
            if (scriptContext.fieldId == 'custcol_ddc_planned_machine') {
                let workCentreGroup = rec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_work_centre_group' })
                let machine = rec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_planned_machine' })
                console.log('Transaction Line Sourcing CS > fieldChanged', { fieldId: scriptContext.fieldId, workCentreGroup, machine })

                if (!machine || !workCentreGroup) {
                    console.log('custcol_ddc_planned_machine || !machine || !workCentreGroup: ')
                    rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_work_centre', value: '', ignoreFieldChange: false })
                    rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_site', value: '', ignoreFieldChange: true })
                    refreshSublist()
                } else {
                    let wcg = search.create({
                        type: 'customrecord_ddc_work_centre',
                        filters: [
                            ['custrecord_ddc_wcl_work_centre_group', 'is', workCentreGroup],
                            'AND',
                            ['custrecord_ddc_wcl_machine', 'is', machine],
                        ],
                        columns: ['custrecord_ddc_wcl_site']
                    })
                    let results = wcg.run().getRange({ start: 0, end: 1 })
                    console.log('RESULTS', results)
                    let workCentreId = '', site = ''
                    if (results.length) {
                        workCentreId = results[0].id
                        site = results[0].getValue({ name: 'custrecord_ddc_wcl_site' })
                    }
                    console.log('custcol_ddc_planned_machine || else !machine || !workCentreGroup: ' + workCentreId)
                    rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_work_centre', value: workCentreId, ignoreFieldChange: true })
                    rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_site', value: site, ignoreFieldChange: true })
                    populateWorkCentreFields(rec, workCentreId)
                    refreshSublist()
                }
            }
            if (scriptContext.fieldId == 'custcol_ddc_work_centre') {
                let workCentreId = rec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_work_centre' })
                populateWorkCentreFields(rec, workCentreId)
                console.log('populateWorkCentreFields executed')
                // refreshSublist()
                // console.log('refreshSublist executed')
            }
            // }
        }

        // Netsuite clears out the rate and amount when the script populates the work centre column where ignoreFieldChange is F
        // Work around would be set the ignoreFieldChange is T then manually source the work centre fields
        const populateWorkCentreFields = (rec, wcId) => {
            console.log('wcId: '+ wcId)
            if (wcId) {
                let wc = search.lookupFields({
                    type: 'customrecord_ddc_work_centre',
                    id: wcId,
                    columns: [
                        'custrecord_ddc_wcl_default_sched_seq',
                        'custrecord_ddc_wcl_machine',
                        'custrecord_ddc_wcl_machine_hour_rate',
                        'custrecord_ddc_wcl_labour_rate',
                        'custrecord_ddc_wcl_labour_oh_rate',
                        'custrecord_ddc_wcl_pref_if_bin', // v1.2.0 Added on August 22, 2023 - DDC CO019
                        'custrecord_ddc_wcl_alt_if_bin' // v1.2.0 Added on August 22, 2023 - DDC CO019
                    ]
                })
                console.log('populateWorkCentreFields', wc)

                var preferredBin = wc.custrecord_ddc_wcl_pref_if_bin.length > 0 ? wc.custrecord_ddc_wcl_pref_if_bin[0].value : '' // v1.2.0 Added on August 22, 2023 - DDC CO019
                var alternateBin = wc.custrecord_ddc_wcl_alt_if_bin.length > 0 ? wc.custrecord_ddc_wcl_alt_if_bin[0].value : '' // v1.2.0 Added on August 22, 2023 - DDC CO019
                var preferredBinText = wc.custrecord_ddc_wcl_pref_if_bin.length > 0 ? wc.custrecord_ddc_wcl_pref_if_bin[0].text : '' // v1.2.0 Added on August 22, 2023 - DDC CO019
                var alternateBinText = wc.custrecord_ddc_wcl_alt_if_bin.length > 0 ? wc.custrecord_ddc_wcl_alt_if_bin[0].text : '' // v1.2.0 Added on August 22, 2023 - DDC CO019

                rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_schedule_sequence', value: wc.custrecord_ddc_wcl_default_sched_seq, ignoreFieldChange: true })
                rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_planned_machine', value: wc.custrecord_ddc_wcl_machine.length ? wc.custrecord_ddc_wcl_machine[0].value : '', ignoreFieldChange: true })
                rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_machine_hour_rate', value: wc.custrecord_ddc_wcl_machine_hour_rate, ignoreFieldChange: true })
                rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_labour_hour_rate', value: wc.custrecord_ddc_wcl_labour_rate, ignoreFieldChange: true })
                rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_labour_oh_rate', value: wc.custrecord_ddc_wcl_labour_oh_rate, ignoreFieldChange: true })
                rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_pref_fulfillment_bin_id', value: preferredBin, ignoreFieldChange: true }) // v1.2.0 Added on August 22, 2023 - DDC CO019
                rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_alt_fulfillment_bin_id', value: alternateBin, ignoreFieldChange: true }) // v1.2.0 Added on August 22, 2023 - DDC CO019
                rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_pref_fulfillment_bin', value: preferredBinText, ignoreFieldChange: true }) // v1.2.0 Added on August 22, 2023 - DDC CO019
                rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_alt_fulfillment_bin', value: alternateBinText, ignoreFieldChange: true }) // v1.2.0 Added on August 22, 2023 - DDC CO019
            }
            // refreshSublist()
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
            let rec = scriptContext.currentRecord
            if (scriptContext.fieldId == 'item') {

            }
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
            if (MODE == 'edit') {
                let rec = scriptContext.currentRecord
                // Copy site main to site custcol
                if (scriptContext.sublistId == 'item') {
                    let siteMain = rec.getValue({ fieldId: 'custbody_ddc_site' })
                    let siteSub = rec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_site' }) || nlapiGetCurrentLineItemValue('item', 'custcol_ddc_site')
                    // console.log('Transaction Line Sourcing CS > lineInit', { siteMain, siteSub })
                    if (!siteMain || siteSub) return

                    rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_site', value: siteMain, ignoreFieldChange: false })
                    refreshSublist()
                }
            }
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
        function validateLine1(scriptContext) {
            console.log('validateLine', scriptContext)
            if (scriptContext.sublistId == 'item') {
                try {
                    let rec = scriptContext.currentRecord
                    let line = rec.getCurrentSublistIndex({ sublistId: 'item' })
                    let siteSub = nlapiGetCurrentLineItemValue('item', 'custcol_ddc_site')
                    let workCentreGroup = nlapiGetCurrentLineItemValue('item', 'custcol_ddc_work_centre_group')
                    let rate = parseFloatOrZero(nlapiGetCurrentLineItemValue('item', 'rate'))
                    let amount = parseFloatOrZero(nlapiGetCurrentLineItemValue('item', 'amount'))
                    let workCentreId = nlapiGetCurrentLineItemValue('item', 'custcol_ddc_work_centre')
                    let machine = nlapiGetCurrentLineItemValue('item', 'custcol_ddc_planned_machine')

                    if (workCentreId)
                        return true

                    console.log('Transaction Line Sourcing CS > validateLine true', { siteSub, workCentreGroup, line, rate, amount })

                    if (!siteSub || !workCentreGroup) {
                        rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_work_centre', value: '', ignoreFieldChange: false })
                        rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_planned_machine', value: '', ignoreFieldChange: true })
                        // refreshSublist()
                        return true
                    } else {
                        let wcg = search.create({
                            type: 'customrecord_ddc_work_centre',
                            filters: [
                                ['custrecord_ddc_wcl_work_centre_group', 'is', workCentreGroup],
                                'AND',
                                ['custrecord_ddc_wcl_site', 'is', siteSub],
                                'AND',
                                ['custrecord_ddc_wcl_default_at_site', 'is', 'T']
                            ],
                            columns: ['custrecord_ddc_wcl_machine']
                        })
                        let results = wcg.run().getRange({ start: 0, end: 1 })
                        console.log('RESULTS', results)
                        // workCentreId = '', machine = ''
                        if (results.length) {
                            workCentreId = results[0].id
                            machine = results[0].getValue({ name: 'custrecord_ddc_wcl_machine' })
                        }
                        rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_work_centre', value: workCentreId, ignoreFieldChange: true })
                        rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ddc_planned_machine', value: machine, ignoreFieldChange: true })
                        populateWorkCentreFields(rec, workCentreId)
                        // refreshSublist()
                        return true
                    }
                } catch (e) {
                    console.log('Error validateLine', e)
                }
            }
            return true
        }
        function validateLine(scriptContext) {
            console.log('validateLine', scriptContext)
            if (scriptContext.sublistId == 'item') {
                try {
                    let rec = scriptContext.currentRecord
                    let line = rec.getCurrentSublistIndex({ sublistId: 'item' })
                    let rate = parseFloatOrZero(nlapiGetCurrentLineItemValue('item', 'rate'))
                    let amount = parseFloatOrZero(nlapiGetCurrentLineItemValue('item', 'amount'))
                    let manualRate = nlapiGetCurrentLineItemValue('item', 'custcol_ddc_manual_rate')
                    log.debug("manualRate", manualRate);
                    if (manualRate == "T" && rate && amount)
                        return true
                    else {
                        return false

                    }
                } catch (e) {
                    console.log('Error validateLine', e)
                }
            }
            return true
        }
        const refreshSublist = () => nlapiRefreshLineItems('item')

        return {
            pageInit,
            fieldChanged,
            // postSourcing,
            // lineInit,
            //validateLine
        };

    });
