/**
* @NApiVersion 2.1
* @NScriptType Suitelet
*/
/*
 * @name:                                       IR_Custom_Labels_Print_popup_SL.js
 * @author:                                     Kamlesh Patel
 * @summary:                                    Script Description
 * @copyright:                                  © Copyright by Jcurve Solutions
 * Date Created:                                Thu June 01 2023 09:21:37
 * Change Logs:
 * Date                          Author               Description
 * Thu June 01 2023 09:21:37 -- Kamlesh Patel -- Initial Creation
 */

define(['N/file', 'N/log', 'N/record', 'N/search', 'N/ui/serverWidget', 'N/runtime'],
/**
* @param{file} file
* @param{log} log
* @param{record} record
* @param{search} search
*/
(file, log, record, search, serverWidget, runtime) => {
    /**
    * Defines the Suitelet script trigger point.
    * @param {Object} scriptContext
    * @param {ServerRequest} scriptContext.request - Incoming request
    * @param {ServerResponse} scriptContext.response - Suitelet response
    * @since 2015.2
    */
    const onRequest = (scriptContext) => {
        var loggedUser = runtime.getCurrentUser();
        var request = scriptContext.request;
        var method = scriptContext.method;
        var recId = request.parameters.recId || '';
        log.debug('method', method);
        log.debug('recId', recId);
        if (/*method == 'GET'*/true) {
            var formObj = serverWidget.createForm({
                title : 'Print Custom Labels',
                hideNavBar : true
            });
            //sublist
            var resultlist = formObj.addSublist({
                id : 'resultlist',
                type : serverWidget.SublistType.LIST,
                label : 'Items List'
            });
            
            resultlist.addField({
                id : 'sblfld_lineid',
                type : serverWidget.FieldType.TEXT,
                label : 'Line ID'
            }).updateDisplayType({
                displayType : serverWidget.FieldDisplayType.INLINE
            });

            resultlist.addField({
                id : 'sblfld_itemid',
                type : serverWidget.FieldType.TEXT,
                label : 'Item ID'
            }).updateDisplayType({
                displayType : serverWidget.FieldDisplayType.INLINE
            });
            
            resultlist.addField({
                id : 'sblfld_itemdescription',
                type : serverWidget.FieldType.TEXT,
                label : 'Item Description'
            }).updateDisplayType({
                displayType : serverWidget.FieldDisplayType.INLINE
            });

            resultlist.addField({
                id : 'sblfld_memomain',
                type : serverWidget.FieldType.TEXT,
                label : 'Memo'
            }).updateDisplayType({
                displayType : serverWidget.FieldDisplayType.HIDDEN
            });

            resultlist.addField({
                id : 'sblfld_formarstockcode',
                type : serverWidget.FieldType.TEXT,
                label : 'Former Stock Code'
            }).updateDisplayType({
                displayType : serverWidget.FieldDisplayType.HIDDEN
            });

            resultlist.addField({
                id : 'sblfld_custstockcode',
                type : serverWidget.FieldType.TEXT,
                label : 'Customer Stock Code'
            }).updateDisplayType({
                displayType : serverWidget.FieldDisplayType.HIDDEN
            });

            resultlist.addField({
                id : 'sblfld_ownbycustomer',
                type : serverWidget.FieldType.TEXT,
                label : 'Own By Customer'
            }).updateDisplayType({
                displayType : serverWidget.FieldDisplayType.HIDDEN
            });

            resultlist.addField({
                id : 'sblfld_uom',
                type : serverWidget.FieldType.TEXT,
                label : 'UOM'
            }).updateDisplayType({
                displayType : serverWidget.FieldDisplayType.HIDDEN
            });
            
            resultlist.addField({
                id : 'sblfld_srnumber',
                type : serverWidget.FieldType.TEXT,
                label : 'Serial Lot Numbers'
            }).updateDisplayType({
                displayType : serverWidget.FieldDisplayType.INLINE
            });
            
            resultlist.addField({
                id : 'sblfld_binnumbers',
                type : serverWidget.FieldType.TEXT,
                label : 'Bin Number'
            }).updateDisplayType({
                displayType : serverWidget.FieldDisplayType.INLINE
            });
            
            resultlist.addField({
                id : 'sblfld_quantity',
                type : serverWidget.FieldType.TEXT,
                label : 'Quantity'
            }).updateDisplayType({
                displayType : serverWidget.FieldDisplayType.INLINE
            });
            
            resultlist.addField({
                id : 'sblfld_print_label_qty',
                type : serverWidget.FieldType.TEXT,
                label : 'Print Label Quantity'
            }).updateDisplayType({
                displayType : serverWidget.FieldDisplayType.ENTRY
            });
            
            var itemreceiptSearchObj = search.create({
                type: "itemreceipt",
                filters:
                [
                    ["type","anyof","ItemRcpt"], 
                    "AND", 
                    ["internalid","anyof",recId], 
                    "AND", 
                    ["mainline","is","F"]
                ],
                columns:
                [
                    search.createColumn({name: "transactionnumber", label: "Transaction Number"}),
                    search.createColumn({name: "line", label: "Line ID"}),
                    search.createColumn({
                        name: "itemid",
                        join: "item",
                        label: "Name"
                    }),
                    search.createColumn({name: "custcol_ddc_po_itemid", label: "Item ID"}),
                    search.createColumn({name: "quantity", label: "Quantity"}),
                    search.createColumn({
                        name: "inventorynumber",
                        join: "inventoryDetail",
                        label: " Number"
                    }),
                    search.createColumn({
                        name: "binnumber",
                        join: "inventoryDetail",
                        label: "Bin Number"
                    }),
                    search.createColumn({
                        name: "quantity",
                        join: "inventoryDetail",
                        label: "Quantity"
                    }),
                    search.createColumn({
                        name: "custitem_ddc_oldstockitemcodeaxapta",
                        join: "item",
                        label: "Old Stock Item Code - Axapta"
                    }),
                    search.createColumn({
                        name: "custitem_ddc_oldstockitemcodepnsw",
                        join: "item",
                        label: "Old Stock Item Code - PNSW"
                    }),
                    search.createColumn({
                        name: "custitem_ddc_oldstockitemcodepvic",
                        join: "item",
                        label: "Old Stock Item Code - PVIC"
                    }),
                    search.createColumn({
                        name: "displayname",
                        join: "item",
                        label: "Display Name"
                    }),
                    search.createColumn({
                        name: "custitem_ive_item_cust_stockcode",
                        join: "item",
                        label: "Customer Stock Code"
                    }),
                    search.createColumn({
                        name: "custitem_ddc_owned_by_cust",
                        join: "item",
                        label: "Owned by Customer"
                    }),
                    search.createColumn({name: "custcol_ddc_unit_sale", label: "Unit"}),
                    search.createColumn({name: "custcol_ddc_label_memo", label: "Memo Line"})
                ]
            });
            var searchResultCount = itemreceiptSearchObj.runPaged().count;
            log.debug("itemreceiptSearchObj result count",searchResultCount);
            var lineid = 0;
            itemreceiptSearchObj.run().each(function(result){
                resultlist.setSublistValue({
                    id : 'sblfld_lineid',
                    line : lineid,
                    value : result.getValue({name: "line", label: "Line ID"}) || ''
                });
                
                resultlist.setSublistValue({
                    id : 'sblfld_itemid',
                    line : lineid,
                    value : result.getValue({
                        name: "itemid",
                        join: "item",
                        label: "Name"
                    }) || ''
                });
                
                resultlist.setSublistValue({
                    id : 'sblfld_itemdescription',
                    line : lineid,
                    value : (result.getValue({ 
                        name: "displayname",
                        join: "item",
                        label: "Display Name"
                    }) || ' ')
                });
                
                var PNSW = result.getValue({ 
                    name: "custitem_ddc_oldstockitemcodepnsw",
                    join: "item",
                    label: "Old Stock Item Code - PNSW"
                }) || '';
                var PVIC = result.getValue({ 
                    name: "custitem_ddc_oldstockitemcodepvic",
                    join: "item",
                    label: "Old Stock Item Code - PVIC"
                }) || ''
                var AXAPTA = result.getValue({ 
                    name: "custitem_ddc_oldstockitemcodeaxapta",
                    join: "item",
                    label: "Old Stock Item Code - Axapta"
                }) || ''
                if(PNSW != '' || PVIC != '' || AXAPTA != ''){
                    resultlist.setSublistValue({
                        id : 'sblfld_formarstockcode',
                        line : lineid,
                        value : (PNSW?PNSW+', ':'') + (PVIC?PVIC+', ':'') + (AXAPTA?AXAPTA+', ':'')
                    });
                }
                
                resultlist.setSublistValue({
                    id : 'sblfld_custstockcode',
                    line : lineid,
                    value : result.getValue({
                        name: "custitem_ive_item_cust_stockcode",
                        join: "item",
                        label: "Customer Stock Code"
                    }) || ' '
                });
                
                resultlist.setSublistValue({
                    id : 'sblfld_ownbycustomer',
                    line : lineid,
                    value : result.getText({
                        name: "custitem_ddc_owned_by_cust",
                        join: "item",
                        label: "Owned by Customer"
                    }) || ' '
                });
                
                resultlist.setSublistValue({
                    id : 'sblfld_srnumber',
                    line : lineid,
                    value : result.getValue({
                        name: "inventorynumber",
                        join: "inventoryDetail",
                        label: " Number"
                    }) || ' '
                });
                
                resultlist.setSublistValue({
                    id : 'sblfld_binnumbers',
                    line : lineid,
                    value : result.getText({
                        name: "binnumber",
                        join: "inventoryDetail",
                        label: "Bin Number"
                    }) || ' '
                });
                
                resultlist.setSublistValue({
                    id : 'sblfld_quantity',
                    line : lineid,
                    value : result.getValue({
                        name: "quantity",
                        join: "inventoryDetail",
                        label: "Quantity"
                    }) || ' '
                });
                
                resultlist.setSublistValue({
                    id : 'sblfld_uom',
                    line : lineid,
                    value : result.getText({
                        name: "custcol_ddc_unit_sale", label: "Unit"
                    }) || ' '
                });
                
                resultlist.setSublistValue({
                    id : 'sblfld_memomain',
                    line : lineid,
                    value : result.getValue({
                        name: "custcol_ddc_label_memo", label: "Memo Line"
                    }) || ' '
                });
                
                resultlist.setSublistValue({
                    id : 'sblfld_print_label_qty',
                    line : lineid,
                    value : 1
                });
                
                lineid++;
                return true;
            });
            
            formObj.clientScriptModulePath = 'SuiteScripts/CustomLabelPrint/HandlePrintButton_CS.js';
            
            formObj.addButton({
                id : 'btn_printlabels',
                label : 'Print Labels',
                functionName : 'IR_POPUP_PrintButton_Click()'
            });
          // Customer doesn't need this button - commenting it out for now
          /*          
            formObj.addButton({
                id : 'btn_printlabels',
                label : 'Download Labels',
                functionName : 'IR_POPUP_DownloadButton_Click()'
            });
          */            
            //response back to client with form
            scriptContext.response.writePage({
                pageObject : formObj
            });
            
        }
    }
    
    return {onRequest}
    
});
