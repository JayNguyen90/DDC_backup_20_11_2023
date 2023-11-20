/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NAmdConfig /SuiteScripts/IVE Scripts/Modules/amdconfig.json
 */
define(
  [
    'N/file',
    'N/runtime',
    'N/search',
    'N/sftp',
    'common',
    'papaparse',
    'moment-tz',
    '../../modules/data',
    '../../modules/constants'
  ],

  /**
* @param {file} file
* @param {runtime} runtime
* @param {search} search
* @param {sftp} sftp
* @param {CommonModule} common
* @param {Papa} papaparse
* @param {moment} moment
* @param {DataModule} data
* @param {ConstantsModule} constants
*/
  (
    file,
    runtime,
    search,
    sftp,
    common,
    papaparse,
    moment,
    data,
    constants
  ) => {

    class DataTransformer {

      static getTransformer(name) {

        common.logVal('debug', 'name', name);

        if (!util.isString(name) || (name.trim() === '')) {

          throw new TypeError('Invalid transformer name: ' + name);

        }

        let _name = name.toLowerCase().trim();

        switch (_name) {

          case 'toyesno':

            return DataTransformer._convertBooleanToText

          case 'removehierarchy':

            return DataTransformer._removeHierarchyFromText;

          default:
            throw new TypeError('Unknown transformer name: ' + _name);

        }

      }

      static _convertBooleanToText(rawValue) {

        let transformedValue;

        try {

          common.enterContext('_convertBooleanToText'); // _convertBooleanToText

          common.logVal('debug', 'rawValue', rawValue);

          if (rawValue === true) {

            transformedValue = 'Yes';

          } else if (rawValue === false) {

            transformedValue = 'No';

          } else {

            transformedValue = '';

          }

        } catch (e) {

          transformedValue = 'Transformation Error';

          common.logErr('error', e);

        } finally {

          common.leaveContext(); // _convertBooleanToText

        }

        return transformedValue;

      }

      static _removeHierarchyFromText(rawValue) {

        let transformedValue = '';

        try {

          common.enterContext('_removeHierarchyFromText'); // _removeHierarchyFromText

          common.logVal('debug', 'rawValue', rawValue);

          if (util.isString(rawValue)) {

            if (rawValue.indexOf(':') !== -1) {

              let lastIndex = rawValue.lastIndexOf(':');

              transformedValue =
                (rawValue.substring(lastIndex + 1) || '')
                  .trim();

            }

          }

        } catch (e) {

          transformedValue = 'Transformation Error';

          common.logErr('error', e);

        } finally {

          common.leaveContext(); // _removeHierarchyFromText

        }

        return transformedValue;

      }

    }

    /**
     * Defines the Scheduled script trigger point.
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
     * @since 2015.2
     */
    function execute(scriptContext) {

      common.startScript(scriptContext);

      common.enterContext('execute'); // execute

      try {

        // Get script parameter values

        let script = runtime.getCurrentScript();

        let searchId =
          script.getParameter(
            {
              name: constants.SCRIPTS.SAVED_SEARCH_EXPORTER.PARAMS.SAVED_SEARCH.ID
            }
          );

        let searchType =
          script.getParameter(
            {
              name: constants.SCRIPTS.SAVED_SEARCH_EXPORTER.PARAMS.SEARCH_TYPE.ID
            }
          );

        let searchMap =
          script.getParameter(
            {
              name: constants.SCRIPTS.SAVED_SEARCH_EXPORTER.PARAMS.MAPPING.ID
            }
          );

        let connectionId =
          script.getParameter(
            {
              name: constants.SCRIPTS.SAVED_SEARCH_EXPORTER.PARAMS.SFTP_CONN.ID
            }
          );

        let csvFileName =
          script.getParameter(
            {
              name: constants.SCRIPTS.SAVED_SEARCH_EXPORTER.PARAMS.FILE_NAME.ID
            }
          );

        let addBlankLine =
          script.getParameter(
            {
              name: constants.SCRIPTS.SAVED_SEARCH_EXPORTER.PARAMS.ADD_BLANK.ID
            }
          );

        let LineSeparatorCodes =
          script.getParameter(
            {
              name: constants.SCRIPTS.SAVED_SEARCH_EXPORTER.PARAMS.LINE_SEP.ID
            }
          );

        let testFileGen =
          script.getParameter(
            {
              name: constants.SCRIPTS.SAVED_SEARCH_EXPORTER.PARAMS.TEST_CREATE.ID
            }
          );

        // Ensure that value is boolean

        testFileGen = (!!testFileGen);

        let lineSeparator = '\r\n';
        let mapping;

        common.logVal('debug', 'searchId', searchId);
        common.logVal('debug', 'searchType', searchType);
        common.logVal('debug', 'searchMap', searchMap);
        common.logVal('debug', 'connectionId', connectionId);
        common.logVal('debug', 'csvFileName', csvFileName);
        common.logVal('debug', 'csvFileName', addBlankLine);
        common.logVal('debug', 'csvFileName', LineSeparatorCodes);
        common.logVal('debug', 'testFileGen', testFileGen);

        if (!searchId) {

          throw new Error('No search configured in the script deployment record');

        }

        if (!searchType) {

          throw new Error('No search type configured in the script deployment record');

        }

        if (!util.isString(searchMap) || searchMap.trim() === '') {

          throw new Error('No search map configured in the script deployment record');

        }

        if (!util.isString(csvFileName) || csvFileName.trim() === '') {

          common.logMsg('audit',
            'WARNING: No file name is configured in the script deployment record'
          );

          csvFileName = '';

        }

        if (util.isString(LineSeparatorCodes) && LineSeparatorCodes.trim() !== '') {

          let codes = LineSeparatorCodes.split(',');
          lineSeparator = '';

          codes.forEach(
            (code) => {

              let _code = Number(code.trim());

              if (isNaN(_code)) {

                throw new Error('Invalid Line Separator Codes configured in the script deployment record');

              }

              lineSeparator += String.fromCharCode(code);
            }
          );

        }

        try {

          mapping = JSON.parse(searchMap);

        } catch (e) {

          common.logErr('error', e);

          throw new Error('Invalid search map configured in the script deployment record');

        }

        if (!connectionId) {

          throw new Error('No SFTP Connection configured in the script deployment record');

        }

        // Run the specified search

        let srch = search.load(
          {
            type: searchType,
            id: searchId
          }
        );

        let results = data.getSearchResults(srch);

        common.logVal('debug', 'results', results);

        // Create the CSV file with the search results

        let csvData = [];
        let header = ['Internal ID'];

        srch.columns.forEach(
          (column) => {

            header.push(column.label);

          }
        );

        results.forEach(
          (result, index) => {

            try {

              common.enterContext('results[' + index + ']'); // results[index]

              // First column is always the internal id of the result record

              let row = [result.id];

              srch.columns.forEach(
                (column, index) => {

                  try {

                    common.enterContext(column.name); // column.name

                    let valueType = mapping[column.label]['use'];
                    let transform = mapping[column.label]['transform'];
                    let value = result[column.name][valueType];

                    common.logVal('debug', 'valueType', valueType);
                    common.logVal('debug', 'transform', transform);

                    common.logVal('debug', 'raw value', value);

                    if (util.isString(transform) && (transform.trim() !== '')) {

                      // Apply transformation

                      value = DataTransformer.getTransformer(transform)(value);

                    }

                    common.logVal('debug', 'transformed value', value);

                    row.push(value);

                  } catch (e) {

                    common.logErr('error', e);

                  } finally {

                    common.leaveContext(); // column.name

                  }

                }
              );

              csvData.push(row);

            } catch (e) {

              common.logErr('error', e);

            } finally {

              common.leaveContext(); // results[index]

            }

          }
        );

        if (addBlankLine === true) {

          csvData.push([]);

        }

        common.logVal('debug', 'csvData', csvData);

        let csvContents =
          papaparse.unparse(
            {
              fields: header,
              data: csvData
            }
            ,
            {
              'newline': lineSeparator
            }
          );

        common.logVal('debug', 'csvContents', csvContents);

        // TODO: Check whether timezone can be left hardcoded or needs to be configurable and amend as appropriate

        let now = moment.tz('Australia/Sydney');
        let fileName =
          (
            (runtime.envType !== runtime.EnvType.PRODUCTION) ?
              'TEST_' :
              ''
          );

        if (csvFileName) {

          fileName += csvFileName.replace(/\s+/g, '_') + '_';

        } else {

          fileName += srch.id + '_';

        }

        fileName += now.format('DD-MM-YYYY_HH-mm');

        fileName += '.csv';

        common.logVal('debug', 'fileName', fileName);

        let csvFile =
          file.create(
            {
              name: fileName,
              fileType: file.Type.CSV,
              contents: csvContents,
              encoding: file.Encoding.UTF_8
            }
          );

        common.logMsg('audit', 'CSV file created');

        if (testFileGen === true) {

          csvFile.folder = -15;
          csvFile.save();

          common.logMsg('audit', 'CSV file saved');

          return;

        }

        // Connect to the SFTP server and upload the file

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
                  constants.RECORDS.CUSTOM.SFTP_CONFIG.FIELDS.HOST_DIR.ID,
                  constants.RECORDS.CUSTOM.SFTP_CONFIG.FIELDS.ENVIRON.ID +
                  '.' +
                  constants.RECORDS.CUSTOM.SFTP_CONFIG_ENV.FIELDS.ENV_TYPE.ID
                ]
            }
          );

        //
        // N.B. details intentioanlly NOT LOGGED to prevent host key being leaked to the logs
        //

        if (details === null) {

          // Invalid connectionId

          throw new Error('SFTP Connection configured in the script deployment record is not valid');

        }

        let configEnv =
          details[
          constants.RECORDS.CUSTOM.SFTP_CONFIG.FIELDS.ENVIRON.ID +
          '.' +
          constants.RECORDS.CUSTOM.SFTP_CONFIG_ENV.FIELDS.ENV_TYPE.ID
          ];

        common.logVal('debug', 'configEnv', configEnv);

        if (configEnv !== runtime.envType) {

          common.logMsg(
            'audit',
            'WARNING: script is running in ' + runtime.envType +
            ' but with a configuration for ' + (configEnv || 'NO') +
            ' environment'
          );

          if (runtime.envType !== runtime.EnvType.PRODUCTION) {

            throw new Error('Script misconfigured with incorrect credentials');

          }

        }

        let connection = null;
        let allowOverwrite = (runtime.envType !== runtime.EnvType.PRODUCTION);

        common.logVal('debug', 'allowOverwrite', allowOverwrite);

        connection =
          sftp.createConnection(
            {
              url: details[constants.RECORDS.CUSTOM.SFTP_CONFIG.FIELDS.HOST.ID],
              keyId: details[constants.RECORDS.CUSTOM.SFTP_CONFIG.FIELDS.USER_KEY.ID],
              // Placeholder here in case required in future for 2FA
              // secret: '',
              hostKey: details[constants.RECORDS.CUSTOM.SFTP_CONFIG.FIELDS.HOST_KEY.ID],
              username: details[constants.RECORDS.CUSTOM.SFTP_CONFIG.FIELDS.USER_NAME.ID],
              port: Number(details[constants.RECORDS.CUSTOM.SFTP_CONFIG.FIELDS.PORT.ID] || '22'),
              directory: details[constants.RECORDS.CUSTOM.SFTP_CONFIG.FIELDS.HOST_DIR.ID]
              // Placeholder here in case required in future
              // timeout: '',
              // Placeholder here in case required in future
              // hostKeyType: ''
            }
          );

        common.logMsg('audit', 'SFTP connection opened');

        // N.B. Just for assisting in troubleshooting remote path issues

        let list =
          connection.list(
            {
              path: './',
              sort: sftp.Sort.NAME
            }
          );

        common.logVal('debug', 'list', list);

        connection.upload(
          {
            file: csvFile,
            // Placeholder here in case required in future
            // filename: ''
            directory: './',
            replaceExisting: allowOverwrite
          }
        );

        common.logMsg(
          'audit',
          'CSV file sent to ' +
          details[constants.RECORDS.CUSTOM.SFTP_CONFIG.FIELDS.HOST_DIR.ID]
        );

      } catch (e) {

        common.logErr('error', e);

      } finally {

        common.leaveContext(); // execute

      }
    }

    return { execute };

  }
);