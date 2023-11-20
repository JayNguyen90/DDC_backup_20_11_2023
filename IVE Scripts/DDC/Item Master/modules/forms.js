/**
 * @NApiVersion 2.1
 * @NAmdConfig /SuiteScripts/IVE Scripts/Modules/amdconfig.json
 */
define(
  [
    'N/file',
    'N/https',
    'N/record',
    'N/render',
    'N/search',
    'common',
    'N/ui/serverWidget',
    './lists',
    './constants'
  ],

  /**
   * @param {file} file
   * @param {https} https
   * @param {record} record
   * @param {render} render
   * @param {search} search
   * @param {CommonModule} common
   * @param{serverWidget} serverWidget
   * @param{object} constants
   */
  (
    file,
    https,
    record,
    render,
    search,
    common,
    serverWidget,
    lists,
    constants
  ) => {

    class FormsModule {

      constructor() {
      }

      /**
         * @param {ServerRequest} request - Incoming request
         * @param {ServerResponse} response - Suitelet response
         */
      // createUIForm(request, response, clientScriptModulePath) {
      createUIForm(request, response, options) {

        try {

          // let clientScriptModulePath = options.clientmodule;
          let clientScriptModulePath;
          let form;

          if (request.method == https.Method.GET) {

            switch (options.recordtype) {

              case record.Type.SERVICE_ITEM:

                // form = this.createGETItemForm(request, clientScriptModulePath);
                form = this.createGETItemForm(request);
                break;

              case 'customrecord_customer_rate_card':

                form = this.createGETCRCForm(request);
                break;

              default:

                throw new Error('Unknown record type: ' + options.recordtype);

            }

          }
          else {

            form = this.createPOSTForm(request);

          }

          response.writePage(
            {
              pageObject: form
            }
          );

        } catch (e) {

          common.logErr('error', e);

        }

      }

      createGETItemForm(request) {

        let form;
        let field;
        let category;
        let values;

        form =
          serverWidget.createForm(
            {
              title: 'Item Master - Service Items'
            }
          );

        form.addButton(
          {
            id: constants.FIELDS.LOAD_ITEMS.ID,
            label: constants.FIELDS.LOAD_ITEMS.LABEL,
            functionName: constants.FIELDS.LOAD_ITEMS.FUNCTION
          }
        );

        form.addButton(
          {
            id: 'custpage_save_changes',
            label: 'Save Changes',
            functionName: 'saveChangesClick'
          }
        );

        form.addButton(
          {
            id: constants.FIELDS.EXPORT.ID,
            label: constants.FIELDS.EXPORT.LABEL,
            functionName: constants.FIELDS.EXPORT.FUNCTION
          }
        );

        form.clientScriptModulePath = '../scripts/client/ddc_itm_cs_user_interface_items.js';

        field =
          form.addField(
            {
              id: constants.FIELDS.ITEM_FIELDS_SEARCH.ID,
              label: constants.FIELDS.ITEM_FIELDS_SEARCH.LABEL,
              type: serverWidget.FieldType.SELECT
            }
          );

        values =
          [].concat(
            lists.getValues(
              lists.IDS.SEARCHES,
              {
                filters:
                  [
                    search.createFilter(
                      {
                        name: 'recordtype',
                        operator: search.Operator.ANYOF,
                        values: ['Item']
                      }
                    )
                  ],

                // Default Item Master Fields

                firstEntryFilters:
                  [
                    search.createFilter(
                      {
                        name: 'id',
                        operator: search.Operator.IS,
                        values: [constants.SEARCHES.DEFAULT_FIELDS_ITEMS.ID]
                      }
                    )
                  ]
              }
            ).tvpairs);
        this.addSelectValues(
          field,
          values
        );

        field.helpText = constants.FIELDS.ITEM_FIELDS_SEARCH.HELP;

        field.updateLayoutType(
          {
            layoutType: serverWidget.FieldLayoutType.OUTSIDEABOVE
          }
        );

        field =
          form.addField(
            {
              id: constants.FIELDS.CATEGORY.ID,
              label: constants.FIELDS.CATEGORY.LABEL,
              type: serverWidget.FieldType.SELECT
            }
          );

        values =
          [
            {
              name: '',
              value: 0
            }
          ].concat(lists.getValues(lists.IDS.ITEM_CATEGORY).tvpairs);
        this.addSelectValues(
          field,
          values
        );

        if (category) {
          field.defaultValue = category;
        }

        field.helpText = constants.FIELDS.CATEGORY.HELP;

        field.updateLayoutType(
          {
            layoutType: serverWidget.FieldLayoutType.OUTSIDEABOVE
          }
        );

        field =
          form.addField(
            {
              id: 'custpage_items_table',
              label: 'Items',
              type: serverWidget.FieldType.INLINEHTML
            }
          );

        let renderer = render.create();
        let htmlFile = file.load({ id: constants.FILES.USER_INTERFACE_HTML.PATH_ID });
        let handsontableJsFile = file.load({ id: constants.FILES.HANDS_ON_TABLE_JS.PATH_ID });
        let handsontableCssFile = file.load({ id: constants.FILES.HANDS_ON_TABLE_CSS.PATH_ID });
        // let floatingScrollBarJsFile = file.load({ id: constants.FILES.FLOATING_SCOLLBARS_JS.PATH_ID });
        // let floatingScrollBarCssFile = file.load({ id: constants.FILES.FLOATING_SCOLLBARS_CSS.PATH_ID });

        renderer.templateContent = htmlFile.getContents();
        renderer.addCustomDataSource(
          {
            alias: 'config',
            format: render.DataSource.OBJECT,
            data:
            {
              stylesheetUrls:
                [
                  handsontableCssFile.url//,
                  // floatingScrollBarCssFile.url
                ],
              scriptUrls:
                [
                  handsontableJsFile.url//,
                  // floatingScrollBarJsFile.url
                ]//,
              // hidden: ['.uir-outside-fields-table td:nth-child(2)']
            }
          }
        );

        field.defaultValue = renderer.renderAsString();

        return form;
      }

      createGETCRCForm(request, clientScriptModulePath) {

        let form;
        let field;
        let values;

        form =
          serverWidget.createForm(
            {
              title: constants.FORMS.CUST_RATE_CARD.TITLE
            }
          );

        form.addButton(
          {
            id: constants.FORMS.CUST_RATE_CARD.BUTTONS.LOAD.ID,
            label: constants.FORMS.CUST_RATE_CARD.BUTTONS.LOAD.LABEL,
            functionName: constants.FORMS.CUST_RATE_CARD.BUTTONS.LOAD.FUNCTION
          }
        );

        form.addButton(
          {
            id: constants.FORMS.CUST_RATE_CARD.BUTTONS.SAVE_CHANGES.ID,
            label: constants.FORMS.CUST_RATE_CARD.BUTTONS.SAVE_CHANGES.LABEL,
            functionName: constants.FORMS.CUST_RATE_CARD.BUTTONS.SAVE_CHANGES.FUNCTION
          }
        );

        form.addButton(
          {
            id: constants.FORMS.CUST_RATE_CARD.BUTTONS.EXPORT.ID,
            label: constants.FORMS.CUST_RATE_CARD.BUTTONS.EXPORT.LABEL,
            functionName: constants.FORMS.CUST_RATE_CARD.BUTTONS.EXPORT.FUNCTION
          }
        );

        form.addButton(
          {
            id: constants.FORMS.CUST_RATE_CARD.BUTTONS.CLONE_RATE_CARD.ID,
            label: constants.FORMS.CUST_RATE_CARD.BUTTONS.CLONE_RATE_CARD.LABEL,
            functionName: constants.FORMS.CUST_RATE_CARD.BUTTONS.CLONE_RATE_CARD.FUNCTION
          }
        );

        // if (clientScriptModulePath) {

        form.clientScriptModulePath = '../scripts/client/ddc_itm_cs_user_interface_crc_items.js';

        // }

        field =
          form.addField(
            {
              id: constants.FORMS.CUST_RATE_CARD.FIELDS.FIELDS_SEARCH.ID,
              label: constants.FORMS.CUST_RATE_CARD.FIELDS.FIELDS_SEARCH.LABEL,
              type: serverWidget.FieldType.SELECT
            }
          );

        values = [
        ].concat(
          lists.getValues(
            lists.IDS.SEARCHES,
            {
              filters:
                [
                  search.createFilter(
                    {
                      name: 'recordtype',
                      operator: search.Operator.ANYOF,
                      values: ['CUSTOMRECORD_CRC_ITEMS']
                    }
                  )
                ],
              // firstEntryNames: ['Default Customer Rate Card Item Fields']
              firstEntryFilters:
                [
                  search.createFilter(
                    {
                      name: 'id',
                      operator: search.Operator.IS,
                      values: [constants.SEARCHES.DEFAULT_FIELDS_CRC_ITEMS.ID]
                    }
                  )
                ]
            }
          ).tvpairs);
        this.addSelectValues(
          field,
          values
        );

        field.helpText = constants.FORMS.CUST_RATE_CARD.FIELDS.FIELDS_SEARCH.HELP;

        field.updateLayoutType(
          {
            layoutType: serverWidget.FieldLayoutType.OUTSIDEABOVE
          }
        );

        field =
          form.addField(
            {
              id: constants.FORMS.CUST_RATE_CARD.FIELDS.RATE_CARD.ID,
              label: constants.FORMS.CUST_RATE_CARD.FIELDS.RATE_CARD.LABEL,
              type: serverWidget.FieldType.SELECT
            }
          );

        values = [
        ].concat(
          lists.getValues(
            constants.RECORDS.CUSTOM.CUST_RATE_CARD.ID,
            {
              // filters:
              //   [
              //     search.createFilter(
              //       {
              //         name: 'recordtype',
              //         operator: search.Operator.ANYOF,
              //         values: ['Customer']
              //       }
              //     )
              //   ],
              // firstEntryNames: ['G-IVE - Generic DDC Customer']
              // firstEntryNames: ['G-IVE - Generic DDC Customer [ CR210 ] Item Master v16.1'],
              firstEntryFilters:
                [
                  // TODO: Restore the value to G-IVE before go live
                  search.createFilter(
                    {
                      name: 'custentity_entity_code',
                      join: constants.RECORDS.CUSTOM.CUST_RATE_CARD.FIELDS.CUSTOMER.ID,
                      operator: search.Operator.IS,
                      values: ['PEG-IVE']
                    }
                  )
                ],
              nameColumn: search.createColumn(
                {
                  name: 'formulatext',
                  formula:
                    "{" +
                    constants.RECORDS.CUSTOM.CUST_RATE_CARD.FIELDS.CUSTOMER.ID + "}||" +
                    "' [ '||{" +
                    constants.RECORDS.CUSTOM.CUST_RATE_CARD.FIELDS.DOC_NO.ID +
                    "}||' ] '||{" +
                    constants.RECORDS.CUSTOM.CUST_RATE_CARD.FIELDS.MEMO.ID +
                    "}",
                  sort: search.Sort.ASC
                }
              )
            }
          ).tvpairs);
        this.addSelectValues(
          field,
          values
        );

        field.helpText = constants.FORMS.CUST_RATE_CARD.FIELDS.RATE_CARD.HELP;

        field.updateLayoutType(
          {
            layoutType: serverWidget.FieldLayoutType.OUTSIDEABOVE
          }
        );

        field =
          form.addField(
            {
              id: constants.FORMS.CUST_RATE_CARD.FIELDS.HOT_TABLE.ID,
              label: constants.FORMS.CUST_RATE_CARD.FIELDS.HOT_TABLE.LABEL,
              type: serverWidget.FieldType.INLINEHTML
            }
          );

        let renderer = render.create();
        let htmlFile = file.load({ id: constants.FILES.USER_INTERFACE_HTML.PATH_ID });
        let handsontableJsFile = file.load({ id: constants.FILES.HANDS_ON_TABLE_JS.PATH_ID });
        let handsontableCssFile = file.load({ id: constants.FILES.HANDS_ON_TABLE_CSS.PATH_ID });

        renderer.templateContent = htmlFile.getContents();
        renderer.addCustomDataSource(
          {
            alias: 'config',
            format: render.DataSource.OBJECT,
            data:
            {
              stylesheetUrls:
                [
                  handsontableCssFile.url
                ],
              scriptUrls:
                [
                  handsontableJsFile.url
                ]
            }
          }
        );

        field.defaultValue = renderer.renderAsString();

        return form;
      }

      createPOSTForm(request) {
        let form =
          serverWidget.createForm(
            {
              title: 'Item Master - Select Search and Operation'
            }
          );

        return form;
      }

      addSelectValues(selectField, nameValuePairs) {
        nameValuePairs.forEach(
          (pair) => {
            // if (util.isFunction(pair.getValue)) {
            // }
            selectField.addSelectOption(
              {
                value: pair.value,
                text: pair.name
              }
            )
          }
        );
      }

    }

    return new FormsModule();

  }
);