/**
 * @NApiVersion 2.1
 * @NAmdConfig /SuiteScripts/IVE Scripts/Modules/amdconfig.json
 */
define(
  [
    'N/search',
    'common',
    'lodash', // lodash = _
    './constants',
    './data'
  ],

  /**
   * @param {search} search
   * @param {CommonModule} common
   * @param {any} _
   * @param {object} constants
   * @param {DataModule} data
   */
  (
    search,
    common,
    _,
    constants,
    data
  ) => {

    const LIST_ID_ITEM_CATEGORY = 'customrecord_ddc_item_category';
    const LIST_ID_DEPARTMENT = 'department';
    const LIST_ID_CLASS = 'classification';
    const LIST_ID_SEARCHES = 'savedsearch';
    const LIST_ID_TAX_SCHEDULE = 'taxschedule';
    const LIST_ID_CUSTOMER = 'customer';
    const LIST_ID_ITEM_MEASURE = 'customlist_ddc_measure';
    const LIST_ID_COSTING_FORMULA = 'customrecord_ddc_costing_formula_list';
    const LIST_ID_LINKED_OT_SERVICE = 'item';
    const LIST_ID_LINKED_STOCK_ITEM = 'item';
    const LIST_ID_MARGIN_CATEGORY = 'customlist_ddc_margin_category';
    const LIST_ID_WORK_GROUP = 'customlist_ddc_work_centre_group_list';
    const LIST_ID_CUSTOMER_RATE_CARD = 'customrecord_customer_rate_card';
    const LIST_ID_QUANTITY_SOURCE = 'customlist_ddc_quantity_source';

    let LIST_NAME_FIELDS = {};

    LIST_NAME_FIELDS[LIST_ID_ITEM_CATEGORY] = 'name';
    LIST_NAME_FIELDS[LIST_ID_DEPARTMENT] = 'name';
    LIST_NAME_FIELDS[LIST_ID_CLASS] = 'name';
    LIST_NAME_FIELDS[LIST_ID_SEARCHES] = 'title';
    LIST_NAME_FIELDS[LIST_ID_TAX_SCHEDULE] = 'name';
    LIST_NAME_FIELDS[LIST_ID_ITEM_MEASURE] = 'name';
    LIST_NAME_FIELDS[LIST_ID_COSTING_FORMULA] = 'name';
    LIST_NAME_FIELDS[LIST_ID_LINKED_OT_SERVICE] = 'itemid';
    LIST_NAME_FIELDS[LIST_ID_LINKED_STOCK_ITEM] = 'itemid';
    LIST_NAME_FIELDS[LIST_ID_MARGIN_CATEGORY] = 'name';
    LIST_NAME_FIELDS[LIST_ID_WORK_GROUP] = 'name';
    LIST_NAME_FIELDS[LIST_ID_CUSTOMER] = 'entityid';
    LIST_NAME_FIELDS[LIST_ID_CUSTOMER_RATE_CARD] = 'custrecord_crc_doc_number';
    LIST_NAME_FIELDS[LIST_ID_QUANTITY_SOURCE] = 'name';

    class ListsModule {
      constructor() {
      }

      get IDS() {
        return {
          'ITEM_CATEGORY': LIST_ID_ITEM_CATEGORY,
          'DEPARTMENT': LIST_ID_DEPARTMENT,
          'CLASS': LIST_ID_CLASS,
          'SEARCHES': LIST_ID_SEARCHES
        };
      }

      getValues(id, options) {

        let values =
        {
          'tvpairs': [],
          'names': []
        };

        try {

          common.enterContext('lists.getValues'); // lists.getValues

          common.logVal('debug', 'id', id);
          common.logVal('debug', 'options', options);

          let filters = [];
          let _opts =
          {
            activeOnly: true,
            filters: [],
            firstEntryBlank: false,
            firstEntryFilters: false,
            firstEntryColumn: null,
            nameColumn: null
          };
          let firstEntryNames = [];

          if (util.isObject(options)) {

            // TODO: implement cloning of options

            if (options['activeOnly'] !== undefined) {

              _opts['activeOnly'] = options['activeOnly'];

            }

            if (options['filters'] !== undefined) {

              _opts['filters'] = options['filters'];

            }

            if (options['firstEntryBlank'] !== undefined) {

              _opts['firstEntryBlank'] = options['firstEntryBlank'];

            }

            if (options['firstEntryFilters'] !== undefined) {

              _opts['firstEntryFilters'] = options['firstEntryFilters'];

            }

            if (options['firstEntryColumn'] !== undefined) {

              _opts['firstEntryColumn'] = options['firstEntryColumn'];

            }

            if (options['nameColumn'] !== undefined) {

              _opts['nameColumn'] = options['nameColumn'];

            }

          }

          if (!!_opts.activeOnly) {

            filters.push(
              search.createFilter(
                {
                  name: 'isinactive',
                  operator: search.Operator.IS,
                  values: ['F']
                }
              )
            );

          }

          if (Array.isArray(_opts.filters)) {

            filters = filters.concat(_opts.filters);

          }

          let columns = [];
          let nameCol;

          if (_opts['nameColumn']) {

            columns.push(_opts['nameColumn']);
            nameCol = _opts['nameColumn'];

          } else {

            if (!LIST_NAME_FIELDS[id]) {

              throw constants.ERRORS.ITM_SERVER_ERROR('Missing name field. Please add the name field to LIST_NAME_FIELDS for list: ' + id);

            }

            nameCol = search.createColumn({ name: LIST_NAME_FIELDS[id] });
            columns.push(nameCol);

          }

          let srch =
            search.create(
              {
                type: id,
                filters: filters,
                columns: columns
              }
            );

          if (Array.isArray(_opts.firstEntryFilters)) {

            let srchFirstEntry =
              search.create(
                {
                  type: id,
                  filters: filters.concat(_opts.firstEntryFilters),
                  columns: columns
                }
              );

            let firstEntries = data.getSearchResults(srchFirstEntry);

            if (firstEntries !== false) {

              firstEntries.forEach(
                (entry) => {

                  try {

                    let entryName;

                    // if (_._opts.firstEntryColumn) {

                    //   entryName = entry[_opts.firstEntryColumn.name];

                    // } else {

                    entryName = entry[nameCol.name]['value'];

                    common.logVal('debug', 'entryName', entryName);

                    // }

                    if (!util.isString(entryName) || entryName.trim() === '') {

                      return;

                    }

                    firstEntryNames.push(entryName);

                  } catch (e) {

                    // TODO: If needed

                  }
                }
              );

              common.logVal('debug', 'firstEntryNames', firstEntryNames);
            }

          }

          let pagedData =
            srch.runPaged(
              {
                pageSize: 1000
              }
            );

          common.logMsg('debug', 'Found ' + pagedData.count + ' list values');

          if (!!_opts['firstEntryBlank'] === true) {
            values['tvpairs'].push(
              {
                value: '',
                name: ''
              }
            );

            values['names'].push('');
          }

          pagedData.pageRanges.forEach(
            (pageRange) => {
              let page =
                pagedData.fetch(
                  {
                    index: pageRange.index
                  }
                );

              page.data.forEach(
                (result) => {

                  let name;

                  if (_opts['nameColumn']) {

                    name = result.getValue(_opts['nameColumn']);

                  } else {

                    name = result.getValue({ name: LIST_NAME_FIELDS[id] });

                  }

                  values['tvpairs'].push(
                    {
                      value: result.id,
                      // name: result.getValue({ name: LIST_NAME_FIELDS[id] })
                      name: name
                    }
                  );

                  values['names'].push(result.getValue({ name: LIST_NAME_FIELDS[id] }));

                }
              );

            }
          );

          common.logVal('debug', 'values', values);

          // Re-order the entries if required r.e. firstEntryNames option

          if (firstEntryNames.length > 0) {

            let _values =
            {
              'tvpairs': [],
              'names': []
            };

            firstEntryNames.forEach(
              (entryName) => {

                // Copy across the tvpair entries to be ordered first

                values['tvpairs'].forEach(
                  (pair) => {

                    if (pair['name'] === entryName) {

                      _values['tvpairs'].push(pair);

                    }

                  }
                );

                // Copy across the remaining tvpair entries

                values['tvpairs'].forEach(
                  (pair) => {

                    if (pair['name'] !== entryName) {

                      _values['tvpairs'].push(pair);

                    }

                  }
                );

                // Copy across the name entries to be ordered first

                values['names'].forEach(
                  (name) => {

                    if (name === entryName) {

                      _values['names'].push(name);

                    }

                  }
                );

                // Copy across the remaining name entries

                values['names'].forEach(
                  (name) => {
                    if (name !== entryName) {
                      _values['names'].push(name);
                    }
                  }
                );
              }
            );

            values = _values;

          }

        } catch (e) {

          if (e.name === constants.ERRORS.CODES.ITM_SERVER_ERROR) {

            common.logErr('emergency', e);

            // Re-throw the error so NetSuite will send a notification email to the admins

            common.leaveContext(); // lists.getValues

            throw e;

          }

          values =
          {
            'tvpairs': [],
            'names': []
          };

          common.logErr('error', e);

        } finally {

          common.leaveContext(); // lists.getValues

        }

        common.logVal('debug', 'values for ' + id, values);

        return values;

      }
    }

    return new ListsModule();
  }
);