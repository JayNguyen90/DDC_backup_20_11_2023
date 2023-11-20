/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/runtime', 'N/search', './lib/ns.utils', 'N/email'],
    /**
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 */
    (record, runtime, search, ns_utils, email) => {
        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */

        const getInputData = (inputContext) => {
            // return ["143250","133626","133624","132886","130332","129330","121963","134144","134141","149590","151828","153090","153791","155799","153792","155391","149804","149793","149500","149791","151489","149499","149790","149508","149593","153896","149506","149789","151826","153289","153794","153911","149501","149792","153998","153906","153798","156095","155693","155995","155796","155492","155591","151822","153796","151837","152991","155395","153191","151820","153891","151827","153889","153989","153899","153907","156194","155691","155694","154090","153890","151903","151819","151836","151998","153894","153789","149498","149507","149803","149802","149502","149805","149801","152990","155592","155491","155593","152989","153091","153991","151829","153990","151831","153795","153892","153790","151905","151835","151823","154089","151830","153893","151833","151834","154189","151832","153189","153793","149301","149589","149492","149491","149303","149300","149490","149302","149489","155393","155392","149304","149591","149496","155797","155798","155696","155792","155692","155791","155394","156099","155994","156096","155891","155794","155795","156097","156094","156098","155793","155800","155695","151794","151891","151900","151691","151995","151805","151790","149689","149497","149305","149494","149495","149493","153895","151824","151997","151792","151796","151818","151896","151812","151996","151899","151994","151901","151889","151789","151809","151803","151991","151892","151993","151793","151798","151894","151806","151490","151992","151897","151589","151825","151821","153089","151904","151989","151592","151816","151690","151893","151795","151902","151814","151801","151804","151491","151590","151898","151808","151797","151813","151895","151791","151810","151689","151815","151799","151802","151591","151890","151807","151990","151817","151811","151800","152089","151906","153190","153992","153806","153804","154092","153809","153903","153904","153808","153902","153999","153913","153800","153909","153797","153915","154190","153997","153807","153805","153799","153897","153908","153993","153996","153910","153898","153905","153810","153803","154091","153901","153916","153900","154093","153994","153912","153914","153995","153801","153802"] // 249 bills
            // return [
            //     156298,
            //     156398,
            //     156296,
            //     156397,
            //     156297,
            //     156396,
            //     156300,
            //     156301,
            //     156399,
            //     156299,
            //     159300,
            //     159302,
            //     134144,
            //     133624
            // ] // 14 bills
            // Generate file SS
            let ls = search.load('customsearch2131') // Invoice sent 20220512-012550
            ls = ns_utils.expandSearch(ls)
            let ids = ls.map(m => m.id)

            let reversed = []
 
            for (var i = ids.length - 1; i >= 0; i--) 
                reversed.push(ids[i])

            log.debug('IDS LENGTH', reversed.length)
            return reversed
            
            // Delete payments
            /* let ls = search.load('customsearch1946') // Payments created May102022
            ls = ns_utils.expandSearch(ls)
            let ids = ls.map(m => m.id) */
            // Process file SS
            /* let ls = search.load('customsearch1945') // Revert bills to process May102022
            ls = ns_utils.expandSearch(ls)
            let ids = ls.map(m => m.id) */

            log.debug('IDS LENGTH', ids.length)
            return ids
        }

        /**
         * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
         * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
         * context.
         * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
         *     is provided automatically based on the results of the getInputData stage.
         * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
         *     function on the current key-value pair
         * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
         *     pair
         * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} mapContext.key - Key to be processed during the map stage
         * @param {string} mapContext.value - Value to be processed during the map stage
         * @since 2015.2
         */

        const map = (mapContext) => {
            let id = mapContext.value
            // Generate file SS
            try {
                record.submitFields({
                    type: 'vendorbill',
                    id,
                    values: {
                        custbody_payment_status: 1,
                        custbody_sent_to_sftp: false,
                        custbody_westpac_ref_id: ''
                    },
                    options: {
                        ignoreMandatoryFields: true,
                    }
                })
                log.debug('Success updating internalid', id)
            } catch(e) {
                log.debug('Error updating internalid', { id,e })
            }
            // Delete payments
            /* try {
                record.delete({
                    type: 'vendorpayment',
                    id
                })
                log.debug('Success deleting internalid', id)
            } catch(e) {
                log.debug('Error deleting internalid', { id,e })
            } */
            // Process file SS
            /* try {
                record.submitFields({
                    type: 'vendorbill',
                    id,
                    values: {
                        custbody_payment_status: 1,
                        custbody_sftp_status_file_source: ''
                    },
                    options: {
                        ignoreMandatoryFields: true,
                    }
                })
                log.debug('Success updating internalid', id)
            } catch(e) {
                log.debug('Error updating internalid', { id,e })
            } */
        }

        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */
        const reduce = (reduceContext) => {

        }


        /**
         * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
         * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
         * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
         * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
         *     script
         * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
         * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
         * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
         * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
         *     script
         * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
         * @param {Object} summaryContext.inputSummary - Statistics about the input stage
         * @param {Object} summaryContext.mapSummary - Statistics about the map stage
         * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
         * @since 2015.2
         */
        const summarize = (summaryContext) => {
            email.send({
                author: -5,
                body: 'LETS GO',
                recipients: [75608, 'leancendana@gmail.com', 'lean.cendana@jcurve.com.au'],
                subject: 'DONE'
            })
        }

        return {getInputData, map, reduce, summarize}

    });
