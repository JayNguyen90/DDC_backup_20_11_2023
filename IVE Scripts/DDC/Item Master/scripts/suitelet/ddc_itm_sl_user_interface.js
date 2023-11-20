/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NAmdConfig /SuiteScripts/IVE Scripts/Modules/amdconfig.json
 */
define(
  [
    'N/error',
    'N/query',
    'N/runtime',
    'N/search',
    'N/ui/serverWidget',
    'N/url',
    'common',
    '../../modules/constants',
    '../../modules/forms'
  ],

  /**
   * @param {error} error
   * @param {query} query
   * @param {runtime} runtime
   * @param {search} search
   * @param {dialog} dialog
   * @param {message} message
   * @param {serverWidget} serverWidget
   * @param {url} url
   * @param {CommonModule} common
   * @param {object} constants
   * @param {FormsModule} forms
   */
  (
    error,
    query,
    runtime,
    search,
    serverWidget,
    url,
    common,
    constants,
    forms
  ) => {
    const SEARCH_ID_ITEM_SEARCH_SEARCH = 'customsearch_itm_item_saved_searches';
    const REQ_PARAM_ITEM_SEARCH = 'custpage_item_search';

    /**
     * Defines the Suitelet script trigger point.
     * @param {Object} scriptContext
     * @param {ServerRequest} scriptContext.request - Incoming request
     * @param {ServerResponse} scriptContext.response - Suitelet response
     * @since 2015.2
     */
    const onRequest = (scriptContext) => {

      // Get script parameter values

      let script = runtime.getCurrentScript();
      let recordType =
        script.getParameter(
          {
            name: constants.SCRIPTS.USER_INTERFACE.PARAMS.RECORD_TYPE.ID
          }
        );

      // Get request parameter values

      try {

        forms.createUIForm(
          scriptContext.request,
          scriptContext.response,
          {
            recordtype: recordType //,
            // clientmodule: '../scripts/client/ddc_itm_cs_user_interface.js'
          }
        );

      } catch (e) {

        common.logErr('error', e);

      }

    }

    return { onRequest };
  }
);
