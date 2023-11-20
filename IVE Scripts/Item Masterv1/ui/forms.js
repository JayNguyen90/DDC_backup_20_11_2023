/**
 * @NApiVersion 2.1
 */
define(
  [
    'N/file',
    'N/https',
    'N/render',
    'N/search',
    'N/ui/serverWidget',
    './lists',
    './constants'
  ],

  /**
   * @param {file} file
   * @param {https} https
   * @param {render} render
   * @param {search} search
   * @param{serverWidget} serverWidget
   * @param{object} constants
   */
  (
    file,
    https,
    render,
    search,
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
      createUIForm(request, response, clientScriptModulePath) {
        let form;

        if (request.method == https.Method.GET) {
          form = this.createGETForm(request, clientScriptModulePath);
        }
        else {
          form = this.createPOSTForm(request);
        }

        response.writePage(
          {
            pageObject: form
          }
        );
      }

      createGETForm(request, clientScriptModulePath) {
        let form;
        let field;
        let area;
        let category;
        let subCategory;

        /*area = (request.parameters[constants.FIELDS.AREA.ID ] || false);*/
        // category = (request.parameters[constants.FIELDS.CATEGORY.ID] || false);
        // subCategory = (request.parameters[constants.FIELDS.SUB_CATEGORY.ID] || false);

        form =
          serverWidget.createForm(
            {
              title: 'Item Master'
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

        // form.addButton(
        //   {
        //     id: constants.FIELDS.CONFIG.ID,
        //     label: constants.FIELDS.CONFIG.LABEL,
        //     functionName: constants.FIELDS.CONFIG.FUNCTION
        //   }
        // );

        if (clientScriptModulePath) {
          form.clientScriptModulePath = clientScriptModulePath;
        }

        /*field =
          form.addField(
            {
              id: constants.FIELDS.AREA.ID,
              label: constants.FIELDS.AREA.LABEL,
              type: serverWidget.FieldType.SELECT
            }
          );

        this.addSelectValues(field, constants.FIELDS.AREA.VALUES);

        if (area)
        {
          field.defaultValue = area;
        }

        field.helpText = constants.FIELDS.AREA.HELP;

        field.updateLayoutType(
          {
            layoutType: serverWidget.FieldLayoutType.OUTSIDEABOVE
          }
        );*/

        // log.debug(
        //   {
        //     title: 'constants.FIELDS',
        //     details: JSON.stringify(constants.FIELDS)
        //   }
        // );

        field =
          form.addField(
            {
              id: constants.FIELDS.CATEGORY.ID,
              label: constants.FIELDS.CATEGORY.LABEL,
              type: serverWidget.FieldType.SELECT
            }
          );

        let values = [
          {
            // name: 'No Item Category',
            // name: 'Select Item Category',
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
              id: constants.FIELDS.ITEM_FIELDS_SEARCH.ID,
              label: constants.FIELDS.ITEM_FIELDS_SEARCH.LABEL,
              type: serverWidget.FieldType.SELECT
            }
          );

        values = [
          // {
          //   name: 'ITM Default Service Item Columns',
          //   value: 2277
          // }
        ].concat(
          lists.getValues(
            lists.IDS.SEARCHES,
            {
              filters:
                [
                  // search.createFilter(
                  //   {
                  //     name: 'internalid',
                  //     operator: search.Operator.NONEOF,
                  //     values: [ 2277 ]
                  //   }
                  // )
                  search.createFilter(
                    {
                      name: 'recordtype',
                      operator: search.Operator.ANYOF,
                      values: ['Item']
                    }
                  )
                ],
              firstEntryNames: ['Default Item Master Fields']
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

        // field.updateDisplayType(
        //   {
        //     displayType: serverWidget.FieldDisplayType.HIDDEN
        //   }
        // );

        /*field =
          form.addField(
            {
              id: constants.FIELDS.SUB_CATEGORY.ID,
              label: constants.FIELDS.SUB_CATEGORY.LABEL,
              type: serverWidget.FieldType.SELECT
            }
          );

        this.addSelectValues(field, constants.FIELDS.SUB_CATEGORY.VALUES);

        if (subCategory) {
          field.defaultValue = subCategory;
        }

        field.helpText = constants.FIELDS.SUB_CATEGORY.HELP;

        field.updateLayoutType(
          {
            layoutType: serverWidget.FieldLayoutType.OUTSIDEABOVE
          }
        );*/

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