/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NAmdConfig /SuiteScripts/IVE Scripts/Modules/amdconfig.json
 */
define(
  [
    'common',
    'papaparse',
    'moment-tz',
    'numeral',
    'lodash'
  ],

  /**
   * @param {CommonModule} common
   * @param {Papa} papaparse
   * @param {moment} moment
   * @param {numeral} numeral
   * @param {lodash} lodash
   */
  (
    common,
    papaparse,
    moment,
    numeral,
    lodash
  ) => {
    /**
     * Defines the Suitelet script trigger point.
     * @param {Object} scriptContext
     * @param {ServerRequest} scriptContext.request - Incoming request
     * @param {ServerResponse} scriptContext.response - Suitelet response
     * @since 2015.2
     */
    function onRequest(scriptContext) {

      try {

        common.startScript(scriptContext);
        common.enterContext('onRequest');

        common.logMsg('debug', 'Testing...');
        common.logVal('debug', 'Lodash Version', lodash.VERSION);
        common.logVal('debug', 'Moment Current date and time in Sydney', moment.tz('Australia/Sydney').format('DD/MM/YYYY HH:mm'));
        common.logVal('debug', "Numeral('1,000')", numeral('1,000').value());
        common.logVal('debug', 'papaparse.BAD_DELIMITERS', papaparse.BAD_DELIMITERS);
        common.logMsg('debug', 'Tests Completed');

      } catch (e) {

        common.logErr('emergency', e);

      }

    }

    return { onRequest }

  }
);