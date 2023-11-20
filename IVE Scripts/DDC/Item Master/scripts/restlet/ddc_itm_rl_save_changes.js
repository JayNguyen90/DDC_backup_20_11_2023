/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NAmdConfig /SuiteScripts/IVE Scripts/Modules/amdconfig.json
 */
define(
  [
    'common',
    '../../modules/constants',
    'N/format',
    'N/record',
    'N/runtime'
  ],

  /**
   *
   * @param {*} common
   * @param {object} constants
   * @param {format} format
   * @param {record} record
   * @param {runtime} runtime
   * @returns
   */
  (
    common,
    constants,
    format,
    record,
    runtime
  ) => {

    // TODO: IMPORTANT!!! : Set To false BEFORE deploying to production

    // const DEBUG_MODE = true;
    // const DEBUG_MODE = false;

    class SaveChangesResponse {
      constructor() {
        // common.enterContext('SaveChangesResponse.constructor');

        this.saved = false;
        this.updated = false;
        this.id = 0;
        this.type = '';
        this.outputType = 'object';

        // this.scriptError = false;
        // this.fieldErrors = {};
        // this.recordErrors = [];
        this.errors = [];
        this.fieldsUpdated = [];

        // let errorCount = 0;
        // let recordCount = 0;

        /*common.logVal('debug', 'requestedChanges', requestedChanges);

        if (util.isObject(requestedChanges)) {
          // TODO: Clean changes in case there are empty or duplicated changes

          common.logMsg('debug', 'Iterating over cleaned requested changes');

          Object.keys(requestedChanges).forEach(
            (recordId, index) => {
              common.enterContext('recordId=' + recordId);
              recordCount++;

              common.logVal('debug', 'recordId', recordId);
              common.logVal('debug', 'recordCount', recordCount);
              common.logVal('debug', 'errorCount', errorCount);

              try {
                // recordId will be a string, so first need to check that it is a valid numeric string

                let _recordId = Number(recordId);

                common.logVal('debug', '_recordId', _recordId);

                if (isNaN(_recordId)) {
                  common.logMsg('error', 'Invalid record id');
                  throw new TypeError('Invalid record id: ' + recordId);
                }

                common.logVal('debug', 'requestedChanges[recordId]', requestedChanges[recordId]);

                if (util.isObject(requestedChanges[recordId])) {
                  // if (Object.keys(requestedChanges[recordId]).length > 0) {

                  this.results[recordId] =
                  {
                    saved: false,
                    errors: []
                  };
                  // }
                } else {
                  throw new TypeError('Invalid changes specification for record id: ' + recordId);
                }
              } catch (e) {
                errorCount++;

                common.logErr('error', e);

                this.results[recordId] =
                {
                  name: e.name,
                  message: e.message
                };

                // Skip processing of this change
              } finally {
                common.leaveContext();
              }
            }
          );

          if (errorCount > 0) {
            this.status = 'partial';

            if (errorCount === recordCount) {
              this.status = 'failed';
            }
          } else {
            this.success = true;
            this.status = 'completed';
          }

          common.logMsg('debug', 'Finished iteration');
        } else {
          this.success = true;
        }

        common.leaveContext();*/
      }

      output(outputType) {
        common.enterContext('SaveChangesResponse.output');

        let _outputType = this.outputType;

        if (outputType) {
          _outputType = outputType;
        }

        switch (_outputType) {
          case 'string':
            common.leaveContext();

            return this.toString();

          case 'object':
            common.leaveContext();

            return this;

          default:
            // Don't leave context here so when the error is caught and logged it will be logged in this context

            throw new TypeError('Invalid Output Type');
        }
      }

      toString() {
        return JSON.stringify(this);
      }
    }

    class SaveChangesScript {
      constructor() {

        // TODO: !!!IMPORTANT!!! change testMode to boolean false BEFORE deploying to production

        // this.testMode = true;
        this.testMode = false;
      }

      get isProd() {
        return (runtime.envType !== runtime.EnvType.SANDBOX);
        // return (runtime.envType === runtime.EnvType.SANDBOX);
      }

      /**
       * Iterates over all of the field internal ids given in `changes` and sets each field to the new value
       * and creates a response to send back
       * @param {record.Record} rcrd Record instance to which to apply the changes loaded in dynamic mode
       * @param {object} changes Map of value changes to make by the internal id of the field to which to change
       * @param {SaveChangesResponse} scriptResponse Container for the information passed back to the script caller
       */
      applyChanges(
        rcrd,
        changes,
        response
      ) {

        common.enterContext('applyChanges');

        // TODO Test applyChanges

        let errors = [];

        Object.keys(changes).forEach(
          (fieldId) => {
            try {
              common.enterContext(fieldId);

              let field = rcrd.getField({ fieldId: fieldId });

              if (field !== null) {
                if (field.type === format.Type.SELECT) {
                  rcrd.setText({ fieldId: fieldId, text: changes[fieldId] });
                } else {
                  rcrd.setValue({ fieldId: fieldId, value: changes[fieldId] });
                }

                response.fieldsUpdated.push(fieldId);
              } else {
                throw constants.ERRORS.ITM_SERVER_ERROR('Field ' + fieldId + ' does not exist');
              }
            } catch (e) {
              common.logErr('error', e);

              errors.push(e);
            } finally {
              common.leaveContext();
            }
          }
        );

        if (Object.keys(errors).length > 0) {
          response.errors = errors;
        } else {
          response.updated = true;
        }

        common.leaveContext();
      }

      getRequestParameters(requestBody, response) {

        common.enterContext('getRequestParameters');

        common.logVal('debug', 'requestBody', requestBody);

        // let returnString = false;
        let _requestBody = requestBody;

        if (util.isString(requestBody)) {
          // returnString = true;

          try {
            _requestBody = JSON.parse(requestBody);
          } catch (e) {
            common.logErr('error', e);

            response.errors.push(constants.ERRORS.ITM_SERVER_ERROR(e.message));

            common.leaveContext();

            return false;
          }
        }

        common.logVal('debug', '_requestBody', _requestBody);

        let recordId = Number(_requestBody[constants.SCRIPTS.SAVE_CHANGES.PARAMS.RECORD_ID]);
        let recordType = (_requestBody[constants.SCRIPTS.SAVE_CHANGES.PARAMS.RECORD_TYPE] || '');
        let changes = (_requestBody[constants.SCRIPTS.SAVE_CHANGES.PARAMS.CHANGES] || {});

        common.logVal('debug', 'recordId', recordId);
        common.logVal('debug', 'recordType', recordType);
        common.logVal('debug', 'changes', changes);
        // common.logVal('debug', 'returnString', returnString);

        if (
          isNaN(recordId) ||
          (recordId < 1) ||
          (recordType.trim() === '')
        ) {

          let e = constants.ERRORS.ITM_SERVER_ERROR('Invalid or missing required parameters');

          common.logErr('error', e);

          response.errors.push(e);

          common.leaveContext();

          return false;
        }

        let params =
        {
          recordId: recordId,
          recordType: recordType,
          changes: changes
        };

        // params.returnType =
        //   (
        //     (returnString === true) ?
        //       'string' :
        //       'object'
        //   );

        common.leaveContext();

        return params;
      }

      /**
       * Defines the function that is executed when a POST request is sent to the RESTlet
       * @param {string | Object} requestBody - The HTTP request body; request body is passed as a string when request
       *     Content-Type is 'text/plain' or parsed into an Object when request Content-Type is 'application/json' (in which case
       *     the body must be a valid JSON)
       * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
       *     Object when request Content-Type is 'application/json' or 'application/xml'
       * @since 2015.2
       */
      processRequest(requestBody, response) {

        try {
          common.startScript();
          common.enterContext('processRequest');
          common.logVal('debug', 'requestBody', requestBody);

          let params = this.getRequestParameters(requestBody, response);

          common.logVal('debug', 'params', params);

          if (params === false) {
            common.leaveContext();

            return;
          }

          common.enterContext(params.recordType);
          common.enterContext(params.recordId.toString());

          response.id = params.recordId;
          response.type = params.recordType;

          let itemRecord;

          try {
            common.logMsg('debug', 'Loading record');

            itemRecord =
              record.load(
                {
                  type: params.recordType,
                  id: params.recordId,
                  isDynamic: true
                }
              );

            common.logMsg('debug', 'Record loaded successfully');
          } catch (e) {
            common.logErr('error', e);

            common.leaveContext();
            common.leaveContext();
            common.leaveContext();

            response.errors.push(e);

            return;
          }

          common.logMsg('debug', 'Applying record changes');

          this.applyChanges(itemRecord, params.changes, response);

          if (response.updated) {
            try {
              common.logMsg('debug', 'Record changes applied successfully');

              if (this.testMode === false) {
                common.logMsg('debug', 'Saving record changes');

                response.id = itemRecord.save();

                common.logMsg('debug', 'Record changes saved successfully');

                response.saved = true;
              } else {
                common.logMsg('debug', 'Skipping the save of record changes in test mode');
              }
            } catch (e) {
              common.logErr('error', e);

              common.logMsg('debug', 'Record changes NOT saved');

              response.errors.push(e);

              common.leaveContext();
              common.leaveContext();
              common.leaveContext();

              return;
            }
          } else {
            common.logMsg('debug', 'Some or all record changes could NOT be applied');
            common.logVal('debug', 'response.fieldsUpdated', response.fieldsUpdated);
          }
        } catch (e) {
          common.logErr('error', e);

          // TODO: Handle roll back additional contexts if something else failing unexpectedly in the script
        }

        // TODO: Fix leaveContext missing ?!

        return;
      }

      determineRequiredReturnType(requestBody) {

        common.enterContext('determineRequiredReturnType');

        common.logVal('debug', 'requestBody', requestBody);

        let returnType;

        if (util.isString(requestBody)) {
          returnType = 'string';
        } else {
          returnType = 'object'
        }

        common.logVal('debug', 'returnType', returnType);

        common.leaveContext();

        return returnType;
      }
    }

    let script = new SaveChangesScript();

    return {

      /**
       *
       * @param {object} requestBody
       * @returns
       */
      get:
        (requestBody) => {
          common.enterContext('get');

          if (script.isProd === true) {
            return '';
          }

          common.logVal('debug', 'script.testMode', script.testMode);

          if (script.testMode === true) {
            common.enterContext('TEST');
          }

          common.logVal('debug', 'requestBody', requestBody);

          let _requestBody = requestBody;
          let response = new SaveChangesResponse();

          // GET requests need to return a text string

          response.outputType = 'string';

          if (requestBody['rb']) {
            _requestBody = requestBody['rb'];

            common.logVal('debug', '_requestBody', _requestBody);

            script.processRequest(_requestBody, response);
          } else {
            common.logMsg('debug', 'No request body provided');
          }

          if (script.testMode === true) {
            common.leaveContext();
          }

          common.leaveContext();

          return response.output();
        },

      post:
        (requestBody) => {
          common.enterContext('post');

          if (this.testMode === true) {
            common.enterContext('TEST');
          }

          common.logVal('debug', 'requestBody', requestBody);

          let response = new SaveChangesResponse();

          response.outputType = script.determineRequiredReturnType(requestBody);

          script.processRequest(requestBody, response);

          if (this.testMode === true) {
            common.leaveContext();
          }

          common.leaveContext();

          return response.output();
        }
    }
  }
);