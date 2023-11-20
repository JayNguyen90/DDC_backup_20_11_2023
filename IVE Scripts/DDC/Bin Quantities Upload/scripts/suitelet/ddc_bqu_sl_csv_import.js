/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NAmdConfig /SuiteScripts/IVE Scripts/Modules/amdconfig.json
 */
define(
  [
    'N/error',
    'N/file',
    'N/format',
    'N/https',
    'N/record',
    'N/redirect',
    'N/runtime',
    'N/search',
    'N/ui/serverWidget',
    'common',
    'papaparse'
  ],

  /**
* @param {error} error
* @param {file} file
* @param {format} format
* @param {https} https
* @param {record} record
* @param {redirect} redirect
* @param {runtime} runtime
* @param {search} search
* @param {serverWidget} serverWidget
* @param {object} common
* @param {Papa} papaparse
*/
  (
    error,
    file,
    format,
    https,
    record,
    redirect,
    runtime,
    search,
    serverWidget,
    common,
    papaparse
  ) => {

    // Saved searches

    const SEARCH_ID_ITEM_QUANTITIES = 'customsearch_ddc_bqu_item_quantities';

    // Inventory Adjustment record field id constants

    const ADJUSTMENT_ACCOUNT = 'account';
    const ADJUSTMENT_SUBSIDIARY = 'subsidiary';
    const ADJUSTMENT_LOCATION = 'adjlocation';
    const ADJUSTMENT_MEMO = 'memo';

    const SUBLIST_ADJUSTMENT_LINE = 'inventory';

    const SUBLIST_FIELD_ADJUSTMENT_LINE_ITEM = 'item';
    const SUBLIST_FIELD_ADJUSTMENT_LINE_LOCATION = 'location';
    const SUBLIST_FIELD_ADJUSTMENT_LINE_ADJUST = 'adjustqtyby';

    // Line memo field may be used in future versions

    const SUBLIST_FIELD_ADJUSTMENT_LINE_MEMO = 'memo';

    const SUBLIST_FIELD_ADJUSTMENT_LINE_INV_DETAIL = 'inventorydetail';

    const SUBLIST_ADJUSTMENT_LINE_INV_DETAIL_INV_ADJUSTMENT = 'inventoryassignment';

    const SUBLIST_ADJUSTMENT_LINE_INV_DETAIL_INV_ADJUSTMENT_BIN = 'binnumber';
    const SUBLIST_ADJUSTMENT_LINE_INV_DETAIL_INV_ADJUSTMENT_QTY = 'quantity';

    // Item record field id constants

    const ITEM_NAME = 'itemid';
    const ITEM_STOCK_CODE = 'custitem_ddc_stock_code';
    const ITEM_STOCK_IDENTITY = 'itemid';

    // Bin record field id constants

    const BIN_INACTIVE = 'inactive';
    const BIN_NO = 'binnumber';

    // Constants for CSV File Header Names

    // N.B. The column header labels are transformed during the CSV parsing process,
    // and the text is transformed to upper case. Any space characters are replaced
    // with an underscore character '_'

    const CSV_FIELD_ITEM_STOCK_CODE = 'STOCK_CODE';
    const CSV_FIELD_LOCATION = 'LOCATION_(NO_HIERARCHY)';
    const CSV_FIELD_UNITS = 'UNITS';
    const CSV_FIELD_BIN = 'TRANSACTION_BIN_NUMBER';
    const CSV_FIELD_BIN_QTY = 'SUM_OF_QUANTITY_ON_HAND';
    const CSV_FIELD_BIN_SERIAL_LOT = '';
    const CSV_FIELD_COUNTED_QTY = 'SUM_OF_COUNTED_QUANTITY';

    class ItemOnHandResult {

      constructor(result) {

        /**
                 * Transaction Line Item Internal Id
                 * @type {number}
                 */
        this.item =
          Number(result.getValue(
            {
              name: 'item',
              summary: search.Summary.GROUP
            }
          )
          );

        /**
                 * Transaction Line Item Stock Identity (itemid)
                 * @type {string}
                 */
        this.itemName =
          (result.getText(
            {
              name: 'item',
              summary: search.Summary.GROUP
            }
          ) || '');

        /**
                 * Transaction Line Item Stock Code
                 * @type {string}
                 */
        this.code =
          (result.getValue(
            {
              name: ITEM_STOCK_CODE,
              join: 'item',
              summary: search.Summary.GROUP
            }
          ) || '');

        /**
         * Transaction Line Item Location (internalid)
         * @type {number}
         */
        this.location =
          Number(result.getValue(
            {
              // name: 'location',
              name: 'locationnohierarchy',
              summary: search.Summary.GROUP
            }
          ) || '');

        /**
                 * Transaction Line Item Location (Name)
                 * @type {string}
                 */
        // this.locationName = (result.getText(
        this.locationName =
          (result.getValue(
            {
              // name: 'location',
              name: 'locationnohierarchy',
              summary: search.Summary.GROUP
            }
          ) || '');

        /**
                 * Transaction Line Item Quantity
                 * @type {number}
                 */
        this.quantity =
          Number(result.getValue(
            {
              name: 'binnumberquantity',
              summary: search.Summary.SUM
            }
          ) || '');

      }
    }

    class ItemBinOnHandResult {

      constructor(result) {

        this.item = Number(result.id);
        this.itemName = (result.getValue({ name: ITEM_NAME }) || '');
        this.location = Number(result.getValue({ name: 'inventorylocation' }) || '');
        this.locationName = (result.getText({ name: 'inventorylocation' }) || '');
        this.binName = (result.getText({ name: 'binnumber', join: 'binOnHand' }) || '');
        this.binQuantity = Number(result.getValue({ name: 'quantityonhand', join: 'binOnHand' }) || '');

      }

    }

    class ItemSearchResult {

      constructor(result) {

        this.id = Number(result.id);
        this.name = (result.getValue({ name: ITEM_NAME }) || '');

      }

    }

    class BinSearchResult {

      constructor(result) {

        this.id = Number(result.id);
        this.name = (result.getValue({ name: BIN_NO }) || '');

      }

    }

    class ItemQtyInfoLocation {

      constructor(total) {

        this.total = (total || 0.0);
        this.bins = {};

      }

    }

    class ItemQtyInfo {

      constructor(stockCode, locationName, totalQty) {

        this.code = (stockCode || '');
        this[locationName] = new ItemQtyInfoLocation(totalQty);

      }

      addItemLocationQuantity(locationName, totalQty) {

        if (!this[locationName]) {

          this[locationName] = new ItemQtyInfoLocation(totalQty);

        }

      }

    }

    class ItemQtyHash {

      constructor() {

        // Intentionally left empty

      }

      addItemQuantity(itemId, code, location, quantity) {

        /// this[itemId] = {};
        /// this[itemId]['code'] = code;
        /// this[itemId][location] = {};
        /// this[itemId][location]['total'] = quantity;
        /// this[itemId][location]['bins'] = {};

        if (!this[itemId]) {

          this[itemId] = new ItemQtyInfo(code, location, quantity);
          // this[itemId].code = code;
          // this[itemId][location].total = quantity;

          /// this[code] = new ItemQtyInfo();
          /// this[code].code = code;
          /// this[code].location.total = quantity;

        } else {

          this[itemId].addItemLocationQuantity(location, quantity);

        }

      }

      mapStockCodeToItemId(code) {

        common.enterContext('ItemQtyHash.mapStockCodeToItemId'); // ItemQtyHash.mapStockCodeToItemId

        if (!util.isString(code) || (code.trim() === '')) {

          common.leaveContext(); // ItemQtyHash.mapStockCodeToItemId

          return false;

        }

        try {

          let _code = code.trim();

          for (let itemId in this) {

            if (!this.hasOwnProperty(itemId)) {

              continue;

            }

            if (this[itemId] && this[itemId]['code'] === _code) {

              // common.leaveContext(); // ItemQtyHash.mapStockCodeToItemId

              return itemId;

            }

          }

          // common.leaveContext(); // ItemQtyHash.mapStockCodeToItemId

          return null;

        } catch (e) {

          common.logErr('error', e);

          return false;

        } finally {

          common.leaveContext(); // ItemQtyHash.mapStockCodeToItemId

        }

      }

    }

    class CsvImportScript {

      constructor() {

        /**
                 * List of unique item Stock Codes from the Stock Code column of the uploaded CSV file
                 * @private
                 * @type {false|string[]}
                 */
        this._itemNameIds = false;

        /**
         * Map of Stock Identity (itemid) to the Id (internalid) of all items in the uploaded CSV file
         * @type {false|number[]}
         */
        this._itemIdByItemName = false;

        /**
         * Map of Bin Number to Id (internalid) of all bins in the Transaction Bin Number column of the uploaded CSV file
         * @type {false|number[]}
         */
        this._binIdByNo = false;

        this._scriptParameters =
        {
          'CSV_UPLOAD_FOLDER_ID': '0',
          'ADJUSTMENT_GL_ACCOUNT_ID': '0',
          'ADJUSTMENT_SUBSIDIARY_ID': '0',
          'USER_INSTRUCTIONS': ''
        };

      }

      get CSV_UPLOAD_FOLDER_ID() {

        return Number(this._scriptParameters.CSV_UPLOAD_FOLDER_ID);

      }

      get ADJUSTMENT_GL_ACCOUNT_ID() {

        return Number(this._scriptParameters.ADJUSTMENT_GL_ACCOUNT_ID);

      }

      get ADJUSTMENT_SUBSIDIARY_ID() {

        return Number(this._scriptParameters.ADJUSTMENT_SUBSIDIARY_ID);

      }

      get USER_INSTRUCTIONS() {

        return String(this._scriptParameters.USER_INSTRUCTIONS);

      }

      /**
       * Array of unique item stock codes read from the Stock Code column of the uploaded CSV file
       * @type {string[]}
       */
      get itemNameIds() {
        if (this._itemNameIds === false) {
          throw new Error('itemNameIds not available');
        }

        return this._itemNameIds;

      }

      get itemIdsByItemName() {
        if (this._itemIdByItemName === false) {
          throw new Error('itemIdsByItemName not available');
        }

        return this._itemIdByItemName;

      }

      get binIdByNo() {

        if (this._binIdByNo === false) {

          throw new Error('binIdByNo not available');

        }

        return this._binIdByNo;

      }

      init() {

        let scrpt = runtime.getCurrentScript();

        this._scriptParameters =
        {
          'CSV_UPLOAD_FOLDER_ID': scrpt.getParameter({ name: 'custscript_ddc_bqu_csv_import_folder' }),
          'ADJUSTMENT_GL_ACCOUNT_ID': scrpt.getParameter({ name: 'custscript_ddc_bqu_csv_import_account' }),
          'ADJUSTMENT_SUBSIDIARY_ID': scrpt.getParameter({ name: 'custscript_ddc_bqu_csv_import_subsidiary' }),
          'USER_INSTRUCTIONS': scrpt.getParameter({ name: 'custscript_ddc_bqu_csv_import_instruct' })
        };

      }

      createUploadForm() {

        common.enterContext('createUploadForm');

        let form = null;

        try {

          let field;

          form =
            serverWidget.createForm(
              {
                title: 'Bin Quantities Upload'
              }
            );

          // Start upload button

          form.addSubmitButton(
            {
              label: 'Upload',
            }
          );

          // End upload button

          // Start file selection field

          field =
            form.addField(
              {
                id: 'custpage_csv',
                label: 'Stock Count CSV File',
                type: serverWidget.FieldType.FILE
              }
            );

          field.setHelpText(
            {
              help:
                `Select the CSV file updated with the item stock count bin quantities`
            }
          );

          field.isMandatory = true;

          // End file selection field

          // Start location field

          field =
            form.addField(
              {
                id: 'custpage_location',
                label: 'Location',
                type: serverWidget.FieldType.SELECT,
                source: 'location'
              }
            );

          // Default the location to the location on the user's Employee record
          field.defaultValue = common.user.location;

          field.setHelpText(
            {
              help:
                `OPTIONAL<br /><br />Location for the Inventory Adjustment record`
            }
          );

          // End location field

          // Start file description field

          field =
            form.addField(
              {
                id: 'custpage_description',
                label: 'Description for CSV File',
                type: serverWidget.FieldType.TEXTAREA
              }
            );

          field.setHelpText(
            {
              help:
                `OPTIONAL<br /><br />Notes entered here will be made available in NetSuite on the uploaded file for future reference`
            }
          );

          // End file description field

          // Start user instructions

          field =
            form.addField(
              {
                id: 'custpage_help',
                type: serverWidget.FieldType.INLINEHTML,
                label: '&nbsp;'
              }
            );

          field.defaultValue = this.USER_INSTRUCTIONS;

          field.updateLayoutType(
            {
              layoutType: serverWidget.FieldLayoutType.OUTSIDEABOVE
            }
          );

          // End user instructions

        } catch (e) {

          common.logErr('emergency', e, 'User form could not be created');

          form = null;

        } finally {

          common.leaveContext();

        }

        return form;
      }

      parseCSVFile(
        csvFile
      ) {

        common.enterContext('parseCSVFile');

        common.logVal('debug', 'csvFile', csvFile);

        // let result = false;
        let result =
        {
          data: null,
          errors: []
        };
        let e;

        if (!csvFile) {

          e = new TypeError('Missing / invalid required argument csvFile');

          common.logErr('error', e);

          result.errors.push(e);

          common.leaveContext();

          return result;

        }

        common.enterContext(csvFile.name);

        if (csvFile.fileType !== file.Type.CSV) {

          e = new Error('File ' + csvFile.name + ' is not a CSV file');

          common.logErr('error', e);

          result.errors.push(e);

          common.leaveContext(); // File name
          common.leaveContext(); // Function

          return result;

        }

        try {

          let discoveredColumnHeaders = [];

          result =
            papaparse.parse(
              csvFile.getContents(),
              {
                header: true,
                transformHeader:
                  (header, index) => {
                    let transformedHeader =
                      (header || '')
                        .replace(/\s+/g, '_')
                        .toUpperCase();

                    discoveredColumnHeaders.push(transformedHeader);

                    return transformedHeader;
                  },
                skipEmptyLines: 'greedy',
                transform:
                  (value, name) => {

                    let _value;

                    common.enterContext('transform');
                    common.enterContext(name);

                    common.logVal('debug', 'value', value);

                    try {

                      _value = Number(value);

                      if (isNaN(_value)) {

                        _value = value;

                      }

                      common.logVal('debug', '_value', _value);

                    } catch (e) {

                      common.logErr('error', e);

                    } finally {

                      common.leaveContext(); // name
                      common.leaveContext(); // transform

                    }

                    return _value;
                  }
              }
            );

          common.logMsg('debug', 'Parsing of CSV file complete');

          common.logVal('debug', 'result.data.length', result.data.length);
          common.logVal('debug', 'data', result.data);
          common.logVal('debug', 'errors', result.errors);
          common.logVal('debug', 'discoveredColumnHeaders', discoveredColumnHeaders);

          // Check that all the required columns are present, otherwise alert the user with an error

          if (discoveredColumnHeaders.indexOf(CSV_FIELD_ITEM_STOCK_CODE) === -1) {

            result.data = [];
            result.errors =
              [
                new Error('CSV file missing required column: ' + CSV_FIELD_ITEM_STOCK_CODE)
              ];

            return result;

          }

          if (discoveredColumnHeaders.indexOf(CSV_FIELD_LOCATION) === -1) {

            result.data = [];
            result.errors =
              [
                new Error('CSV file missing required column: ' + CSV_FIELD_LOCATION)
              ];

            return result;

          }

          if (discoveredColumnHeaders.indexOf(CSV_FIELD_BIN) === -1) {

            result.data = [];
            result.errors =
              [
                new Error('CSV file missing required column: ' + CSV_FIELD_BIN)
              ];

            return result;

          }

          if (discoveredColumnHeaders.indexOf(CSV_FIELD_COUNTED_QTY) === -1) {

            result.data = [];
            result.errors =
              [
                new Error('CSV file missing required column: ' + CSV_FIELD_COUNTED_QTY)
              ];

            return result;

          }

          if ((result.errors) && Array.isArray(result.errors) && (result.errors.length > 0)) {

            let errors = [];

            result.errors.forEach(
              (error) => {
                let e =
                  new Error(
                    'Line ' + (error.row + 1) + ' : ' +
                    error.type + ' error code ' +
                    error.code + ' - ' +
                    error.message
                  );

                common.logErr('error', e);
                errors.push(e);
              }
            );

            // Replace error objects from Papaparse with actual Error instances
            // for display to the user

            result.errors = errors;

            common.leaveContext(); // File name
            common.leaveContext(); // Function

            return result;
          }

        } catch (e) {

          common.logErr('error', e, 'Failed to parse CSV file');

          common.leaveContext(); // File name
          common.leaveContext(); // Function

          result =
          {
            data: null,
            errors: [e]
          };

          return result;

        } finally {

          common.leaveContext(); // File name

        }

        // TODO: Discuss with Dirk why lines exist with Group Office as the location and if these should be filtered out or handled differently

        // Filter out any total lines

        common.enterContext('filter');

        let filtered = [];

        result.data.forEach(
          (line, index) => {
            try {

              common.enterContext('line[' + index + ']'); // Line N

              common.logVal('debug', 'line', line);

              let stockCode = line[CSV_FIELD_ITEM_STOCK_CODE];

              common.logVal('debug', 'CSV_FIELD_ITEM_STOCK_CODE', '"' + stockCode + '"');

              if (
                (stockCode !== 'Total') &&
                (stockCode !== 'Overall Total')
              ) {

                filtered.push(line);

              } else {

                common.logMsg('debug', 'Filtered out line ' + (index + 2));

              }

            }
            catch (e) {

              common.logErr('error', e);

            } finally {

              common.leaveContext(); // Line N

            }
          }
        );

        result.data = filtered;

        common.leaveContext(); // filter

        common.logMsg('debug', 'Filtered out total line(s)');

        // Extract item and bin information for use elsewhere in the script

        try {

          // TODO: Fix this initialisation. this._itemNameIds is not reset to false if an error is thrown and
          // this will not be picked up by checking in the itemNameIds getter

          this._itemNameIds = [];

          let binNos = [];

          result.data.forEach(
            (line, index) => {
              try {

                common.enterContext('line[' + index + ']'); // Line N

                common.logVal('debug', 'line', line);

                let stockCode = line[CSV_FIELD_ITEM_STOCK_CODE];
                // let units = line[CSV_FIELD_UNITS];
                let binNo = line[CSV_FIELD_BIN];

                common.logVal('debug', 'CSV_FIELD_ITEM_STOCK_CODE', '"' + stockCode + '"');
                common.logVal('debug', 'CSV_FIELD_BIN', '"' + binNo + '"');

                if (this._itemNameIds.indexOf(stockCode) === -1) {
                  this._itemNameIds.push(stockCode);
                }

                if (binNos.indexOf(binNo) === -1) {
                  binNos.push(binNo);
                }

              }
              catch (e) {

                common.logErr('error', e);

              } finally {

                common.leaveContext();

              }
            }
          );

          common.logVal('debug', 'this.itemNameIds', this.itemNameIds);
          common.logVal('debug', 'binNos', binNos);

          this.createItemIdByNameMap();
          this.createBinIdByNoMap(binNos);

        } catch (e) {

          result = false;

          common.logErr('error', e);

        }

        common.leaveContext(); // Function

        return result;
      }

      createItemIdByNameMap() {

        common.enterContext('createItemIdByNameMap');

        this._itemIdByItemName = {};

        try {

          common.logVal('debug', 'this.itemNameIds', this.itemNameIds);

          let itemFilterContainer = [];
          let itemFilters = [];

          this.itemNameIds.forEach(
            (itemName) => {
              itemFilters.push(
                [
                  ITEM_NAME,
                  search.Operator.IS,
                  itemName
                ]
              );
            }
          );

          itemFilters.forEach(
            (itemFilter, index) => {
              if (index > 0) {
                itemFilterContainer.push('OR');
              }
              itemFilterContainer.push(itemFilter);
            }
          );

          let srch =
            search.create(
              {
                type: search.Type.ITEM,

                filters: [],

                columns:
                  [
                    search.createColumn(
                      {
                        name: ITEM_NAME
                      }
                    )
                  ]
              }
            );

          srch.filterExpression = itemFilterContainer;

          let items = this.runSearch(srch, ItemSearchResult);
          let errorCount = 0;

          items.forEach(
            (result, index) => {

              try {

                common.enterContext('items[' + index + ']');
                this._itemIdByItemName[result.name] = result.id;

              } catch (error) {

                errorCount++;

                common.logErr('error', e);

              } finally {

                common.leaveContext();

              }

            }
          );

          if (errorCount > 0) {

            // Reset this._itemIdByItemName if just one thing went wrong with creating the mapping

            this._itemIdByItemName = false;
          }

        } catch (e) {

          this._itemIdByItemName = false;

          common.logErr('error', e);

        }

        common.logVal('debug', 'this.itemIdsByItemName', this.itemIdsByItemName);

        common.leaveContext(); // Function
      }

      createBinIdByNoMap(binNos) {

        common.enterContext('createBinIdByNoMap');

        this._binIdByNo = {};

        try {

          let binFilterContainer = [];
          let binFilters = [];

          binNos.forEach(
            (binNo) => {
              binFilters.push(
                [
                  BIN_NO,
                  search.Operator.IS,
                  binNo
                ]
              );
            }
          );

          binFilters.forEach(
            (binFilter, index) => {
              if (index > 0) {
                binFilterContainer.push('OR');
              }

              binFilterContainer.push(binFilter);
            }
          );

          let srch =
            search.create(
              {
                type: search.Type.BIN,

                filters:
                  [
                    search.createFilter(
                      {
                        name: BIN_INACTIVE,
                        operator: search.Operator.IS,
                        values:
                          [
                            'F'
                          ]
                      }
                    )
                  ],

                columns:
                  [
                    search.createColumn(
                      {
                        name: BIN_NO
                      }
                    )
                  ]
              }
            );

          srch.filterExpression =
            srch.filterExpression.concat(
              [
                'AND',
                binFilterContainer
              ]
            );

          common.logVal('debug', 'srch.filterExpression', srch.filterExpression);

          let bins = this.runSearch(srch, BinSearchResult);
          let errorCount = 0;

          bins.forEach(
            (result, index) => {

              try {

                common.enterContext('bins[' + index + ']');
                this._binIdByNo[result.name] = result.id;

              } catch (error) {

                errorCount++;

                common.logErr('error', e);

              } finally {

                common.leaveContext();

              }

            }
          );

          if (errorCount > 0) {

            // Reset this._binIdByNo if just one thing went wrong with creating the mapping

            this._binIdByNo = false;
          }

          common.logVal('debug', 'this._binIdByNo', this.binIdByNo);

        } catch (e) {

          this._binIdByNo = false;

          common.logErr('error', e);

        }

        common.leaveContext(); // Function
      }

      /**
             * 
             * @returns {ItemQtyHash|false}
             */
      getItemOnHandQty() {

        common.enterContext('getItemOnHandQty'); // Function

        let itemOnHandQuantities = new ItemQtyHash();
        let results = [];

        try {

          let srch =
            search.load(
              {
                type: search.Type.TRANSACTION,
                id: SEARCH_ID_ITEM_QUANTITIES
              }
            );

          common.logVal('debug', 'original srch.filterExpression', srch.filterExpression);

          let itemFilterContainer = [];
          let itemFilters = [];

          this.itemNameIds.forEach(
            (stockCode) => {

              // if (this.itemIdsByItemName[stockCode]) {

              common.logVal('debug', 'stockCode', stockCode);

              itemFilters.push(
                [
                  'item.' + ITEM_STOCK_CODE,
                  search.Operator.IS,
                  stockCode
                ]
              );

              // }

            }
          );

          itemFilters.forEach(
            (itemFilter, index) => {
              if (index > 0) {
                itemFilterContainer.push('OR');
              }

              itemFilterContainer.push(itemFilter);
            }
          );

          if (itemFilterContainer.length > 0) {

            // let modifiedFilterExpression = structuredClone(srch.filterExpression);
            let modifiedFilterExpression = JSON.parse(JSON.stringify(srch.filterExpression));

            // modifiedFilterExpression[2][0] = itemFilterContainer;
            modifiedFilterExpression[2] = itemFilterContainer;

            // srch.filterExpression =
            //   srch.filterExpression.concat(
            //     [
            //       'AND',
            //       itemFilterContainer
            //     ]
            //   );
            srch.filterExpression = modifiedFilterExpression;

          }

          common.logVal('debug', 'modified srch.filterExpression', srch.filterExpression);

          /**
           * @type {ItemOnHandResult[]}
           */
          results = this.runSearch(srch, ItemOnHandResult);

          common.logVal('debug', 'results', results);

          if (results === false) {

            return false;

          }

          if (results.length > 0) {

            // let previousName = results[0].itemName;
            let itemName;// = results[0].itemName;
            let location;// = results[0].locationName;
            let quantity;// = results[0].quantity;
            let stockCode;// = results[0].code;
            let index;

            // itemOnHandQuantities.addItemQuantity(itemName, stockCode, location, quantity);

            // for (index = 1; index < results.length; index++) {
            for (index = 0; index < results.length; index++) {

              itemName = results[index].itemName;
              location = results[index].locationName;
              quantity = results[index].quantity;
              stockCode = results[index].code;

              // if (previousName !== itemName) {

              itemOnHandQuantities.addItemQuantity(itemName, stockCode, location, quantity);

              // }

              // previousName = itemName;

            }

          }

        } catch (e) {

          common.logErr('error', e);

          return false;

        } finally {

          common.leaveContext();  // Function

        }

        common.logVal('debug', 'itemOnHandQuantities', itemOnHandQuantities);

        if (this.addBinOnHandQty(itemOnHandQuantities) === false) {

          return false;

        }

        common.logVal('debug', 'Final itemOnHandQuantities', itemOnHandQuantities);

        return itemOnHandQuantities;

      }

      addBinOnHandQty(itemOnHandQuantities) {

        common.enterContext('addBinOnHandQty'); // Function

        common.logVal('debug', 'itemOnHandQuantities', itemOnHandQuantities);
        common.logVal('debug', 'itemNameIds', this.itemNameIds);

        let results;

        try {

          let srch =
            search.create(
              {
                type: search.Type.ITEM,
                filters:
                  [
                    search.createFilter(
                      {
                        name: 'type',
                        operator: search.Operator.ANYOF,
                        values:
                          [
                            'InvtPart'
                          ]
                      }
                    ),

                    search.createFilter(
                      {
                        name: 'locationquantityonhand',
                        operator: search.Operator.GREATERTHAN,
                        values:
                          [
                            0
                          ]
                      }
                    )
                  ],

                columns:
                  [
                    search.createColumn(
                      {
                        name: ITEM_NAME,
                        sort: search.Sort.ASC
                      }
                    ),

                    search.createColumn(
                      {
                        name: 'inventorylocation',
                        sort: search.Sort.ASC
                      }
                    ),

                    search.createColumn(
                      {
                        name: 'binnumber',
                        join: 'binOnHand',
                        sort: search.Sort.ASC
                      }
                    ),

                    search.createColumn(
                      {
                        name: 'quantityonhand',
                        join: 'binOnHand'
                      }
                    )
                  ]
              }
            );

          common.logVal('debug', 'srch.filterExpression', srch.filterExpression);

          let itemFilterContainer = [];
          let itemFilters = [];

          this.itemNameIds.forEach(
            // (itemName) => {
            (stockCode) => {
              itemFilters.push(
                [
                  ITEM_STOCK_CODE,
                  search.Operator.IS,
                  stockCode
                ]
              );
            }
          );

          itemFilters.forEach(
            (itemFilter, index) => {
              if (index > 0) {
                itemFilterContainer.push('OR');
              }
              itemFilterContainer.push(itemFilter);
            }
          );

          srch.filterExpression =
            srch.filterExpression.concat(
              [
                'AND',
                itemFilterContainer
              ]
            );

          common.logVal('debug', 'srch.filterExpression', srch.filterExpression);

          results = this.runSearch(srch, ItemBinOnHandResult);

          common.logVal('debug', 'results', results);

          if (results === false) {

            return false;

          }

          let itemName;
          let locationName;
          let binName;
          let binQty;

          if (results.length > 0) {

            let index;
            let e;

            for (index = 0; index < results.length; index++) {

              common.enterContext('results[' + index + ']');

              itemName = results[index]['itemName'];
              locationName = results[index]['locationName'];
              binName = results[index]['binName'];
              binQty = results[index]['binQuantity'];

              common.logVal('debug', 'itemName', itemName);
              common.logVal('debug', 'locationName', locationName);
              common.logVal('debug', 'binName', binName);
              common.logVal('debug', 'binQty', binQty);

              if (
                itemOnHandQuantities[itemName] &&
                itemOnHandQuantities[itemName][locationName]
              ) {

                if (itemOnHandQuantities[itemName][locationName]['bins'][binName] === undefined) {

                  itemOnHandQuantities[itemName][locationName]['bins'][binName] = binQty;

                  common.logMsg(
                    'debug',
                    'Bin quantity set for bin ' +
                    binName +
                    ' item ' +
                    itemName +
                    ' location ' +
                    locationName +
                    ' from results[' + index + ']'
                  );

                } else {

                  e =
                    new Error(
                      'Bin quantity already set for bin ' +
                      binName +
                      ' item ' +
                      itemName +
                      ' location ' +
                      locationName
                    );

                  common.logErr('error', e);

                }

              } else {

                if (!itemOnHandQuantities[itemName]) {

                  e =
                    new Error(
                      'Misssing item ' +
                      itemName +
                      ' and location ' +
                      locationName
                    );

                } else if (!itemOnHandQuantities[itemName][locationName]) {

                  common.logVal('debug', 'itemOnHandQuantities[itemName]', itemOnHandQuantities[itemName]);

                  e =
                    new Error(
                      'Expected location ' +
                      locationName +
                      ' but location not in itemOnHandQuantities'
                    );

                }

                common.logErr('error', e);

                e =
                  new Error(
                    'Unable to set bin quantity for bin ' +
                    binName +
                    ' item ' +
                    itemName +
                    ' location ' +
                    locationName
                  );

                common.logErr('error', e);

              }

              common.leaveContext(); // result[x]

            }

          }

        } catch (e) {

          common.logErr('error', e);

          return false;

        } finally {

          common.leaveContext();  // Function

        }

        common.logVal('debug', 'itemOnHandQuantities', itemOnHandQuantities);

        return true;

      }

      createAdjustment(
        currentQuantities,
        updates,
        memo,
        bodyLocationId
      ) {

        common.enterContext('createAdjustment');

        let invAdj;
        let result =
        {
          id: false,
          errors: []
        };

        // Create the Inventory Adjustment record in dynamic mode to allow field data to be sourced
        // like in the user interface, and errors detected sooner for better error handling

        try {

          invAdj =
            record.create(
              {
                type: record.Type.INVENTORY_ADJUSTMENT,
                isDynamic: true
              }
            );

          // Set the subsidary frst to allow other fields to be sourced
          // e.g. posting period defaulting from the date

          invAdj.setValue(
            {
              fieldId: ADJUSTMENT_SUBSIDIARY,
              value: this.ADJUSTMENT_SUBSIDIARY_ID
            }
          );

          invAdj.setValue(
            {
              fieldId: ADJUSTMENT_ACCOUNT,
              value: this.ADJUSTMENT_GL_ACCOUNT_ID
            }
          );

          invAdj.setValue(
            {
              fieldId: ADJUSTMENT_LOCATION,
              value: bodyLocationId
            }
          );

          invAdj.setValue(
            {
              fieldId: ADJUSTMENT_MEMO,
              value: memo
            }
          );

        } catch (e) {

          common.logErr('error', e, 'Failed to create the Inventory Adjustment record');

          common.leaveContext(); // createAdjustment

          result.errors.push(e);

          return result;

        }

        common.logMsg('audit', 'Created a new Inventory Adjustment record');

        // Loop over the uploaded CSV file lines capturing the new quantity of each item
        // for each location and for all bins in that location so that the items which
        // need adjusting can be determined and by how much

        let newQuantities = {};

        updates.forEach(
          (line, index) => {

            try {

              common.enterContext('line[' + index + ']'); // Line

              common.logVal('debug', 'line', line);

              // N.B. CSV file now contains only Stock Code not Stock Identity (itemid).
              // Need to map Stock Code to Stock Identity for populating the Inventory Adjustment record

              let stockCode = line[CSV_FIELD_ITEM_STOCK_CODE];
              let itemId = currentQuantities.mapStockCodeToItemId(stockCode);
              let location = line[CSV_FIELD_LOCATION];
              let binName = line[CSV_FIELD_BIN];
              let newBinQty = line[CSV_FIELD_COUNTED_QTY];

              common.logVal('debug', 'CSV_FIELD_ITEM_STOCK_CODE', stockCode);
              common.logVal('debug', 'CSV_FIELD_LOCATION', location);
              common.logVal('debug', 'CSV_FIELD_BIN', binName);
              common.logVal('debug', 'CSV_FIELD_COUNTED_QTY', newBinQty);

              common.logVal('debug', 'itemId', itemId);

              if (itemId === false) {

                throw new Error(
                  'Failed to determine ItemId for stock code ' +
                  stockCode +
                  ', location ' +
                  location +
                  ', and bin ' +
                  binName +
                  ' on line ' + (index + 2)
                );

              } else if (itemId === null) {

                throw new Error(
                  'ItemId not found for stock code ' +
                  stockCode +
                  ', location ' +
                  location +
                  ', and bin ' +
                  binName +
                  ' on line ' + (index + 2)
                );

              }

              if (newQuantities[itemId] === undefined) {
                newQuantities[itemId] = {};
              }

              if (newQuantities[itemId][location] === undefined) {
                newQuantities[itemId][location] = {
                  total: 0,
                  bins: {}
                };
              }

              if (newQuantities[itemId][location]['bins'][binName] === undefined) {

                newQuantities[itemId][location]['bins'][binName] = newBinQty;
                newQuantities[itemId][location]['total'] += newBinQty

              } else {

                throw new Error(
                  'Quantity for item ' +
                  itemId +
                  ', location ' +
                  location +
                  ', and bin ' +
                  binName +
                  ' repeated on line ' + (index + 2)
                );

              }

            }
            catch (e) {

              common.logErr('error', e, 'Error processing line ' + (index + 2));

              result.errors.push(e);

            } finally {

              common.leaveContext(); // Line

            }

          }
        );

        common.logVal('debug', 'errors', result.errors);

        if (result.errors.length > 0) {

          common.logMsg('debug', 'Unable to extract new quantity data');

          common.leaveContext(); // createAdjustment

          return result;

        }

        common.logMsg('audit', 'Extracted new quantity data');
        common.logVal('debug', 'newQuantities', newQuantities);

        // Create the required adjustment lines on the Inventory Adjustment record

        /**
         * Helper function to simplify error handling and logging contexts
         * @param {string} binNo The text number of the bin for the inventory detail line
         * @param {number} adjustmentQty The quantity difference for the inventory detail line
         * @returns
         */
        function _addInventoryDetail(binNo, adjustmentQty) {

          common.enterContext('_addInventoryDetail');

          common.logVal('debug', 'binNo', binNo);
          common.logVal('debug', 'adjustmentQty', adjustmentQty);

          let errors = [];

          try {

            let invDetail;

            invDetail =
              invAdj.getCurrentSublistSubrecord(
                {
                  sublistId: SUBLIST_ADJUSTMENT_LINE,
                  fieldId: SUBLIST_FIELD_ADJUSTMENT_LINE_INV_DETAIL
                }
              );

            common.logMsg('debug', 'Created the Inventory Detail subrecord');

            invDetail.selectNewLine(
              {
                sublistId: SUBLIST_ADJUSTMENT_LINE_INV_DETAIL_INV_ADJUSTMENT
              }
            );

            common.logMsg('debug', 'Selected a new line on the Inventory Detail subrecord');

            common.logVal('debug', 'this.binIdByNo[binNo]', this.binIdByNo[binNo]);

            invDetail.setCurrentSublistValue(
              {
                sublistId: SUBLIST_ADJUSTMENT_LINE_INV_DETAIL_INV_ADJUSTMENT,
                fieldId: SUBLIST_ADJUSTMENT_LINE_INV_DETAIL_INV_ADJUSTMENT_BIN,

                value: this.binIdByNo[binNo]
              }
            );

            common.logMsg('debug', 'Set bin to ' + binNo);

            invDetail.setCurrentSublistValue(
              {
                sublistId: SUBLIST_ADJUSTMENT_LINE_INV_DETAIL_INV_ADJUSTMENT,
                fieldId: SUBLIST_ADJUSTMENT_LINE_INV_DETAIL_INV_ADJUSTMENT_QTY,
                value: adjustmentQty
              }
            );

            common.logMsg('debug', 'Set bin quantity to ' + adjustmentQty);

            invDetail.commitLine(
              {
                sublistId: SUBLIST_ADJUSTMENT_LINE_INV_DETAIL_INV_ADJUSTMENT
              }
            );

            common.logMsg('debug', 'Committed the new line on the Inventory Detail subrecord');

          } catch (e) {

            errors.push(e);

            common.logErr('error', e, 'Failed to create the Inventory Detail subrecord');

          } finally {

            common.leaveContext();

          }

          return (errors.length > 0) ? errors : true;

        }

        let itemId;
        let location;
        let bin;
        let totalQtyDiff;

        for (itemId in newQuantities) {

          if (!newQuantities.hasOwnProperty(itemId)) {

            continue;

          }

          if (currentQuantities[itemId] === undefined) {

            result.errors.push(
              new Error(
                'No total quantity available for item ' +
                itemId + '. Is there such an item ?'
              )
            );

            continue;

          }

          common.enterContext(itemId); // Item

          try {

            for (location in newQuantities[itemId]) {

              if (!newQuantities[itemId].hasOwnProperty(location)) {

                continue;

              }

              common.enterContext(location); // Location

              try {

                if (currentQuantities[itemId][location] === undefined) {

                  result.errors.push(
                    new Error(
                      'No total quantity available for location ' +
                      location +
                      ' for item ' +
                      itemId + '. Is there such a location ?'
                    )
                  );

                  continue;

                }

                if (currentQuantities[itemId][location]['total'] === undefined) {

                  result.errors.push(
                    new Error(
                      'No total quantity available for item ' +
                      itemId +
                      ' in location ' +
                      location +
                      '. Is a valid item / location combination ?'
                    )
                  );

                  continue;

                }

                common.logVal('debug', 'current total', currentQuantities[itemId][location]['total']);
                common.logVal('debug', 'new total', newQuantities[itemId][location]['total']);

                totalQtyDiff =
                  (
                    newQuantities[itemId][location]['total'] -
                    currentQuantities[itemId][location]['total']
                  );

                common.logVal('debug', 'qtyDiff', totalQtyDiff);

                if (totalQtyDiff === 0) {

                  common.logMsg('debug', 'NO adjustment line(s) required');

                  common.leaveContext(); // Location

                  continue;
                }

                common.logMsg('debug', 'Adjustment line(s) required');

                for (bin in newQuantities[itemId][location]['bins']) {

                  if (!newQuantities[itemId][location].hasOwnProperty(bin)) {

                    // TODO: Fix removal of continue causing "Error: TypeError: Cannot read property 'binIdByNo' of undefined"
                    // continue;

                  }

                  common.enterContext(bin); // Bin

                  try {

                    if (currentQuantities[itemId][location]['bins'][bin] === undefined) {
                      throw new Error(
                        'No quantity available for item ' +
                        itemId + ', location ' +
                        location +
                        ', and bin ' +
                        bin + '. Is there such a bin ?'
                      );
                    }

                    let binQtyDiff =
                      (
                        newQuantities[itemId][location]['bins'][bin] -
                        currentQuantities[itemId][location]['bins'][bin]
                      );

                    common.logVal('debug', 'binQtyDiff', binQtyDiff);

                    // Prevent attempting to create an Inventory Detail line with 0 quantity

                    if (binQtyDiff === 0) {

                      common.logMsg('debug', 'Adjustment of bin quantity NOT required');

                      common.leaveContext(); // Bin

                      continue;

                    }

                    common.logMsg('debug', 'Adjustment of bin quantity required');

                    invAdj.selectNewLine(
                      {
                        sublistId: SUBLIST_ADJUSTMENT_LINE
                      }
                    );

                    common.logMsg('debug', 'Selected new line');

                    invAdj.setCurrentSublistText(
                      {
                        sublistId: SUBLIST_ADJUSTMENT_LINE,
                        fieldId: SUBLIST_FIELD_ADJUSTMENT_LINE_ITEM,
                        text: itemId
                      }
                    );

                    invAdj.setCurrentSublistText(
                      {
                        sublistId: SUBLIST_ADJUSTMENT_LINE,
                        fieldId: SUBLIST_FIELD_ADJUSTMENT_LINE_LOCATION,
                        text: location
                      }
                    );

                    invAdj.setCurrentSublistValue(
                      {
                        sublistId: SUBLIST_ADJUSTMENT_LINE,
                        fieldId: SUBLIST_FIELD_ADJUSTMENT_LINE_ADJUST,
                        value: binQtyDiff
                      }
                    );

                    common.logVal('debug', 'Set bin quantity Adjust Quantity By to ', binQtyDiff);

                    // N.B. Internal helper function must be called in the context of this function

                    let invDetResults = _addInventoryDetail.call(this, bin, binQtyDiff);

                    if (invDetResults === true) {

                      common.logMsg('debug', 'Configured the Inventory Detail subrecord');

                      invAdj.commitLine(
                        {
                          sublistId: SUBLIST_ADJUSTMENT_LINE
                        }
                      );

                      common.logMsg('debug', 'Committed the Inventory Adjustment line');

                    } else {

                      result.errors = result.errors.concat(invDetResults);

                    }

                  } catch (e) {

                    result.errors.push(e);

                    common.logErr('error', e);

                  } finally {

                    common.leaveContext(); // Bin

                  }
                }

              } catch (e) {

                result.errors.push(e);

                common.logErr('error', e);

              } finally {

                common.leaveContext(); // Location

              }
            }

          } catch (e) {

            result.errors.push(e);

            common.logErr('error', e);

          } finally {

            common.leaveContext(); // Item

          }

        }

        if (result.errors.length === 0) {

          if (invAdj.getLineCount({ sublistId: SUBLIST_ADJUSTMENT_LINE }) < 1) {

            result.id = false;
            result.errors.push(
              new Error('Inventory Adjustment record not created - No quantity changes required')
            );

          } else {

            try {

              result.id = invAdj.save();

              common.logVal('debug', 'invAdjId', result.id);

            } catch (e) {

              result.id = false;
              result.errors.push(
                new Error('Unable to save the Inventory Adjustment record')
              );

              common.logErr('error', e, 'Unable to save the Inventory Adjustment record');

            }

          }

        }

        common.leaveContext(); // createAdjustment

        return result;

      }

      displayErrors(response, errors) {

        errors.forEach(
          (e) => {

            response.writeLine(
              {
                output: e.name + ' - ' + e.message
              }
            );

          }
        );

      }

      /**
       * Runs a search and assembles the results into an Array of resultClass
       * @param {search.Search} srch
       * @param {class} resultClass
       * @returns
       */
      runSearch(srch, resultClass) {

        common.enterContext('runSearch'); // Function

        common.logVal('debug', 'srch', srch);

        let results = [];
        let resultCount = 0;
        let errorCount = 0;

        try {

          let pagedData = srch.runPaged({ pageSize: 1000 });
          let page;
          let obj;

          pagedData.pageRanges.forEach(
            (range) => {
              page = pagedData.fetch({ index: range.index });

              page.data.forEach(
                (result, index) => {

                  common.enterContext('result[' + index + ']');

                  try {

                    obj = new resultClass(result);

                    resultCount++;

                    common.logVal('debug', 'obj', obj);

                    results.push(obj);

                  } catch (e) {

                    errorCount++;

                    common.logErr('error', e);

                  } finally {

                    common.leaveContext();

                  }
                }
              );
            }
          );

        } catch (e) {

          results = false;
          common.logErr('error', e);

        }

        common.logVal('debug', 'results', results);
        common.logVal('debug', 'resultCount', resultCount);
        common.logVal('debug', 'errorCount', errorCount);

        if (errorCount > 0) {
          results = false;
        }

        common.logVal('debug', 'final results', results);

        common.leaveContext(); // Function

        return results;
      }

      /**
       * Defines the Suitelet script trigger point.
       * @param {Object} scriptContext
       * @param {ServerRequest} scriptContext.request - Incoming request
       * @param {ServerResponse} scriptContext.response - Suitelet response
       * @since 2015.2
       */
      onRequest(scriptContext) {
        try {

          common.startScript(scriptContext);
          common.enterContext('onRequest');

          // Initialise the script with values from NetSuite

          this.init();

          common.logVal('debug', 'CSV_UPLOAD_FOLDER_ID', this.CSV_UPLOAD_FOLDER_ID);
          common.logVal('debug', 'ADJUSTMENT_GL_ACCOUNT_ID', this.ADJUSTMENT_GL_ACCOUNT_ID);
          common.logVal('debug', 'ADJUSTMENT_SUBSIDIARY_ID', this.ADJUSTMENT_SUBSIDIARY_ID);
          common.logVal('debug', 'USER_INSTRUCTIONS', this.USER_INSTRUCTIONS);

          if (scriptContext.request.method === https.Method.GET) {

            common.enterContext('GET');

            let form = this.createUploadForm();

            if (form === null) {

              scriptContext.response.write(
                {
                  output: 'Unexpected error - Unable to create user form'
                }
              );

            } else {

              scriptContext.response.writePage(
                {
                  pageObject: form
                }
              );
            }

            common.leaveContext(); // GET

          } else {

            common.enterContext('POST');

            common.logVal('debug', 'scriptContext.request.files', scriptContext.request.files);

            let csvFile = scriptContext.request.files['custpage_csv'];
            let description = (scriptContext.request.parameters['custpage_description'] || '');
            let location = Number(scriptContext.request.parameters['custpage_location'] || '0');

            common.logVal('debug', 'csvFile', csvFile);
            common.logVal('debug', 'description', description);
            common.logVal('debug', 'location', location);

            let errs = [];

            if (!csvFile) {

              errs.push(new Error('No upload CSV file provided'));

            }

            if (location === 0) {

              errs.push(new Error('No location selected'));

            }

            if (errs.length) {

              this.displayErrors(scriptContext.response, errs);

              return;

            }

            if (description.trim() !== '') {
              csvFile.description = description;

              common.logMsg('debug', 'Uploaded file description set');

            }

            csvFile.folder = this.CSV_UPLOAD_FOLDER_ID;

            // 1. Parse CSV file contents into a usable datastructure

            let parsed = this.parseCSVFile(csvFile);

            if (Array.isArray(parsed.errors) && (parsed.errors.length > 0)) {

              this.displayErrors(scriptContext.response, parsed.errors);

              return;

            }

            // 2. Extract a list of items whose bin quantities need updating

            let itemOnHandQtyByNameAndLocation;

            itemOnHandQtyByNameAndLocation = this.getItemOnHandQty();

            if (itemOnHandQtyByNameAndLocation === false) {

              throw new Error('Failed to extract a list of items whose bin quantities need updating');

            }

            // Include the name of the user uploading the file and the file name in the memo field

            let memo =

              'Created by ' + common.user.name + ' using the Bin Quantities Upload script ' +
              ' to upload CSV file ' + csvFile.name;

            // 3. Create an Inventory Adjustment record to adjust the bin quantities

            let result =
              this.createAdjustment(
                itemOnHandQtyByNameAndLocation,
                parsed.data,
                memo,
                location
              );

            common.logVal('debug', 'result', result);

            if (result.id === false) {

              this.displayErrors(scriptContext.response, result.errors);

              return;

            }

            try {

              // N.B. If a file with the same name already exists in the folder, it will be overwritten

              let fileId = csvFile.save();

              common.logMsg('debug', 'Uploaded file saved with id: ' + fileId);

            }
            catch (e) {

              common.logErr('emergency', e, 'File uploaded but NOT able to save to the file cabinet');

            }

            // Redirect user to the new Inventory Adjustment record

            redirect.toRecord(
              {
                type: record.Type.INVENTORY_ADJUSTMENT,
                id: result.id
              }
            );

          } // POST

        } catch (e) {

          common.logErr('error', e);

          scriptContext.response.write(
            {
              output: 'Unexpected error. Please raise a helpdesk request'
            }
          );

        } finally {

          common.leaveContext();  // Filename
          common.leaveContext();  // POST

        }
      }
    }

    const script = new CsvImportScript();

    return { onRequest: script.onRequest.bind(script) };
  }
);