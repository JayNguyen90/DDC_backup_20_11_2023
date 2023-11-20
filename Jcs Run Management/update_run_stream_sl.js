/**
 *@NApiVersion 2.1
*@NScriptType Suitelet
*/
define(['N/ui/serverWidget', 'N/search', 'N/task', 'N/ui/message', 'N/format', 'N/runtime'], function (serverWidget, search, task, message, format, runtime) {

    function onRequest(context) {

        var method = context.request.method
        var jobId = context.request.parameters.jobId
        if (!jobId) {
            jobId = context.request.parameters.custpage_jobid
        }
        log.debug("jobId", jobId);
        var form = serverWidget.createForm({
            title: 'Update Manage Runs/Streams',
            hideNavBar: true
        })

        form.addSubmitButton({
            label: 'Submit'
        });
        form.addFieldGroup({
            id: 'fieldgroup_primary',
            label: 'Primary'
        });
        var run = form.addField({
            id: 'custpage_run',
            type: serverWidget.FieldType.SELECT,
            label: 'Run',
            container: 'fieldgroup_primary'
        })
        run.addSelectOption({
            value: "None",
            text: "All",
        });
        run.isMandatory = true;
        var runList = getRunByJob(jobId)
        log.debug("runList", runList)
        for (var i = 0; i < runList.length; i++) {
            run.addSelectOption({
                value: runList[i].value,
                text: runList[i].text,
            });
        }
        var runIdArr = runList.map(x => x.value);
        log.debug("runIdArr", runIdArr)
        runIdArr = [...new Set(runIdArr)];
        var runDetailList = getRunDetail(runIdArr)
        var runDetail = form.addField({
            id: 'custpage_run_detail',
            type: serverWidget.FieldType.SELECT,
            label: 'Run Detail Stream Name',
            container: 'fieldgroup_primary'
        })
        runDetail.addSelectOption({
            value: "",
            text: "All",
        });
        for (var i = 0; i < runDetailList.length; i++) {
            runDetail.addSelectOption({
                value: runDetailList[i].value,
                text: runDetailList[i].text,
            });
        }
        var jobIdFiled = form.addField({
            id: 'custpage_jobid',
            label: 'Job ID',
            type: serverWidget.FieldType.TEXT,
            container: 'fieldgroup_item_info'
        });
        jobIdFiled.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });
        if (jobId) {
            jobIdFiled.defaultValue = jobId.toString()
        }
        if (method == 'POST') {
            var runDetailParamter = context.request.parameters.custpage_run_detail
            log.debug("runDetailParamter", runDetailParamter);
            runDetail.defaultValue = runDetailParamter
            var runParamter = context.request.parameters.custpage_run
            log.debug("runParamter", runParamter);
            // var runParamter=runParamter.split("\u0005");
            // log.debug("runParamter",runParamter)

            run.defaultValue = runParamter
            var sublist = form.addSublist({
                id: 'custpage_sublist',
                type: serverWidget.SublistType.LIST,
                label: 'Detail'
            });
            sublist.addMarkAllButtons();
            sublist.addField({
                id: 'custpage_updateduedate',
                label: 'Update?',
                type: serverWidget.FieldType.CHECKBOX
            });
            sublist.addField({
                id: 'custpage_run_internalid',
                type: serverWidget.FieldType.TEXT,
                label: 'Run Internal ID'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            sublist.addField({
                id: 'custpage_job_id',
                type: serverWidget.FieldType.TEXT,
                label: 'Job ID'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            sublist.addField({
                id: 'custpage_run_id',
                type: serverWidget.FieldType.TEXT,
                label: 'Run Id'
            })
            sublist.addField({
                id: 'custpage_stream_name',
                type: serverWidget.FieldType.TEXT,
                label: 'Stream Name'
            })
            sublist.addField({
                id: 'custpage_stream_number',
                type: serverWidget.FieldType.TEXT,
                label: 'Stream Number'
            })

            sublist.addField({
                id: 'custpage_start_date',
                type: serverWidget.FieldType.DATE,
                label: 'Start Date'
            }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });

            sublist.addField({
                id: 'custpage_end_date',
                type: serverWidget.FieldType.DATE,
                label: 'End Date'
            }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });


            var runDetailStatus = sublist.addField({
                id: 'custpage_run_detail_status',
                type: serverWidget.FieldType.SELECT,
                label: 'Status',
            }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
            runDetailStatus.addSelectOption({
                value: "",
                text: "",
            });
            // runDetailStatus.addSelectOption({
            //     value: 1,
            //     text: "Pending",
            // });
            // runDetailStatus.addSelectOption({
            //     value: 10,
            //     text: "Planning",
            // });
            runDetailStatus.addSelectOption({
                value: 8,
                text: "Cancelled",
            });
            runDetailStatus.addSelectOption({
                value: 7,
                text: 'On Hold',
            });
           
            sublist.addField({
                id: 'custpage_production_approval_status',
                type: serverWidget.FieldType.SELECT,
                label: 'Production Approval Status',
                source: 'customlist_ddc_product_approval_status',
            }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });



            var runDetail = getDataRunDetail(runParamter, runDetailParamter, jobId)
            runDetail = runDetail.filter(
                (obj, index) =>
                    runDetail.findIndex((item) => item.streamName === obj.streamName&&item.rundId === obj.rundId) === index
            );
            for (var i = 0; i < runDetail.length; i++) {
                sublist.setSublistValue({ id: 'custpage_run_internalid', line: i, value: runDetail[i].runInternalId });
                sublist.setSublistValue({ id: 'custpage_job_id', line: i, value: runDetail[i].jobId });
                sublist.setSublistValue({ id: 'custpage_run_id', line: i, value: runDetail[i].rundId });
                sublist.setSublistValue({ id: 'custpage_stream_name', line: i, value: runDetail[i].streamName });
                if (runDetail[i].streamNumber) {
                    sublist.setSublistValue({ id: 'custpage_stream_number', line: i, value: runDetail[i].streamNumber });

                }
            }
            var count = context.request.getLineCount({
                group: 'custpage_sublist'
            });
            log.debug('count', count);
            var toUpdateArr = [];
            for (var i = 0; i < count; i++) {

                var updateDueDate = context.request.getSublistValue({
                    group: 'custpage_sublist',
                    name: 'custpage_updateduedate',
                    line: i
                });

                if (updateDueDate == 'T') {
                    var runInternalId = context.request.getSublistValue({
                        group: 'custpage_sublist',
                        name: 'custpage_run_internalid',
                        line: i
                    });
                    var jobId = context.request.getSublistValue({
                        group: 'custpage_sublist',
                        name: 'custpage_job_id',
                        line: i
                    });
                    var rundId = context.request.getSublistValue({
                        group: 'custpage_sublist',
                        name: 'custpage_run_id',
                        line: i
                    });

                    var streamName = context.request.getSublistValue({
                        group: 'custpage_sublist',
                        name: 'custpage_stream_name',
                        line: i
                    });
                    var startDate = context.request.getSublistValue({
                        group: 'custpage_sublist',
                        name: 'custpage_start_date',
                        line: i
                    });
                    
                    var endDate = context.request.getSublistValue({
                        group: 'custpage_sublist',
                        name: 'custpage_end_date',
                        line: i
                    });

                    var runDetailStatus = context.request.getSublistValue({
                        group: 'custpage_sublist',
                        name: 'custpage_run_detail_status',
                        line: i
                    });

                    var productioApprovalStatus = context.request.getSublistValue({
                        group: 'custpage_sublist',
                        name: 'custpage_production_approval_status',
                        line: i
                    });

                    toUpdateArr.push({
                        jobId:jobId,
                        runInternalId: runInternalId,
                        rundId: rundId,
                        streamName: streamName,
                        startDate:startDate,
                        endDate:endDate,
                        runDetailStatus:runDetailStatus,
                        productioApprovalStatus:productioApprovalStatus

                    })

                }
            }
            if (toUpdateArr.length) {
                var taskId = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    params: {
                        custscript_jcs_data_run_detail_process: JSON.stringify(toUpdateArr),
                    },
                    scriptId: 'customscript_jcs_update_runs_stream_mr'
                }).submit()
                log.debug("taskId", taskId);
                if (taskId) {
                    form.addPageInitMessage({
                        type: message.Type.CONFIRMATION,
                        title: 'Update Stream Success',
                        message: 'Update Stream are now being processed.',
                    });
                }
                else {
                    form.addPageInitMessage({
                        type: message.Type.WARNING,
                        title: 'Update Stream Success',
                        message: 'Job busy',
                    });
                }

            }


        }

        context.response.writePage(form);


    }
    function getAllResults(search) {
        var results = [];
        var pgSize = 1000;
        var r = search.runPaged({ pageSize: pgSize });
        var numPage = r.pageRanges.length;
        var searchPage;
        var ssResult;
        for (var np = 0; np < numPage; np++) {
            searchPage = r.fetch({ index: np });
            ssResult = searchPage.data;
            if (ssResult != undefined && ssResult != null && ssResult != '') {
                results = results.concat(ssResult);
            }
        }
        return results;

    }
    function getRunDetail(runArr) {
        var ret = [];
        var runDetailSearch = search.create({
            type: "customrecord_ddc_run_detail",
            filters:
                [
                    ["custrecord_ddc_rd_parent_run", "anyof", runArr]
                ],
            columns:
                [
                    search.createColumn({ name: "custrecord_ddc_rd_stream_name", label: "Stream Name" }),

                ]
        });
        var searchResultCount = runDetailSearch.runPaged().count;
        log.debug("customrecord_ddc_run_detailSearchObj result count", searchResultCount);
        if (runDetailSearch) {
            var ssResult = getAllResults(runDetailSearch);
            for (var i = 0; i < ssResult.length; i++) {
                var streamName = (ssResult[i].getValue('custrecord_ddc_rd_stream_name'));
                ret.push(streamName)
            }
        }
        else {
            log.debug(waJcurce, ' Return Null, Search issue');
            return [];
        }
        log.debug("ret",ret);
        ret = [...new Set(ret)];
        var data = [];
        for (var i = 0; i < ret.length; i++) {
            data.push({
                value: ret[i],
                text: ret[i],
            });
        }
        return data;
    }
    function getDataRunDetail(runDetailParamter, runParamter, jobId) {
        var ret = [];
        var filterArr=[
            ["custrecord_ddc_rd_parent_run.custrecord_ddc_run_job", "anyof", jobId]
        ]
        if(runParamter){
            filterArr=filterArr.concat(["AND", ["custrecord_ddc_rd_stream_name","is",runParamter]])
        }
        if(runDetailParamter!="None"){
            filterArr=filterArr.concat(["AND", ["custrecord_ddc_rd_parent_run.internalid","is",runDetailParamter]])
        }
        var runDetailSearch = search.create({
            type: "customrecord_ddc_run_detail",
            filters:filterArr,
            columns:
                [
                    search.createColumn({
                        name: "custrecord_ddc_run_id",
                        join: "CUSTRECORD_DDC_RD_PARENT_RUN",
                        label: "DDC Run ID"
                    }),
                    search.createColumn({ name: "custrecord_ddc_rd_stream_name", label: "Stream Name" }),
                    search.createColumn({ name: "custrecord_ddc_rd_stream_number", label: "Stream Number" }),
                    search.createColumn({ name: "custrecord_ddc_rd_planned_startdate", label: "Planned Start Date" }),
                    search.createColumn({ name: "custrecord_ddc_rd_planned_enddate", label: "Planned End Date" }),
                    search.createColumn({ name: "custrecord_ddc_rd_status", label: "Run Detail Status" }),
                    search.createColumn({ name: "custrecord_ddc_rd_prod_approval_status", label: "Run Detail Production Approval Status" }),
                    search.createColumn({
                        name: "internalid",
                        join: "CUSTRECORD_DDC_RD_PARENT_RUN",
                        label: "Internal ID"
                    }),
                    search.createColumn({
                        name: "custrecord_ddc_run_job",
                        join: "CUSTRECORD_DDC_RD_PARENT_RUN",
                        label: "Job"
                    })
                ]
        });
        var searchResultCount = runDetailSearch.runPaged().count;
        var cols = runDetailSearch.columns;
        log.debug("getDataRunDetail count", searchResultCount);
        if (runDetailSearch) {
            var ssResult = getAllResults(runDetailSearch);
            for (var i = 0; i < ssResult.length; i++) {
                var rundId = ssResult[i].getValue(cols[0]);
                var streamName = ssResult[i].getValue('custrecord_ddc_rd_stream_name');
                var streamNumber = ssResult[i].getValue('custrecord_ddc_rd_stream_number');
                var startDate = ssResult[i].getValue('custrecord_ddc_rd_planned_startdate');
                var endDate = ssResult[i].getValue('custrecord_ddc_rd_planned_enddate');
                var runDetailStatus = ssResult[i].getValue('custrecord_ddc_rd_status');
                var runDetailStatusText = ssResult[i].getText('custrecord_ddc_rd_status');
                var productionApprovalStatus = ssResult[i].getValue('custrecord_ddc_rd_prod_approval_status');
                var productionApprovalStatusText = ssResult[i].getText('custrecord_ddc_rd_prod_approval_status');
                var runInternalId = ssResult[i].getValue(cols[7]);
                var jobId = ssResult[i].getValue(cols[8]);
                ret.push({
                    rundId: rundId,
                    streamName: streamName,
                    streamNumber: streamNumber,
                    startDate: startDate,
                    endDate: endDate,
                    runDetailStatus: runDetailStatus,
                    runDetailStatusText: runDetailStatusText,
                    productionApprovalStatus: productionApprovalStatus,
                    productionApprovalStatusText: productionApprovalStatusText,
                    runInternalId: runInternalId,
                    jobId:jobId
                })
            }
        }
        else {
            log.debug(waJcurce, ' Return Null, Search issue');
            return [];
        }

        return ret;
    }
    function getRunByJob(saleOrderId) {
        var runArr = [];
        var searchRun = search.create({
            type: "customrecord_ddc_run",
            filters:
                [
                    ["custrecord_ddc_run_job", "anyof", saleOrderId]
                ],
            columns:
                [
                    search.createColumn({ name: "internalid", label: "Internal ID" }),
                    search.createColumn({ name: "custrecord_ddc_run_id", label: "DDC Run Id" })
                ]
        });
        var searchRunCount = searchRun.runPaged().count;
        log.debug("searchRunCount", searchRunCount);
        if (searchRun) {
            var ssResult = getAllResults(searchRun);
            for (var i = 0; i < ssResult.length; i++) {
                var internalid = ssResult[i].id;
                var runId = ssResult[i].getValue('custrecord_ddc_run_id');
                runArr.push({
                    value: internalid,
                    text: runId
                });
            }
        }
        else {
            log.debug(waJcurce, ' Return Null, Search issue');
            return [];
        }
        return runArr;
    }


    return {
        onRequest: onRequest
    }
});
