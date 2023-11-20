/**
 * @NApiVersion 2.1
 * @NAmdConfig /SuiteScripts/IVE Scripts/Modules/amdconfig.json
 */
define(
  [
    'N/currentRecord',
    'N/https',
    'N/record',
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
    search,
    message,
    url,
    //common,
    constants,
    _
  ) => {

    /*
    class UserInterfaceClientModule {
      constructor() {
      }

      get SAVE_CHANGES_RESTLET_URL() {
        const s = this._saveChangesRestletURL;

        return s;
      }

      initUI() {

        this.buildItemsTable();

      }

      getParameters() {
        let fields = currentRecord.get();
        let params = false;
        // let area;
        let category;
        // let subCategory;
        let searchId;

        // area =
        //   fields.getValue(
        //     {
        //       fieldId: constants.FIELDS.AREA.ID
        //     }
        //   );

        category =
          fields.getValue(
            {
              fieldId: constants.FIELDS.CATEGORY.ID
            }
          );

        // log.debug(
        //   {
        //     title: 'getParameters:category',
        //     details: category
        //   }
        // );
        console.log('getParameters:category = ' + category);

        category = Number(category);

        if (isNaN(category)) {
          return false;
        }

        searchId =
          fields.getValue(
            {
              fieldId: constants.FIELDS.ITEM_FIELDS_SEARCH.ID
            }
          );

        searchId = Number(searchId);

        console.log('getParameters:searchId = ' + searchId);

        // subCategory =
        //   fields.getValue(
        //     {
        //       fieldId: constants.FIELDS.SUB_CATEGORY.ID
        //     }
        //   );

        // log.debug(
        //   {
        //     title: 'getParameters:subCategory',
        //     details: subCategory
        //   }
        // );
        // console.log('getParameters:subCategory = ' + subCategory);

        if (
          // area &&
          category
        ) {
          params = {};
          // params[constants.SCRIPTS.USER_INTERFACE.PARAM_AREA] = area;
          params[constants.SCRIPTS.USER_INTERFACE.PARAM_CATEGORY] = category;
          // params[constants.SCRIPTS.USER_INTERFACE.PARAM_SUB_CATEGORY] = subCategory;
        }

        if (searchId) {
          params[constants.SCRIPTS.GET_ITEMS.PARAM_ITEM_SEARCH] = searchId;
        }

        return params;
      }

      buildItemsTable() {
      }

      getItemsData() {
        let data = [];

        try {
          let params = this.getParameters();

          if (params !== false) {
            let rlUrl =
              url.resolveScript(
                {
                  scriptId: constants.SCRIPTS.GET_ITEMS.SCRIPT_ID,
                  deploymentId: constants.SCRIPTS.GET_ITEMS.DEPLOY_ID,
                  params: params
                }
              );

            response =
              https.get(
                {
                  url: rlUrl,
                  headers: {
                    'content-Type': 'application/json'
                  }
                }
              );

            log.debug(
              {
                title: 'getItemsData:response.body',
                details: response.body
              }
            );

            if (util.isString(response.body) && (response.body.trim() !== '')) {
              data = JSON.parse(response.body);
            }
          }
        } catch (e) {
          data = [];

          log.emergency(
            {
              title: 'getItemsData',
              details: e
            }
          );
        }

        return data;
      }

      async saveRecordChanges(recordType, recordId, changes) {
        return new Promise(
          function (resolve, reject) {
            try {
              let body = {};

              body[constants.SCRIPTS.SAVE_CHANGES.PARAMS.RECORD_TYPE] = recordType;
              body[constants.SCRIPTS.SAVE_CHANGES.PARAMS.RECORD_ID] = recordId;
              body[constants.SCRIPTS.SAVE_CHANGES.PARAMS.CHANGES] = changes;

              return https.post.promise(
                {
                  url: this.SAVE_CHANGES_RESTLET_URL,
                  headers: {
                    'content-Type': 'application/json',
                  },
                  body: body
                }
              )
                .then(
                  function (response) {
                    console.log('response.body = ' + response.body);

                    try {
                      let body = JSON.parse(response.body);

                      resolve(body);
                    } catch (e) {
                      console.error(e);

                      reject('saveRecordChanges: Invalid JSON response: ' + e);
                    }
                  }
                )
                .catch(
                  function (err) {
                    reject('saveRecordChanges: ' + err);
                  }
                );
            } catch (e) {
              reject('saveRecordChanges: ' + e);
            }
          }.bind(this)
        );
      }

      viewRecord(key, options) {
        console.log('key = ' + key);
        console.log('options = ' + JSON.stringify(options));
        // options = [{"start":{"row":0,"col":2},"end":{"row":0,"col":2}}]

        let selectedRows = [];
        let selectedRow;
        // let startRow = -1;
        // let endRow = -1;

        if (options.length !== 1) {
          return;
        }

        // options.forEach(
        //   (range) => {
        //     if (selectedRows.indexOf(range.start.row) === -1) {
        //       selectedRows.push(range.start.row);
        //     }

        //     if (selectedRows.indexOf(range.end.row) === -1) {
        //       selectedRows.push(range.end.row);
        //     }
        //   }
        // );

        // console.log('selectedRows = ' + selectedRows);

        // startRow = Math.min(...selectedRows);
        // endRow = Math.max(...selectedRows);

        // console.log('startRow = ' + startRow);
        // console.log('endRow = ' + endRow);

        // let proceed = false;

        // if (selectedRows.length > 1) {
        //   proceed = confirm('Do you wish to open multiple records ?');
        // } else if (selectedRows.length === 1) {
        //   proceed = true;
        // }

        // if (proceed === false) {
        //   return;
        // }

        // if (selectedRows.length !== 1) {
        //   return;
        // }

        // selectedRow = selectedRows[0];

        // for (selectedRow = selectedRows[0].start; selectedRow <= selectedRows[0].end; selectedRow++) {
        //   let itemInternalId = this._hot.getDataAtRowProp(selectedRow, 'internalid');

        //   if (itemInternalId) {
        //     let itemUrl =
        //       url.resolveRecord(
        //         {
        //           isEditMode: false,
        //           recordType: 'item',
        //           recordId: itemInternalId
        //         }
        //       );

        //       window.open(itemUrl, '_blank');
        //   }
        // }
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
        // options = [{"start":{"row":0,"col":2},"end":{"row":0,"col":2}}]

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

      // cellRenderer(instance, td, row, col, prop, value, cellProperties) {
      //   let renderer = this.getCellRenderer(row, col);

      //   renderer.apply(this, arguments);
      //   td.style.color = 'blue';
      // }

      viewItemsClick() {
        console.log('viewItemsClick');

        let fields = currentRecord.get();
        let categoryId =
          Number(
            fields.getValue(
              {
                fieldId: constants.FIELDS.CATEGORY.ID
              }
            )
          );

        if (!isNaN(categoryId) && categoryId > 0) {
          this.hideMessage();
          this.changesToSave = {};
          this.changesPendingSave = {};
          // this.recordsById = {};
          this.buildItemsTable();
        } else {
          this.showMessage(
            message.Type.WARNING,
            // '', 'No Item Category selected.<br/><br/>Hint: First select an item category',
            '', 'First select an item category'//,
            // 4000
          );
        }
      }

      sendChanges(changesByItemInternalId) {

        return new Promise(
          async (resolve, reject) => {

            let promises = {};
            let results = {};
            let itemInternalId;

            for (itemInternalId in changesByItemInternalId) {

              // TODO: Map itemInternalId to item name for console logs and errors

              try {

                console.log('sendChanges:Attempting to save changes to item ' + itemInternalId);

                let changes = changesByItemInternalId[itemInternalId];

                console.log('changes = ' + JSON.stringify(changes));

                promises[itemInternalId] = this.saveRecordChanges(record.Type.SERVICE_ITEM, itemInternalId, changes);

                console.log('sendChanges:Save of changes to item ' + itemInternalId + ' trigggered');

              } catch (e) {

                console.error('sendChanges:Error occurred while attempting to save changes to item ' + itemInternalId + ' - ' + e);

                reject(e);

              }

            }

            let resolutions = await Promise.all(Object.values(promises));

            Object.keys(promises).forEach(
              (itemInternalId, index) => {

                results[itemInternalId] = resolutions[index];

              }
            );

            resolve(results);
          }
        );
      }

      saveChangesClick() {
        console.log('saveChangesClick');
        // let data = this._hot.getData();

        console.log('saveChangesClick:current data = ' + JSON.stringify(this.data));
        console.log('saveChangesClick:this.changesToSave = ' + JSON.stringify(this.changesToSave));
        console.log('saveChangesClick:this.changesPendingSave = ' + JSON.stringify(this.changesPendingSave));
        // console.log('saveChangesClick:this.recordsById = ' + JSON.stringify(this.recordsById));

        if (Object.keys(this.changesPendingSave).length !== 0) {
          // Merge changes that still need to be saved into the changes list

          _.merge(this.changesToSave, this.changesPendingSave);

          // Reset the list of changes that still need to be saved

          this.changesPendingSave =
            _.mapValues(
              this.changesToSave,
              () => {
                return {};
              }
            );
        }

        this.hideMessage();

        // Clean up the list of changes for testing whether there are changes to be saved

        let cleanChanges =
          _.pickBy(
            this.changesToSave,
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

            this.sendChanges(cleanChanges)
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

                      itemsUpdated.push(this.itemNamesById[id]);

                      // TODO: Reset changes for fields that were successfully saved

                      results[id].fieldsUpdated.forEach(
                        (fieldId) => {

                          delete this.changesToSave[id][fieldId];

                          console.log('saveChangesClick:removed changesToSave[' + id + '][' + fieldId + ']');

                          delete this.changesPendingSave[id][fieldId];

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
                        itemsUpdated.length + ' items saved',
                        this.createHtmlListStr(itemsUpdated),
                        6000
                      );

                    }

                    // Show the errors generated by saving

                    this.displayErrors(errsById);

                  } else {

                    // No errors were generated

                    if (itemsUpdated.length > 0) {

                      this.showMessage(
                        message.Type.CONFIRMATION,
                        itemsUpdated.length + ' items saved',
                        this.createHtmlListStr(itemsUpdated),
                        6000
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

        // TODO: Remove all code below once reviewed
        return;

        let itemErrors = {};
        let itemInternalId;
        let itemRecord;
        let itemCode;
        let itemChanges;
        let fieldId;

        // TODO: Add error handling for governance failure

        for (itemInternalId in this.changesToSave) {
          // console.log('Attempting to save changes to item ' + itemInternalId);

          // itemChanges = this.changesToSave[itemInternalId];

          // console.log('itemChanges = ' + JSON.stringify(itemChanges));

          // TODO: Replace with global switch
          // let test = false;

          // try {
          // if (test) {
          //   throw constants.ERRORS.ITM_TEST_ERROR('record loading');
          // }

          // if (!this.recordsById[itemInternalId]) {
          // TODO: Handle error when record hasn't already been pre-loaded
          // }

          // itemRecord = this.recordsById[itemInternalId];
          //     // TODO: Implement for any item type by adding additional hidden column with record type
          //     // TODO: Restore after error testing

          // console.log('Item ' + itemInternalId + ' loaded');

          // itemCode = itemRecord.getValue({ fieldId: 'itemid' });
          // } catch (e) {
          //   console.error((e.type || 'Javascript Error') + ' item ' + itemInternalId + ' ' + e.name + ' - ' + e.message);
          //   console.log('Item ' + itemInternalId + ' NOT loaded');

          // if (!(itemInternalId in itemErrors)) {
          //   itemErrors[itemInternalId] = {};
          // }

          // Prevents saving of the record

          // TODO: Replace itemInternalId with item name from the table
          itemErrors[itemInternalId]['row'] = e;

          this._hot.render();

          // Skip attempting to save the changes to this record

          // continue;
          // }

          // console.log('Attempting to save changes to item ' + itemInternalId);

          for (fieldId in itemChanges) {
            try {
              console.log('Changing ' + fieldId + ' to ' + itemChanges[fieldId]);

              if (this.columnsById[fieldId].type === 'dropdown') {
                itemRecord.setText({ fieldId: fieldId, text: itemChanges[fieldId] });
              } else {
                itemRecord.setValue({ fieldId: fieldId, value: itemChanges[fieldId] });
              }
            } catch (e) {

              if (!(itemCode in itemErrors)) {
                itemErrors[itemCode] = {};
              }

              if ((!(fieldId in itemErrors[itemCode]))) {
                itemErrors[itemCode][fieldId] = e;
              }

              this.changesPendingSave[itemInternalId][fieldId] = this.changesToSave[itemInternalId][fieldId];
            } finally {
            }
          }

          this._hot.render();

          // TODO: Change this so that if save errors occur the code can pick up all errors, currently if a record
          // doesn't get saved the other errors get skipped

          console.log('Item ' + itemCode + ' (' + itemInternalId + ')' + ' field changes made successfully');

          try {
            itemRecord.save();

            // Remove changes and unsaved changes for this item from the list
            delete this.changesToSave[itemInternalId];
            delete this.changesPendingSave[itemInternalId];
          } catch (e) {
            // Item record could not be saved

            // N.B. Errors triggered by a missing value for a mandatory field will arrive here
            // TODO: Implement handling for missing values for mandatory fields

            console.error(e);

            if (!(itemInternalId in itemErrors)) {
              itemErrors[itemInternalId] = {};
            }

            itemErrors[itemInternalId]['all'] = e;

            debugger;
            if (e.validationDetail && e.validationDetail.fields) {
              e.validationDetail.fields.forEach(
                (fld) => {
                  this.changesPendingSave[itemInternalId][fld.id] = this.changesToSave[itemInternalId][fld.id];
                }
              );
            }
          }

          itemRecord = null;
        }

        console.log('itemErrors = ' + JSON.stringify(itemErrors));

        if (Object.keys(itemErrors).length) {
          let str = '<ul style="list-style: unset">';
          let id;
          let field;
          let err;

          for (id in itemErrors) {
            str += '<li>Item <b>' + id + '</b>' + '</li>';
            str += '<ol style="list-style: auto">';

            for (field in itemErrors[id]) {
              err = itemErrors[id][field];

              switch (err.name) {
                case constants.ERRORS.CODES.ITM_TEST_ERROR:
                  str += '<li>' + err.message + '</li>';
                  break;

                case 'INVALID_KEY_OR_REF':
                  str += '<li>Field: ' + this.headersById[field] + ' - Invalid selection or entry</li>';
                  break;

                case 'INVALID_FLD_VALUE':
                  str += '<li>Field: ' + this.headersById[field] + ' - ' + err.message + '</li>';
                  break;

                case 'RCRD_HAS_BEEN_CHANGED':
                  str += '<li>' + err.message + '</li>';
                  break;

                case 'USER_ERROR':
                  str += '<li>' + err.message + '</li>';
                  break;

                default:
                  str += '<li>Field ' + field + ' ' + err.name + ' - ' + err.message + '</li>';
                  break;
              }
            }

            str += '</ol>';
          }

          str += '</ul>';

          this.showMessage(message.Type.ERROR, 'Save Errors', str);
        } else {
          // Trigger a reload of the item information to avoid issues (in case a field value is reset
          // to its initial value prior to the save button click). The value in NetSuite will differ
          // from that shown to the user and the "change" will not be flagged internally, and a further
          // save button click will not trigger the update of NetSuite.

          this.viewItemsClick();
        }
      }

      exportItemsClick() {
        // TODO: Revisit logic for determining if there is an error condition

        let fields = currentRecord.get();
        let categoryName =

          // categoryName =
          (
            fields.getText(
              {
                fieldId: constants.FIELDS.CATEGORY.ID
              }
            ) || ''
          );

        if (categoryName === '') {
          console.warn('exportItemsClick:categoryName is empty');

          this.showMessage(
            message.Type.WARNING,
            '',
            // 'No item to export.<br/><br/>Hint: Use the View Items button to show items to export'
            'No Item Category selected<br/><br/>Hint: Select an item category for the name of the CSV file'
          );

          return;
        }

        if (!this._hot) {
          this.showMessage(
            message.Type.WARNING,
            '',
            // 'No items available to export.<br/><br/>Hint: Use the View Items button to show items to export',
            'No items available<br/><br/>Hint: First use View Items to show items'//,
            // 4000
          );

          return;
        }

        categoryName = categoryName.replace(/\s+/g, '_');

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
            // filename: 'Handsontable-CSV-file_[YYYY]-[MM]-[DD]',
            filename: categoryName + '_Items_[YYYY]-[MM]-[DD]',
            mimeType: 'text/csv',
            rowDelimiter: '\r\n',
            rowHeaders: false
          }
        );
      }

      configureFieldsClick() {
        let fields = currentRecord.get();
        let searchField = fields.getField({ fieldId: constants.FIELDS.ITEM_FIELDS_SEARCH.ID });
        searchField.isDisplay = !searchField.isDisplay;
      }

      displayErrors(errorsByItem) {

        let str = '<ol style="list-style: unset">';
        let id;
        let err;

        for (id in errorsByItem) {
          // str += '<li><h1>Item <b>' + id + '</b>' + '</li>';
          str += '<li><h1>Item ' + this.itemNamesById[id] + '</h1>' + '</li>';
          str += '<ul style="list-style: auto">';

          let matches;
          let prop;
          let value;

          errorsByItem[id].forEach(
            (err) => {

              switch (err.name) {

                // case constants.ERRORS.CODES.ITM_TEST_ERROR:
                //   str += '<li>' + err.message + '</li>';
                //   break;

                case 'INVALID_KEY_OR_REF':

                  matches =
                    err.message.match(
                      /Invalid (.*) reference key (.*)\./
                    );

                  if (matches) {

                    prop = matches[1];
                    value = matches[2];

                    str += '<li>' + 'Invalid value ' + value + ' for field ' + this.headersById[prop] + '</li>';
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
                      this.headersById[prop] +
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

                // case 'RCRD_HAS_BEEN_CHANGED':
                //   str += '<li>' + err.message + '</li>';
                //   break;

                // case 'USER_ERROR':
                //   str += '<li>' + err.message + '</li>';
                //   break;

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

      createHtmlListStr(elements, ordered) {

        let str = '';

        if (elements) {

          if (!!ordered) {

            // str+= '<ol style="list-style: unset">';
            str += '<ol style="list-style: revert">';

          } else {

            // str+= '<ul style="list-style: auto">';
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
    */

    class CustomerRateCardItemsClientModule {

      constructor() {

        this._message = null;
        this._hot = null;
        this._sourceData = [];
        this._data = [];
        this._columnsById = {};
        this._headersById = {};
        this._changesToSave = {};
        this._changesPendingSave = {};
        this._itemNamesById = {};
        this._listData = {};

        // TODO: Review and remove if appropriate
        // jQuery(document).ready(this.initUI.bind(this));

        // Required to ensure that the table fills the entire page

        jQuery(window).resize(this.windowOnResize.bind(this));

        // TODO: Reinstate once common module updated
        // common.startScript('UserInterfaceClientModule');

        this._DATA_HANDLER_URL =
          url.resolveScript(
            {
              scriptId: constants.SCRIPTS.DATA_HANDLER.SCRIPT_ID,
              deploymentId: constants.SCRIPTS.DATA_HANDLER.DEPLOY_ID
            }
          );

      }

      getDataHandlerUrl(params) {

        let _params = {};

        if (util.isObject(params)) {

          _params = params;
        }

        return url.format(
          {
            domain: this._DATA_HANDLER_URL,
            params: _params
          }
        );

      }

      getFormValues() {

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

          Ext.getBody().mask('Please wait ...');

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

                // Now check how the RESTlet responded

                Ext.getBody().unmask();

                return Promise.resolve(JSON.parse(response.body));

              }.bind(this)
            )
            .catch(
              function (e) {

                Ext.getBody().unmask();

                console.error('callRESTlet:Promise.catch: ' + e.name + ' - ' + e.message);

                return Promise.reject(e);

              }.bind(this)
            );

        } catch (e) {

          console.error('callRESTlet: ' + e.name + ' - ' + e.message);

          return Promise.reject(e);

        }

      }

      buildTable(customerId, searchId) {

        console.log('buildTable:customerId = ' + customerId + ' {' + (typeof customerId) + '}');
        console.log('buildTable:searchId = ' + searchId + ' {' + (typeof searchId) + '}');

        try {

          if (isNaN(customerId) || customerId === 0) {

            throw new Error('Invalid customerId');

          }

          if (isNaN(searchId) || searchId === 0) {

            throw new Error('Invalid searchId');

          }

          // Call the RESTlet to get the initial data for building the table and for its contents

          let params = {};

          params[constants.SCRIPTS.DATA_HANDLER.REQUEST_PARAMS.DATA_TYPE.ID] = constants.RECORDS.CUSTOM.CUST_RATE_CARD_ITEM.ID;
          params[constants.SCRIPTS.DATA_HANDLER.REQUEST_PARAMS.RATE_CARD.ID] = customerId;
          params[constants.SCRIPTS.DATA_HANDLER.REQUEST_PARAMS.SEARCH.ID] = searchId;

          console.log('buildTable:params = ' + JSON.stringify(params) + ' {' + (typeof params) + '}');

          let restletUrl = this.getDataHandlerUrl(params);
          // url.resolveScript(
          //   {
          //     scriptId: constants.SCRIPTS.DATA_HANDLER.SCRIPT_ID,
          //     deploymentId: constants.SCRIPTS.DATA_HANDLER.DEPLOY_ID,
          //     params: params
          //   }
          // );

          console.log('buildTable:restletUrl = ' + restletUrl + ' {' + (typeof restletUrl) + '}');

          Ext.getBody().mask('Please wait ...');

          // TODO: Delete commented out code below once confirmed that callRESTlet returns correct data

          // https.get.promise(
          //   {
          //     url: restletUrl,
          //     headers: {
          //       'content-Type': 'application/json'
          //     }
          //   }
          // )
          this.callRESTlet(https.Method.GET, restletUrl)
            .then(
              // function (response) {
              function (payload) {

                // Check if the request worked

                // console.log('buildTable:response.code = ' + response.code + ' {' + (typeof response.code) + '}');
                // console.log('buildTable:response.body = ' + response.body + ' {' + (typeof response.body) + '}');

                // if (!util.isNumber(response.code) || (response.code !== 200)) {

                //   return Promise.reject(new Error('NetSuite responded with a request error code: ' + response.code));

                // }

                // if (!util.isString(response.body) || (response.body.trim() === '')) {

                //   return Promise.reject(new Error('No response was received from the RESTlet'));

                // }

                // Now check how the RESTlet responded

                // let payload = JSON.parse(response.body);
                let headers = payload.headers;
                let columns = payload.columns;

                this._data = payload.rows;

                console.log('buildTable:this._data = ' + JSON.stringify(this._data) + ' {' + (typeof this._data) + '}');

                if (this._data.length === 0) {

                  Ext.getBody().unmask();

                  this.showMessage(message.Type.INFORMATION, '', 'No records found', 4000);

                  return;

                }

                // Source: https://stackoverflow.com/questions/597588/how-do-you-clone-an-array-of-objects-in-javascript
                this._sourceData = this._data.map(a => ({ ...a }));

                this._data.forEach(
                  (rec) => {

                    // TODO: Rename to be generic e.g. recordNamesById
                    // TODO: Make property names constants i.e. displayname
                    this._itemNamesById[rec['internalid']] = rec['displayname'];

                  }
                );

                console.log('buildTable:this._itemNamesById = ' + JSON.stringify(this._itemNamesById) + ' {' + (typeof this._itemNamesById) + '}');

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
                      beforeChange: this.beforeDataChanged.bind(this),
                      afterChange: this.afterDataChanged.bind(this),
                      afterRenderer: this.afterCellRendered.bind(this),


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
                          'new_item': {
                            name: 'Copy To New Item',
                            // callback: this.viewRecord.bind(this) // TODO: <--- Implement new item
                          },
                          'delete_item': {
                            name: 'Delete Item',
                            // callback: this.viewRecord.bind(this) // TODO: <--- Implement delete item
                          },
                          'sep3': {
                            "name": '---------'
                          },
                          /* TODO: Fix
                          'view_item': {
                            name: 'View Item Record',
                            callback: this.viewRecord.bind(this)
                          },*/
                          /* TODO: Fix
                          'edit_item': {
                            name: 'Edit Item Record',
                            callback: this.editRecord.bind(this)
                          }*/
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

      async getListData(source, query, callback) {

        console.log('getListData:source = ' + source);
        console.log('getListData:query = ' + query);

        try {

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

      //////////

      saveChanges(recordType, changesByInternalId) {

        return new Promise(
          async (resolve, reject) => {

            let promises = {};
            let results = {};
            let internalId;

            for (internalId in changesByInternalId) {

              // TODO: Map internalId to record name for console logs and errors

              try {

                console.log('saveChanges:Attempting to save changes to record ' + internalId);

                let changes = changesByInternalId[internalId];

                console.log('changes = ' + JSON.stringify(changes));

                // promises[internalId] = this.saveRecordChanges(record.Type.SERVICE_ITEM, internalId, changes);
                promises[internalId] = this.saveRecordChanges(recordType, internalId, changes);

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
          }
        );
      }

      //////////

      async saveRecordChanges(recordType, recordId, changes) {

        let body = {};

        body[constants.SCRIPTS.DATA_HANDLER.REQUEST_PARAMS.RECORD_TYPE.ID] = recordType;
        body[constants.SCRIPTS.DATA_HANDLER.REQUEST_PARAMS.RECORD_ID.ID] = recordId;
        body[constants.SCRIPTS.DATA_HANDLER.REQUEST_PARAMS.CHANGES.ID] = changes;

        return this.callRESTlet(
          https.Method.PUT,
          this.getDataHandlerUrl(),
          body
        );

      }

      //////////

      displayErrors(errorsByItem) {

        let str = '<ol style="list-style: unset">';
        let id;

        for (id in errorsByItem) {

          str += '<li><h1>Item ' + this._itemNamesById[id] + '</h1>' + '</li>';
          str += '<ul style="list-style: auto">';

          let matches;
          let prop;
          let value;

          errorsByItem[id].forEach(
            (err) => {

              switch (err.name) {

                case 'INVALID_KEY_OR_REF':

                  matches = err.message.match(/Invalid (.*) reference key (.*)\./);

                  if (matches) {

                    prop = matches[1];
                    value = matches[2];

                    str += '<li>' + 'Invalid value ' + value + ' for field ' + this._headersById[prop] + '</li>';

                  } else {

                    // TODO: Implement if matches == null

                  }
                  break;

                case 'INVALID_FLD_VALUE':

                  matches = err.message.match(/You have entered an Invalid Field Value (.*) for the following field: (.*)/);

                  if (matches) {

                    value = matches[1];
                    prop = matches[2];

                    str +=
                      '<li>' +
                      'Invalid value ' +
                      value +
                      ' for field ' +
                      this.headersById[prop] +
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

      //////////

      loadCRCItemsButtonOnClick(event) {

        try {

          console.log('loadCRCItemsButtonOnClick');

          let values = this.getFormValues();
          let customerId;
          let searchId;

          if (values === false) {

            throw new Error('Unable to get form field values');

          }

          customerId = Number(values[constants.FORMS.CUST_RATE_CARD.FIELDS.RATE_CARD.ID]['value']);
          searchId = Number(values[constants.FORMS.CUST_RATE_CARD.FIELDS.FIELDS_SEARCH.ID]['value']);

          this.hideMessage();
          this._changesToSave = {};
          this._changesPendingSave = {};

          this.buildTable(customerId, searchId);

        } catch (e) {

          console.error('loadCRCItemsButtonOnClick: ' + e.name + ' - ' + e.message);

          this.showMessage(
            message.Type.ERROR,
            'Unexpected Error', 'This script is not functioning correctly. Please raise a helpdesk ticket for the NetSuite Group'
          );

        }

      }

      saveCRCItemsChangesButtonOnClick(event) {

        console.log('saveCRCItemsChangesButtonOnClick');
        console.log('saveCRCItemsChangesButtonOnClick:current data = ' + JSON.stringify(this._data));
        console.log('saveCRCItemsChangesButtonOnClick:changesToSave = ' + JSON.stringify(this._changesToSave));
        console.log('saveCRCItemsChangesButtonOnClick:changesPendingSave = ' + JSON.stringify(this._changesPendingSave));

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

        // Clean up the list of changes for so they can be test to determine if there are changes to be saved

        let cleanChanges =
          _.pickBy(
            this._changesToSave,
            (obj) => {

              return (Object.keys(obj).length !== 0);

            }
          );

        console.log('saveCRCItemsChangesButtonOnClick:cleanChanges = ' + JSON.stringify(cleanChanges));

        if (Object.keys(cleanChanges).length === 0) {

          console.warn('saveCRCItemsChangesButtonOnClick:No changes to save');

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

            // TODO: Replace constants.RECORDS.CUSTOM.CUST_RATE_CARD_ITEM.ID with type passed from NetSuite
            this.saveChanges(constants.RECORDS.CUSTOM.CUST_RATE_CARD_ITEM.ID, cleanChanges)
              .then(
                function (results) {

                  console.log('saveCRCItemsChangesButtonOnClick:results = ' + JSON.stringify(results));

                  let errsById = {};
                  let itemsUpdated = [];
                  let itemsNotUpdated = [];
                  let id;

                  for (id in results) {

                    console.log('saveCRCItemsChangesButtonOnClick:Examining result of saving item ' + id);

                    if (results[id].saved === false) {

                      itemsNotUpdated.push(id);

                      // N.B. Substitution of item name for internal id handled in this.displayErrors

                      errsById[id] = results[id].errors;

                      results[id].errors.forEach(
                        (err) => {

                          console.error(
                            'saveCRCItemsChangesButtonOnClick:Error saving item ' +
                            id +
                            ' changes ' +
                            err.name +
                            ' - ' +
                            err.message
                          );

                        }
                      );

                    } else {

                      itemsUpdated.push(this._itemNamesById[id]);

                      // TODO: Reset changes for fields that were successfully saved

                      results[id].fieldsUpdated.forEach(
                        (fieldId) => {

                          delete this._changesToSave[id][fieldId];

                          console.log('saveCRCItemsChangesButtonOnClick:removed changesToSave[' + id + '][' + fieldId + ']');

                          delete this._changesPendingSave[id][fieldId];

                          console.log('saveCRCItemsChangesButtonOnClick:removed changesPendingSave[' + id + '][' + fieldId + ']');

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
                        itemsUpdated.length + ' items saved',
                        this.createHtmlListStr(itemsUpdated),
                        6000
                      );

                    }

                    // Show the errors generated by saving

                    this.displayErrors(errsById);

                  } else {

                    // No errors were generated

                    if (itemsUpdated.length > 0) {

                      this.showMessage(
                        message.Type.CONFIRMATION,
                        itemsUpdated.length + ' items saved',
                        this.createHtmlListStr(itemsUpdated),
                        6000
                      );

                      // Trigger a reload of the item information to avoid issues in case a field value is reset
                      // to its initial value prior to the save button click. This would mean that the field value
                      // in NetSuite will differ from that shown to the user and the "change" will not be flagged internally,
                      // and a further save button click will not trigger the update of NetSuite.

                      this.viewItemsClick();

                    } else {

                      // No errors were generated but nothing was saved either ?!

                      console.warn('saveCRCItemsChangesButtonOnClick:No errors were generated but nothing was saved either ?!');

                    }

                  }

                }.bind(this)
              )
              .catch(
                function (err) {

                  console.error('saveCRCItemsChangesButtonOnClick.catch: ' + err);

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

      exportCRCItemsButtonOnClick(event) {

        try {

          alert('exportCRCItemsButtonOnClick');

        } catch (e) {

          //

        }

      }

      cloneCRCButtonOnClick(event) {

        try {

          let memo =
            search.lookupFields(
              {
                type: constants.RECORDS.CUSTOM.CUST_RATE_CARD.ID,
                // TODO: Determine internal id of rate card record selected
                id: 210,
                columns: constants.RECORDS.CUSTOM.CUST_RATE_CARD.FIELDS.MEMO.ID
              }
            )[constants.RECORDS.CUSTOM.CUST_RATE_CARD.FIELDS.MEMO.ID];

          let newMemo = prompt('Please enter a new Memo field value', memo);

          if ((!util.isString(newMemo)) || (newMemo.trim() === '') || (newMemo.trim() === memo)) {

            // TODO: Implement validation error handling on the memo value entered

          }

          if (newMemo === null) {

            return;

          }

          let values = this.getFormValues();

          if (values === false) {

            throw new Error('Unable to get form field values');

          }

          let sourceRateCardName = values[constants.FORMS.CUST_RATE_CARD.FIELDS.RATE_CARD.ID]['text'];
          let sourceRateCardId = values[constants.FORMS.CUST_RATE_CARD.FIELDS.RATE_CARD.ID]['value'];

          let copy =
            record.copy(
              {
                type: constants.RECORDS.CUSTOM.CUST_RATE_CARD.ID,
                id: sourceRateCardId
              }
            );

          copy.setValue(
            {
              fieldId: constants.RECORDS.CUSTOM.CUST_RATE_CARD.FIELDS.MEMO.ID,
              value: newMemo
            }
          );

          let newRateCardId = copy.save();
          let newRateCardName =
            search.lookupFields(
              {
                type: constants.RECORDS.CUSTOM.CUST_RATE_CARD.ID,
                id: newRateCardId,
                columns: [constants.RECORDS.CUSTOM.CUST_RATE_CARD.FIELDS.DOC_NO.ID]
              }
            )[constants.RECORDS.CUSTOM.CUST_RATE_CARD.FIELDS.DOC_NO.ID];

          this.showMessage(
            message.Type.CONFIRMATION,
            'Success',
            'New rate card ' +
            newRateCardName +
            ' cloned from ' +
            sourceRateCardName,
          );

        } catch (e) {

          console.error('cloneCRCButtonOnClick: ' + e.name + ' - ' + e.message);

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

      // TODO: Cleanup

      beforeDataChanged(changes, source) {

        if (source === 'loadData') {

          return true;

        }

        console.log('changes = ' + JSON.stringify(changes));

        if (changes) {

          changes.forEach(
            (change, index) => {

              let row = change[0];
              let prop = change[1];
              let oldValue = change[2];
              let newValue = change[3];
              let col = this._hot.propToCol(prop);
              let isEditable = (this._hot.getCellEditor(row, col) !== false);

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

      // TODO: Cleanup

      afterDataChanged(changes, source) {

        if (source === 'loadData') {

          return;

        }

        console.log('changes = ' + JSON.stringify(changes));

        if (changes) {

          changes.forEach(
            (change) => {
              let row = change.shift();
              let prop = change.shift();
              // let oldValue = change.shift();
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

                /*if (this.recordsById[itemInternalId]) {
                  delete this.recordsById[itemInternalId];

                  console.log('Item ' + itemInternalId + ' unloaded');
                }*/
              } else {
                this._changesToSave[itemInternalId][prop] = newValue;
                delete this._changesPendingSave[itemInternalId][prop];

                /*if (!this.recordsById[itemInternalId]) {
                  // Load the NetSuite record now to be updated when saving. This is to allow NetSuite
                  // to detect if the record has been modified by another user before the user's changes
                  // can be saved

                  try {
                    this.recordsById[itemInternalId] =
                      record.load(
                        {
                          // TODO: Implement for any item type by adding additional hidden column with record type
                          // type: 'item',
                          // TODO: Restore after error testing
                          type: record.Type.SERVICE_ITEM,
                          // type: record.Type.ITEM,
                          id: itemInternalId,
                          isDynamic: true
                        }
                      );

                    console.log('Item ' + itemInternalId + ' loaded');

                    // itemCode = itemRecord.getValue({ fieldId: 'itemid' });
                  } catch (e) {
                    console.error((e.type || 'Javascript Error') + ' item ' + itemInternalId + ' ' + e.name + ' - ' + e.message);
                    console.log('Item ' + itemInternalId + ' NOT loaded');

                    // TODO: How to handle if the item record can't be loaded for future saves ?!
                  }
                }*/
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

    }

    return new CustomerRateCardItemsClientModule();

  }
);