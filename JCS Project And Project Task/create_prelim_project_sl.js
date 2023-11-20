/**
 * @name:                                       create_prelim_project_sl.js
 * @author:                                     Patrick Lising
 * @summary:                                    Script Description
 * @copyright:                                  © Copyright by Jcurve Solutions
 * Date Created:                                Thu Sep 22 2022 9:29:22 AM
 * Change Logs:
 * Date                          Author               Description
 * Thu Sep 22 2022 9:29:22 AM -- Patrick Lising -- Initial Creation
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */

define(['N/https', 'N/record', 'N/search', './lodash.js'], function (https, record, search, _) {

    function onRequest(context) {

        if (context.request.method == https.Method.GET) {

            log.debug({
                title: "Suitelet call",
                details: "Called from button"
            })

            log.debug({
                title: "recId",
                details: context.request.parameters.recId
            })

            var quoteId = context.request.parameters.recId

            if (quoteId) {

                var quoteRec = record.load({
                    type: record.Type.ESTIMATE,
                    id: quoteId
                })

                var prelimProject = quoteRec.getValue({
                    fieldId: "custbody_ddc_prelim_project"
                })

                log.debug({
                    title: "prelimProject exists?",
                    details: prelimProject
                })

                //if no value on prelim project field, create Prelim Project

                if (!prelimProject) {

                    log.debug({
                        title: "Create Project and Project Tasks",
                        details: "Prelim Project does not exist. Proceed to create Project and Project Tasks"
                    })

                    // GR 20-01-2023 - Adding Customer to Project - Fetch Customer from transaction
                    var customerId = quoteRec.getValue({
                        fieldId: 'entity'
                    })

                    var campaignName = quoteRec.getValue({
                        fieldId: 'custbody_ddc_campaign_job_name'
                    })
                    
                    var lineCount = quoteRec.getLineCount({
                        sublistId: "item"
                    })

                    var createProjectRec = record.create({
                        type: record.Type.JOB
                    })

                    createProjectRec.setValue({
                        fieldId: 'customform',
                        value: 154
                    })

                    createProjectRec.setValue({
                        fieldId: 'companyname',
                        value: 'Prelim Project ' + campaignName
                    })

                    // GR 20-01-2023 - Adding Customer to Project - Set Customer on Project
                    createProjectRec.setValue({
                        fieldId: 'parent',
                        value: customerId
                    })                  
                  
                    createProjectRec.setValue({
                        fieldId: 'subsidiary',
                        value: 2
                    })

                    createProjectRec.setValue({
                        fieldId: 'projectexpensetype',
                        value: -2
                    })

                    createProjectRec.setValue({
                        fieldId: 'custentity_ddc_linked_transaction',
                        value: quoteId
                    })
                    
                    var projectId = createProjectRec.save()

                    //if project was created, create Project Tasks for it

                    if (projectId) {

                        var itemArr = [];

                        //set Prelim Project ID on the Quote

                        record.submitFields({
                            type: record.Type.ESTIMATE,
                            id: quoteId,
                            values: {
                                'custbody_ddc_prelim_project': projectId
                            }
                        })

                        for (var i = 0; i < lineCount; i++) {

                            //store item description, qty in an object array

                            var itemId = quoteRec.getSublistValue({
                                sublistId: "item",
                                fieldId: "item",
                                line: i
                            })

                            // var projectTask = quoteRec.getSublistValue({
                            //     sublistId: "item",
                            //     fieldId: "custcol_ddc_item_project_task",
                            //     line: i
                            // })

                            var itemLookup = search.lookupFields({
                                type: 'item',
                                id: itemId,
                                columns: 'custitem_ddc_project_task_cb'
                            })

                            var projectTask = itemLookup.custitem_ddc_project_task_cb

                            if (projectTask) {

                                log.debug({
                                    title: "Item Project task is T",
                                    details: "item: " + itemId
                                })

                                var itemDesc = quoteRec.getSublistValue({
                                    sublistId: "item",
                                    fieldId: "description",
                                    line: i
                                })

                                var estimatedQty = quoteRec.getSublistValue({
                                    sublistId: "item",
                                    fieldId: "custcol_ddc_estimated_qty",
                                    line: i
                                })
                            var department=quoteRec.getSublistValue({
                                sublistId: "item",
                                fieldId: "department",
                                line: i
                            })
                            var classLineSo=quoteRec.getSublistValue({
                                sublistId: "item",
                                fieldId: "class",
                                line: i
                            })
                            var itemCategory=quoteRec.getSublistValue({
                                sublistId: "item",
                                fieldId: "custcol_ddc_item_category",
                                line: i
                            })

                                if (itemDesc.includes('Overtime')) {
                                    itemArr.push({
                                        'itemId': itemId,
                                        'itemDesc': itemDesc,
                                        'estimatedQty': estimatedQty,
                                        'parentItem': itemDesc.replace(' Overtime', ''),
                                    'department':department,
                                    'classLineSo':classLineSo,
                                    'itemCategory':itemCategory
                                    })
                                } else {
                                    itemArr.push({
                                        'itemId': itemId,
                                        'itemDesc': itemDesc,
                                        'estimatedQty': estimatedQty,
                                        'parentItem': itemDesc,
                                    'department':department,
                                    'classLineSo':classLineSo,
                                    'itemCategory':itemCategory
                                    })
                                }

                            }

                        }

                        log.debug({
                            title: "itemArr values",
                            details: "itemArr: " + JSON.stringify(itemArr)
                        })

                        //after pushing valid items into itemArr, check for overtime items and sum them up with the parent item

                        var groupedArr = _.groupBy(itemArr, 'parentItem')
                        var totalQty = 0;

                        var department;
                        var classLineSo;
                        var itemCategory;
                        log.debug({
                            title: 'groupedArr value',
                            details: groupedArr
                        })

                        Object.keys(groupedArr).forEach((keys, keyIndex) => {
                            log.debug({
                                title: 'groupedArr Keys',
                                details: keyIndex + ' || ' + keys
                            })
                            var totalQty = 0
                            groupedArr[keys].forEach((value, index) => {
                                log.debug({
                                    title: 'object value',
                                    details: value
                                })
                            department=value.department;
                            classLineSo=value.classLineSo;
                            itemCategory=value.itemCategory;
                                totalQty += value.estimatedQty
                            })
                            //after sum of totalQty

                            //create Project Task for each Key
                            var projTaskRecord = record.create({
                                type: record.Type.PROJECT_TASK
                            })

                            projTaskRecord.setValue({
                                fieldId: 'company',
                                value: projectId
                            })

                            projTaskRecord.setValue({
                                fieldId: 'title',
                                value: keys
                            })

                            projTaskRecord.setValue({
                                fieldId: 'plannedwork',
                                value: totalQty
                            })
                        //add 
                        projTaskRecord.setValue({
                            fieldId: 'custevent_ddc_department',
                            value: department
                        })
                        //
                        projTaskRecord.setValue({
                            fieldId: 'custevent_ddc_project_task_class',
                            value: classLineSo
                        })
                        //
                        projTaskRecord.setValue({
                            fieldId: 'custevent_ddc_task_category',
                            value: itemCategory
                        })
                            var projectTaskId = projTaskRecord.save()

                            log.debug({
                                title: "created Project Task",
                                details: "Project Task ID: " + projectTaskId
                            })

                            //mark the Project task Created? checkbox on the Prelim Project
                            // if (projectTaskId) {
                            //     record.submitFields({
                            //         type: record.Type.JOB,
                            //         id: projectId,
                            //         values: {
                            //             'custentity_project_task_created': true
                            //         }
                            //     })
                            // }

                        })
                    }

                }
            }
        }
    }

    return {
        onRequest: onRequest
    }
});

