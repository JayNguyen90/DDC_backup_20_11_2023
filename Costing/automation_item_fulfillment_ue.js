/**
 *
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search'],
    function (record, runtime, search) {

        /**
         *  Function definition to be triggered after record is submitted.
         *
         * @param {Object} scriptContextS
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type
         * @param {Form} scriptContext.form - Current form
         * @Since 2015.2
         */
        function afterSubmit(context) {
            try {
                var itemArr = [];
                var newRecord = context.newRecord;
                var transactionId = newRecord.id;
                log.debug("transactionId", transactionId);
                if (context.type !== "edit") {
                    return;
                }
                var newRecord = record.load({
                    type: record.Type.SALES_ORDER,
                    id: transactionId,
                    //isDynamic: true,
                });
                var status = newRecord.getText({ fieldId: 'status' });
                var subsidiary = newRecord.getValue({ fieldId: 'subsidiary' });
                if (subsidiary != 2) {
                    return;
                }
                // GR - 2023-07-11 - Adding Pending Fulfillment status so this works on first IF
                //if (status == 'Pending Billing/Partially Fulfilled' || status == 'Pending Billing') {
                if (status == 'Pending Fulfillment' || status == 'Pending Billing/Partially Fulfilled' || status == 'Pending Billing' || status == 'Partially Fulfilled') {
                    var line = newRecord.getLineCount('item');
                    log.debug("line", line);
                    for (var i = 0; i < line; i++) {
                        var itemtype = newRecord.getSublistValue('item', 'itemtype', i);
                        var itemId = newRecord.getSublistValue('item', 'item', i);
                        var itemText = newRecord.getSublistText('item', 'item', i);
                        var quantity = newRecord.getSublistValue('item', 'quantity', i);
                        var actualQuantity = newRecord.getSublistValue('item', 'custcol_ddc_actual_qty', i);
                        var quantityfulfilled = newRecord.getSublistValue('item', 'quantityfulfilled', i);
                        var preferredBin = newRecord.getSublistValue('item', 'custcol_ddc_pref_fulfillment_bin_id', i);
                        var alternateBin = newRecord.getSublistValue('item', 'custcol_ddc_alt_fulfillment_bin_id', i);
                        var lineNumber = newRecord.getSublistValue('item', 'line', i);

                        // GR - 2023-11-08 - Adding check for whether Inventory is Weight-tracked, ie. Has an Actual KGs value.
                        var actualKgs = newRecord.getSublistValue('item', 'custcol_ddc_actual_kgs', i) || 0;
                        actualKgs = actualKgs.toFixed(5);
                        var qtyToUse;
                      
                        if (actualKgs != 0) {
                            qtyToUse = actualKgs;
                        } else {
                            qtyToUse = actualQuantity;
                        }
                        /*
                         if (itemtype == 'InvtPart' && (parseFloatOrZero(quantity) - parseFloatOrZero(quantityfulfilled) > 0)) {
                            //if (itemtype == 'InvtPart') {
                            itemArr.push({
                                itemId: itemId,
                                itemText: itemText,
                                quantity: parseFloatOrZero(quantity) - parseFloatOrZero(quantityfulfilled),
                                //quantity: parseFloatOrZero(quantity),
                                lineNumber: lineNumber,
                                preferredBin: preferredBin,
                                alternateBin: alternateBin
                            })
                        }    
                        */
                        if (itemtype == 'InvtPart' && (parseFloatOrZero(qtyToUse) - parseFloatOrZero(quantityfulfilled) > 0)) {
                            //if (itemtype == 'InvtPart') {
                            itemArr.push({
                                itemId: itemId,
                                itemText: itemText,
                                quantity: parseFloatOrZero(qtyToUse) - parseFloatOrZero(quantityfulfilled),
                                //quantity: parseFloatOrZero(quantity),
                                lineNumber: lineNumber,
                                preferredBin: preferredBin,
                                alternateBin: alternateBin
                            })
                        }
                      // GR End
                    }
                    log.debug('itemArr', itemArr);
                    if (itemArr.length > 0) {

                        log.debug("dkm", 'dkm')
                        var soLocation = search.lookupFields({
                            type: "salesorder",
                            id: transactionId,
                            columns: ['location']
                        }).location;
                        log.debug('soLocation', soLocation);

                        let prefBinArray = itemArr.flatMap((val) => { return val.preferredBin })
                        let alternateBinArray = itemArr.flatMap((val) => { return val.alternateBin })

                        prefBinArray = prefBinArray = [...new Set(prefBinArray)];
                        alternateBinArray = alternateBinArray = [...new Set(alternateBinArray)];

                        let binArray = [...prefBinArray, ...alternateBinArray]

                        log.emergency({
                            title: 'binArray',
                            details: binArray
                        })
                        log.debug('binArray', binArray)

                        const loadBinData = getBinQuantityLocationData(soLocation[0].value, binArray)
                        log.debug('loadBinData', loadBinData)


                        var itemFullFillRec = record.transform({
                            fromType: record.Type.SALES_ORDER,
                            fromId: parseInt(transactionId),
                            toType: record.Type.ITEM_FULFILLMENT,
                            isDynamic: true,
                            defaultValues: {
                                inventorylocation: soLocation[0].value
                            }
                        });

                        var lineCount = itemFullFillRec.getLineCount({
                            sublistId: 'item'
                        });
                        log.debug("line Count IF", lineCount)
                        var fulfilledLinesArray = [];
                        for (var k = 0; k < lineCount; k++) {
                            itemFullFillRec.selectLine({
                                sublistId: 'item',
                                line: k
                            });
                            var itemId = itemFullFillRec.getCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                //line: k
                            });
                            log.debug("itemId", itemId);
                    
                            var orderline = itemFullFillRec.getCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'orderline',
                                //line: k
                            });

                            log.debug("orderline", orderline);
                            //no need fifter by orderline
                            var itemFullFill = itemArr.filter(x => x.itemId == itemId && x.lineNumber == orderline);
                            log.debug("itemArr dkm: " + k, itemFullFill);

                            if (itemFullFill.length > 0) {
                                const results = loadBinData.filter(element => {
                                    return element.internalid == itemId && element.bin_number == itemArr[k].preferredBin;
                                });
                                log.emergency({
                                    title: 'results',
                                    details: results
                                })
                                if (results.length > 0) {
                                    log.debug("dkm3", itemFullFill[0].quantity);
                                    if (itemFullFill[0].quantity <= results[0].available) {
                                        log.emergency({
                                            title: 'pass 1 qty is less than or equal to on hand',
                                            details: 'pass 1 qty is less than or equal to on hand'
                                        })
                                        itemFullFillRec.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'itemreceive',
                                            value: true,
                                        });
                                        log.debug("quantity item", itemFullFill[0].quantity);
                                        let inventoryDetail = itemFullFillRec.getCurrentSublistSubrecord({
                                            sublistId: 'item',
                                            fieldId: 'inventorydetail',
                                        });
                                        inventoryDetail.selectLine({
                                            sublistId: 'inventoryassignment',
                                            line: 0
                                        });
                                        inventoryDetail.setCurrentSublistValue({
                                            sublistId: 'inventoryassignment',
                                            fieldId: 'binnumber',
                                            value: itemFullFill[0].preferredBin,
                                        });
                                        inventoryDetail.setCurrentSublistValue({
                                            sublistId: 'inventoryassignment',
                                            fieldId: 'tobinnumber',
                                            value: itemFullFill[0].preferredBin,
                                        });
                                        log.debug("quantity inventoryassignment ", itemFullFill[0].quantity);
                                        inventoryDetail.setCurrentSublistValue({
                                            sublistId: 'inventoryassignment',
                                            fieldId: 'quantity',
                                            value: parseFloat(itemFullFill[0].quantity),
                                        });
                                        inventoryDetail.commitLine('inventoryassignment');
                                        itemFullFillRec.commitLine('item');

                                        fulfilledLinesArray.push(itemFullFillRec.getCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'itemreceive',
                                        }));
                                    } else if (itemFullFill[0].quantity > results[0].available) {
                                        // first check if the line has a second bin and if it does check if the second bin has enough quantity
                                        // if (itemFullFill[0].alternateBin != null && itemFullFill[0].alternateBin != '') {
                                        if (hasValue(itemFullFill[0].alternateBin)) {
                                            log.debug('dkm1', 'dkm1');
                                            log.debug('dkm1dkm1', itemFullFill[0].alternateBin);
                                            const alternateResults = loadBinData.filter(element => {
                                                return element.internalid == itemId && element.bin_number == itemFullFill[0].alternateBin;
                                            });
                                            log.emergency({
                                                title: 'alternateResults1',
                                                details: alternateResults
                                            })
                                            if (alternateResults.length > 0) {
                                                let preferredBinQuantity;
                                                let quantityForAlternateBin;
                                                // if the alternate bin has enough quantity then fulfill the preferred bin with the quantity from the preferred bin and the alternate bin with the remaining quantity
                                                if ((alternateResults[0].available + results[0].available) >= itemFullFill[0].quantity) {
                                                    preferredBinQuantity = results[0].available;;
                                                    //quantityForAlternateBin = itemFullFill[0].quantity - alternateResults[0].available;
                                                    //quantityForAlternateBin = itemFullFill[0].quantity - preferredBinQuantity - alternateResults[0].available;
                                                    quantityForAlternateBin = itemFullFill[0].quantity - preferredBinQuantity;
                                                    log.emergency({
                                                        title: 'Quantity check on alternate bin',
                                                        details: {
                                                            preferredBinQuantity,
                                                            quantityForAlternateBin
                                                        }
                                                    });
                                                    itemFullFillRec.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'itemreceive',
                                                        value: true,
                                                    });
                                                    // itemFullFillRec.setSublistValue({
                                                    //     sublistId: 'item',
                                                    //     fieldId: 'quantity',
                                                    //     value: itemFullFill[0].quantity,
                                                    //     line: k
                                                    // });
                                                    let inventoryDetail = itemFullFillRec.getCurrentSublistSubrecord({
                                                        sublistId: 'item',
                                                        fieldId: 'inventorydetail',
                                                    });
                                                    inventoryDetail.selectLine({
                                                        sublistId: 'inventoryassignment',
                                                        line: 0
                                                    });
                                                    inventoryDetail.setCurrentSublistValue({
                                                        sublistId: 'inventoryassignment',
                                                        fieldId: 'binnumber',
                                                        value: itemFullFill[0].preferredBin,
                                                        //line: 0
                                                    });
                                                    inventoryDetail.setCurrentSublistValue({
                                                        sublistId: 'inventoryassignment',
                                                        fieldId: 'tobinnumber',
                                                        value: itemFullFill[0].preferredBin,
                                                        line: 0
                                                    });
                                                    inventoryDetail.setCurrentSublistValue({
                                                        sublistId: 'inventoryassignment',
                                                        fieldId: 'quantity',
                                                        value: preferredBinQuantity,
                                                        line: 0
                                                    });
                                                    inventoryDetail.commitLine('inventoryassignment');
                                                    inventoryDetail.selectLine({
                                                        sublistId: 'inventoryassignment',
                                                        line: 1
                                                    });
                                                    inventoryDetail.setCurrentSublistValue({
                                                        sublistId: 'inventoryassignment',
                                                        fieldId: 'binnumber',
                                                        value: itemFullFill[0].alternateBin,
                                                        //line: 1
                                                    });
                                                    inventoryDetail.setCurrentSublistValue({
                                                        sublistId: 'inventoryassignment',
                                                        fieldId: 'tobinnumber',
                                                        value: itemFullFill[0].alternateBin,
                                                        //line: 1
                                                    });
                                                    inventoryDetail.setCurrentSublistValue({
                                                        sublistId: 'inventoryassignment',
                                                        fieldId: 'quantity',
                                                        value: quantityForAlternateBin,
                                                        //line: 1
                                                    });
                                                    fulfilledLinesArray.push(itemFullFillRec.getCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'itemreceive',
                                                        line: k
                                                    }));
                                                    inventoryDetail.commitLine('inventoryassignment');

                                                    itemFullFillRec.commitLine('item');

                                                } else {
                                                    itemFullFillRec.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'itemreceive',
                                                        value: false,
                                                    });
                                                    fulfilledLinesArray.push(itemFullFillRec.getCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'itemreceive',
                                                    }));
                                                    // if the alternate bin does not have enough quantity then log an error that the preferred bin and the alternate bin does not have enough quantity
                                                    log.error({
                                                        title: 'Check On Hand Quantity',
                                                        details: `Preferred Bin ${results[0].bin_number_text} has ${results[0].available} quantity and Alternate Bin ${alternateResults[0].bin_number_text} has ${alternateResults[0].available} quantity but you are trying to fulfill ${itemFullFill[0].quantity} quantity. Please check the quantity and try again.`
                                                    });
                                                }
                                            } else {
                                                // if there is no alternate bin then log an error that the preferred bin does not have enough quantity
                                                itemFullFillRec.setCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'itemreceive',
                                                    value: false,
                                                });
                                                fulfilledLinesArray.push(itemFullFillRec.getCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'itemreceive',
                                                }));
                                                log.error({
                                                    title: 'Check On Hand Quantity',
                                                    details: `Preferred Bin ${results[0].bin_number_text} has ${results[0].available} quantity but you are trying to fulfill ${itemArr[0].quantity} quantity. Please check the quantity and try again.`
                                                })
                                            }
                                        }
                                        else {
                                            log.debug('dkm2dkm2', itemFullFill[0].preferredBin);
                                            const alternateResults = loadBinData.filter(element => {
                                                return element.internalid == itemId && element.bin_number == itemFullFill[0].preferredBin;
                                            });
                                            log.emergency({
                                                title: 'alternateResults2',
                                                details: alternateResults
                                            })
                                            if (alternateResults.length > 0) {
                                                let preferredBinQuantity;
                                                let quantityForAlternateBin;
                                                // if the alternate bin has enough quantity then fulfill the preferred bin with the quantity from the preferred bin and the alternate bin with the remaining quantity
                                                if ((alternateResults[0].available + results[0].available) >= itemFullFill[0].quantity) {
                                                    preferredBinQuantity = results[0].available;;
                                                    //quantityForAlternateBin = itemFullFill[0].quantity - alternateResults[0].available;
                                                    //quantityForAlternateBin = itemFullFill[0].quantity - preferredBinQuantity - alternateResults[0].available;
                                                    quantityForAlternateBin = itemFullFill[0].quantity - preferredBinQuantity;
                                                    log.emergency({
                                                        title: 'alternateResults2 Quantity check on alternate bin',
                                                        details: {
                                                            preferredBinQuantity,
                                                            quantityForAlternateBin
                                                        }
                                                    });
                                                    itemFullFillRec.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'itemreceive',
                                                        value: true,
                                                    });
                                                    // itemFullFillRec.setSublistValue({
                                                    //     sublistId: 'item',
                                                    //     fieldId: 'quantity',
                                                    //     value: itemFullFill[0].quantity,
                                                    //     line: k
                                                    // });
                                                    let inventoryDetail = itemFullFillRec.getCurrentSublistSubrecord({
                                                        sublistId: 'item',
                                                        fieldId: 'inventorydetail',
                                                    });
                                                    inventoryDetail.selectLine({
                                                        sublistId: 'inventoryassignment',
                                                        line: 0
                                                    });
                                                    inventoryDetail.setCurrentSublistValue({
                                                        sublistId: 'inventoryassignment',
                                                        fieldId: 'binnumber',
                                                        value: itemFullFill[0].preferredBin,
                                                        //line: 0
                                                    });
                                                    inventoryDetail.setCurrentSublistValue({
                                                        sublistId: 'inventoryassignment',
                                                        fieldId: 'tobinnumber',
                                                        value: itemFullFill[0].preferredBin,
                                                        line: 0
                                                    });
                                                    inventoryDetail.setCurrentSublistValue({
                                                        sublistId: 'inventoryassignment',
                                                        fieldId: 'quantity',
                                                        value: preferredBinQuantity,
                                                        line: 0
                                                    });
                                                    inventoryDetail.commitLine('inventoryassignment');
                                                    inventoryDetail.selectLine({
                                                        sublistId: 'inventoryassignment',
                                                        line: 1
                                                    });
                                                    inventoryDetail.setCurrentSublistValue({
                                                        sublistId: 'inventoryassignment',
                                                        fieldId: 'binnumber',
                                                        value: itemFullFill[0].alternateBin,
                                                        //line: 1
                                                    });
                                                    inventoryDetail.setCurrentSublistValue({
                                                        sublistId: 'inventoryassignment',
                                                        fieldId: 'tobinnumber',
                                                        value: itemFullFill[0].alternateBin,
                                                        //line: 1
                                                    });
                                                    inventoryDetail.setCurrentSublistValue({
                                                        sublistId: 'inventoryassignment',
                                                        fieldId: 'quantity',
                                                        value: quantityForAlternateBin,
                                                        //line: 1
                                                    });
                                                    fulfilledLinesArray.push(itemFullFillRec.getCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'itemreceive',
                                                        line: k
                                                    }));
                                                    inventoryDetail.commitLine('inventoryassignment');

                                                    itemFullFillRec.commitLine('item');

                                                } else {
                                                    itemFullFillRec.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'itemreceive',
                                                        value: false,
                                                    });
                                                    fulfilledLinesArray.push(itemFullFillRec.getCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'itemreceive',
                                                    }));
                                                    // if the alternate bin does not have enough quantity then log an error that the preferred bin and the alternate bin does not have enough quantity
                                                    log.error({
                                                        title: 'Check On Hand Quantity',
                                                        details: `Preferred Bin ${results[0].bin_number_text} has ${results[0].available} quantity and Alternate Bin ${alternateResults[0].bin_number_text} has ${alternateResults[0].available} quantity but you are trying to fulfill ${itemFullFill[0].quantity} quantity. Please check the quantity and try again.`
                                                    });
                                                }
                                            } else {
                                                // if there is no alternate bin then log an error that the preferred bin does not have enough quantity
                                                itemFullFillRec.setCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'itemreceive',
                                                    value: false,
                                                });
                                                fulfilledLinesArray.push(itemFullFillRec.getCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'itemreceive',
                                                }));
                                                log.error({
                                                    title: 'Check On Hand Quantity',
                                                    details: `Preferred Bin ${results[0].bin_number_text} has ${results[0].available} quantity but you are trying to fulfill ${itemArr[0].quantity} quantity. Please check the quantity and try again.`
                                                })
                                            }
                                        }
                                    } else {
                                        itemFullFillRec.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'itemreceive',
                                            value: false,
                                        });
                                        fulfilledLinesArray.push(itemFullFillRec.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'itemreceive',
                                        }));
                                    }

                                } else {
                                    log.debug('dkm3','dkm3')
                                    itemFullFillRec.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'itemreceive',
                                        value: false,
                                    });
                                    fulfilledLinesArray.push(itemFullFillRec.getCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'itemreceive',

                                    }));
                                }
                                itemFullFillRec.commitLine({
                                    sublistId: 'item'
                                });

                            } else {

                                fulfilledLinesArray.push(itemFullFillRec.getCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'itemreceive',
                                    line: k
                                }));
                                itemFullFillRec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'itemreceive',
                                    value: false,
                                    //line: k
                                });
                            }

                            itemFullFillRec.commitLine({
                                sublistId: 'item'
                            });
                        }
                        log.emergency({
                            title: 'fulfilledLinesArray',
                            details: fulfilledLinesArray
                        })
                        if (fulfilledLinesArray.length > 0) {
                            if (fulfilledLinesArray.includes(true)) {
                                var rec = itemFullFillRec.save({
                                    enableSourcing: true,
                                    ignoreMandatoryFields: true
                                });
                                log.debug("rec", rec);
                            }
                        }
                    }
                }

            } catch (e) {
                log.debug("e", e)
            }
        };

        const parseFloatOrZero = n => parseFloat(n) || 0
        function hasValue(value) {
            var isContain = false;
            if (value != undefined && value != null && value != '') {
                isContain = true;
            }
            return isContain;
        }


        /** 
        * @name getBinQuantityLocationData
        * @description load the saved search bin on hand numbers
        * @param {internalid} integer
        *
        * @returns {results} array
        */
        const getBinQuantityLocationData = (location, binnumber) => {
            let query = search.load({
                id: 'customsearch_jcs_bin_on_hands'
            });
            query.filters.push(search.createFilter({
                name: 'location',
                join: 'binOnHand',
                operator: search.Operator.ANYOF,
                values: location
            }));
            if (binnumber.length > 0) {
                binnumber = binnumber.filter((val) => { return val != null && val != '' });
                log.debug('binnumber', binnumber)
                if (binnumber.length > 0) {
                    query.filters.push(search.createFilter({
                        name: 'binnumber',
                        join: 'binOnHand',
                        operator: search.Operator.ANYOF,
                        values: binnumber
                    }));
                }

            }
            let results = getResults(query.run())
            log.debug('results', results);
            results = results.map(mapBinQuantityLocationData)
            return results;
        }

        const mapBinQuantityLocationData = (data) => {
            return {
                'internalid': data.id,
                'item': data.getValue(data.columns[0]),
                'location': data.getValue(data.columns[1]),
                'bin_number': data.getValue(data.columns[2]),
                'bin_number_text': data.getText(data.columns[2]),
                //'available': parseFloatOrZero(data.getValue(data.columns[4])),
                'available': data.getText(data.columns[5]) == 'Per 1000' ? parseFloatOrZero(data.getValue(data.columns[4])) * 1000 : parseFloatOrZero(data.getValue(data.columns[4])),
            };
        };

        /**
         * DONOT ALTER THIS FUNCTION
         * Retrieves all(even if data is more than 2000) 
         * search results of an nlobjSearchResultSet
         *
         * @param  {resultSet} set search result set to retrieve results
         * @return {Array}     array containing search results
         */
        var getResults = (set) => {
            let holder = [];
            let i = 0;
            while (true) {
                let result = set.getRange({
                    start: i,
                    end: i + 1000
                });
                if (!result) break;
                holder = holder.concat(result);
                if (result.length < 1000) break;
                i += 1000;
            }
            return holder;
        };
        return { afterSubmit: afterSubmit };
    });