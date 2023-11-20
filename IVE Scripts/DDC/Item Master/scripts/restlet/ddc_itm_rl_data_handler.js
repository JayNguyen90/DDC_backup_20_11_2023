/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NAmdConfig /SuiteScripts/IVE Scripts/Modules/amdconfig.json
 */
define(
  [
    'N/format',
    'N/record',
    'N/runtime',
    'N/search',
    'N/task',
    'N/ui/serverWidget',
    'common',
    '../../modules/constants',
    '../../modules/data',
    '../../modules/lists'
  ],

  /**
   *
   * @param {format} format
   * @param {record} record
   * @param {runtime} runtime
   * @param {search} search
   * @param {task} task
   * @param {serverWidget} serverWidget
   * @param {CommonModule} common
   * @param {object} constants
   * @param {DataModule} data
   * @param {ListsModule} lists
   * @returns
   */
  (
    format,
    record,
    runtime,
    search,
    task,
    serverWidget,
    common,
    constants,
    data,
    lists
  ) => {

    const LOCKED_FIELD_IDS =
      [
        'internalid',
        'itemid'//,
        // 'displayname'
      ];

    // const MAPS = {
    //   SEARCH_COL_SOURCE_LIST_ID: {
    //   }
    // }

    // TODO: Fix this to allow for selection of config record

    // const MAP_REC_TYPE_BY_SEARCH_COLUMN =
    // {
    //   'department': 'department',
    //   'class': 'classification',
    //   'taxschedule': 'taxschedule',
    //   'custitem_ddc_item_category': 'customrecord_ddc_item_category',
    //   'custitem_ddc_item_measure': 'customlist_ddc_measure',
    //   'custitem_ddc_work_centre_group': 'customlist_ddc_work_centre_group_list',
    //   'custitem_ddc_costing_formula': 'customrecord_ddc_costing_formula_list',
    //   'custitem_ddc_linked_ot_service': 'item',
    //   'custitem_ddc_linked_stock_item': 'item',
    //   'custitem_ddc_margin_category': 'customlist_ddc_margin_category',
    //   'custrecord_crc_customer': 'customer',
    //   'custrecord_crc_parent': constants.RECORDS.CUSTOM.CUST_RATE_CARD.ID,
    //   'custrecord_crc_measure': 'customlist_ddc_measure'
    // };

    const MAP_LISTS_OPTIONS_BY_REC_TYPE =
    {
      'taxschedule': {

        activeOnly: false
      },

      'custitem_ddc_linked_ot_service': {
        filters:
          [
            search.createFilter(
              {
                name: 'type',
                operator: search.Operator.ANYOF,
                values: ['Service']
              }
            )
          ],
        firstEntryBlank: true
      },

      'custitem_ddc_linked_stock_item': {
        filters:
          [
            search.createFilter(
              {
                name: 'type',
                operator: search.Operator.ANYOF,
                values: ['InvtPart']
              }
            )
          ],
        firstEntryBlank: true
      }

    };

    function terminateScript(e) {

      // Force a 400 Error Code BAD_REQUEST

      let _e;

      if (!e) {

        _e = new Error('');

        // Remove stack information to prevent information leak to outside world

        _e.stack = null;

      } else {

        _e = e;

      }

      throw _e;

    }

    function xor(a, b) {

      let _a = (!!a);
      let _b = (!!b);

      return ((_a) && !_b) || (!_a && _b);

    }

    /**
     * Iterates over all of the field internal ids given in `changes` and sets each field to the new value
     * and creates a response to send back
     * @param {record.Record} rcrd Record instance to which to apply the changes loaded in dynamic mode
     * @param {object} changes Map of value changes to make by the internal id of the field to which to change
     * @param {SaveChangesResponse} scriptResponse Container for the information passed back to the script caller
     */
    function applyChanges(
      rcrd,
      changes,
      response
    ) {

      common.enterContext('applyChanges');

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

    function getConfig() {

      let configRecord =
        search.lookupFields(
          {
            type: constants.RECORDS.CUSTOM.CONFIG.ID,
            id: 1,
            columns: [constants.RECORDS.CUSTOM.CONFIG.FIELDS.SEARCH_COL_REC_TYPES_MAP.ID]
          }
        );//[constants.RECORDS.CUSTOM.CONFIG.FIELDS.SEARCH_COL_REC_TYPES_MAP.ID]

      let config = {};

      config[constants.RECORDS.CUSTOM.CONFIG.FIELDS.SEARCH_COL_REC_TYPES_MAP.ID] =
        JSON.parse(configRecord[constants.RECORDS.CUSTOM.CONFIG.FIELDS.SEARCH_COL_REC_TYPES_MAP.ID]);

        return config;

    }

    class GetItemsResponse {
      constructor() {
        this.meta = {
          errmsg: false,
          // sources: {}
        };

        // this.meta.sources['department'] = lists.getValues(lists.IDS.DEPARTMENT);
        // this.meta.sources['class'] = lists.getValues(lists.IDS.CLASS);
        this.columns = [];
        this.headers = [];
        this.rows = [];
        this.visibleColumns = [];
      }

      get DATA_TYPES() {
        return {
          TEXT: 'text',
          NUMERIC: 'numeric',
          DROPDOWN: 'dropdown',
          CHECKBOX: 'checkbox'
        }
      }

      get DATA_TYPE_OPTIONS() {
        return {
          NUMERIC_CURRENCY: {
            numericFormat: {
              pattern: '0,0.00',
              culture: 'en-AU'
            }
          },

          NUMERIC_FLOAT: {
            numericFormat: {
              pattern: '0.000',
              culture: 'en-AU'
            }
          },

          NUMERIC_INTEGER: {
            numericFormat: {
              pattern: '0',
              culture: 'en-AU'
            }
          },

          // NUMERIC_INTERNALID: {
          //   numericFormat: {
          //     pattern: '0',
          //     culture: 'en-AU'
          //   },
          //   readOnly: true
          // },

          PERCENT: {
            numericFormat: {
              pattern: '0.00 %',
              culture: 'en-AU'
            }
          }
        };
      }

      addColumn(name, label, type, lock, source) {
        this.headers.push(label);

        let hotDef =
        {
          data: name,
          type: null,
          source: null//,
          // renderer: 'html'
        };

        switch (type) {
          case serverWidget.FieldType.TEXT:
          case serverWidget.FieldType.LONGTEXT:
          case serverWidget.FieldType.RICHTEXT:
          case serverWidget.FieldType.TEXTAREA:
          case serverWidget.FieldType.PHONE:
          case serverWidget.FieldType.TIMEOFDAY:
          case serverWidget.FieldType.URL:
          case serverWidget.FieldType.DATE:
          case serverWidget.FieldType.DATETIME:
          case serverWidget.FieldType.DATETIMETZ:
          case serverWidget.FieldType.EMAIL:
            hotDef.type = this.DATA_TYPES.TEXT;
            break;

          case serverWidget.FieldType.CHECKBOX:
            hotDef.type = this.DATA_TYPES.CHECKBOX;
            break;

          case serverWidget.FieldType.CURRENCY:
          case serverWidget.FieldType.FLOAT:
          case serverWidget.FieldType.INTEGER:
            hotDef.type = this.DATA_TYPES.NUMERIC;
            break;

          // case 'ID':
          //   hotDef.type = this.DATA_TYPES.NUMERIC;
          //   break;

          case serverWidget.FieldType.RADIO:
          case serverWidget.FieldType.SELECT:
          case serverWidget.FieldType.MULTISELECT:
            hotDef.type = this.DATA_TYPES.DROPDOWN;
            hotDef.source = source;
            break;

          case serverWidget.FieldType.PERCENT:
            hotDef.type = this.DATA_TYPES.PERCENT;
            break;
        }

        let options;

        switch (type) {
          case serverWidget.FieldType.TEXT:
          case serverWidget.FieldType.LONGTEXT:
          case serverWidget.FieldType.RICHTEXT:
          case serverWidget.FieldType.TEXTAREA:
          case serverWidget.FieldType.PHONE:
          case serverWidget.FieldType.TIMEOFDAY:
          case serverWidget.FieldType.URL:
          case serverWidget.FieldType.DATE:
          case serverWidget.FieldType.DATETIME:
          case serverWidget.FieldType.DATETIMETZ:
          case serverWidget.FieldType.EMAIL:
          case serverWidget.FieldType.CHECKBOX:
            // No formatting options to add
            break;

          case serverWidget.FieldType.CURRENCY:
            options = this.DATA_TYPE_OPTIONS.NUMERIC_CURRENCY;
            break;
          case serverWidget.FieldType.FLOAT:
            options = this.DATA_TYPE_OPTIONS.NUMERIC_FLOAT;
            break;

          case serverWidget.FieldType.INTEGER:
            options = this.DATA_TYPE_OPTIONS.NUMERIC_INTEGER;
            break;

          case serverWidget.FieldType.RADIO:
          case serverWidget.FieldType.SELECT:
          case serverWidget.FieldType.MULTISELECT:
            // TODO: Add dropdown formatting options
            break;

          // case 'ID':
          //   options = this.DATA_TYPE_OPTIONS.NUMERIC_INTERNALID;
          //   break;

          case serverWidget.FieldType.PERCENT:
            options = this.DATA_TYPE_OPTIONS.PERCENT;
            break;
        }

        if (options) {
          for (let prop in options) {
            if (!options.hasOwnProperty(prop)) {
              continue;
            }

            hotDef[prop] = options[prop];
          }
        }

        if (lock) {
          // hotDef['readOnly'] = true;
          hotDef['editor'] = false;
        }

        this.columns.push(hotDef);

        // if (visible) {
        this.visibleColumns.push(name);
        // }
      }

      addRow(row) {
        this.rows.push(row);
      }

      toString() {
        return JSON.stringify(this);
      }
    }

    class Row {
      constructor(id) {
        // this.id = id;
      }

      addColumnValue(name, value) {
        if (this.hasOwnProperty(name)) {
          throw new Error('Column name ' + name + ' already set');
        }

        this[name] = value;
      }
    }

    class SaveChangesResponse {

      constructor() {

        this.saved = false;
        this.updated = false;
        this.id = 0;
        this.type = '';

        this.errors = [];
        this.fieldsUpdated = [];

      }

      /*output(outputType) {
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
      }*/

      /*toString() {

        return JSON.stringify(this);

      }*/

    }

    /**
     * Following standard REST conventions the GET request is used to retrieve information from NetSuite
     * Defines the function that is executed when a GET request is sent to a RESTlet.
     * @param {Object} requestParams - Parameters from HTTP request URL; parameters passed as an Object (for all supported
     *     content types)
     * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
     *     Object when request Content-Type is 'application/json' or 'application/xml'
     * @since 2015.2
     */
    function get(requestParams) {

      common.enterContext('get'); // get

      common.logVal('debug', 'requestParams', requestParams);

      const MAP_REC_TYPE_BY_SEARCH_COLUMN = getConfig()[constants.RECORDS.CUSTOM.CONFIG.FIELDS.SEARCH_COL_REC_TYPES_MAP.ID];

      // Parse and check request parameters

      let dataType = (requestParams[constants.SCRIPTS.DATA_HANDLER.REQUEST_PARAMS.DATA_TYPE.ID] || '');
      let listType = (requestParams[constants.SCRIPTS.DATA_HANDLER.REQUEST_PARAMS.LIST_TYPE.ID] || '');
      let categoryId = Number(requestParams[constants.SCRIPTS.DATA_HANDLER.REQUEST_PARAMS.CATEGORY.ID] || '0');
      let rateCardId = Number(requestParams[constants.SCRIPTS.DATA_HANDLER.REQUEST_PARAMS.RATE_CARD.ID] || '0');
      let searchId = Number(requestParams[constants.SCRIPTS.DATA_HANDLER.REQUEST_PARAMS.SEARCH.ID]);
      let filter;

      common.logVal('debug', 'dataType', dataType);
      common.logVal('debug', 'listType', listType);
      common.logVal('debug', 'categoryId', categoryId);
      common.logVal('debug', 'searchId', searchId);
      common.logVal('debug', 'rateCardId', rateCardId);

      let hasDataType = (!(!util.isString(dataType) || (dataType.trim() === '')));
      let hasListType = (!(!util.isString(listType) || (listType.trim() === '')));

      common.logVal('debug', 'hasDataType', hasDataType);
      common.logVal('debug', 'hasListType', hasListType);

      if (
        !xor(
          hasDataType,
          hasListType
        )
      ) {

        terminateScript();

      }

      if (hasDataType) {

        switch (dataType) {

          case search.Type.SERVICE_ITEM:

            if (

              (isNaN(categoryId)) ||
              (categoryId === 0) ||
              (isNaN(searchId)) ||
              (searchId === 0)

            ) {

              terminateScript();

            }

            break;

          case constants.RECORDS.CUSTOM.CUST_RATE_CARD_ITEM.ID:

            if (

              (isNaN(rateCardId)) ||
              (rateCardId === 0) ||
              (isNaN(searchId)) ||
              (searchId === 0)

            ) {

              terminateScript();

            }

            break;

          default:

            terminateScript(constants.ERRORS.ITM_SERVER_ERROR('Invalid data type: ' + dataType));

        }

      }

      // Run the appropriate search and build the corresponding response

      let response;

      try {

        if (hasDataType) {

          response = new GetItemsResponse();

          switch (dataType) {

            case search.Type.SERVICE_ITEM:

              filter =
                search.createFilter(
                  {
                    name: constants.RECORDS.ITEM.FIELDS.CATEGORY.ID,
                    operator: search.Operator.ANYOF,
                    values: categoryId
                  }
                );

              break;

            case constants.RECORDS.CUSTOM.CUST_RATE_CARD_ITEM.ID:

              filter =
                search.createFilter(
                  {
                    name: constants.RECORDS.CUSTOM.CUST_RATE_CARD_ITEM.FIELDS.PARENT_CRC.ID,
                    operator: search.Operator.ANYOF,
                    values: rateCardId
                  }
                );

              break;

            default:

              // N.B. Script should have already been terminated before reaching here

              break;

          }

          let srch =
            search.load(
              {
                type: dataType,
                id: searchId
              }
            );

          srch.filters = srch.filters.concat(filter);

          // let row = new Row();
          // let colNames = [];
          let columns = {};

          srch.columns.forEach(
            (col) => {

              columns[col.name] = JSON.parse(JSON.stringify(col));

              if (col.name === 'internalid') {

                // Override column type for internal ids
                //  * Prevents generation of hyperlink
                //  * Allows formatting of a number so it can be used by the client module

                columns[col.name]['type'] = serverWidget.FieldType.INTEGER;

                // return;

              }

              let type = columns[col.name]['type'].toUpperCase();
              let locked = (LOCKED_FIELD_IDS.indexOf(col.name) !== -1);
              let recType = MAP_REC_TYPE_BY_SEARCH_COLUMN[col.name];
              let source = [];

              common.logVal('debug', 'type', type);
              common.logVal('debug', 'locked', locked);
              common.logVal('debug', 'recType', recType);

              if (

                (type === serverWidget.FieldType.SELECT) ||
                (type === serverWidget.FieldType.MULTISELECT)

              ) {

                if (recType) {

                  source = recType;

                } else {

                  throw constants.ERRORS.ITM_SERVER_ERROR('Missing mapping. Please add a mapping to MAP_REC_TYPE_BY_SEARCH_COLUMN for search column: ' + col.name);

                }

              }

              response.addColumn(col.name, col.label, type, locked, source);

            }
          );

          log.debug({ title: 'columns', details: JSON.stringify(columns) });

          let pagedData =
            srch.runPaged(
              {
                pageSize: 1000
              }
            );

          if (pagedData.count > 0) {
            pagedData.pageRanges.forEach(
              (range) => {
                // log.debug({ title: 'range', details: range.index });
                let page = pagedData.fetch(range.index);

                page.data.forEach(
                  (result) => {
                    let row = new Row();

                    for (let name in columns) {

                      // Cause of over logging

                      // log.debug({ title: 'name', details: name });
                      // log.debug({ title: 'columns[name].type', details: columns[name]['type'] + ' {' + (typeof columns[name]['type']) + '}' });
                      // log.debug({ title: 'type', details: columns[name].type });

                      switch (columns[name]['type'].toUpperCase()) {
                        // case serverWidget.FieldType.TEXT:
                        // case serverWidget.FieldType.LONGTEXT:
                        // case serverWidget.FieldType.RICHTEXT:
                        // case serverWidget.FieldType.TEXTAREA:
                        // case serverWidget.FieldType.PASSWORD:
                        // case serverWidget.FieldType.PHONE:
                        // case serverWidget.FieldType.TIMEOFDAY:
                        // case serverWidget.FieldType.URL:
                        // case serverWidget.FieldType.CURRENCY:
                        // case serverWidget.FieldType.DATE:
                        // case serverWidget.FieldType.DATETIME:
                        // case serverWidget.FieldType.DATETIMETZ:
                        // case serverWidget.FieldType.EMAIL:
                        case serverWidget.FieldType.FLOAT:
                        case serverWidget.FieldType.INTEGER:
                          // row.addColumnValue(name, result.getValue(columns[name]));
                          row.addColumnValue(name, Number(result.getValue(columns[name])));
                          break;

                        // case serverWidget.FieldType.CHECKBOX:
                        //   row.addColumnValue(name, (result.getValue(columns[name]) === true) ? 'Yes' : 'No');
                        //   break;

                        // case serverWidget.FieldType.RADIO:
                        //   row.addColumnValue(name, result.getValue(columns[name]));
                        //   break;

                        case serverWidget.FieldType.SELECT:
                          // case serverWidget.FieldType.MULTISELECT:
                          row.addColumnValue(name, result.getText(columns[name]));
                          break;

                        // TODO: How to handle multi-select ?
                        // case serverWidget.FieldType.MULTISELECT:
                        //   row.addColumnValue(name, result.getText(columns[name]));
                        //   break;

                        // case serverWidget.FieldType.PERCENT:
                        default:
                          row.addColumnValue(name, result.getValue(columns[name]));
                          break;
                      }
                    }
                    // );

                    response.addRow(row);

                  }
                );
              }
            );
          }

        } else if (hasListType) {

          let options =
            (
              MAP_LISTS_OPTIONS_BY_REC_TYPE[listType] ||
              {
                firstEntryBlank: true
              }
            );

          response =
            JSON.stringify(
              lists.getValues(listType, options)['names']
            );

        }

      } catch (e) {

        if (e.name === constants.ERRORS.CODES.ITM_SERVER_ERROR) {

          common.logErr('emergency', e);

          // Re-throw the error so NetSuite will send a notification email to the admins

          terminateScript(e);

        } else {

          common.logErr('error', e);

        }

      } finally {

        common.leaveContext(); // get

      }

      return response.toString();

    }

    /**
     * Following standard REST conventions the PUT request is used to update information in NetSuite
     * Defines the function that is executed when a PUT request is sent to a RESTlet.
     * @param {string | Object} requestBody - The HTTP request body; request body are passed as a string when request
     *     Content-Type is 'text/plain' or parsed into an Object when request Content-Type is 'application/json' (in which case
     *     the body must be a valid JSON)
     * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
     *     Object when request Content-Type is 'application/json' or 'application/xml'
     * @since 2015.2
     */
    function put(requestBody) {

      common.enterContext('put'); // put

      common.logVal('debug', 'requestBody', requestBody);

      let response = new SaveChangesResponse();

      // Parse and check the request parameters

      let recordId = Number(requestBody[constants.SCRIPTS.DATA_HANDLER.REQUEST_PARAMS.RECORD_ID.ID] || '0');
      let recordType = (requestBody[constants.SCRIPTS.DATA_HANDLER.REQUEST_PARAMS.RECORD_TYPE.ID] || '');
      let changes = (requestBody[constants.SCRIPTS.DATA_HANDLER.REQUEST_PARAMS.CHANGES.ID] || {});

      common.logVal('debug', 'recordId', recordId);
      common.logVal('debug', 'recordType', recordType);
      common.logVal('debug', 'changes', changes);

      if (!util.isString(recordType) || (recordType.trim() === '')) {

        terminateScript();

      } else if (isNaN(recordId) || (recordId === 0)) {

        terminateScript();

      }

      try {

        response.id = recordId;
        response.type = recordType;

        let rcrd =
          record.load(
            {
              type: recordType,
              id: recordId,
              isDynamic: true
            }
          );

        common.logMsg('debug', 'Record loaded successfully');

        applyChanges(rcrd, changes, response);

        common.logMsg('debug', 'Record changes applied successfully');

        if (response.updated) {

          response.id = rcrd.save();

          common.logMsg('debug', 'Record changes saved successfully');

          response.saved = true;

        } else {

          common.logVal('debug', 'Fields updated', response.fieldsUpdated);

        }

      } catch (e) {

        common.logErr('error', e);

        response.errors.push(e);

      }

      common.leaveContext(); // put

      return response;

    }

    /**
     * Defines the function that is executed when a POST request is sent to a RESTlet.
     * @param {string | Object} requestBody - The HTTP request body; request body is passed as a string when request
     *     Content-Type is 'text/plain' or parsed into an Object when request Content-Type is 'application/json' (in which case
     *     the body must be a valid JSON)
     * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
     *     Object when request Content-Type is 'application/json' or 'application/xml'
     * @since 2015.2
     */
    function post(requestBody) {

      common.enterContext('post');// post

      common.logVal('debug', 'requestBody', requestBody);

      // Parse and check request body parameters

      let recordId = Number(requestBody[constants.SCRIPTS.DATA_HANDLER.REQUEST_PARAMS.RECORD_ID.ID] || '0');
      let recordType = (requestBody[constants.SCRIPTS.DATA_HANDLER.REQUEST_PARAMS.RECORD_TYPE.ID] || '');
      let newVersion = (requestBody[constants.SCRIPTS.DATA_HANDLER.REQUEST_PARAMS.VERSION.ID] || '');

      common.logVal('debug', 'recordId', recordId);
      common.logVal('debug', 'recordType', recordType);
      common.logVal('debug', 'newVersion', newVersion);

      if (!util.isString(recordType) || (recordType.trim() === '')) {

        terminateScript();

      } else if (isNaN(recordId) || (recordId === 0)) {

        terminateScript();

      }

      // Copy the specified record and child records, trigger the background script, and build the corresponding response

      let params = {};
      let response;

      params[constants.SCRIPTS.CRC_CLONE.PARAMS.SOURCE_CRC.ID] = recordId;

      try {

        // TODO: Replace with appropriate response type
        response = new GetItemsResponse();

        switch (recordType) {

          case constants.RECORDS.CUSTOM.CUST_RATE_CARD.ID:

            // TODO: Complete this
            let job = record.create({ type: constants.RECORDS.CUSTOM.BACKGRND_JOB.ID });

            params[constants.SCRIPTS.CRC_CLONE.PARAMS.BACKGRND_JOB.ID] = job.save();

            common.logMsg('debug', 'Job record created');

            let copy =
              record.copy(
                {
                  type: constants.RECORDS.CUSTOM.CUST_RATE_CARD.ID,
                  id: recordId
                }
              );

            copy.setValue(
              {
                fieldId: constants.RECORDS.CUSTOM.CUST_RATE_CARD.FIELDS.MEMO.ID,
                value: newVersion
              }
            );

            params[constants.SCRIPTS.CRC_CLONE.PARAMS.DEST_CRC.ID] = copy.save();

            common.logMsg('debug', 'CRC record copy created');

            let cloneTask =
              task.create(
                {
                  taskType: task.TaskType.MAP_REDUCE,
                  scriptId: constants.SCRIPTS.CRC_CLONE.SCRIPT_ID,
                  deploymentId: constants.SCRIPTS.CRC_CLONE.DEPLOY_ID,
                  params: params
                }
              );

            let cloneTaskId = cloneTask.submit();

            if (!cloneTaskId) {

              throw constants.ERRORS.ITM_SERVER_ERROR('Background job could not be submitted');

            }

            break;

          default:

            // TODO: Implement unsupported record type handling

            break;

        }

      } catch (e) {

        if (e.name === constants.ERRORS.CODES.ITM_SERVER_ERROR) {

          common.logErr('emergency', e);

          // Re-throw the error so NetSuite will send a notification email to the admins

          terminateScript(e);

        } else {

          common.logErr('error', e);

        }

      } finally {

        common.leaveContext();// post

      }

      return response.toString();


    }

    /**
     * Defines the function that is executed when a DELETE request is sent to a RESTlet.
     * @param {Object} requestParams - Parameters from HTTP request URL; parameters are passed as an Object (for all supported
     *     content types)
     * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
     *     Object when request Content-Type is 'application/json' or 'application/xml'
     * @since 2015.2
     */
    function doDelete(requestParams) {

      // Not Used

    }

    return {
      get: get,
      delete: doDelete, // Not Used
      post: post,
      put: put
    };

  }
);