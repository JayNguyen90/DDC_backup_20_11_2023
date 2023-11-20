/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NAmdConfig /SuiteScripts/IVE Scripts/Modules/amdconfig.json
 */
define(
  [
    'N/error',
    'N/https',
    'N/record',
    'N/render',
    'N/search',
    'common'
  ],

  /**
* @param {error} error
* @param {https} https
* @param {record} record
* @param {render} render
* @param {search} search
*/
  (
    error,
    https,
    record,
    render,
    search,
    common
  ) => {
    /**
     * Defines the Suitelet script trigger point.
     * @param {Object} scriptContext
     * @param {ServerRequest} scriptContext.request - Incoming request
     * @param {ServerResponse} scriptContext.response - Suitelet response
     * @since 2015.2
     */
    const onRequest = (scriptContext) => {
      let type;
      let tranId;
      let id;

      try {
        if (scriptContext.request.method !== https.Method.GET) {
          return;
        }

        type = scriptContext.request.parameters['custpage_type'];
        id = scriptContext.request.parameters['custpage_id'];

        if (!type || !id) {
          return;
        }

        common.emailErrorsTo(601581);
        common.startScript(scriptContext);

        common.logVal('debug', 'type', type);
        common.logVal('debug', 'id', id);

        // throw new TypeError('I do not like you');
        // throw error.create(
        //   {
        //     name: 'TPR_TEST_ERROR',
        //     message: 'This is just a test error',
        //     notifyOff: true
        //   }
        // );

        tranId =
          search.lookupFields(
            {
              type: type,
              id: id,
              columns: ['tranid']
            }
          )['tranid'];

        common.logVal('debug', 'tranId', tranId);

        common.enterContext(type);

        if (!tranId) {
          tranId = 'Unknown';
        }

        common.enterContext(tranId);

        let pdfFile =
          render.transaction(
            {
              printMode: render.PrintMode.PDF,
              entityId: Number(id)
            }
          );

        pdfFile.name = tranId + '.pdf';

        common.logMsg('audit', 'PDF rendered');

        scriptContext.response.writeFile(
          {
            file: pdfFile,
            isInline: true
          }
        );
      } catch (e) {
        common.logErr('error', e, 'Failed to print the transaction ' + tranId + ' (' + id + ')');
      }
    };

    return { onRequest };
  }
);