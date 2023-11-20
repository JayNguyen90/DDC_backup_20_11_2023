/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(
  [
    'N/search',
    'N/ui/serverWidget',
    'N/url',
    '../../modules/constants',
    '../../modules/lists'
  ],

  (
    search,
    serverWidget,
    url,
    constants,
    lists
  ) => {
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

    // class Column {
    //   constructor(id, value) {
    //     this.id = id;
    //     this.data = (value || '');
    //   }
    // }

    /**
     * Defines the function that is executed when a GET request is sent to a RESTlet.
     * @param {Object} requestParams - Parameters from HTTP request URL; parameters passed as an Object (for all supported
     *     content types)
     * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
     *     Object when request Content-Type is 'application/json' or 'application/xml'
     * @since 2015.2
     */
    const get = (requestParams) => {
      let categoryId = Number(requestParams[constants.SCRIPTS.GET_ITEMS.PARAM_CATEGORY]);
      let searchId = Number(requestParams[constants.SCRIPTS.GET_ITEMS.PARAM_ITEM_SEARCH]);

      log.debug(
        {
          title: 'categoryId',
          details: categoryId + ' {' + (typeof categoryId) + '}'
        }
      );

      log.debug(
        {
          title: 'searchId',
          details: searchId + ' {' + (typeof searchId) + '}'
        }
      );

      let srch;

      let data = new GetItemsResponse();

      if (!isNaN(categoryId) && (categoryId > 0)) {
        /*srch =
          search.create(
            {
              type: constants.RECORDS.CAT_ITEM_FIELDS.ID,
              filters:
                [
                  search.createFilter(
                    {
                      name: constants.RECORDS.CAT_ITEM_FIELDS.FIELDS.CATEGORY,
                      operator: search.Operator.ANYOF,
                      values: [categoryId]
                    }
                  )
                ],
              columns:
                [
                  search.createColumn({ name: constants.RECORDS.CAT_ITEM_FIELDS.FIELDS.SEARCH })
                ]
            }
          );

        let results = srch.run().getRange({ start: 0, end: 1000 });

        log.debug({ title: 'results', details: results });*/

        // if (results.length === 1) {
        if (!isNaN(searchId)) {
          srch =
            search.load(
              {
                type: search.Type.ITEM,
                // id: constants.SEARCHES.SERVICE_ITEMS
                // id: results[0].getValue({ name: constants.RECORDS.CAT_ITEM_FIELDS.FIELDS.SEARCH })
                id: searchId
              }
            );

          // if (categoryId) {
          srch.filters =
            srch.filters.concat(
              search.createFilter(
                {
                  name: constants.RECORDS.ITEM.FIELDS.CATEGORY,
                  operator: search.Operator.ANYOF,
                  values: categoryId
                }
              )
            );
          // }

          // let data = new Table();
          let row = new Row();
          let colNames = [];
          let columns = {};

          srch.columns.forEach(
            (col) => {
              // log.debug({ title: 'srch.columns.forEach:col', details: JSON.stringify(col) });
              // row.addColumnValue(col.name, col.label);
              // colNames.push(col.name);
              columns[col.name] = JSON.parse(JSON.stringify(col));

              if (col.name === 'internalid') {
                // Override column type for internal ids
                //  * Prevents generation of hyperlink
                //  * Allows formatting of a number so it can be used by the client module

                columns[col.name]['type'] = serverWidget.FieldType.INTEGER;
              }

              let type = columns[col.name]['type'].toUpperCase();

              let locked =
                (
                  [
                    'internalid',
                    'itemid',
                    'displayname'
                  ].indexOf(col.name) !== -1
                );

              let source = [];

              if (
                (type === serverWidget.FieldType.SELECT) ||
                (type === serverWidget.FieldType.MULTISELECT)
              ) {
                if (constants.MAPS.SEARCH_COL_SOURCE_LIST_ID[col.name]) {
                  switch (col.name) {
                    case 'taxschedule':
                      source =
                        lists.getValues(
                          constants.MAPS.SEARCH_COL_SOURCE_LIST_ID[col.name],
                          { activeOnly: false }
                        )['names'];
                      break;

                    // case 'item':
                    case 'custitem_ddc_linked_ot_service':
                      source =
                        lists.getValues(
                          constants.MAPS.SEARCH_COL_SOURCE_LIST_ID[col.name],
                          {
                            filters:
                              [
                                search.createFilter(
                                  {
                                    name: 'type',
                                    operator: search.Operator.ANYOF,
                                    values:
                                      ['Service']
                                  }
                                )
                              ],
                            firstEntryBlank: true
                          }
                        )['names'];
                      break;

                    case 'custitem_ddc_linked_stock_item':
                      source =
                        lists.getValues(
                          constants.MAPS.SEARCH_COL_SOURCE_LIST_ID[col.name],
                          {
                            filters:
                              [
                                search.createFilter(
                                  {
                                    name: 'type',
                                    operator: search.Operator.ANYOF,
                                    values:
                                      ['InvtPart']
                                  }
                                )
                              ],
                            firstEntryBlank: true
                          }
                        )['names'];
                      break;

                    default:
                      source =
                        lists.getValues(
                          constants.MAPS.SEARCH_COL_SOURCE_LIST_ID[col.name],
                          {
                            firstEntryBlank: true
                          }
                        )['names'];
                      break;
                  }

                  /*if (col.name === 'taxschedule') {
                    source =
                      lists.getValues(
                        constants.MAPS.SEARCH_COL_SOURCE_LIST_ID[col.name],
                        { activeOnly: false }
                      )['names'];
                  } else {
                    source =
                      lists.getValues(
                        constants.MAPS.SEARCH_COL_SOURCE_LIST_ID[col.name]
                      )['names'];
                  }*/
                } else {
                  log.emergency(
                    {
                      title: 'Missing mapping',
                      details: 'Please add map for search column: ' + col.name
                    }
                  );
                }
              }

              data.addColumn(col.name, col.label, type, locked, source);
            }
          );

          log.debug({ title: 'columns', details: JSON.stringify(columns) });

          // log.debug({ title: 'colNames', details: colNames });

          // data.addRow(row);

          let pagedData =
            srch.runPaged(
              {
                pageSize: 1000
              }
            );

          if (pagedData.count > 0) {
            pagedData.pageRanges.forEach(
              (range) => {
                log.debug({ title: 'range', details: range.index });
                let page = pagedData.fetch(range.index);

                // log.debug({ title: 'page.data',  details: page.data });

                page.data.forEach(
                  (result) => {
                    let row = new Row();

                    // colNames.forEach(
                    //   (name) => {
                    //* log.debug({ title: 'name',  details: name });
                    //* log.debug({ title: 'value',  details: result.getValue({ name: name }) });
                    // row.addColumn(name, result.getValue({ name: name }));
                    //   }
                    // );

                    for (let name in columns) {
                      // Object.keys(result.columns).forEach(
                      // (name) => {
                      // let json = JSON.stringify(result.columns[name]);
                      // let col = JSON.parse(json);
                      log.debug({ title: 'name', details: name });
                      //log.debug({ title: 'columns.forEach', details: JSON.stringify(result.columns[name]) + ' {' +(typeof result.columns[name]) + '}' });
                      //log.debug({ title: 'columns.forEach', details: result.columns[name]['type'] + ' {' +(typeof result.columns[name]['type']) + '}' });
                      // log.debug({ title: 'columns.forEach', details: col['type'] + ' {' +(typeof col['type']) + '}' });
                      log.debug({ title: 'columns[name].type', details: columns[name]['type'] + ' {' + (typeof columns[name]['type']) + '}' });
                      log.debug({ title: 'type', details: columns[name].type });
                      // switch (col['type']) {
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
                          // let valueRecordType = constants.MAPS.SEARCH_COL_SOURCE_LIST_ID[name];
                          // let valueUrl;

                          // log.debug(
                          //   {
                          //     title: 'name',
                          //     details: name
                          //   }
                          // );

                          // log.debug(
                          //   {
                          //     title: 'valueRecordType',
                          //     details: valueRecordType
                          //   }
                          // );

                          /*if (valueRecordType !== 'item') {
                            valueUrl =
                              url.resolveRecord(
                                {
                                  isEditMode: false,
                                  recordType: valueRecordType,
                                  recordId: result.getValue(columns[name])
                                }
                              );
                          }*/

                          /*if (util.isString(valueUrl) && (valueUrl.trim() !== '')) {
                            row.addColumnValue(
                              name,
                              '<a href="' + valueUrl + '" target="_blank">' + result.getText(columns[name]) + '</a>'
                            );
                          } else {
                            row.addColumnValue(name, result.getText(columns[name]));
                          }*/
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

                    data.addRow(row);
                  }
                );
              }
            );
          }
        } else {
          // No field search configured
          data.meta.errmsg = 'Columns have not been configured for the item category';
        }
      } else {
        // TODO: Handle error no category internal id value passed
      }

      // log.audit(
      //   {
      //     title: 'data.rows',
      //     details: data.rows
      //   }
      // );

      log.debug(
        {
          title: 'data',
          details: data.toString()
        }
      );

      // return JSON.stringify(data.rows);
      return data.toString();
    };

    /**
     * Defines the function that is executed when a PUT request is sent to a RESTlet.
     * @param {string | Object} requestBody - The HTTP request body; request body are passed as a string when request
     *     Content-Type is 'text/plain' or parsed into an Object when request Content-Type is 'application/json' (in which case
     *     the body must be a valid JSON)
     * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
     *     Object when request Content-Type is 'application/json' or 'application/xml'
     * @since 2015.2
     */
    const put = (requestBody) => {

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
    const post = (requestBody) => {

    }

    /**
     * Defines the function that is executed when a DELETE request is sent to a RESTlet.
     * @param {Object} requestParams - Parameters from HTTP request URL; parameters are passed as an Object (for all supported
     *     content types)
     * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
     *     Object when request Content-Type is 'application/json' or 'application/xml'
     * @since 2015.2
     */
    const doDelete = (requestParams) => {

    }

    return { get, put, post, delete: doDelete };
  }
);