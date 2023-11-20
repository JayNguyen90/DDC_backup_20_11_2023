/**
 * @NApiVersion 2.1
 */
define(
  [
    'N/error'
  ],

  (error) => {
    const SEARCHES = {
      /** @deprecated */
      SERVICE_ITEMS_DEFAULT: 'customsearch_ive_itm_service_items'
    };

    const RECORDS = {
      ITEM: {
        FIELDS: {
          CATEGORY: 'custitem_ddc_item_category',
          CODE: 'itemid'
        }
      },

      CAT_ITEM_FIELDS: {
        ID: 'customrecord_ive_itm_item_fields',
        FIELDS: {
          CATEGORY: 'custrecord_ive_itm_item_fields_category',
          SEARCH: 'custrecord_ive_itm_item_fields_search'
        }
      }
    };

    const FIELDS = {
      /*AREA: {
        ID: 'custpage_ui_area',
        LABEL: 'Area',
        HELP: 'Select an area into which the items are grouped',
        VALUES: [
          {
            value: 1,
            name: 'Campaign Mgt'
          },
          {
            value: 2,
            name: 'Prof Services'
          },
          {
            value: 3,
            name: 'DP & Dig Sends'
          },
          {
            value: 4,
            name: 'SecurDocs'
          },
          {
            value: 5,
            name: 'Outbound Print'
          },
          {
            value: 6,
            name: 'Outbound HSCC'
          },
          {
            value: 7,
            name: 'Outbound Insert'
          },
          {
            value: 8,
            name: 'Outbound Manual'
          },
          {
            value: 9,
            name: 'Outbound Tip Glue'
          },
          {
            value: 10,
            name: 'Outbound Finishing'
          },
          {
            value: 11,
            name: 'Outbound Plastic'
          },
          {
            value: 12,
            name: 'Outbound OT'
          },
          {
            value: 13,
            name: 'Inbound'
          },
          {
            value: 14,
            name: 'Postage'
          },
          {
            value: 15,
            name: 'Logistics'
          },
          {
            value: 16,
            name: 'CPQ Paper'
          }
        ]
      },*/

      CATEGORY: {
        ID: 'custpage_ui_category',
        LABEL: 'Item Category',
        HELP:
          `Select the category of the items that you wish to manage.<br /><br />
<b>N.B.</b> The Load Items button will use the category to load just the items in that category, and the Export Items button will use the category in the name of the created CSV file`,
        VALUES: []
      },

      SUB_CATEGORY: {
        ID: 'custpage_ui_sub_category',
        LABEL: 'Sub Category',
        HELP: 'Select a sub-category within the category',
        VALUES: [
          {
            value: 1,
            name: 'Campaign Mgt'
          },
          {
            value: 2,
            name: 'Prof Services'
          },
          {
            value: 3,
            name: 'DP & Dig Sends'
          },
          {
            value: 4,
            name: 'SecurDocs'
          },
          {
            value: 5,
            name: 'Outbound Print'
          },
          {
            value: 6,
            name: 'Outbound HSCC'
          },
          {
            value: 7,
            name: 'Outbound Insert'
          },
          {
            value: 8,
            name: 'Outbound Manual'
          },
          {
            value: 9,
            name: 'Outbound Tip Glue'
          },
          {
            value: 10,
            name: 'Outbound Finishing'
          },
          {
            value: 11,
            name: 'Outbound Plastic'
          },
          {
            value: 12,
            name: 'Outbound OT'
          },
          {
            value: 13,
            name: 'Inbound'
          },
          {
            value: 14,
            name: 'Postage'
          },
          {
            value: 15,
            name: 'Logistics'
          },
          {
            value: 16,
            name: 'CPQ Paper'
          }
        ]
      },

      LOAD_ITEMS: {
        ID: 'custpage_load_items',
        LABEL: 'Load Items',
        HELP: 'Get information about all the items in the selected category',
        VALUES: [],
        FUNCTION: 'viewItemsClick'
      },

      EXPORT: {
        ID: 'custpage_ui_export',
        LABEL: 'Export Items',
        HELP: 'Export the information about the displayed items',
        VALUES: [],
        FUNCTION: 'exportItemsClick'
      },

      CONFIG: {
        ID: 'custpage_ui_config',
        LABEL: 'Configure Fields',
        HELP: '',
        VALUES: [],
        FUNCTION: 'configureFieldsClick'
      },

      ITEM_FIELDS_SEARCH: {
        ID: 'custpage_ui_field_search',
        LABEL: 'Item Field Search',
        HELP:
          `Select the item saved search used to retrieve the item information<br/><br/>
 The result columns in the saved search will be used as the columns in the table shown
 `,
        VALUES: [],
        // FUNCTION: 'configureClick'
      }
    };

    const SCRIPTS = {
      USER_INTERFACE: {
        SCRIPT_ID: 'customscript_ive_itm_user_interface',
        DEPLOY_ID: 'customdeploy_ive_itm_user_interface',
        // PARAM_AREA: FIELDS.AREA.ID,
        PARAM_CATEGORY: FIELDS.CATEGORY.ID,
        PARAM_SUB_CATEGORY: FIELDS.SUB_CATEGORY.ID,
      },
      GET_ITEMS: {
        SCRIPT_ID: 'customscript_ive_itm_get_items',
        DEPLOY_ID: 'customdeploy_ive_itm_get_items',
        // PARAM_AREA: FIELDS.AREA.ID,
        PARAM_CATEGORY: FIELDS.CATEGORY.ID,
        PARAM_SUB_CATEGORY: FIELDS.SUB_CATEGORY.ID,
        PARAM_ITEM_SEARCH: FIELDS.ITEM_FIELDS_SEARCH
      },
      SAVE_CHANGES: {
        SCRIPT_ID: 'customscript_ive_itm_save_changes',
        DEPLOY_ID: 'customdeploy_ive_itm_save_changes',
        PARAMS: {
          RECORD_ID: 'sc_recid',
          RECORD_TYPE: 'sc_rectype',
          CHANGES: 'sc_changes'
          }
      }
    }

    const MAPS = {
      SEARCH_COL_SOURCE_LIST_ID: {
        'department': 'department',
        'class': 'classification',
        'taxschedule': 'taxschedule',
        'custitem_ddc_item_category': 'customrecord_ddc_item_category',
        'custitem_ddc_item_measure': 'customlist_ddc_measure',
        'custitem_ddc_work_centre_group': 'customlist_ddc_work_centre_group_list',
        'custitem_ddc_costing_formula': 'customrecord_ddc_costing_formula_list',
        'custitem_ddc_linked_ot_service': 'item',
        'custitem_ddc_linked_stock_item': 'item',
        'custitem_ddc_margin_category': 'customlist_ddc_margin_category',
      }
    }

    const FILES = {
      USER_INTERFACE_HTML:
      {
        PATH_ID: '/SuiteScripts/IVE Scripts/Item Master/ui/templates/user_interface.ftl'
      },

      HANDS_ON_TABLE_JS:
      {
        PATH_ID: '/SuiteScripts/IVE Scripts/Item Master/ui/templates/js/handsontable.full.min.js'
      },

      HANDS_ON_TABLE_CSS:
      {
        PATH_ID: '/SuiteScripts/IVE Scripts/Item Master/ui/templates/css/handsontable.full.min.css'
      },

      FLOATING_SCOLLBARS_JS:
      {
        PATH_ID: '/SuiteScripts/IVE Scripts/Item Master/ui/templates/js/jquery.floatingscroll.min.js'
      },

      FLOATING_SCOLLBARS_CSS:
      {
        PATH_ID: '/SuiteScripts/IVE Scripts/Item Master/ui/templates/css/jquery.floatingscroll.css'
      }
    }

    function generateString(template, values) {
      let str = template;

      if (values) {
        // Array.from(values).forEach(
        //   (value, index) => {
        //     let re = new RegExp('/%' + index.toString() + '/g');

        //     str = str.replace(re, value);
        //   }
        // );
        let index;

        for (index = 0; index < values.length; index++) {
          let re = new RegExp('%' + index.toString(), 'g');
          str = str.replace(re, values[index]);
        }
      }
      return str;
    }

    const ERRORS = {
      CODES: {
        ITM_TEST_ERROR: 'ITM_TEST_ERROR',
        ITM_SERVER_ERROR: 'ITM_SERVER_ERROR'
      },

      ITM_TEST_ERROR:
        // N.B. This does not work as an arrow function as arguments are not bound
        function () {
          return error.create(
            {
              // TODO: Set name from CODES

              name: 'ITM_TEST_ERROR',
              message: generateString('Error thrown while testing %0', arguments),
              notifyOff: true
            }
          );
        },

        ITM_SERVER_ERROR:
        // N.B. This does not work as an arrow function as arguments are not bound
        function () {
          return error.create(
            {
              // TODO: Set name from CODES

              name: 'ITM_SERVER_ERROR',
              message: generateString('Unexpected application error thrown - %0', arguments),
              notifyOff: true
            }
          );
        }
    }

    /*class ConstantsModule {
      constructor() {
      }

      get FIELDS() {
        // return {
        //   CATEGORY: {
        //     ID: 'custpage_ui_category',
        //     LABEL: 'Category',
        //     HELP: 'Select a category',
        //     VALUES: []
        //   }
        // };
        return 'cat';
      }
    }*/

    // let module = new ConstantsModule();

    // log.debug(
    //   {
    //     title: 'constants',
    //     details: JSON.stringify(module.FIELDS)
    //   }
    // );

    return {
      FIELDS,
      RECORDS,
      SCRIPTS,
      SEARCHES,
      MAPS,
      FILES,
      ERRORS
    };
  }
);