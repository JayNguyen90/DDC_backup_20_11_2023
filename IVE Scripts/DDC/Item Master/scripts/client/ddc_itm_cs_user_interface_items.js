/**
 * @NApiVersion 2.1
 * @NAmdConfig /SuiteScripts/IVE Scripts/Modules/amdconfig.json
 */
define(
  [
    'N/currentRecord',
    'N/https',
    'N/record',
    'N/runtime',
    'N/search',
    'N/ui/message',
    'N/url',
    //'common', // TODO: Add support to common for client modules
    '../../modules/constants',
    'lodash'
  ],

  (
    currentRecord,
    https,
    record,
    runtime,
    search,
    message,
    url,
    //common,
    constants,
    _
  ) => {

    class UserInterfaceClientModule {

      constructor() {

        this._hot = null;
        this._message = null;
        this._sourceData = [];
        this._data = [];
        this._columnsById = {};
        this._headersById = {};
        this._changesToSave = {};
        this._changesPendingSave = {};
        this._recordNamesById = {};
        this._listData = {};

        // TODO: Review and remove if appropriate
        // jQuery(document).ready(this.initUI.bind(this));

        // Required to ensure that the table fills the entire page

        jQuery(window).resize(this.windowOnResize.bind(this));

        // TODO: Reinstate once common module updated
        // common.startScript('UserInterfaceClientModule');

        /**@deprecated */
        // this._saveChangesRestletURL =
        //   url.resolveScript(
        //     {
        //       scriptId: constants.SCRIPTS.SAVE_CHANGES.SCRIPT_ID,
        //       deploymentId: constants.SCRIPTS.SAVE_CHANGES.DEPLOY_ID
        //     }
        //   );

        // TODO: Move out of constructor

        this._DATA_HANDLER_URL =
          url.resolveScript(
            {
              scriptId: constants.SCRIPTS.DATA_HANDLER.SCRIPT_ID,
              deploymentId: constants.SCRIPTS.DATA_HANDLER.DEPLOY_ID
            }
          );


      }

      /**@deprecated */
      get SAVE_CHANGES_RESTLET_URL() {
        //   const s = this._saveChangesRestletURL;

        //   return s;
      }

      get FORM_FIELDS() {

        return [

          {
            id: constants.FIELDS.ITEM_FIELDS_SEARCH.ID,
            type: 'number',
            required: true
          },

          {
            id: constants.FIELDS.CATEGORY.ID,
            type: 'number',
            required: true
          }

        ];

      }

      get FORM_FIELDS_IDS() {

        return _.flatMap(
          this.FORM_FIELDS,
          (obj) => {

            return obj.id;

          }
        );

      }

      get FORM_FIELDS_DETAILS() {

        let detailsById = {};

        this.FORM_FIELDS.forEach(
          (obj) => {

            detailsById[obj.id] = _.pick(obj, ['type', 'required'])

          }
        );
        return detailsById;

      }

      get TABLE_ROW_RECORD_TYPE() {

        return record.Type.SERVICE_ITEM;

      }

      get TABLE_ROW_RECORD_ID_FIELD() {

        return 'internalid';

      }

      get TABLE_ROW_RECORD_NAMEID_FIELD() {

        return 'itemid';

      }

      get TABLE_ROW_RECORD_NAME_FIELD() {

        return 'displayname';

      }

      get TABLE_ROW_NEW_RECORD_REQD_FIELDS() {

        return [
          {
            id: this.TABLE_ROW_RECORD_NAMEID_FIELD,
            from: 'prompt',
            allowSame: false
          },
          {
            id: this.TABLE_ROW_RECORD_NAME_FIELD,
            from: 'source',
            allowSame: true
          }
        ];

      }

      getDataHandlerUrl(params) {

        let _params = {};

        debugger;

        if (util.isObject(params)) {

          _params = params;
        }

        debugger;

        return url.format(
          {
            domain: this._DATA_HANDLER_URL,
            params: _params
          }
        );

      }

      /*getFormValues() {

        let fieldNames =
          [
            constants.FORMS.CUST_RATE_CARD.FIELDS.FIELDS_SEARCH.ID,
            constants.FORMS.CUST_RATE_CARD.FIELDS.RATE_CARD.ID
          ];

        let values = {};

        try {

          let formRecord = currentRecord.get();

          fieldNames.forEach(
            (name) => {

              console.log('getFormValues:name = ' + name);

              let val = formRecord.getValue({ fieldId: name });
              let text = formRecord.getText({ fieldId: name });

              // console.log('getFormValues:val = ' + val + ' {' + (typeof val) + '}');
              values[name] =
              {
                value: val,
                text: text
              };

              console.log('getFormValues:values = ' + JSON.stringify(values));

            }
          );

        } catch (e) {

          values = false;

          console.error('getFormValues: ' + e.name + ' - ' + e.message);

        }

        console.log('getFormValues:values = ' + JSON.stringify(values) + ' {' + (typeof values) + '}');

        return values;

      }*/

      getTableExportFilename() {

        let filename = false;

        try {

          let formValues = this.getTableDataRequestParameters();

          debugger;

          if (!formValues[constants.FIELDS.CATEGORY.ID].valid) {

            return false;

          }

          let categoryName = formValues[constants.FIELDS.CATEGORY.ID]['text'];

          debugger;

          filename = categoryName.replace(/\s+/g, '_') + '_[DD]-[MM]-[YYYY]';

        } catch (e) {

          filename = false;

        }

        debugger;

        return filename;

      }

      /**
       * Removes a message that was previously displayed
       */
      hideMessage() {

        if (this._message) {

          this._message.hide();
          this._message = null;

        }

      }

      /**
       * Displays a message to the user at the top of the page and tracks that it is there in case it needs to be hidden later.
       * First hides any message already being displayed
       * @param {message.Type} type
       * @param {string} title
       * @param {string} msg
       * @param {number} [duration]
       */
      showMessage(type, title, msg, duration) {

        let _duration = 0;

        if (type == message.Type.WARNING) {

          _duration = 3000;

        }

        if (util.isNumber(duration)) {

          _duration = duration;

        }

        this.hideMessage();

        this._message =
          message.create(
            {
              type: type,
              title: title,
              message: msg
            }
          );

        this._message.show(
          {
            duration: _duration
          }
        );

      }

      /**
       *
       * @param {https.Method} method type of request to make
       * @param {string} url URL to which to make the request
       * @param {object} [body] request body only for POST requests
       */
      async callRESTlet(method, url, body) {

        try {

          console.log('callRESTlet:url = ' + url + ' {' + (typeof url) + '}');

          let promise;

          switch (method) {

            case https.Method.GET:
              promise =
                https.get.promise(
                  {
                    url: url,
                    headers: {
                      'content-Type': 'application/json'
                    }
                  }
                );
              break;

            case https.Method.POST:

              promise =
                https.post.promise(
                  {
                    url: url,
                    headers: {
                      'content-Type': 'application/json'
                    },
                    body: body
                  }
                );
              break;

            case https.Method.PUT:

              promise =
                https.put.promise(
                  {
                    url: url,
                    headers: {
                      'content-Type': 'application/json'
                    },
                    body: body
                  }
                );
              break;

            default:
              throw new Error('Unsupported method: ' + method);

          }

          return promise
            .then(
              function (response) {

                // Check if the request worked

                console.log('callRESTlet:response.code = ' + response.code + ' {' + (typeof response.code) + '}');
                console.log('callRESTlet:response.body = ' + response.body + ' {' + (typeof response.body) + '}');

                if (!util.isNumber(response.code) || (response.code !== 200)) {

                  return Promise.reject(new Error('NetSuite responded with a request error code: ' + response.code));

                }

                if (!util.isString(response.body) || (response.body.trim() === '')) {

                  return Promise.reject(new Error('No response was received from the RESTlet'));

                }

                return Promise.resolve(JSON.parse(response.body));

              }.bind(this)
            )
            .catch(
              function (e) {

                console.error('callRESTlet:Promise.catch: ' + e.name + ' - ' + e.message);

                return Promise.reject(e);

              }.bind(this)
            );

        } catch (e) {

          console.error('callRESTlet: ' + e.name + ' - ' + e.message);

          return Promise.reject(e);

        }

      }

      getTableDataRequestParameters() {

        let values = {};


        try {

          let formRecord = currentRecord.get();

          this.FORM_FIELDS_IDS.forEach(
            (name) => {

              console.log('getTableDataRequestParameters:name = ' + name);

              // TODO: Tested - remove
              // throw new Error('Bang!');

              values[name] =
              {
                value: null,
                text: '',
                valid: false
              };

              let val = formRecord.getValue({ fieldId: name });
              let text = formRecord.getText({ fieldId: name });

              console.log('getTableDataRequestParameters:val = ' + val + ' {' + (typeof val) + '}');

              switch (this.FORM_FIELDS_DETAILS[name]['type']) {

                case 'number':
                  val = Number(val);

                  if (isNaN(val) || (val === 0)) {

                    val = undefined;
                    text = undefined;
                    values[name]['valid'] = false;

                  } else {

                    values[name]['valid'] = true;

                  }
                  break;

                default:
                  values[name]['valid'] = true;
                  break;

              }

              values[name]['value'] = val;
              values[name]['text'] = text;

              console.log('getTableDataRequestParameters:values = ' + JSON.stringify(values));

            }
          );

        } catch (e) {

          console.error('getTableDataRequestParameters: ' + e.name + ' - ' + e.message);

          throw new constants.ERRORS.ITM_CLIENT_ERROR(e.name + ' - ' + e.message);

        }

        console.log('getTableDataRequestParameters:values = ' + JSON.stringify(values) + ' {' + (typeof values) + '}');

        return values;

      }

      async getTableData() {

        debugger;

        try {

          let params = this.getTableDataRequestParameters();

          debugger;

          // Check for invalid parameters

          Object.keys(params).forEach(
            (name) => {

              if (!params[name]['valid']) {

                // TODO: Return a rejection with an error if request param invalid to report to user

              }

            }
          );

          let urlParams = {};

          urlParams[constants.SCRIPTS.DATA_HANDLER.REQUEST_PARAMS.DATA_TYPE.ID] = record.Type.SERVICE_ITEM;
          urlParams[constants.SCRIPTS.DATA_HANDLER.REQUEST_PARAMS.SEARCH.ID] =
            params[constants.FIELDS.ITEM_FIELDS_SEARCH.ID]['value'];
          urlParams[constants.SCRIPTS.DATA_HANDLER.REQUEST_PARAMS.CATEGORY.ID] =
            params[constants.FIELDS.CATEGORY.ID]['value'];

          debugger;

          let restletUrl = this.getDataHandlerUrl(urlParams);

          console.log('getTableData:restletUrl = ' + restletUrl + ' {' + (typeof restletUrl) + '}');

          debugger;

          return this.callRESTlet(https.Method.GET, restletUrl)
            .catch(
              function (e) {

                console.error('getTableData.catch: ' + e.name + ' - ' + e.message);

                return Promise.reject(e);

              }
            );

        } catch (e) {

          console.error('getTableData: ' + e.name + ' - ' + e.message);

          return Promise.reject(e);

        }

      }

      buildTable() {

        try {

          Ext.getBody().mask('Please wait ...');

          this.getTableData()
            .then(
              function (payload) {

                let headers = payload.headers;
                let columns = payload.columns;


                this._data = payload.rows;

                console.log('buildTable:this._data = ' + JSON.stringify(this._data) + ' {' + (typeof this._data) + '}');

                if (this._data.length === 0) {

                  Ext.getBody().unmask();

                  this.showMessage(message.Type.INFORMATION, '', 'No records found');

                  return;

                }

                // Source: https://stackoverflow.com/questions/597588/how-do-you-clone-an-array-of-objects-in-javascript
                this._sourceData = this._data.map(a => ({ ...a }));

                this._data.forEach(
                  (rec) => {

                    this._recordNamesById[rec[this.TABLE_ROW_RECORD_ID_FIELD]] = rec[this.TABLE_ROW_RECORD_NAMEID_FIELD];

                  }
                );

                console.log('buildTable:this._recordNamesById = ' + JSON.stringify(this._recordNamesById) + ' {' + (typeof this._recordNamesById) + '}');

                columns.forEach(
                  (colDef, index) => {

                    // Prevent cells from being validated
                    colDef['validator'] = null;

                    this._columnsById[colDef['data']] = colDef;
                    this._headersById[colDef['data']] = headers[index];

                    if (colDef['type'] === 'dropdown') {

                      if (util.isString(colDef['source'])) {

                        // Create the source function to retrieve values for the column dropdowns

                        colDef['source'] =
                          async function (source, query, callback) {

                            return await this.getListData(source, query, callback);

                          }.bind(this, colDef['source']);

                      }

                    }
                  }
                );

                console.log('buildTable:this._columnsById = ' + JSON.stringify(this._columnsById) + ' {' + (typeof this._columnsById) + '}');
                console.log('buildTable:this._headersById = ' + JSON.stringify(this._headersById) + ' {' + (typeof this._headersById) + '}');

                // If the table has already been created once before then destroy it so it can be recreated

                if (this._hot) {

                  this._hot.destroy();
                  this._hot = null;

                }

                if (util.isString(payload.meta.errmsg)) {

                  Ext.getBody().unmask();

                  this.showMessage(message.Type.ERROR, 'Error', payload.meta.errmsg);

                  return;

                }

                // TODO: Update #items to #table asap

                let container = document.querySelector('#items');

                this._hot =
                  new Handsontable(
                    container,
                    {
                      afterChange: this.dataChanged.bind(this),
                      afterRenderer: this.afterCellRendered.bind(this),
                      afterContextMenuDefaultOptions: this.afterContextMenuDefaultOptions.bind(this),

                      beforeChange: this.beforeChange.bind(this),

                      columns: columns,
                      columnSorting: true,
                      contextMenu: {
                        items: {
                          'undo': {
                            key: 'undo'
                          },
                          'redo': {
                            key: 'redo'
                          },
                          'sep1': {
                            "name": '---------'
                          },
                          'cut': {
                            key: 'cut'
                          },
                          'copy': {
                            key: 'copy'
                          },
                          'sep2': {
                            "name": '---------'
                          },
                          'make_copy': {
                            name: 'Copy Record',
                            callback: this.copyRecord.bind(this)
                          },
                          // 'delete_item': {
                          //   name: 'Delete Item',
                          //   // callback: this.viewRecord.bind(this) // TODO: <--- Implement delete item
                          // },
                          'sep3': {
                            "name": '---------'
                          },
                          'view_item': {
                            name: 'View Record',
                            callback: this.viewRecord.bind(this)
                          },
                          'edit_item': {
                            name: 'Edit Record',
                            callback: this.editRecord.bind(this)
                          }
                        }
                      },
                      data: this._data,
                      dropdownMenu: [
                        'filter_by_value',
                        'filter_action_bar'
                      ],
                      filters: true,
                      fixedColumnsStart: 3,
                      rowHeaders: true,
                      colHeaders: headers,
                      // width: '100%',
                      stretchH: 'last',
                      height: 'auto',
                      licenseKey: 'non-commercial-and-evaluation', // for non-commercial use only
                      // TODO: sort options alphabetically
                      manualColumnResize: true,
                      persistentState: true
                    }
                  );

                Ext.getBody().unmask();

                // Size the table container so that it fills the entire vertical height of the page

                jQuery(window).resize();

              }.bind(this)
            )
            .catch(
              function (e) {

                Ext.getBody().unmask();

                console.error('buildTable:Promise.catch: ' + e.name + ' - ' + e.message);

                this.showMessage(
                  message.Type.ERROR,
                  'Unexpected Error', 'This script is not functioning correctly. Please raise a helpdesk ticket for the NetSuite Group'
                );

              }.bind(this)
            );

        } catch (e) {

          Ext.getBody().unmask();

          console.error('buildTable: ' + e.name + ' - ' + e.message);

          this.showMessage(
            message.Type.ERROR,
            'Unexpected Error', 'This script is not functioning correctly. Please raise a helpdesk ticket for the NetSuite Group'
          );

        }

      }

      async getListData(source, query, callback) {

        console.log('getListData:source = ' + source);
        console.log('getListData:query = ' + query);

        try {

          debugger;

          if (!Array.isArray(this._listData[source])) {

            console.log('getListData:Retrieving the list data from NetSuite');

            // Retrieve the list data from NetSuite

            let params = {};

            params[constants.SCRIPTS.DATA_HANDLER.REQUEST_PARAMS.LIST_TYPE.ID] = source;

            console.log('buildTable:params = ' + JSON.stringify(params) + ' {' + (typeof params) + '}');

            let restletUrl = this.getDataHandlerUrl(params);
            // url.resolveScript(
            //   {
            //     scriptId: constants.SCRIPTS.DATA_HANDLER.SCRIPT_ID,
            //     deploymentId: constants.SCRIPTS.DATA_HANDLER.DEPLOY_ID,
            //     params: params
            //   }
            // );

            // TODO: Fix url

            this._listData[source] = await this.callRESTlet(https.Method.GET, restletUrl);

          } else {

            console.log('getListData:Using the cached list data');

          }

        } catch (e) {

          console.error('getListData: ' + e.name + ' - ' + e.message);

          this._listData[source] = []

        } finally {

          callback(this._listData[source]);

        }

      }


      dataChanged(changes, source) {

        if (
          (source === 'loadData') ||
          (source === 'copyRecord')
        ) {

          return;

        }

        console.log('dataChanged:changes = ' + JSON.stringify(changes));

        if (changes) {

          changes.forEach(
            (change) => {
              let row = change.shift();
              let prop = change.shift();
              change.shift();
              let newValue = change.shift();
              let col = this._hot.propToCol(prop);
              let oldValue;

              console.log('row = ' + row);
              console.log('prop = ' + prop);
              console.log('col = ' + col);
              console.log('newValue = ' + newValue + ' {' + (typeof newValue) + '}');

              oldValue = this._sourceData[row][prop];

              console.log('oldValue = ' + oldValue + ' {' + (typeof oldValue) + '}');

              let itemInternalId =
                this._hot.getDataAtRowProp(row, 'internalid');

              console.log('itemInternalId = ' + itemInternalId + ' {' + (typeof itemInternalId) + '}');

              if (!(itemInternalId in this._changesToSave)) {
                this._changesToSave[itemInternalId] = {};
              }

              if (!(itemInternalId in this._changesPendingSave)) {
                this._changesPendingSave[itemInternalId] = {};
              }

              if (oldValue === newValue) {
                delete this._changesToSave[itemInternalId][prop];
                delete this._changesPendingSave[itemInternalId][prop];
              } else {
                this._changesToSave[itemInternalId][prop] = newValue;
                delete this._changesPendingSave[itemInternalId][prop];

              }
            }
          );

          console.log('this._changesToSave = ' + JSON.stringify(this._changesToSave));
          console.log('this._changesPendingSave = ' + JSON.stringify(this._changesPendingSave));

          // Need to re-render to retrigger afterCellRendered which has already been fired
          this._hot.render();

        }
      }

      afterCellRendered(td, row, column, prop, value, cellProperties) {
        if (this._hot) {
          let itemInternalId = this._hot.getDataAtRowProp(row, 'internalid');

          td.style.backgroundColor = '';



          if (this._changesToSave[itemInternalId]) {
            if (this._changesToSave[itemInternalId][prop] !== undefined) {
              td.style.backgroundColor = 'lightblue';
            }
          }

          if (this._changesPendingSave[itemInternalId]) {
            if (this._changesPendingSave[itemInternalId]['row'] === true) {
            } else if (this._changesPendingSave[itemInternalId][prop] !== undefined) {
              td.style.backgroundColor = 'red';
            }
          }
        }
      }

      afterContextMenuDefaultOptions(predefinedItems) {
        console.log('predefinedItems = ' + JSON.stringify(predefinedItems));

      }

      beforeChange(changes, source) {

        debugger;

        if (source === 'loadData') {

          return true;

        }

        console.log('beforeChange:changes = ' + JSON.stringify(changes));

        debugger;

        if (changes) {

          changes.forEach(
            (change, index) => {

              let row = change[0];
              let prop = change[1];
              let oldValue = change[2];
              let newValue = change[3];
              let col = this._hot.propToCol(prop);
              let isEditable =
                (
                  (this._hot.getCellEditor(row, col) !== false) ||
                  (source === 'copyRecord')
                );

              console.log('row = ' + row);
              console.log('prop = ' + prop);
              console.log('col = ' + col);
              console.log('oldValue = ' + oldValue + ' {' + (typeof oldValue) + '}');
              console.log('newValue = ' + newValue + ' {' + (typeof newValue) + '}');

              if (!isEditable) {

                changes[index] = null;

              } else {

                changes[index][3] = this.convertToColumnType(prop, newValue);

              }

            }
          );

          console.log('changes = ' + JSON.stringify(changes));

        }

        return true;

      }

      async saveRecordChanges(recordId, changes) {

        let body = {};

        body[constants.SCRIPTS.DATA_HANDLER.REQUEST_PARAMS.RECORD_TYPE.ID] = this.TABLE_ROW_RECORD_TYPE;
        body[constants.SCRIPTS.DATA_HANDLER.REQUEST_PARAMS.RECORD_ID.ID] = recordId;
        body[constants.SCRIPTS.DATA_HANDLER.REQUEST_PARAMS.CHANGES.ID] = changes;

        return this.callRESTlet(
          https.Method.PUT,
          this.getDataHandlerUrl(),
          body
        );

      }

      viewRecord(key, options) {
        console.log('key = ' + key);
        console.log('options = ' + JSON.stringify(options));

        let selectedRows = [];
        let selectedRow;

        if (options.length !== 1) {
          return;
        }


        for (selectedRow = options[0].start.row; selectedRow <= options[0].end.row; selectedRow++) {
          try {
            let itemInternalId = this._hot.getDataAtRowProp(selectedRow, 'internalid');
            let itemUrl;

            if (itemInternalId) {
              itemUrl =
                url.resolveRecord(
                  {
                    isEditMode: false,
                    recordType: 'serviceitem',
                    recordId: itemInternalId
                  }
                );

              window.open(itemUrl, '_blank');
            }
          } catch (e) {
            console.error(e);
          }
        }
      }

      editRecord(key, options) {
        console.log('key = ' + key);
        console.log('options = ' + JSON.stringify(options));

        let selectedRow;

        if (options.length !== 1) {
          return;
        }

        for (selectedRow = options[0].start.row; selectedRow <= options[0].end.row; selectedRow++) {
          try {
            let itemInternalId = this._hot.getDataAtRowProp(selectedRow, 'internalid');
            let itemUrl;

            if (itemInternalId) {
              itemUrl =
                url.resolveRecord(
                  {
                    isEditMode: true,
                    recordType: 'serviceitem',
                    recordId: itemInternalId
                  }
                );

              window.open(itemUrl, '_blank');
            }
          } catch (e) {
            console.error(e);
          }
        }
      }

      getNewRecordValues() {

        let values = {};

        try {

        } catch (e) {

        }

      }
      copyRecord(key, options) {

        debugger;

        try {

          if (options.length !== 1) {

            // Ignore non-consecutive ranges

            // TODO: Add message to the user

            return;

          }

          // N.B. options[0].start.row and options[0].end.row contain VISUAL row indicies

          let nameId;
          let copyNameId;
          let id;

          for (let selectedVisRow = options[0].start.row; selectedVisRow <= options[0].end.row; selectedVisRow++) {

            try {

              let selectedPhysRow = this._hot.toPhysicalRow(selectedVisRow);
              let userError;

              if (selectedPhysRow === null) {

                // console.log('copyRecord: Unable to find a physical row for ' + nameId);
                throw new Error('Unable to find a physical row for visual row ' + selectedVisRow);

              }

              id = this._hot.getDataAtRowProp(selectedVisRow, this.TABLE_ROW_RECORD_ID_FIELD);

              if (!id) {

                // console.log('copyRecord: Unable to find internal id for ' + nameId);
                throw new Error('Unable to find internal id for visual row ' + selectedVisRow);

              }

              nameId = this._hot.getDataAtRowProp(selectedVisRow, this.TABLE_ROW_RECORD_NAMEID_FIELD);

              // N.B. Cloning properties to ensure table source data doesn't get changed

              let dstRowValues = _.cloneDeep(this._hot.getSourceDataAtRow(selectedPhysRow));

              console.log('copyRecord:dstRowValues = ' + JSON.stringify(dstRowValues));

              // Populate required fields

              let copy =
                record.copy(
                  {
                    type: this.TABLE_ROW_RECORD_TYPE,
                    id: id,
                    isDynamic: true
                  }
                );

              for (let f = 0; f < this.TABLE_ROW_NEW_RECORD_REQD_FIELDS.length; f++) {

                let info = this.TABLE_ROW_NEW_RECORD_REQD_FIELDS[f];
                let val;

                switch (info.from) {

                  case 'prompt':

                    val =
                      prompt(
                        'Please enter a value for ' +
                        this._headersById[info.id],
                        dstRowValues[info.id]
                      );

                    if (val === null) {

                      // User cancelled prompt

                      userError = new Error('User cancelled copy operation');
                      userError.name = 'CancelError';

                      throw userError;

                    }

                    if ((!util.isString(val)) || (val.trim() === '')) {

                      userError = new Error('A value for ' + this._headersById[info.id] + ' is required');
                      userError.name = 'ValidationError';

                      throw userError;

                    }

                    if (!info.allowSame) {

                      if (val.trim() === dstRowValues[info.id]) {

                        userError = new Error('A different value for ' + this._headersById[info.id] + ' is required');
                        userError.name = 'ValidationError';

                        throw userError;

                      }

                    }

                    dstRowValues[info.id] = val;

                    break;

                  case 'source':

                    dstRowValues[info.id] = this._hot.getSourceDataAtRow(selectedPhysRow)[info.id];

                    break;

                  default:
                    break;

                }

                copy.setValue(
                  {
                    fieldId: info.id,
                    value: dstRowValues[info.id]
                  }
                );

              }

              Ext.getBody().mask('Please wait ...');

              console.log('copyRecord:dstRowValues = ' + JSON.stringify(dstRowValues));

              copyNameId =
                copy.getValue(
                  {
                    fieldId: this.TABLE_ROW_RECORD_NAMEID_FIELD,
                    value: dstRowValues[this.TABLE_ROW_RECORD_NAMEID_FIELD]
                  }
                );

              // Create the copy in NetSuite and update the ID field with the new internal id
              // Add the name of the record to the internal record name register

              dstRowValues[this.TABLE_ROW_RECORD_ID_FIELD] = copy.save();

              this._recordNamesById[dstRowValues[this.TABLE_ROW_RECORD_ID_FIELD]] = dstRowValues[this.TABLE_ROW_RECORD_NAMEID_FIELD];

              // Transform into values for setDataAtRowProp()
              // i.e. [ row, propererty, value. ... ]

              let _dstRowValues = [];

              Object.keys(dstRowValues).forEach(
                (prop) => {

                  _dstRowValues.push(
                    [
                      (selectedVisRow + 1),
                      prop,
                      dstRowValues[prop]
                    ]
                  );

                }
              );

              console.log('copyRecord:_dstRowValues = ' + JSON.stringify(_dstRowValues));

              this._hot.alter('insert_row_below', selectedVisRow);
              this._hot.setDataAtRowProp(_dstRowValues, 'copyRecord');

              console.log('copyRecord: Copied ' + nameId + ' to ' + copyNameId);

              this.showMessage(
                message.Type.CONFIRMATION,
                'Success',
                'Copied ' + nameId + ' to ' + copyNameId
              );

              Ext.getBody().unmask();

            } catch (e) {

              // Just in case the error occurred after the mask was put in place

              Ext.getBody().unmask();

              if (e.name === 'ValidationError') {

                this.showMessage(
                  message.Type.ERROR,
                  'User Error',
                  e.message
                );

              } else if (e.name === 'CancelError') {

                console.warn('copyRecord: ' + e.name + ' - ' + e.message);

              } else {

                console.error('copyRecord: ' + e.name + ' - ' + e.message);

                this.showMessage(
                  message.Type.ERROR,
                  'Failed',
                  'Unable to make a copy of ' + nameId
                );

              }

            }

          }

        } catch (e) {

          console.error('copyRecord: ' + e.name + ' - ' + e.message);

        }

      }

      viewItemsClick() {

        console.log('viewItemsClick');

        let formValues = this.getTableDataRequestParameters();

        debugger;

        if (formValues[constants.FIELDS.CATEGORY.ID].valid) {

          this.hideMessage();
          this._changesToSave = {};
          this._changesPendingSave = {};

          debugger;

          this.buildTable();

        } else {

          this.showMessage(
            message.Type.INFORMATION,
            '',
            'Please select a category',
            4000
          );

        }

      }

      /** @deprecated */
      sendChanges(changesByItemInternalId) {
      }

      //////////

      saveChanges(changesByInternalId) {

        return new Promise(
          async function (resolve, reject) {

            let promises = {};
            let results = {};
            let internalId;

            for (internalId in changesByInternalId) {

              // TODO: Map internalId to record name for console logs and errors

              try {

                console.log('saveChanges:Attempting to save changes to record ' + internalId);

                let changes = changesByInternalId[internalId];

                console.log('changes = ' + JSON.stringify(changes));

                promises[internalId] =
                  this.saveRecordChanges(
                    internalId,
                    changes
                  );

                console.log('saveChanges:Save of changes to item ' + internalId + ' trigggered');

              } catch (e) {

                console.error('saveChanges:Error occurred while attempting to save changes to item ' + internalId + ' - ' + e);

                reject(e);

              }

            }

            let resolutions = await Promise.all(Object.values(promises));

            Object.keys(promises).forEach(
              (internalId, index) => {

                results[internalId] = resolutions[index];

              }
            );

            resolve(results);

          }.bind(this)
        );

      }

      saveChangesClick() {

        console.log('saveChangesClick');
        console.log('saveChangesClick:current data = ' + JSON.stringify(this._data));
        console.log('saveChangesClick:this._changesToSave = ' + JSON.stringify(this._changesToSave));
        console.log('saveChangesClick:this._changesPendingSave = ' + JSON.stringify(this._changesPendingSave));

        if (Object.keys(this._changesPendingSave).length !== 0) {

          // Merge changes that still need to be saved into the changes list

          _.merge(this._changesToSave, this._changesPendingSave);

          // Reset the list of changes that still need to be saved

          this._changesPendingSave =
            _.mapValues(
              this._changesToSave,
              () => {

                return {};

              }
            );

        }

        this.hideMessage();

        // Clean up the list of changes for testing whether there are changes to be saved

        let cleanChanges =
          _.pickBy(
            this._changesToSave,
            (obj) => {

              return (Object.keys(obj).length !== 0);

            }
          );

        console.log('cleanChanges = ' + JSON.stringify(cleanChanges));

        if (Object.keys(cleanChanges).length === 0) {

          console.warn('No changes to save');

          this.showMessage(
            message.Type.WARNING,
            '',
            'No changes to save'
          );

          return;

        }

        Ext.getBody().mask('Please wait ...');

        setTimeout(
          function () {

            this.saveChanges(cleanChanges)
              .then(
                function (results) {

                  console.log('saveChangesClick:results = ' + JSON.stringify(results));

                  let errsById = {};
                  let itemsUpdated = [];
                  let itemsNotUpdated = [];
                  let id;

                  for (id in results) {

                    console.log('saveChangesClick:Examing result of saving item ' + id);

                    if (results[id].saved === false) {

                      itemsNotUpdated.push(id);

                      // N.B. Substitution of item name for internal id handled in this.displayErrors

                      errsById[id] = results[id].errors;

                      results[id].errors.forEach(

                        (err) => {

                          console.error('saveChangesClick:Error saving item ' + id + ' changes ' + err.name + ' - ' + err.message);

                        }

                      );

                    } else {

                      itemsUpdated.push(this._recordNamesById[id]);

                      // TODO: Reset changes for fields that were successfully saved

                      results[id].fieldsUpdated.forEach(
                        (fieldId) => {

                          delete this._changesToSave[id][fieldId];

                          console.log('saveChangesClick:removed changesToSave[' + id + '][' + fieldId + ']');

                          delete this._changesPendingSave[id][fieldId];

                          console.log('saveChangesClick:removed changesPendingSave[' + id + '][' + fieldId + ']');

                        }
                      );

                    }

                  }

                  if (itemsNotUpdated.length > 0) {

                    // Some record changes could not be saved

                    if (itemsUpdated.length > 0) {

                      // Some record changes were saved so show which were saved

                      this.showMessage(
                        message.Type.CONFIRMATION,
                        // itemsUpdated.length + ' items saved',
                        'Items saved: ' + itemsUpdated.length,
                        this.createHtmlListStr(itemsUpdated)
                      );

                    }

                    // Show the errors generated by saving

                    this.displayErrors(errsById);

                  } else {

                    // No errors were generated

                    if (itemsUpdated.length > 0) {

                      this.showMessage(
                        message.Type.CONFIRMATION,
                        'Items saved',
                        this.createHtmlListStr(itemsUpdated)
                      );

                      // Trigger a reload of the item information to avoid issues in case a field value is reset
                      // to its initial value prior to the save button click. This would mean that the field value
                      // in NetSuite will differ from that shown to the user and the "change" will not be flagged internally,
                      // and a further save button click will not trigger the update of NetSuite.

                      this.viewItemsClick();

                    } else {

                      // No errors were generated but nothing was saved either ?!

                      console.warn('saveChangesClick:No errors were generated but nothing was saved either ?!');

                    }

                  }

                }.bind(this)
              )
              .catch(
                function (err) {

                  console.error('saveChangesClick.catch: ' + err);

                }
              )
              .finally(
                function () {

                  Ext.getBody().unmask();

                }
              );

          }.bind(this),
          0
        );

      }

      exportRecords(fileName) {

        try {

          let exportPlugin = this._hot.getPlugin('exportFile');

          exportPlugin.downloadFile(
            'csv',
            {
              bom: false,
              columnDelimiter: ',',
              columnHeaders: true,
              exportHiddenColumns: false,
              exportHiddenRows: false,
              fileExtension: 'csv',
              filename: fileName,
              mimeType: 'text/csv',
              rowDelimiter: '\r\n',
              rowHeaders: false
            }
          );

        } catch (e) {

          console.error('exportRecords: ' + e.name + ' - ' + e.message);

        }

      }

      exportButtonOnClick() {

        try {

          if (
            (!this._hot) ||
            (this._hot.countSourceRows() < 1)
          ) {

            this.showMessage(
              message.Type.INFORMATION,
              '',
              'No records available for export'
            );

            return;

          }

          let fileName = this.getTableExportFilename();

          if (fileName === false) {

            this.showMessage(
              message.Type.ERROR,
              '',
              'Unable to determine a file name'
            );

            return;

          }

          this.exportRecords(fileName);

          this.showMessage(
            message.Type.CONFIRMATION,
            'Success',
            'Records exported to file: ' + fileName + '.csv'
          );

        } catch (e) {

          console.error('exportButtonOnClick: ' + e.name + ' - ' + e.message);

          this.showMessage(
            message.Type.ERROR,
            'Unexpected Error', 'This script is not functioning correctly. Please raise a helpdesk ticket for the NetSuite Group'
          );

        }

      }

      windowOnResize() {

        // TODO: Rename items to table once items client script has been updated
        let $handsontable = jQuery('#items');
        let $document = jQuery(document);


        // window height - items vertical offset - 30
        let tableHeight = $document.height() - $handsontable.offset()['top'] - 30;

        // console.log('$document.height() = ' + $document.height());
        // console.log('$handsontable.offset()[\'top\'] = ' + $handsontable.offset()['top']);
        // console.log('tableHeight = ' + tableHeight);

        $handsontable.height(tableHeight);

      }

      hideMessage() {
        if (this._message) {
          this._message.hide();
          this._message = null;
        }
      }

      /**
       *
       * @param {message.Type} type
       * @param {string} title
       * @param {string} msg
      //  * @param {string} [duration]
       */
      showMessage(type, title, msg, duration) {
        let _duration = 0;

        if (type == message.Type.WARNING) {
          _duration = 3000;
        }

        if (util.isNumber(duration)) {
          _duration = duration;
        }

        this.hideMessage();

        this._message =
          message.create(
            {
              type: type,
              title: title,
              message: msg
            }
          );

        this._message.show(
          {
            duration: _duration
          }
        );

      }

      displayErrors(errorsByItem) {

        let str = '<ol style="list-style: unset">';
        let id;
        let err;

        for (id in errorsByItem) {
          str += '<li><h1>Item ' + this._recordNamesById[id] + '</h1>' + '</li>';
          str += '<ul style="list-style: auto">';

          let matches;
          let prop;
          let value;

          errorsByItem[id].forEach(
            (err) => {

              switch (err.name) {

                case 'INVALID_KEY_OR_REF':

                  matches =
                    err.message.match(
                      /Invalid (.*) reference key (.*)\./
                    );

                  if (matches) {

                    prop = matches[1];
                    value = matches[2];

                    str += '<li>' + 'Invalid value ' + value + ' for field ' + this._headersById[prop] + '</li>';
                  } else {

                    // TODO: Implement if matches == null

                  }
                  break;

                case 'INVALID_FLD_VALUE':

                  matches =
                    err.message.match(
                      /You have entered an Invalid Field Value (.*) for the following field: (.*)/
                    );

                  if (matches) {

                    value = matches[1];
                    prop = matches[2];

                    str +=
                      '<li>' +
                      'Invalid value ' +
                      value +
                      ' for field ' +
                      this._headersById[prop] +
                      '</li>';
                  } else {

                    // TODO: Implement if matches == null

                  }
                  break;


                case 'RCRD_SUB_MISMATCH_WITH_CLASS':

                  matches =
                    err.message.match(
                      /The subsidiary restrictions on this record are incompatible with those defined for class: (.*)\.  Subsidiary access on this record must be a subset of those permitted by the class\./
                    );

                  if (matches) {

                    value = matches[1];

                    str +=
                      '<li>' +
                      'The subsidiary restrictions on this record are incompatible with those defined for class ' +
                      value +
                      '</li>';
                  } else {

                    // TODO: Implement if matches == null

                  }
                  break;

                default:
                  str += '<li>' + err.name + ' - ' + err.message + '</li>';
                  break;

              }

            }
          );

          str += '</ul>';
        }

        str += '</ol>';

        this.showMessage(message.Type.ERROR, 'Save Errors', str);
      }

      convertToColumnType(prop, newValue) {

        console.log('convertToColumnType:prop = ' + prop + ' {' + (typeof prop) + '}');
        console.log('convertToColumnType:newValue = ' + newValue + ' {' + (typeof newValue) + '}');

        let converted = newValue;

        try {

          if (this._columnsById[prop]) {

            switch (this._columnsById[prop].type) {

              case 'checkbox':

                if (typeof newValue !== 'boolean') {

                  if (newValue === 'TRUE') {

                    converted = true;

                  } else if (newValue === 'FALSE') {

                    converted = false;

                  }

                }
                break;

              case 'numeric':

                if (typeof newValue !== 'number') {

                  let parsed = Number(newValue);

                  if (!isNaN(parsed)) {

                    converted = parsed;

                  } else {

                    console.error('Value provided for ' + prop + ' is not a number');

                  }

                }

                break;

              default:
                break;

            }

            console.log('convertToColumnType:converted = ' + converted + ' {' + (typeof converted) + '}');

            return converted;

          }

        } catch (e) {

          console.error('convertToColumnType' + e);

        }

        return converted;

      }

      createHtmlListStr(elements, ordered) {

        let str = '';

        if (elements) {

          if (!!ordered) {

            str += '<ol style="list-style: revert">';

          } else {

            str += '<ul style="list-style: revert">';

          }

          str += '<li>' + elements.join('</li><li>') + '</li>';

          if (!!ordered) {

            str += '</ol>';

          } else {

            str += '</ul>';

          }

        }

        return str;

      }
    }

    return new UserInterfaceClientModule();
  }
);