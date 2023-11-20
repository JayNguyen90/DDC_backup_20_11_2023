/**
* @NApiVersion 2.x
* @NScriptType ClientScript
*/

define([
    'N/ui/message',
    'N/ui/dialog',
    'N/currentRecord',
    'N/record',
    'N/search',
    './ddc_jcs_util.js',
    'N/runtime'],
    function (
        _nMessage,
        _nDialog,
        _nCurrentRecord,
        _nRecord,
        _nSearch,
        util,
        runtime
    ) {
        //GLOBAL 
        var currentItem, currentLineNo = '';
        var deleteFlag = 'manual';

        function postSourcing(context) {
            try {



            } catch (ex) {
                console.log('postSourcing exception: ' + ex);
            }
        }


        function validateInsert(context) {
            try {


            } catch (ex) {
                console.log('validateInsert exception: ' + ex);
            }
        }

        function sublistChanged(context) {
            var currentUser = runtime.getCurrentUser();
            var subsidiary = currentUser.subsidiary
            if (subsidiary == '2') {
                try {
                    //console.log('sublistChanged context : '+JSON.stringify(context));
                    var sublistName = context.sublistId;

                    var currentRecord = context.currentRecord;
                    if (sublistName != 'recmachcustrecord_crc_parent') return true;
                    if (context.operation != 'remove') return true;

                    var itemno = currentRecord.getCurrentSublistValue({
                        sublistId: 'recmachcustrecord_crc_parent',
                        fieldId: 'custrecord_crc_item_no'
                    });


                    var currentlineno = currentRecord.getCurrentSublistValue({
                        sublistId: 'recmachcustrecord_crc_parent',
                        fieldId: 'custrecord_crc_hidden_item_no'
                    });

                    if (util.isEmpty(itemno)) return true;

                    var lineCount = currentRecord.getLineCount({
                        sublistId: 'recmachcustrecord_crc_parent'
                    });
                    lineCount = lineCount + 1;
                    console.log('delete: linecnt: ' + lineCount + ', itemno: ' + itemno);
                    deleteFlag = 'script';
                    for (var i = 0; i < lineCount; i++) {
                        var thislineno = currentRecord.getSublistValue({
                            sublistId: "recmachcustrecord_crc_parent",
                            fieldId: "custrecord_crc_hidden_item_no",
                            line: i
                        });

                        if (itemno != thislineno) continue;

                        // console.log('delete: itemno: '+itemno+'= thislineno: '+thislineno);

                        currentRecord.selectLine({
                            sublistId: 'recmachcustrecord_crc_parent',
                            line: i
                        });

                        var idx = currentRecord.getCurrentSublistIndex({
                            sublistId: 'recmachcustrecord_crc_parent'
                        });

                        currentRecord.removeLine({
                            sublistId: 'recmachcustrecord_crc_parent',
                            line: idx,
                            ignoreRecalc: true
                        });
                        i--
                        lineCount--;
                        console.log('removing index: ' + idx + ', itemno...' + itemno);

                    }

                    deleteFlag = 'manual';


                    return true;

                } catch (ex) {
                    console.log('sublistChanged exception: ' + ex.message);
                }
            }
        }

        function validateDelete(context) {
            var currentUser = runtime.getCurrentUser();
            var subsidiary = currentUser.subsidiary
            if (subsidiary == '2') {
                try {

                    if (deleteFlag == 'script') return;

                    var sublistName = context.sublistId;
                    if (sublistName != 'recmachcustrecord_crc_parent') return true;
                    var currentRecord = context.currentRecord;


                    var itemno = currentRecord.getCurrentSublistValue({
                        sublistId: 'recmachcustrecord_crc_parent',
                        fieldId: 'custrecord_crc_item_no'
                    });


                    var currentlineno = currentRecord.getCurrentSublistValue({
                        sublistId: 'recmachcustrecord_crc_parent',
                        fieldId: 'custrecord_crc_hidden_item_no'
                    });


                    if (util.isEmpty(itemno)) return true;

                    //deleteFlag = 'script';

                    var lineCount = currentRecord.getLineCount({
                        sublistId: 'recmachcustrecord_crc_parent'
                    });
                    //console.log('delete: linecnt: '+lineCount+', itemno: '+itemno);

                    deleteFlag = 'script';
                    for (var i = 0; i < lineCount; i++) {
                        var thislineno = currentRecord.getSublistValue({
                            sublistId: "recmachcustrecord_crc_parent",
                            fieldId: "custrecord_crc_hidden_item_no",
                            line: i
                        });

                        if (itemno != thislineno) continue;

                        console.log('delete: itemno: ' + itemno + '= thislineno: ' + thislineno);

                        currentRecord.selectLine({
                            sublistId: 'recmachcustrecord_crc_parent',
                            line: i
                        });

                        var idx = currentRecord.getCurrentSublistIndex({
                            sublistId: 'recmachcustrecord_crc_parent'
                        });

                        currentRecord.removeLine({
                            sublistId: 'recmachcustrecord_crc_parent',
                            line: idx
                        });


                        console.log('removing index: ' + idx + ', itemno...' + itemno);

                    }

                    deleteFlag = 'manual';


                    return true;

                } catch (ex) {
                    //console.log('validateDelete exception: '+ex);
                }
            }
        }


        function pageInit(context) {

        }


        function isValidInsert(context) {
            var currentUser = runtime.getCurrentUser();
            var subsidiary = currentUser.subsidiary
            if (subsidiary == '2') {
                try {
                    var currentRecord = context.currentRecord;
                    var idx = currentRecord.getCurrentSublistIndex({
                        sublistId: 'recmachcustrecord_crc_parent'
                    });

                    var item = currentRecord.getCurrentSublistValue({
                        sublistId: "recmachcustrecord_crc_parent",
                        fieldId: "custrecord_crc_item"
                    });

                    var currentLine = context.line;

                    var previtem, nextitem = null;

                    var lineCount = currentRecord.getLineCount({
                        sublistId: 'recmachcustrecord_crc_parent'
                    });

                    //alert('idx: '+idx+', lineCount: '+lineCount);

                    if (idx == 0 || idx >= lineCount) {
                        //do nothing
                        return true;
                    }

                    previtem = currentRecord.getSublistValue({
                        sublistId: "recmachcustrecord_crc_parent",
                        fieldId: "custrecord_crc_item",
                        line: idx - 1
                    });

                    try {
                        nextitem = currentRecord.getSublistValue({
                            sublistId: "recmachcustrecord_crc_parent",
                            fieldId: "custrecord_crc_item",
                            line: idx + 1
                        });
                    } catch (ex1) {
                        nextitem = null;
                        //alert('null na to nextitem: '+nextitem);
                    }


                    //alert('previtem: '+previtem+', nextitem: '+nextitem);

                    if ((util.isEmpty(previtem) && util.isEmpty(nextitem)) && !util.isEmpty(item)) {
                        var options = {
                            title: 'Attention',
                            message: 'You cannot add an item to this line.'
                        };

                        _nDialog.alert(options).then(function success(choice) {
                            //console.log('Success with value ' + choice);
                        }).catch(failure);

                        currentRecord.cancelLine({
                            sublistId: 'recmachcustrecord_crc_parent'
                        });

                        return false;
                    }

                    if ((util.isEmpty(previtem) && !util.isEmpty(nextitem)) && !util.isEmpty(item)) {
                        var options = {
                            title: 'Attention',
                            message: 'You cannot add an item to this line.'
                        };

                        _nDialog.alert(options).then(function success(choice) {
                            //console.log('Success with value ' + choice);
                        }).catch(failure);

                        currentRecord.cancelLine({
                            sublistId: 'recmachcustrecord_crc_parent'
                        });

                        return false;
                    }

                    if ((!util.isEmpty(previtem) && util.isEmpty(nextitem)) && !util.isEmpty(item)) {
                        var options = {
                            title: 'Attention',
                            message: 'You cannot add an item to this line.'
                        };

                        _nDialog.alert(options).then(function success(choice) {
                            //console.log('Success with value ' + choice);
                        }).catch(failure);


                        currentRecord.cancelLine({
                            sublistId: 'recmachcustrecord_crc_parent'
                        });

                        return false;
                    }

                    return true;

                } catch (ex) {
                    console.log('isValidInsert exception: ' + ex);
                }
            }
        }

        function validateLine(context) {
            var currentUser = runtime.getCurrentUser();
            var subsidiary = currentUser.subsidiary
            if (subsidiary == '2') {
                try {
                    var currentRecord = context.currentRecord;
                    var sublistName = context.sublistId;

                    if (sublistName === 'recmachcustrecord_crc_parent') {
                        var currentLine = context.line;
                        var item = currentRecord.getCurrentSublistValue({
                            sublistId: 'recmachcustrecord_crc_parent',
                            fieldId: 'custrecord_crc_item'
                        });

                        var qty = currentRecord.getCurrentSublistValue({
                            sublistId: 'recmachcustrecord_crc_parent',
                            fieldId: 'custrecord_crc_from_quantity'
                        });

                        var rate = currentRecord.getCurrentSublistValue({
                            sublistId: 'recmachcustrecord_crc_parent',
                            fieldId: 'custrecord_crc_rate'
                        });

                        var itemno = currentRecord.getCurrentSublistValue({
                            sublistId: 'recmachcustrecord_crc_parent',
                            fieldId: 'custrecord_crc_item_no'
                        });

                        var itemcode = currentRecord.getCurrentSublistValue({
                            sublistId: 'recmachcustrecord_crc_parent',
                            fieldId: 'custrecord_crc_cust_itemcode'
                        });

                        var hiddenitemno = currentRecord.getCurrentSublistValue({
                            sublistId: 'recmachcustrecord_crc_parent',
                            fieldId: 'custrecord_crc_hidden_item_no'
                        });


                        var isValid = isValidInsert(context);
                        if (!isValid) return false;


                        if (util.isEmpty(item) && util.isEmpty(qty) && util.isEmpty(rate)) {

                            var options = {
                                title: 'Attention',
                                message: 'Please select an <b>ITEM</b> or enter <b>From Quantity</b> and <b>Rate</b>'
                            };

                            _nDialog.alert(options).then(function success(choice) {
                                //console.log('Success with value ' + choice);
                            }).catch(failure);
                            return false;
                        }

                        if (!util.isEmpty(item) && (util.isEmpty(qty) || util.isEmpty(rate))) {

                            var options = {
                                title: 'Attention',
                                message: '<b>From Quantity</b> and <b>Rate</b> must not be empty.'
                            };

                            _nDialog.alert(options).then(function success(choice) {
                                //console.log('Success with value ' + choice);
                            }).catch(failure);
                            return false;
                        }

                        if ((util.isEmpty(item)) && ((util.isEmpty(qty) && !util.isEmpty(rate)) || (!util.isEmpty(qty) && util.isEmpty(rate)))) {

                            var options = {
                                title: 'Attention',
                                message: '<b>From Quantity</b> and <b>Rate</b> must not be empty.'
                            };
                            _nDialog.alert(options).then(function success(choice) {
                                //console.log('Success with value ' + choice);
                            }).catch(failure);
                            return false;
                        }

                        if (!util.isEmpty(item) && util.isEmpty(itemno)) {
                            //set item no
                            var max = LoopLines(currentRecord);
                            max = parseInt(max) + 1;

                            console.log('max: ' + max);
                            currentRecord.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_crc_parent',
                                fieldId: 'custrecord_crc_hidden_item_no',
                                value: max
                            });

                            currentRecord.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_crc_parent',
                                fieldId: 'custrecord_crc_item_no',
                                value: max
                            });
                        }



                        if (util.isEmpty(item)) {
                            var idx = currentRecord.getCurrentSublistIndex({
                                sublistId: 'recmachcustrecord_crc_parent'
                            });


                            console.log('idx-1: ' + idx);

                            if (idx == 0) {
                                if (!util.isEmpty(itemcode) || !util.isEmpty(qty) || !util.isEmpty(rate)) {
                                    var options = {
                                        title: 'Attention',
                                        message: 'You must select an item.'
                                    };
                                    _nDialog.alert(options).then(function success(choice) {
                                        //console.log('Success with value ' + choice);
                                    }).catch(failure);
                                    return false;
                                }
                                var hiddenitemno = currentRecord.getCurrentSublistValue({
                                    sublistId: "recmachcustrecord_crc_parent",
                                    fieldId: "custrecord_crc_hidden_item_no"
                                });
                            } else {
                                var hiddenitemno = currentRecord.getSublistValue({
                                    sublistId: "recmachcustrecord_crc_parent",
                                    fieldId: "custrecord_crc_hidden_item_no",
                                    line: idx - 1
                                });
                            }

                            if (!util.isEmpty(itemno)) {
                                var options = {
                                    title: 'Attention',
                                    message: 'You must select an item.'
                                };
                                _nDialog.alert(options).then(function success(choice) {
                                    //console.log('Success with value ' + choice);
                                }).catch(failure);
                                return false;
                            }


                            console.log('hiddenitemno: ' + hiddenitemno);
                            currentRecord.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_crc_parent',
                                fieldId: 'custrecord_crc_hidden_item_no',
                                value: hiddenitemno
                            });


                            currentRecord.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_crc_parent',
                                fieldId: 'custrecord_crc_item_no',
                                value: ''
                            });


                            currentRecord.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_crc_parent',
                                fieldId: 'custrecord_crc_cust_itemcode',
                                value: ''
                            });
                        }

                        return true;
                    }


                } catch (ex) {
                    console.log('validateLine exception: ' + ex);
                }
            }
        }

        function LoopLines(currentRecord) {
            try {
                var lineCount = currentRecord.getLineCount({
                    sublistId: 'recmachcustrecord_crc_parent'
                });

                console.log('lineCount: ' + lineCount);

                var max = 0;
                for (var i = 0; i < lineCount; i++) {
                    var hiddenitemno = currentRecord.getSublistValue({
                        sublistId: "recmachcustrecord_crc_parent",
                        fieldId: "custrecord_crc_hidden_item_no",
                        line: i
                    });

                    if (hiddenitemno > max)
                        max = hiddenitemno;
                }

                return max;

            } catch (ex) {
                console.log('LoopLines exception: ' + ex);
            }
        }

        function fieldChanged(context) {
            var currentUser = runtime.getCurrentUser();
            var subsidiary = currentUser.subsidiary
            if (subsidiary == '2') {
                try {

                    var currentRecord = context.currentRecord;
                    var sublistName = context.sublistId;
                    var sublistFieldName = context.fieldId;


                    if (sublistName === 'recmachcustrecord_crc_parent' && sublistFieldName === 'custrecord_crc_cust_itemcode') {
                        var custcode = currentRecord.getCurrentSublistValue({
                            sublistId: 'recmachcustrecord_crc_parent',
                            fieldId: 'custrecord_crc_cust_itemcode'
                        });

                        if (util.isEmpty(custcode)) return true;

                        var item = currentRecord.getCurrentSublistValue({
                            sublistId: 'recmachcustrecord_crc_parent',
                            fieldId: 'custrecord_crc_item'
                        });

                        var idx = currentRecord.getCurrentSublistIndex({
                            sublistId: 'recmachcustrecord_crc_parent'
                        });
                        console.log('idx-1: ' + idx);

                        if (idx == 0) {

                            var itemcode = currentRecord.getCurrentSublistValue({
                                sublistId: 'recmachcustrecord_crc_parent',
                                fieldId: 'custrecord_crc_cust_itemcode'
                            });

                            if (util.isEmpty(item) && !util.isEmpty(itemcode)) {
                                var options = {
                                    title: 'Attention',
                                    message: 'You must select an item.'
                                };
                                _nDialog.alert(options).then(function success(choice) {
                                    //console.log('Success with value ' + choice);
                                }).catch(failure);
                                return false;
                            }
                        }

                        var hiddenitemno = currentRecord.getCurrentSublistValue({
                            sublistId: 'recmachcustrecord_crc_parent',
                            fieldId: 'custrecord_crc_hidden_item_no'
                        });

                        if (util.isEmpty(item)) {
                            if (!util.isEmpty(hiddenitemno)) {
                                var options = {
                                    title: 'Attention',
                                    message: 'You are not allowed to enter a value.'
                                };

                                _nDialog.alert(options).then(function success(choice) {
                                    //console.log('Success with value ' + choice);
                                }).catch(failure);
                            } else {
                                var options = {
                                    title: 'Attention',
                                    message: 'Please select an <b>ITEM</b> or enter <b>From Quantity</b> and <b>Rate</b>'
                                };

                                _nDialog.alert(options).then(function success(choice) {
                                    //console.log('Success with value ' + choice);
                                }).catch(failure);
                            }

                            return false;
                        }

                        return true;
                    }


                    if (sublistName === 'recmachcustrecord_crc_parent' && sublistFieldName === 'custrecord_crc_item') {

                        var currentLine = context.line;
                        var item = currentRecord.getCurrentSublistValue({
                            sublistId: 'recmachcustrecord_crc_parent',
                            fieldId: 'custrecord_crc_item'
                        });

                        //if current line item is child
                        if (util.isEmpty(currentItem) && !util.isEmpty(currentLineNo)) {
                            if (!util.isEmpty(item)) {
                                var options = {
                                    title: 'Attention',
                                    message: 'You cannot add an item to this line.'
                                };

                                _nDialog.alert(options).then(function success(choice) {
                                    //console.log('Success with value ' + choice);
                                }).catch(failure);

                                currentRecord.cancelLine({
                                    sublistId: 'recmachcustrecord_crc_parent'
                                });


                                currentRecord.selectLine({
                                    sublistId: 'recmachcustrecord_crc_parent',
                                    line: currentLine
                                });

                                return false;
                            }
                        }

                        var lineCount = currentRecord.getLineCount({
                            sublistId: 'recmachcustrecord_crc_parent'
                        });

                        for (var i = 0; i < lineCount; i++) {

                            if (i == currentLine) continue;

                            var thisitem = currentRecord.getSublistValue({
                                sublistId: "recmachcustrecord_crc_parent",
                                fieldId: "custrecord_crc_item",
                                line: i
                            });

                            if (util.isEmpty(thisitem)) continue;// return true;

                            console.log('current line item: ' + item + ' || loop item line : ' + i + ' - ' + thisitem);
                            if (item != thisitem) continue;

                            var errmsg = 'Item line number will not be saved - ERROR: the same item already exists.';
                            var options = {
                                title: 'Attention',
                                message: errmsg
                            };

                            _nDialog.alert(options).then(function success(choice) {
                                //console.log('Success with value ' + choice);
                            }).catch(failure);

                            currentRecord.cancelLine({
                                sublistId: 'recmachcustrecord_crc_parent'
                            });


                            currentRecord.selectLine({
                                sublistId: 'recmachcustrecord_crc_parent',
                                line: i
                            });


                            return true;
                        }
                        return true;
                    }

                } catch (ex) {
                    console.log('fieldChanged exception: ' + ex);
                }
            }
        }

        function success2(res) {
        }

        function failure(res) {

        }

        function saveRecord(context) {
            var currentUser = runtime.getCurrentUser();
            var subsidiary = currentUser.subsidiary
            if (subsidiary == '2') {
                try {

                    var currentRecord = context.currentRecord;
                    var recid = currentRecord.id;

                    var jt = currentRecord.getValue({
                        fieldId: 'custrecord_crc_job_type'
                    });

                    var s = currentRecord.getText({
                        fieldId: 'custrecord_crc_start_date'
                    });

                    var e = currentRecord.getText({
                        fieldId: 'custrecord_crc_end_date'
                    });
                    var e = currentRecord.getText({
                        fieldId: 'custrecord_crc_end_date'
                    });

                    var c = currentRecord.getValue({
                        fieldId: 'custrecord_crc_customer'
                    });

                    if (util.isEmpty(s) || util.isEmpty(e) || util.isEmpty(jt) || util.isEmpty(c)) return;


                    var vals = SearchCards(c, s, e, jt, recid); if (!vals) return true;

                    var errmsg = 'The rate card will not be saved - ERROR: A customer rate card already exists. <br><br>' +
                        'Document No: <b>' + vals.docno + '</b>  <br>' +
                        'Customer: ' + vals.custid + '  <br>' +
                        'Start Date: ' + vals.start + '  <br>' +
                        'End Date: ' + vals.end + '  <br>' +
                        'Job Type: ' + vals.jobtype + '  <br>';

                    var options = {
                        title: 'Attention',
                        message: errmsg
                    };

                    _nDialog.alert(options).then(function success(choice) {
                        //console.log('Success with value ' + choice);
                    }).catch(failure);

                } catch (ex) {
                    console.log('saveRecord exception: ' + ex);
                }
            }
        }



        function failure(reason) {
            console.log('Failure: ' + reason);
            return false;
        }

        function SearchCards(c, s, e, jt, recid) {
            try {

                console.log('saveRecord s: ' + s);
                console.log('saveRecord e: ' + e);
                console.log('saveRecord jt: ' + jt);

                var filters = [
                    [["formulatext: CASE WHEN TO_DATE('" + s + "', 'DD/MM/YYYY') BETWEEN TO_DATE({custrecord_crc_start_date}, 'DD/MM/YYYY') AND TO_DATE({custrecord_crc_end_date}, 'DD/MM/YYYY') THEN 0 ELSE 1 END", "is", "0"],
                        "OR",
                    ["formulatext: CASE WHEN TO_DATE('" + e + "', 'DD/MM/YYYY') BETWEEN TO_DATE({custrecord_crc_start_date}, 'DD/MM/YYYY')  AND TO_DATE({custrecord_crc_end_date}, 'DD/MM/YYYY') THEN 0 ELSE 1 END", "is", "0"]
                    ],
                    "AND",
                    ["isinactive", "is", "F"],
                    "AND",
                    ["custrecord_crc_job_type", "anyof", jt],
                    "AND",
                    ["custrecord_crc_customer", "anyof", c]
                ];

                if (!util.isEmpty(recid)) {
                    filters.push('AND');
                    filters.push(["internalid", "noneof", recid]);
                }

                var crcObj = _nSearch.create({
                    type: "customrecord_customer_rate_card",

                    filters: filters,
                    columns:
                        [
                            "custrecord_crc_customer",
                            "custrecord_crc_start_date",
                            "custrecord_crc_end_date",
                            "custrecord_crc_job_type",
                            "custrecord_crc_doc_number"
                        ]
                });
                var searchResultCount = crcObj.runPaged().count;
                log.debug("crcObj result count", searchResultCount);
                if (searchResultCount == 0) return null;
                var obj = {};
                crcObj.run().each(function (result) {
                    // .run().each has a limit of 4,000 results
                    obj.id = result.id;
                    obj.start = result.getValue('custrecord_crc_start_date');
                    obj.end = result.getValue('custrecord_crc_end_date');
                    obj.jobtype = result.getText('custrecord_crc_job_type');
                    obj.docno = result.getValue('custrecord_crc_doc_number');
                    obj.custid = result.getText('custrecord_crc_customer');

                    return true;
                });
                return obj;
            } catch (ex) {
                console.log('SearchCards ex: ' + ex);
            }
        }



        function lineInit(context) {
            var currentUser = runtime.getCurrentUser();
            var subsidiary = currentUser.subsidiary
            if (subsidiary == '2') {
                try {

                    var currentRecord = context.currentRecord;
                    currentItem = currentRecord.getCurrentSublistValue({
                        sublistId: 'recmachcustrecord_crc_parent',
                        fieldId: 'custrecord_crc_item'
                    });

                    currentLineNo = currentRecord.getCurrentSublistValue({
                        sublistId: 'recmachcustrecord_crc_parent',
                        fieldId: 'custrecord_crc_item_no'
                    });

                } catch (ex) {
                    console.log('lineInit ex: ' + ex);
                }
            }
        }
        return {
            fieldChanged: fieldChanged,
            saveRecord: saveRecord,
            lineInit: lineInit,
            validateLine: validateLine,
            sublistChanged: sublistChanged
            //validateDelete : validateDelete,
            //validateInsert : validateInsert
            //postSourcing : postSourcing
        };
    });