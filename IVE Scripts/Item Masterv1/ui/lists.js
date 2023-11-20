/**
 * @NApiVersion 2.1
 */
define(
  [
    'N/search'
  ],

  /**
   * @param {search} search
   */
  (search) => {
    const LIST_ID_ITEM_CATEGORY = 'customrecord_ddc_item_category';
    const LIST_ID_DEPARTMENT = 'department';
    const LIST_ID_CLASS = 'classification';
    const LIST_ID_SEARCHES = 'savedsearch';
    const LIST_ID_TAX_SCHEDULE = 'taxschedule';
    const LIST_ID_ITEM_MEASURE = 'customlist_ddc_measure';
    const LIST_ID_COSTING_FORMULA = 'customrecord_ddc_costing_formula_list';
    const LIST_ID_LINKED_OT_SERVICE = 'item';
    const LIST_ID_LINKED_STOCK_ITEM = 'item';
    const LIST_ID_MARGIN_CATEGORY = 'customlist_ddc_margin_category';
    const LIST_ID_WORK_GROUP = 'customlist_ddc_work_centre_group_list';

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
        log.debug(
          {
            title: 'getValues:id',
            details: id
          }
        );

        log.debug(
          {
            title: 'getValues:options',
            details: options
          }
        );

        let count = 0;
        let values =
        {
          'tvpairs': [],
          'names': []
        };
        let filters = [];
        let _opts;

        if (util.isObject(options)) {
          // TODO: implement cloning of options and defaulting
          _opts = options;

          if (_opts['activeOnly'] === undefined) {
            _opts['activeOnly'] = true;
          }

          if (_opts['filters'] === undefined) {
            _opts['filters'] = [];
          }

          if (_opts['firstEntryBlank'] === undefined) {
            _opts['firstEntryBlank'] = false;
          }

          if (_opts['firstEntryNames'] === undefined) {
            _opts['firstEntryNames'] = [];
          }
        } else {
          _opts =
          {
            activeOnly: true,
            filters: [],
            firstEntryBlank: false,
            firstEntryNames: []
          };
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

        try {
          let srch =
            search.create(
              {
                type: id,
                filters: filters,
                columns:
                  [
                    // search.createColumn({ name: 'name' })
                    search.createColumn({ name: LIST_NAME_FIELDS[id] })
                  ]
              }
            );

          // srch.run()
          //   .each(
          //     function (result) {
          //       values['tvpairs'].push(
          //         {
          //           value: result.id,
          //           name: result.getValue({ name: 'name' })
          //         }
          //       );

          //       values['names'].push(result.getValue({ name: 'name' }));

          //       count++;

          //       return (count < 4000);
          //     }.bind(this)
          //   );

          let pagedData =
            srch.runPaged(
              {
                pageSize: 1000
              }
            );

          log.debug(
            {
              title: 'lists.getValues',
              details: 'Found ' + pagedData.count + ' list values'
            }
          );

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
                  values['tvpairs'].push(
                    {
                      value: result.id,
                      // name: result.getValue({ name: 'name' })
                      name: result.getValue({ name: LIST_NAME_FIELDS[id] })
                    }
                  );

                  // values['names'].push(result.getValue({ name: 'name' }));
                  values['names'].push(result.getValue({ name: LIST_NAME_FIELDS[id] }));
                }
              );
            }
          );
        } catch (e) {
          log.debug(
            {
              title: 'getValues:count',
              details: count
            }
          );

          values =
          {
            'tvpairs': [],
            'names': []
          };

          log.emergency(
            {
              title: 'getValues',
              details: e
            }
          );
        }

        log.debug(
          {
            title: 'getValues:values[' + id + ']',
            details: values
          }
        );

        // Re-order the entries if required r.e. firstEntryNames option

        if (_opts.firstEntryNames.length > 0) {
          let _values =
          {
            'tvpairs': [],
            'names': []
          };

          _opts.firstEntryNames.forEach(
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

        log.debug(
          {
            title: 'getValues:values[' + id + ']',
            details: values
          }
        );

        return values;
      }
    }

    return new ListsModule();
  }
);