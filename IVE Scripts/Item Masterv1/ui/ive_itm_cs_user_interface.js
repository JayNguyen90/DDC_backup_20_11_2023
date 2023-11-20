/**
 * @NApiVersion 2.1
 * @NAmdConfig /SuiteScripts/IVE Scripts/Modules/amdconfig.json
 */
define(
  [
    'N/currentRecord',
    // 'N/error',
    'N/https',
    'N/record',
    'N/ui/message',
    'N/url',
    //'common', // TODO: Add support to common for client modules
    './constants',
    '/SuiteScripts/IVE Scripts/Item Master/ui/lodash.min.js'
  ],

  (
    currentRecord,
    // error,
    https,
    record,
    message,
    url,
    //common,
    constants,
    _
  ) => {
    /*class GroupedErrors {
      // constructor (groupedBy) {
      constructor() {
        // this.groupedBy = groupedBy;
        this.groupings = {};
      }

      add(err, groupingValue1, ... groupingValueN) {
        let container = this.groupings;
        let placementContainer = this.groupings;
        let arg;

        for (arg = 1; arg < (arguments.length -1); arg++) {
          let grouping = arguments[arg];

          if (!(grouping in container)) {
            container[grouping] = {};
            container = container[grouping];
          }

          placementContainer = container[grouping];
        }

        grouping = arguments[(arguments.length-1)];
        placementContainer[grouping] = err;

        // let errors = new GroupedErrors(['item', 'field']);
        // errors.add(err, 'item1', 'field1');
      }
    }*/

    class UserInterfaceClientModule {
      constructor() {
        this.hot = null;
        this.message = null;
        this.sourceData = [];
        this.data = [];
        this.columnsById = {};
        this.headersById = {};
        this.changesToSave = {};
        this.changesPendingSave = {};
        // this.recordsById = {};
        this.itemNamesById = {};

        jQuery(document).ready(this.initUI.bind(this));
        jQuery(window).resize(this.windowResize.bind(this));

        // TODO: Reinstate once common module updated
        // common.startScript('UserInterfaceClientModule');

        this._saveChangesRestletURL =
          url.resolveScript(
            {
              scriptId: constants.SCRIPTS.SAVE_CHANGES.SCRIPT_ID,
              deploymentId: constants.SCRIPTS.SAVE_CHANGES.DEPLOY_ID
            }
          );
      }

      get SAVE_CHANGES_RESTLET_URL() {
        const s = this._saveChangesRestletURL;

        return s;
      }

      initUI() {
        // let fields = currentRecord.get();
        // let searchField = fields.getField({ fieldId: constants.FIELDS.ITEM_FIELDS_SEARCH.ID });
        // searchField.isDisplay = false;

        this.buildItemsTable();
      }

      gotoSuitelet(scriptId, deploymentId, params) {
        let newUrl;

        // if (util.isString(searchId) && searchId.trim() !== '') {
        //   params = {};
        //   params['custpage_item_search'] = searchId;
        // }

        if (util.isObject(params)) {
          newUrl =
            url.resolveScript(
              {
                scriptId: scriptId,
                deploymentId: deploymentId,
                params: params
              }
            );
        }
        else {
          newUrl =
            url.resolveScript(
              {
                scriptId: constants.SCRIPTS.USER_INTERFACE.SCRIPT_ID,
                deploymentId: constants.SCRIPTS.USER_INTERFACE.DEPLOY_ID
              }
            );
        }

        location.href = newUrl;
      }

      restart() {
        this.gotoSuitelet('');
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
          category /*&&
          subCategory*/
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

            Ext.getBody().mask('Please wait ...');

            https.get.promise(
              {
                url: rlUrl,
                headers: {
                  'content-Type': 'application/json'
                }
              }
            )
              .then(
                function (response) {
                  log.debug(
                    {
                      title: 'response.body',
                      details: response.body
                    }
                  );

                  let resp;
                  let data = [];
                  let headers;
                  let columns;
                  let rows;

                  log.debug(
                    {
                      title: 'response.body',
                      details: response.body
                    }
                  );

                  console.log('response.body = ' + response.body);

                  if (util.isString(response.body) && (response.body.trim() !== '')) {
                    resp = JSON.parse(response.body);
                    data = resp.rows;
                    headers = resp.headers;
                    columns = resp.columns;
                    this.data =
                      rows =
                      resp.rows;

                    // Source: https://stackoverflow.com/questions/597588/how-do-you-clone-an-array-of-objects-in-javascript
                    this.sourceData = this.data.map(a => ({ ...a }));

                    data.forEach(
                      (rec) => {

                        this.itemNamesById[rec['internalid']] = rec['displayname'];

                      }
                    );
                  }

                  columns.forEach(
                    (colDef, index) => {
                      // Prevent cells from being validated
                      colDef['validator'] = null;
                      this.columnsById[colDef['data']] = colDef;
                      this.headersById[colDef['data']] = headers[index];
                    }
                  );

                  console.log('this.columnsById = ' + JSON.stringify(this.columnsById));
                  console.log('this.headersById = ' + JSON.stringify(this.headersById));

                  if (this.hot) {
                    this.hot.destroy();
                    this.hot = null;
                  }

                  if (util.isString(resp.meta.errmsg)) {
                    Ext.getBody().unmask();

                    this.showMessage(message.Type.ERROR, 'Error', resp.meta.errmsg);

                    return;
                  }

                  let container = document.querySelector('#items');
                  // let headers = Object.values(data[0]);
                  // let rows = data.rows;

                  // if (data.length === 1) {
                  //   let empty = {};

                  //   Object.keys(data[0]).forEach(
                  //     (key) => {
                  //       empty[key] = '';
                  //     }
                  //   );

                  //   console.log(JSON.stringify(empty));

                  //   rows = data.slice(1);
                  //   rows.push(empty);
                  // } else {
                  //   rows = data.slice(1);
                  // }

                  console.log(JSON.stringify(rows));

                  this.hot = new Handsontable(
                    container,
                    {
                      afterChange: this.dataChanged.bind(this),
                      afterRenderer: this.afterCellRendered.bind(this),
                      /*afterContextMenuDefaultOptions:
                      (predefinedItems) => {
                        console.log('(predefinedItems = ' + JSON.stringify(predefinedItems));
                      },*/
                      afterContextMenuDefaultOptions: this.afterContextMenuDefaultOptions.bind(this),
                      // cells:
                      //   (row, col) => {
                      //     let cellProps = {};

                      //     return {
                      //       renderer:
                      //         (instance, td, row, col, prop, value, cellProperties) => {
                      //           if (true) {
                      //             // cell has been changed
                      //           }
                      //         }
                      //     }
                      //   },

                      beforeChange: this.beforeChange.bind(this),

                      // columns: data.meta.columns,
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
                          'view_item': {
                            name: 'View Item Record',
                            callback: this.viewRecord.bind(this)
                          },
                          'edit_item': {
                            name: 'Edit Item Record',
                            callback: this.editRecord.bind(this)
                          }
                        }
                      },
                      data: rows,
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
                      licenseKey: 'non-commercial-and-evaluation' // for non-commercial use only
                    }
                  );

                  Ext.getBody().unmask();

                  // Size the table container so that it fills the entire vertical height of the page
                  jQuery(window).resize();
                }.bind(this)
              )
              .catch(
                function (err) {
                  Ext.getBody().unmask();

                  console.error(err);
                  log.error(
                    {
                      title: 'getItemsData',
                      details: err
                    }
                  );
                }
              );
          }
        } catch (e) {
          Ext.getBody().unmask();

          log.emergency(
            {
              title: 'getItemsData',
              details: e
            }
          );
        }
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

      dataChanged(changes, source) {

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
              let col = this.hot.propToCol(prop);
              let oldValue;

              console.log('row = ' + row);
              console.log('prop = ' + prop);
              console.log('col = ' + col);
              console.log('newValue = ' + newValue + ' {' + (typeof newValue) + '}');

              oldValue = this.sourceData[row][prop];

              console.log('oldValue = ' + oldValue + ' {' + (typeof oldValue) + '}');

              let itemInternalId =
                this.hot.getDataAtRowProp(row, 'internalid');

              console.log('itemInternalId = ' + itemInternalId + ' {' + (typeof itemInternalId) + '}');

              if (!(itemInternalId in this.changesToSave)) {
                this.changesToSave[itemInternalId] = {};
              }

              if (!(itemInternalId in this.changesPendingSave)) {
                this.changesPendingSave[itemInternalId] = {};
              }

              if (oldValue === newValue) {
                delete this.changesToSave[itemInternalId][prop];
                delete this.changesPendingSave[itemInternalId][prop];

                /*if (this.recordsById[itemInternalId]) {
                  delete this.recordsById[itemInternalId];

                  console.log('Item ' + itemInternalId + ' unloaded');
                }*/
              } else {
                this.changesToSave[itemInternalId][prop] = newValue;
                delete this.changesPendingSave[itemInternalId][prop];

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

          console.log('this.changesToSave = ' + JSON.stringify(this.changesToSave));
          console.log('this.changesPendingSave = ' + JSON.stringify(this.changesPendingSave));

          // Need to re-render to retrigger afterCellRendered which has already been fired
          this.hot.render();

        }
      }

      afterCellRendered(td, row, column, prop, value, cellProperties) {
        if (this.hot) {
          let itemInternalId = this.hot.getDataAtRowProp(row, 'internalid');

          td.style.backgroundColor = '';

          // if (this.changesPendingSave[itemInternalId]) {
          //   if (this.changesPendingSave[itemInternalId][prop] !== undefined) {
          //     td.style.backgroundColor = 'orange';
          //   }
          // } else if (this.changesToSave[itemInternalId]) {
          //   if (this.changesToSave[itemInternalId][prop] !== undefined) {
          //     td.style.backgroundColor = 'lightblue';
          //   }
          // }

          // debugger;

          // if (this.changesToSave[itemInternalId]) {
          //   debugger;
          //   if (this.changesToSave[itemInternalId][prop] !== undefined) {
          //     td.style.backgroundColor = 'lightblue';
          //   }
          // } else if (this.changesPendingSave[itemInternalId]) {
          //   debugger;
          //   if (this.changesPendingSave[itemInternalId][prop] !== undefined) {
          //     td.style.backgroundColor = 'orange';
          //   }
          // }

          if (this.changesToSave[itemInternalId]) {
            // debugger;
            if (this.changesToSave[itemInternalId][prop] !== undefined) {
              td.style.backgroundColor = 'lightblue';
            }
          }

          if (this.changesPendingSave[itemInternalId]) {
            if (this.changesPendingSave[itemInternalId]['row'] === true) {
              // td.style.backgroundColor = 'orange';
              // td.style.backgroundColor = 'rgb(255, 0, 0, 0.25)';
            } else if (this.changesPendingSave[itemInternalId][prop] !== undefined) {
              // td.style.backgroundColor = 'orange';
              td.style.backgroundColor = 'red';
            }
          }
        }
      }

      afterContextMenuDefaultOptions(predefinedItems) {
        console.log('predefinedItems = ' + JSON.stringify(predefinedItems));

        /*this.hot.updateSettings(
          {
            contextMenu: {
              items: {
                "export": {
                  name: 'Export to CSV',
                  callback: function (key, options) {
                    hot.getPlugin('exportFile').downloadFile('csv', {
                      filename: 'MyFile'
                    });
                  }
                }
              }
            }
          }
        );*/
      }

      beforeChange(changes, source) {

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
              let col = this.hot.propToCol(prop);
              let isEditable = (this.hot.getCellEditor(row, col) !== false);

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
        //   let itemInternalId = this.hot.getDataAtRowProp(selectedRow, 'internalid');

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
            let itemInternalId = this.hot.getDataAtRowProp(selectedRow, 'internalid');
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
            let itemInternalId = this.hot.getDataAtRowProp(selectedRow, 'internalid');
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
        /*let params = this.getParameters();

        if (params !== false) {
          this.gotoSuitelet(
            constants.SCRIPTS.USER_INTERFACE.SCRIPT_ID,
            constants.SCRIPTS.USER_INTERFACE.DEPLOY_ID,
            params
          );
        }*/

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

      /*async saveChanges(itemChanges) {
        // TODO: Return resolved promises as an object indexed by item internal id instead of array of resolved promises

        let promises = [];
        let itemInternalId;

        for (itemInternalId in itemChanges) {
          try {
            console.log('saveChanges:Attempting to save changes to item ' + itemInternalId);

            let changes = itemChanges[itemInternalId];

            console.log('itemChanges = ' + JSON.stringify(changes));

            promises[itemInternalId] = this.saveRecordChanges(record.Type.SERVICE_ITEM, itemInternalId, changes);
          } catch (e) {
            // TODO: Add error handling for governance failure

            // TODO: Refer to amendment above
            promises[itemInternalId] = Promise.reject('saveChanges: ' + e);
          }
        }

        return await Promise.all(promises);
      }*/

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
        // let data = this.hot.getData();

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

                  /*if (itemsNotUpdated.length === 0) {

                    // Trigger a reload of the item information to avoid issues in case a field value is reset
                    // to its initial value prior to the save button click. This would mean that the field value
                    // in NetSuite will differ from that shown to the user and the "change" will not be flagged internally,
                    // and a further save button click will not trigger the update of NetSuite.

                    this.viewItemsClick();

                  } else {

                  }*/

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

          this.hot.render();

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

          this.hot.render();

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

        if (!this.hot) {
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

        let exportPlugin = this.hot.getPlugin('exportFile');

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

      windowResize() {
        let $items = jQuery('#items');
        let $document = jQuery(document);


        // window height - items vertical offset - 30
        let itemsHeight = $document.height() - $items.offset()['top'] - 30;

        console.log('$document.height() = ' + $document.height());
        console.log('$items.offset()[\'top\'] = ' + $items.offset()['top']);
        console.log('itemsHeight = ' + itemsHeight);

        $items.height(itemsHeight);
      }

      hideMessage() {
        if (this.message) {
          this.message.hide();
          this.message = null;
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
        // let _duration = 0;
        let _duration = 0;
        // let retain = true;

        if (type == message.Type.WARNING) {
          _duration = 3000;
        }

        if (util.isNumber(duration)) {
          _duration = duration;
        }

        this.hideMessage();

        // let m =
        this.message =
          message.create(
            {
              type: type,
              title: title,
              message: msg
            }
          );

        this.message.show(
          {
            duration: _duration
          }
        );

        // if (retain) {
        //   this.message = m;
        // }
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

      convertToColumnType(prop, newValue) {

        console.log('convertToColumnType:prop = ' + prop + ' {' + (typeof prop) + '}');
        console.log('convertToColumnType:newValue = ' + newValue + ' {' + (typeof newValue) + '}');

        let converted = newValue;

        try {

          if (this.columnsById[prop]) {

            switch (this.columnsById[prop].type) {

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

    return new UserInterfaceClientModule();
  }
);