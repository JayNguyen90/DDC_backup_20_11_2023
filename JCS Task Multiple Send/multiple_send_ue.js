/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 * @name:                                       multiple_send_ue.js
 * @author:                                     Patrick Lising
 * @summary:                                    Script Description
 * @copyright:                                  © Copyright by Jcurve Solutions
 * Date Created:                                Fri Mar 31 2023 9:43:25 AM
 * Change Logs:
 * Date                          Author               Description
 * Fri Mar 31 2023 9:43:25 AM -- Patrick Lising -- Initial Creation
 */

define(['N/email', 'N/runtime', 'N/url', 'N/search','N/record'], function (email, runtime, url, search,record) {

    function multiple_send_beforeSubmit(context) {

    }

    function multiple_send_afterSubmit(context) {
        var currRec = context.newRecord;
        let currentUser = runtime.getCurrentUser()

        //validation: check custevent_ddc_vrf_notify_assignees_by_e before triggering sending email

        var notifyAssignees = currRec.getValue({
            fieldId: 'custevent_ddc_vrf_notify_assignees_by_e'
        })

        if (notifyAssignees) { //if true, send email to assignees (custevent_ddc_assignees)

            //sandbox 1 accountDomain
            var accountDomain = 'https://5281669-sb1.app.netsuite.com'
            var recordUrl = url.resolveRecord({
                recordType: 'task',
                recordId: currRec.id,
                isEditMode: false
            });
            var currRec=record.load({
                type: 'task',
                id: currRec.id,
            })
            var emailUrl = accountDomain + recordUrl

            var linkedJobSubsidiary = currRec.getValue({
                fieldId: 'custevent_ddc_vrf_job_subsidiary'
            })

            //check for Linked Job Subsidiary if the value is “IVE Group Limited : IVE Group Australia Pty Ltd : IVE - Data Driven Communications“.

            if (linkedJobSubsidiary == 2) {

                var assignees = currRec.getValue({
                    fieldId: 'custevent_ddc_assignees'
                })

                // var customForm = currRec.getValue({
                //     fieldId: 'customform'
                // })

                //May 29 changed script to allow any task from with prefix DDC
                var customForm = currRec.getText({
                    fieldId: 'customform'
                })
                
                let createdBy = currentUser.name

                var emailSubject
                var emailBody

                //if (customForm == 'DDC - Task Form') {
                //if (customForm == 151) {

                if (customForm == 'DDC - Variation Request Form') {
                    //} else if (customForm == 2862) {

                    log.debug({
                        title: 'Variation Process',
                        details: customForm
                    })

                    var variationTitle = currRec.getValue({
                        fieldId: 'title'
                    })
                    let variationDescription = currRec.getValue({
                        fieldId: 'custevent_ddc_vrf_variation_description'
                    })
                    let variationStatus = currRec.getValue({
                        fieldId: 'custevent_ddc_vrf_status'
                    })

                    var variationStatusValue = getVariationStatusValue(variationStatus)

                    let variationDateRaised = currRec.getValue({
                        fieldId: 'custevent_ddc_vrf_date_raised'
                    })
                    let variationDetail = currRec.getValue({
                        fieldId: 'message'
                    })
                    var variationUrgency = currRec.getValue({
                        fieldId: 'custevent_ddc_vrf_urgent'
                    })
                    var variationPriority = ''

                    if (variationUrgency) {
                        variationPriority = 'Urgent'
                    } else {
                        variationPriority = 'Normal'
                    }

                    emailSubject = variationTitle + ' ' + variationDescription
                    emailBody = 'The following task has been assigned to you by ' + createdBy + ' in IVE Group Australia Pty Ltd.<br><br>' +
                        'Information regarding the task has been posted below.<br>' +
                        'To view the task record, log in to NetSuite then navigate to: <a href=' + emailUrl + '>Click Here</a><br><br>' +
                        'Variation Description - Summary: ' + variationDescription + '<br>' +
                        'Priority: ' + variationPriority + '<br>' +
                        'Status: ' + variationStatusValue + '<br>' +
                        'Date Raised: ' + variationDateRaised + '<br>' +
                        'Comments: ' + variationDetail + '<br>'
                } else if (customForm.startsWith('DDC')) {

                    log.debug({
                        title: 'Any Task Form',
                        details: customForm
                    })

                    let taskTitle = currRec.getValue({
                        fieldId: 'title'
                    })
                    let taskPriority = currRec.getValue({
                        fieldId: 'priority'
                    })
                    let taskStatus = currRec.getValue({
                        fieldId: 'status'
                    })

                    let taskComments = currRec.getValue({
                        fieldId: 'message'
                    })

                    let startDate = currRec.getValue({
                        fieldId: 'startdate'
                    })
                    let endDate = currRec.getValue({
                        fieldId: 'duedate'
                    })

                    emailSubject = taskTitle
                    emailBody = 'The following task has been assigned to you by ' + createdBy + ' in IVE Group Australia Pty Ltd.<br><br>' +
                        'Information regarding the task has been posted below.<br>' +
                        'To view the task record, log in to NetSuite then navigate to: <a href=' + emailUrl + '>Click Here</a> <br><br>' +
                        'Task: ' + taskTitle + '<br>' +
                        'Priority: ' + taskPriority + '<br>' +
                        'Status: ' + taskStatus + '<br>' +
                        'Start Date: ' + startDate + '<br>' +
                        'Due Date: ' + endDate + '<br>' +
                        'Comments: ' + taskComments + '<br>'

                }

                //after sourcing values, proceed with sending the email

                email.send({
                    author: currentUser.id,
                    recipients: assignees,
                    subject: emailSubject,
                    body: emailBody,
                })

            }
        }
    }

    function getVariationStatusValue(variationFieldValue) {

        var variationStatusValues = []

        var variationStatusList = search.create({
            type: 'customlist_ddc_vrf_status',
            filters:
                [
                    ["internalid", "anyof", variationFieldValue]
                ],
            columns:
                [
                    search.createColumn({
                        name: "name"
                    })
                ]
        })

        variationStatusList.run().each(function (result) {
            variationStatusValues.push(result.getValue('name'))
            return true;
        })

        return variationStatusValues

    }

    return {
        //beforeSubmit: multiple_send_beforeSubmit
        afterSubmit: multiple_send_afterSubmit
    }
});
