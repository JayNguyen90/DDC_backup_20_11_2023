/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(
  [
    'N/error',
    'N/runtime',
    'N/ui/serverWidget'
  ],

  /**
* @param {error} error
* @param {runtime} runtime
* @param {serverWidget} serverWidget
*/
  (
    error,
    runtime,
    serverWidget
  ) => {

    const SCRIPT_PARAM_LOCK_SUBSIDIARY_ID = 'custscript_ive_glob_lock_trans_doc_no_su';

    /**
     * Defines the function definition that is executed before record is loaded.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
     * @param {Form} scriptContext.form - Current form
     * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
     * @since 2015.2
     */
    function beforeLoad(scriptContext) {

      let script = runtime.getCurrentScript();

      if (scriptContext.type !== scriptContext.UserEventType.EDIT) {

        return;

      }

      try {

        let lockSubsidiaryId =
          Number(
            script.getParameter(
              {
                name: SCRIPT_PARAM_LOCK_SUBSIDIARY_ID
              }
            ) || '0'
          );

        if (lockSubsidiaryId === 0) {

          throw error.create(
            {
              name: 'IVE_MISCONFIGURED_DEPLOYMENT',
              message: 'Lock Subsidiary not provided',
              notifyOff: false
            }
          );

        }

        let user = runtime.getCurrentUser();

        if (user.subsidiary !== lockSubsidiaryId) {

          return;

        }

        if (scriptContext.form) {

          let field = scriptContext.form.getField({ id: 'tranid' });

          field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        }

      } catch (e) {

        log.error(
          {
            title: 'Script: ' + script.id + ' Deployement: ' + script.deploymentId,
            details: e.name + ' - ' + e.message
          }
        );

      }

    }

    /**
     * Defines the function definition that is executed before record is submitted.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
     * @since 2015.2
     */
    const beforeSubmit = (scriptContext) => {

      // Not used

    }

    /**
     * Defines the function definition that is executed after record is submitted.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
     * @since 2015.2
     */
    const afterSubmit = (scriptContext) => {

      // Not used

    }

    return {
      beforeLoad,

      // Not used

      // beforeSubmit,
      // afterSubmit
    }

  }
);
