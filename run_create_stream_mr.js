/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define(['N/record', 'N/runtime', 'N/search', 'N/xml', 'N/task', './run_creation_cm', './lib/moment.min', './lib/ns.utils', 'N/format'],
    /**
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 * @param{task} task
 * 
 * - Summary > consolidate run objects > filterout > reexecute
 */
    (record, runtime, search, xml, task, cm, moment, ns_utils, format) => {
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
            let scriptParam = scriptParams()
            let runs = scriptParam.runs
            var soRec = record.load({
                id: scriptParam.jobId,
                type: 'salesorder'
            });
            soRec.setValue({ fieldId: 'custbody_ddc_job_status', value: 2 })
            soRec.setValue('custbody_ddc_runs_created', true);
            var recId = soRec.save();
            log.debug("recId", recId)
            log.debug('-------- [START] --------', { id: scriptParam.jobId, retry: scriptParam.retry, runsLength: runs.length, runs })

            return runs
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
        // Create runs
        const map = (mapContext) => {
            let scriptParam = scriptParams()
            log.debug("scriptParam", scriptParam);
            let run = JSON.parse(mapContext.value)
            try {
                log.debug("runssssssssssssssssss", run);
                run['custrecord_ddc_run_planned_startdate_dt'] = run['custrecord_ddc_run_planned_startdate']
                run['custrecord_ddc_run_planned_enddate_dt'] = run['custrecord_ddc_run_planned_enddate']
                run['custrecord_ddc_run_planned_startdate'] = format.parse({ value: run['custrecord_ddc_run_planned_startdate'] + " " + " " + "12:00:00 AM", type: format.Type.DATETIME });
                run['custrecord_ddc_run_planned_enddate'] = format.parse({ value: run['custrecord_ddc_run_planned_enddate'] + " " + "11:59:00 PM", type: format.Type.DATETIME });
                log.debug("final run", run);
                run.id = ns_utils.createRecord(run.type, run)
                log.debug("run id", run.id)
                for (detail of run.details) {
                    if (cm.getRemainingUsage() < 100)
                        break

                    detail.custrecord_ddc_rd_parent_run = run.id
                    detail.custrecord_ddc_rd_planned_startdate = run.custrecord_ddc_run_planned_startdate_dt
                    detail.custrecord_ddc_rd_planned_enddate = run.custrecord_ddc_run_planned_enddate_dt
                    try {
                        mapContext.write({
                            key: `${run.id}###${detail.custrecord_ddc_rd_lineid}`,
                            value: run
                        })
                        log.debug(`JobId:${scriptParam.jobId} => Run detail creation remaining usage`, cm.getRemainingUsage())
                    } catch (e) {
                        log.debug(`JobId:${scriptParam.jobId} => Run detail creation error: ${detail.custrecord_ddc_rd_lineid}`, e.message)
                    }
                }
            } catch (e) {
                log.debug(`JobId:${id} => Run creation error:${run.custrecord_ddc_run_id}`, e.message)
            }
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
        // Create run details
        const reduce = (reduceContext) => {
            let runs = reduceContext.values.map(m => JSON.parse(m))
            let detail = runs[0].details.find(f => f.custrecord_ddc_rd_lineid == reduceContext.key.split('###')[1])
            if (detail) {

                try {
                    log.debug("dkm", detail)
                    cm.parseDateValueFields(detail)
                    detail.id = ns_utils.createRecord(detail.type, detail)
                    log.debug("detail.id", detail.id)
                } catch (error) {
                    log.debug("error", error)
                }

            }
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

        }

        const scriptParams = () => {
            let script = runtime.getCurrentScript()
            return {
                jobId: script.getParameter({ name: 'custscript_jcs_run_create_stream_jobid' }),
                runs: JSON.parse(script.getParameter({ name: 'custscript_jcs_data_run_detail' }) || '[]'),
            }
        }

        const logErrors = ctx => {
            let scriptParam = scriptParams()
            let errorStack = []
            if (ctx.inputSummary.error) {
                errorStack.push(`Input Error: ${ctx.inputSummary.error}`)
                log.debug('Input Error', ctx.inputSummary.error)
            }

            ctx.mapSummary.errors.iterator().each((code, message) => {
                errorStack.push(`Map Error ${code}: ${message}`)
                // if (!(code+message).match(/unexpected error/gi))
                log.debug(`Map Error ${code}`, message)
                return true
            })
            ctx.reduceSummary.errors.iterator().each((code, message) => {
                errorStack.push(`Reduce Error ${code}: ${message}`)
                log.debug(`Reduce Error ${code}`, message)
                return true
            })
            log.debug(`JobId:${scriptParam.jobId} => Error stack`, errorStack)
            return errorStack
        }

        return { getInputData, map, reduce, summarize }

    });
