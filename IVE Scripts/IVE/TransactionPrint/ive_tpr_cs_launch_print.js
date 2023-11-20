/**
 * @NApiVersion 2.1
 */
define(
  [
    'N/currentRecord',
    'N/url'
  ],

  /**
   * @param{currentRecord} currentRecord
   */
  (
    currentRecord,
    url
  ) => {
    const SCRIPT_ID_PRINT_SUITELET = 'customscript_ive_tpr_print_transaction';
    const DEPLOY_ID_PRINT_SUITELET = 'customdeploy_ive_tpr_print_transaction';

    const printTransaction =
      () => {
        let tran = currentRecord.get();
        // let id = tran.id;
        // let type = tran.type;
        // let form = tran.getValue({ fieldId: 'customform' });
        // alert('Printing ' + type + ' ' + id + ' form ' + form);
        // alert('Printing ' + type + ' ' + id);
        let params =
          {
            custpage_type: tran.type,
            custpage_id: tran.id
          };

        printUrl =
          url.resolveScript(
            {
              scriptId: SCRIPT_ID_PRINT_SUITELET,
              deploymentId: DEPLOY_ID_PRINT_SUITELET,
              params: params,
              returnExternalUrl: false
            }
          );

          window.open(printUrl, '_blank');
      };

    return { printTransaction };
  }
);