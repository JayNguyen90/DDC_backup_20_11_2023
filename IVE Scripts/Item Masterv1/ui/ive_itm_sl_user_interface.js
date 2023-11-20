/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(
  [
    'N/error',
    // 'N/https',
    'N/query',
    'N/runtime',
    'N/search',
    'N/ui/serverWidget',
    'N/url',
    './forms'
  ],

  /**
* @param {error} error
// * @param {https} https
* @param {query} query
* @param {runtime} runtime
* @param {search} search
* @param {dialog} dialog
* @param {message} message
* @param {serverWidget} serverWidget
* @param {url} url
* @param {FormsModule} forms
*/
  (
    error,
    // https,
    query,
    runtime,
    search,
    serverWidget,
    url,
    forms
  ) => {
    const SEARCH_ID_ITEM_SEARCH_SEARCH = 'customsearch_itm_item_saved_searches';
    const REQ_PARAM_ITEM_SEARCH = 'custpage_item_search';

    /**
     * Defines the Suitelet script trigger point.
     * @param {Object} scriptContext
     * @param {ServerRequest} scriptContext.request - Incoming request
     * @param {ServerResponse} scriptContext.response - Suitelet response
     * @since 2015.2
     */
    const onRequest = (scriptContext) => {
      // Get request parameter values

      /*let itemSearch = (scriptContext.request.parameters[REQ_PARAM_ITEM_SEARCH] || false);
      let form;
      let field;
      let itemSubList;

      if (scriptContext.request.method == https.Method.GET) {
        if (itemSearch === false) {
          form =
            serverWidget.createForm(
              {
                title: 'Item Master - Select Search and Operation'
              }
            );

          field =
            form.addField(
              {
                id: REQ_PARAM_ITEM_SEARCH,
                label: 'Item saved search',
                type: serverWidget.FieldType.SELECT
              }
            );

          field.helpText = 'Choose an Item saved search used to find the items';

          let srch =
            search.load(
              {
                type: search.Type.SAVED_SEARCH,
                id: SEARCH_ID_ITEM_SEARCH_SEARCH
              }
            );

          srch.run()
            .each(
              (result) => {
                field.addSelectOption(
                  {
                    value: result.getValue({ name: 'id' }),
                    text: result.getValue({ name: 'title' })
                  }
                );
              }
            );

          form.addButton(
            {
              id: 'custpage_view_items',
              label: 'View Items',
              functionName: 'viewItemsClick'
            }
          );
        }
        else {
          form =
            serverWidget.createForm(
              {
                title: 'Item Master - Edit Items'
              }
            );

          field =
            form.addButton(
              {
                id: 'custpage_new_search',
                label: 'return To Select Search',
                functionName: 'restart'
              }
            );

          let srch =
            search.load(
              {
                type: ''
              }
            );
          // field =
          //   form.addField(
          //     {
          //       id: 'custpage_table',
          //       label: '&nbsp;',
          //       type: serverWidget.FieldType.INLINEHTML
          //     }
          //   );

            // field.updateLayoutType(
            //   {
            //     layoutType: serverWidget.FieldLayoutType.OUTSIDEABOVE
            //   }
            // );

          // field.defaultValue =
          //   `
          //     <html>
          //       <body>
          //         <h1>This is the item table<h1>
          //       </body>
          //     </html>
          //   `;

          itemSubList =
            form.addSublist(
              {
                id: 'items_list',
                label: 'items',
                type: serverWidget.SublistType.INLINEEDITOR
              }
            );

            // itemSubList.addMarkAllButtons();

            // itemSubList.addField(
            //   {
            //     id: 'item_choose',
            //     label: 'Choose',
            //     type: serverWidget.FieldType.CHECKBOX
            //   }
            // );

          field =
            itemSubList.addField(
              {
                id: 'item_code',
                label: 'Item Code',
                type: serverWidget.FieldType.TEXT
              }
            );

          field.defaultValue = 'PW4125';

          field.updateDisplayType(
            {
              displayType: serverWidget.FieldDisplayType.READONLY
            }
          );

          scriptContext.response.writePage(
            {
              pageObject: form
            }
          );
        }

        if (form) {
          form.clientScriptModulePath = './ive_itm_cs_user_interface.js';

          scriptContext.response.writePage(
            {
              pageObject: form
            }
          );
        }
      }*/

      try {
        forms.createUIForm(
          scriptContext.request,
          scriptContext.response,
          './ive_itm_cs_user_interface.js'
        );
      } catch (e) {
        // TODO: script level error handling
        log.error(
          {
            title: 'Ops',
            details: e + ' ' + e.stack
          }
        );
      }
    }

    return { onRequest };
  }
);
