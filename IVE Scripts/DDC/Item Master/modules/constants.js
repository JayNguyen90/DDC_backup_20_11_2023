/**
 * @NApiVersion 2.1
 */
define(
  [
    'N/error'
  ],

  (error) => {

    const SEARCHES = {

      DEFAULT_FIELDS_ITEMS: {

        ID: 'customsearch_ddc_itm_def_srv_item_fields'

      },

      DEFAULT_FIELDS_CRC_ITEMS: {

        ID: 'customsearch_ddc_itm_def_crc_item_fields'

      }

    };

    const RECORDS = {

      ITEM: {

        FIELDS: {

          CATEGORY: {

            ID: 'custitem_ddc_item_category'

          },

          CODE: {

            ID: 'itemid'

          }

        }

      },

      CAT_ITEM_FIELDS: {

        ID: 'customrecord_ive_itm_item_fields',

        FIELDS: {

          CATEGORY: 'custrecord_ive_itm_item_fields_category',
          SEARCH: 'custrecord_ive_itm_item_fields_search'

        }

      },

      CUSTOM: {

        CONFIG: {

          ID: 'customrecord_ddc_itm_config',

          FIELDS: {

            SEARCH_COL_REC_TYPES_MAP: {

              ID: 'custrecord_ddc_itm_config_srch_rcrd_map'
            }

          }

        },

        CUST_RATE_CARD: {

          // ID: 'customrecord_crc',
          ID: 'customrecord_customer_rate_card',

          FIELDS: {

            CUSTOMER: {

              ID: 'custrecord_crc_customer'

            },

            DOC_NO: {

              ID: 'custrecord_crc_doc_number'

            },

            MEMO: {

              ID: 'custrecord_crc_memo'

            }

          }

        },

        CUST_RATE_CARD_ITEM: {

          ID: 'customrecord_crc_items',

          FIELDS: {

            PARENT_CRC: {

              ID: 'custrecord_crc_parent'

            }

          }

        },

        BACKGRND_JOB: {

          ID: 'customrecord_ddc_itm_bkgrnd_job',

          FIELDS: {

            COMPLETE: {

              ID: 'custrecord_ddc_itm_bkgrnd_job_complete'

            },

            RESULTS: {

              ID: 'custrecord_ddc_itm_bkgrnd_job_results'

            }

          }
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
        FUNCTION: 'exportButtonOnClick'
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
 The result columns in the saved search will be used as the columns in the table shown below
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

        PARAMS: {

          RECORD_TYPE: {

            ID: 'custscript_ddc_itm_user_interface_rectyp'

          }

        }

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
      },

      DATA_HANDLER: {

        SCRIPT_ID: 'customscript_ddc_itm_data_handler',
        DEPLOY_ID: 'customdeploy_ddc_itm_data_handler',

        REQUEST_PARAMS: {

          DATA_TYPE: {

            ID: 'da'

          },

          LIST_TYPE: {

            ID: 'li'

          },

          CATEGORY: {

            ID: 'ca'

          },

          SEARCH: {

            ID: 'sr'

          },

          RATE_CARD: {

            ID: 'rc'

          },

          RECORD_ID: {

            ID: 'sc_recid'

          },

          RECORD_TYPE: {

            ID: 'sc_rectype',

          },

          CHANGES: {

            ID: 'sc_changes'

          },

          VERSION: {

            ID: 'vr'

          }

        }

      },

      CRC_CLONE: {

        SCRIPT_ID: 'customscript_ddc_itm_crc_clone',
        DEPLOY_ID: 'customdeploy_ddc_itm_crc_clone',

        PARAMS: {

          BACKGRND_JOB: {

            ID: 'custscript_ddc_itm_crc_clone_job'
          },

          SOURCE_CRC: {

            ID: 'custscript_ddc_itm_crc_clone_source'

          },

          DEST_CRC: {

            ID: 'custscript_ddc_itm_crc_clone_copy'

          }

        }

      }
    }

    const FILES = {
      USER_INTERFACE_HTML:
      {
        PATH_ID: '../web/html/ddc_itm_user_interface.ftl'
      },

      HANDS_ON_TABLE_JS:
      {
        PATH_ID: '../web/js/handsontable.full.min.js'
      },

      HANDS_ON_TABLE_CSS:
      {
        PATH_ID: '../web/css/handsontable.full.min.css'
      },

      /*FLOATING_SCOLLBARS_JS:
      {
        // PATH_ID: '/SuiteScripts/IVE Scripts/Item Master/ui/templates/js/jquery.floatingscroll.min.js'
        PATH_ID: '../web/js/jquery.floatingscroll.min.js'
      },

      FLOATING_SCOLLBARS_CSS:
      {
        // PATH_ID: '/SuiteScripts/IVE Scripts/Item Master/ui/templates/css/jquery.floatingscroll.css'
        PATH_ID: '../web/css/jquery.floatingscroll.css'
      }*/
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
        ITM_SERVER_ERROR: 'ITM_SERVER_ERROR',
        ITM_CLIENT_ERROR: 'ITM_CLIENT_ERROR'
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
              notifyOff: false
            }
          );
        },

      ITM_CLIENT_ERROR:
        // N.B. This does not work as an arrow function as arguments are not bound
        function () {
          return error.create(
            {
              name: 'ITM_CLIENT_ERROR',
              message: generateString('Unexpected client application error thrown - %0', arguments),
              notifyOff: false
            }
          );
        }
    };

    // class ConstantsModule {

    //   constructor() {
    //   }

    //   get FIELDS() {

    //     return FIELDS;

    //   }

    // }

    // let module = new ConstantsModule();

    // return module;

    const FORMS = {

      CUST_RATE_CARD: {

        TITLE: 'Item Master - Customer Rate Card',

        FIELDS: {

          // CUSTOMER: {

          //   ID: 'custpage_crc_customer',
          //   LABEL: 'Rate Card Customer',
          //   HELP: 'Select the customer whose rate card you wish to change'

          // },

          RATE_CARD: {

            ID: 'custpage_crc_rate_card',
            LABEL: 'Rate Card',
            HELP: 'Select the rate card for the customer whose rate card items you wish to change'

          },

          FIELDS_SEARCH: {

            ID: 'custpage_crc_fields_search',
            LABEL: 'Customer Rate Card Field Search',
            HELP:
              `Select the Customer Rate Card saved search used to retrieve the item information for customer<br/><br/>
            The result columns in the saved search will be used as the columns in the table shown below`

          },

          HOT_TABLE: {

            ID: 'custpage_crc_items_table',
            LABEL: 'CRC Items',

          }

        },

        BUTTONS: {

          LOAD: {

            ID: 'custpage_crc_load',
            // LABEL: 'Load CRC Items',
            LABEL: 'Load Items',
            HELP: 'Get the CRC Items for the customer',
            FUNCTION: 'loadCRCItemsButtonOnClick'

          },

          SAVE_CHANGES: {

            ID: 'custpage_crc_save_changes',
            // LABEL: 'Save CRC Item Changes',
            LABEL: 'Save Items',
            FUNCTION: 'saveCRCItemsChangesButtonOnClick'

          },

          EXPORT: {

            ID: 'custpage_crc_export',
            // LABEL: 'Export CRC Items',
            LABEL: 'Export Items',
            FUNCTION: 'exportCRCItemsButtonOnClick'

          },

          CLONE_RATE_CARD: {

            ID: 'custpage_crc_clone',
            LABEL: 'Clone Card & Items',
            FUNCTION: 'cloneCRCButtonOnClick'
          }

        }

      }

    };

    return {

      FORMS,
      FIELDS,
      RECORDS,
      SCRIPTS,
      SEARCHES,
      // MAPS,
      FILES,
      ERRORS

    };
  }
);