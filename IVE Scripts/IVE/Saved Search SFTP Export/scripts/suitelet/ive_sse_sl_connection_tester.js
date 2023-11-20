/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NAmdConfig /SuiteScripts/IVE Scripts/Modules/amdconfig.json
 */
define(
  [
    'N/file',
    'N/https',
    'N/runtime',
    'N/search',
    'N/sftp',
    'N/ui/serverWidget',
    'common',
    '../../modules/constants'
  ],

  /**
* @param {file} file
* @param {https} https
* @param {runtime} runtime
* @param {search} search
* @param {sftp} sftp
* @param {serverWidget} serverWidget
* @param {CommonModule} common
* @param {ConstantsModule} constants
*/
  (
    file,
    https,
    runtime,
    search,
    sftp,
    serverWidget,
    common,
    constants
  ) => {

    /**
     * Defines the Suitelet script trigger point.
     * @param {Object} scriptContext
     * @param {ServerRequest} scriptContext.request - Incoming request
     * @param {ServerResponse} scriptContext.response - Suitelet response
     * @since 2015.2
     */
    const onRequest = (scriptContext) => {

      if (scriptContext.request.method === https.Method.GET) {

        try {

          let form =
            serverWidget.createForm(
              {
                title: 'SFTP Connection Tester'
              }
            );
          let field;

          form.addSubmitButton(
            {
              label: 'Test'
            }
          );
          field =
            form.addField(
              {
                id: 'custpage_connection',
                label: 'SFTP Connection',
                type: serverWidget.FieldType.SELECT,
                source: constants.RECORDS.CUSTOM.SFTP_CONFIG.ID
              }
            );

          scriptContext.response.writePage(
            {
              pageObject: form
            }
          );

        } catch (e) {

          common.logErr('error', e);

        }

      } else if (scriptContext.request.method === https.Method.POST) {

        let results = [];

        try {


          let connectionId =
            scriptContext.request.parameters['custpage_connection'];
          let details =
            search.lookupFields(
              {
                type: constants.RECORDS.CUSTOM.SFTP_CONFIG.ID,
                id: connectionId,
                columns:
                  [
                    constants.RECORDS.CUSTOM.SFTP_CONFIG.FIELDS.HOST.ID,
                    constants.RECORDS.CUSTOM.SFTP_CONFIG.FIELDS.PORT.ID,
                    constants.RECORDS.CUSTOM.SFTP_CONFIG.FIELDS.HOST_KEY.ID,
                    constants.RECORDS.CUSTOM.SFTP_CONFIG.FIELDS.USER_NAME.ID,
                    constants.RECORDS.CUSTOM.SFTP_CONFIG.FIELDS.USER_KEY.ID,
                    constants.RECORDS.CUSTOM.SFTP_CONFIG.FIELDS.HOST_DIR.ID
                  ]
              }
            );
          let connection = null;

          connection =
            sftp.createConnection(
              {
                url: details[constants.RECORDS.CUSTOM.SFTP_CONFIG.FIELDS.HOST.ID],
                keyId: details[constants.RECORDS.CUSTOM.SFTP_CONFIG.FIELDS.USER_KEY.ID],
                // Placeholder here in case required in future for 2FA
                // secret: '',
                hostKey: details[constants.RECORDS.CUSTOM.SFTP_CONFIG.FIELDS.HOST_KEY.ID],
                username: details[constants.RECORDS.CUSTOM.SFTP_CONFIG.FIELDS.USER_NAME.ID],
                port: Number(details[constants.RECORDS.CUSTOM.SFTP_CONFIG.FIELDS.PORT.ID]),
                directory: details[constants.RECORDS.CUSTOM.SFTP_CONFIG.FIELDS.HOST_DIR.ID] //,
                // Placeholder here in case required in future
                // timeout: '',
                // Placeholder here in case required in future
                // hostKeyType: ''
              }
            );

          results.push('Connection opened');

          let list =
            connection.list(
              {
                path: './',
                sort: sftp.Sort.NAME
              }
            );

          results.push('Current directory: ' + details[constants.RECORDS.CUSTOM.SFTP_CONFIG.FIELDS.HOST_DIR.ID]);
          results.push('Listed current directory');

          if (list.length === 0) {

            results.push('Directory is empty');

          } else {

            list.forEach(
              (item) => {

                if (item.directory) {

                  results.push(item.name + '/');

                } else {

                  results.push(item.name);

                }

              }
            );

          }

          results.push('');
          results.push('!!! Connection Test SUCCESSFUL');

        } catch (e) {

          common.logErr('error', e);

          results.push('!!! Connection Test FAILED: ' + e.name + ' - ' + e.message);

        }

        results.forEach(
          (line) => {

            scriptContext.response.writeLine(
              {
                output: (line || ' ')
              }
            );

          }
        );

      }
    }

    return { onRequest };

  }
);