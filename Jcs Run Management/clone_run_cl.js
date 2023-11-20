/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/record', 'SuiteScripts/Jcs Run Management/sweetalert2.all.min.js', 'N/url'], function (currentRecord, record, Swal1, url) {

    var exports = {};
    function pageInit(context) {
    }
    function cloneRun(type) {
        Swal1.fire({
            onBeforeOpen: Swal1.showLoading,
            onOpen: function () {
                var rec = currentRecord.get().id;

                var suiteletUrl = url.resolveScript({
                    scriptId: 'customscript_jcs_clone_run_sl',
                    deploymentId: 'customdeploy_jcs_clone_run_sl'
                });
                console.log(suiteletUrl)
                try {
                    jQuery.ajax({
                        method: 'GET',
                        url: suiteletUrl + "&recid=" + rec + "&type=" + type,
                        success: function (result) {
                            if (result.status == true) {
                                alert("Run Job Clone Record sucessfully.");
                                window.location.reload();
                            }
                            else {
                                alert("Please contact admin!");
                                window.location.reload();
                            }

                        }
                    })

                } catch (error) {
                    console.log("erro", error);
                    alert("Please contact admin!")
                    window.location.reload();
                }




            },
            allowOutsideClick: false,
            allowEscapeKey: true,
            text: "Processing"
        });


    }
    function closeRun(type) {
        Swal1.fire({
            onBeforeOpen: Swal1.showLoading,
            onOpen: function () {
                var rec = currentRecord.get().id;
                var reason = prompt("Enter a reason for the cancellation:", "");
                if (reason == null || reason == "") {
                    alert('You are required to give a reason for cancellation');
                    window.location.reload();
                } else {
                    record.submitFields({
                        type: 'customrecord_ddc_run',
                        id: currentRecord.get().id,
                        values: {
                            'custrecord_ddc_run_status_reason': reason
                        }

                    })
                    var suiteletUrl = url.resolveScript({
                        scriptId: 'customscript_jcs_close_run_sl',
                        deploymentId: 'customdeploy_jcs_close_run_sl'
                    });
                    console.log(suiteletUrl)
                    try {
                        jQuery.ajax({
                            method: 'GET',
                            url: suiteletUrl + "&recid=" + rec + "&type=" + type,
                            success: function (result) {
                                if (result.status == true) {
                                    alert("Run Job Close Record sucessfully.");
                                    window.location.reload();
                                }
                                else {
                                    alert("System busy!please contact admin!");
                                    window.location.reload();
                                }
    
                            }
                        })
    
                    } catch (error) {
                        console.log("erro", error);
                        alert("System busy!please contact admin!")
                        window.location.reload();
                    }
    
                }
               



            },
            allowOutsideClick: false,
            allowEscapeKey: true,
            text: "Processing"
        });


    }
    exports.pageInit = pageInit;
    exports.cloneRun = cloneRun;
    exports.closeRun = closeRun;
    return exports;
});
1