/**
 * @name:                                       manual_qty_cs.js
 * @author:                                     Patrick Lising
 * @summary:                                    Script Description
 * @copyright:                                  © Copyright by Jcurve Solutions
 * Date Created:                                Fri Jan 06 2023 7:55:02 AM
 * Change Logs:
 * Date                          Author               Description
 * Fri Jan 06 2023 7:55:02 AM -- Patrick Lising -- Initial Creation
 
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */

define(['N/runtime'], function (runtime) {

    function manualqty_lineInit(context) {

        var currentUser = runtime.getCurrentUser();
        var subsidiary = currentUser.subsidiary
        if (subsidiary == '2') {

            var currentRecord = context.currentRecord;

            // var itemCount = currentRecord.getLineCount('item');

            // log.debug(‘itemCount’,itemCount);

            // for (i = 0; i < itemCount; i++) {

            //     var manualQty = currentRecord.getSublistValue({
            //         sublistId: 'item',
            //         fieldId: 'custcol_ddc_manual_qty',
            //         line: i
            //     });

            //     if (manualQty) {
            //         var originalQty = currentRecord.getSublistValue({
            //             sublistId: 'item',
            //             fieldId: 'quantity',
            //             line: i
            //         });

            //         console.log('init originalQty: ' + originalQty)

            //         currentRecord.setCurrentSublistValue({
            //             sublistId: 'item',
            //             fieldId: 'custcol_ddc_quantity_before_manualqty',
            //             value: originalQty
            //         });
            //     }



            // }

            // var currentLine = currentRecord.getCurrentSublistIndex({
            //     sublistId: 'item'
            // });

            // var manualQty = currentRecord.getCurrentSublistValue({
            //     sublistId: 'item',
            //     fieldId: 'custcol_ddc_manual_qty'
            // });

            // if (!manualQty) {
            //     var itemField = currentRecord.getSublistField({
            //         sublistId: 'item',
            //         fieldId: 'quantity',
            //         line: currentLine
            //     });
            //     itemField.isDisabled = true;

            //     var objSublist = currentRecord.getSublist({
            //         sublistId: 'item'
            //     });

            //     var objColumn = objSublist.getColumn({
            //         fieldId: 'quantity'
            //     });

            //     console.log('column: ' + objColumn)

            //     objColumn.isDisabled = true

            // }

            var currentLine = currentRecord.getCurrentSublistIndex({
                sublistId: 'item'
            });

            var manualQty = currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_ddc_manual_qty'
            });

            var originalQty = currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_ddc_quantity_before_manualqty'
            });

            console.log('init originalQty: ' + originalQty)

            var currentQty = currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'quantity'
            })

            console.log('init currentQty value: ' + currentQty)

            if (!manualQty && currentQty > 0) {
                currentRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_ddc_quantity_before_manualqty',
                    value: currentQty
                });
            }
        }

    }

    function manualqty_validateField(context) {
        var currentRecord = context.currentRecord;
        var sublistName = context.sublistId;
        var sublistFieldName = context.fieldId;

        // if (sublistName === 'item' && sublistFieldName === 'quantity') {

        //     var manualQty = currentRecord.getCurrentSublistValue({
        //         sublistId: 'item',
        //         fieldId: 'custcol_ddc_manual_qty'
        //     })

        //     if (!manualQty) {
        //         alert('Manual Quantity is not allowed')
        //         return false;
        //     } else {
        //         return true
        //     }
        // }

        if (sublistName === 'item' && sublistFieldName === 'quantity') {

            var manualQty = currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_ddc_manual_qty'
            })

            console.log('!manualQty')

            var currentLine = currentRecord.getCurrentSublistIndex({
                sublistId: 'item'
            });

            var beforeQty = currentRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_ddc_quantity_before_manualqty',
                line: currentLine
            })

            console.log('beforeQty value: ' + beforeQty)

            var currentQty = currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'quantity'
            })

            console.log('currentQty value: ' + currentQty)

            if (!manualQty && currentQty != beforeQty) {

                if (currentQty > 0) {
                    alert('Manual Quantity is not allowed')
                    currentRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        value: beforeQty
                    });
                    return false;
                }

            } else if (manualQty) {
                console.log('proceed')
                return true;
            }
        }

        return true;
    }

    function manualqty_fieldChanged(context) {

        var currentUser = runtime.getCurrentUser();
        var subsidiary = currentUser.subsidiary
        if (subsidiary == '2') {
            var currentRecord = context.currentRecord;
            var sublistName = context.sublistId;
            var sublistFieldName = context.fieldId;
            var lineNum = context.line

            // if (sublistName === 'item' && sublistFieldName === 'custcol_ddc_manual_qty') {

            //     var manualQty = currentRecord.getCurrentSublistValue({
            //         sublistId: 'item',
            //         fieldId: 'custcol_ddc_manual_qty'
            //     })

            //     if (manualQty) {
            //         var itemField = currentRecord.getSublistField({
            //             sublistId: 'item',
            //             fieldId: 'quantity',
            //             line: lineNum
            //         });
            //         itemField.isDisabled = false;

            //     } else {
            //         var itemField = currentRecord.getSublistField({
            //             sublistId: 'item',
            //             fieldId: 'quantity',
            //             line: lineNum
            //         });
            //         itemField.isDisabled = true;
            //     }


            // }

            // var currentRecord = context.currentRecord;
            // var sublistName = context.sublistId;
            // var sublistFieldName = context.fieldId;

            // if (sublistName === 'item' && sublistFieldName === 'quantity') {

            //     var manualQty = currentRecord.getCurrentSublistValue({
            //         sublistId: 'item',
            //         fieldId: 'custcol_ddc_manual_qty'
            //     })

            //     var itemRate = currentRecord.getCurrentSublistValue({
            //         sublistId: 'item',
            //         fieldId: 'rate'
            //     })

            //     var itemAmnt = currentRecord.getCurrentSublistValue({
            //         sublistId: 'item',
            //         fieldId: 'amount'
            //     })

            //     console.log(itemRate)
            //     console.log(itemAmnt)

            //     var originalQty = itemAmnt / itemRate

            //     console.log(originalQty)

            //     var currentQty = currentRecord.getCurrentSublistValue({
            //         sublistId: 'item',
            //         fieldId: 'quantity'
            //     })

            //     if (!manualQty && currentQty != originalQty) {
            //         console.log('!manualQty && currentQty != originalQty')
            //         alert('Manual Quantity is not allowed')

            //         currentRecord.setCurrentSublistValue({
            //             sublistId: 'item',
            //             fieldId: 'quantity',
            //             value: originalQty
            //         });
            //         return false;
            //     } else {
            //         console.log('else')
            //         return true
            //     }
            // }


            if (sublistName === 'item' && sublistFieldName === 'quantity') {

                var itemId = currentRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item'
                })

                if (itemId != 10892 && itemId != 10893) {

                    var manualQty = currentRecord.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_ddc_manual_qty'
                    })

                    var beforeQty = currentRecord.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_ddc_quantity_before_manualqty'
                    })

                    console.log('fieldChanged beforeQty: ' + beforeQty)

                    var currentQty = currentRecord.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity'
                    })

                    if (!manualQty && currentQty != beforeQty) {
                        console.log('!manualQty && currentQty != beforeQty')

                        alert('Manual Quantity is not allowed')

                        currentRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            value: beforeQty
                        });
                    } else {
                        console.log('proceed field changed')

                        var itemUnit = currentRecord.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_ddc_unit_sale'
                        })

                        if (itemUnit == '1000') {
                            var reducedQty = parseFloat(currentQty) / 1000

                            var itemRate = currentRecord.getCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'rate'
                            })

                            currentRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'amount',
                                value: parseFloat(reducedQty) * parseFloat(itemRate)
                            });
                        }
                    }
                }
            } else if (sublistName === 'item' && sublistFieldName === 'custcol_ddc_manual_qty') {
                var itemId = currentRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item'
                })

                if (itemId != 10892 && itemId != 10893) {
                    var manualQty = currentRecord.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_ddc_manual_qty'
                    })

                    if (!manualQty) {
                        var currentQty = currentRecord.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity'
                        })

                        currentRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_ddc_quantity_before_manualqty',
                            value: currentQty
                        });
                    }
                }

            }
        }
    }

    return {
        lineInit: manualqty_lineInit,
        //validateField: manualqty_validateField,
        fieldChanged: manualqty_fieldChanged
    }
});
