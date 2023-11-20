/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 *@NModuleScope Public
 */
define(['N/currentRecord', 'N/format', 'N/query', 'N/record', 'N/runtime', 'N/search', 'N/ui/message', 'N/url', 'SuiteScripts/Jcs Run Management/sweetalert2.all.min.js'],
    function (currentRecord, format, query, record, runtime, search, message, url, Swal1) {


        function pageInit(context) {



        }
        function createVariationJob(id) {
            console.log("id",id);
            Swal1.fire({
                onBeforeOpen: Swal1.showLoading,
                onOpen: function () {
                    var rec = currentRecord.get().id;
                    if(!rec){
                        rec=id;
                    }
                    var parentJob=record.load({
                        type: 'salesorder',
                        id: rec,
                        //isDynamic: true,
                    })
                    var countJobVariations=parseInt(parentJob.getValue('custbody_ddc_linked_variations_count'))||0
                    countJobVariations+=1;
                    console.log("countJobVariations",countJobVariations)
                    parentJob.setValue('custbody_ddc_linked_variations_count',countJobVariations);
                    // var recParentJob=parentJob.save();
                    // console.log("recParentJob",recParentJob);
                    record.submitFields({
                        type: 'salesorder',
                        id: rec,
                        values: {
                            'custbody_ddc_linked_variations_count': countJobVariations,
                        }
                    })
                    var suiteletUrl = url.resolveScript({
                        scriptId: 'customscript_jcs_create_job_variation_sl',
                        deploymentId: 'customdeploy_jcs_create_job_variation_sl'
                    });
                    console.log(suiteletUrl)
                    try {
                        try {
                            url = suiteletUrl + "&recid=" + rec
                            window.open(url);
                            window.location.reload();

                        } catch (error) {
                            console.log("error", error);
                            alert("Please contact admin!")
                            window.location.reload();
                        }

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

        function popupButton_OnClick(context) {
            var suiteletURL = getPopupURL();
            window.open(suiteletURL, "Create Runs/Streams", "width=1000,height=600");
        }
        function popupButton_OnClick_Update(context) {
            var suiteletURL = getPopupURLUpdate();
            window.open(suiteletURL, "Create Runs/Streams", "width=1000,height=600");
        }
        function getPopupURL(context) {
            var newRecord = currentRecord.get();
            var suiteletURL = url.resolveScript({
                scriptId: 'customscript_jcs_create_runs_stream_sl',
                deploymentId: 'customdeploy_jcs_create_runs_stream_sl',
                returnExternalUrl: false
            });

            try {
                suiteletURL += '&jobId=' + newRecord.id;

            } catch (e) {
                alert(JSON.stringify(e))
            }
            return suiteletURL
        }


        function getPopupURLUpdate(context) {
            var newRecord = currentRecord.get();
            var suiteletURL = url.resolveScript({
                scriptId: 'customscript_jcs_update_runs_stream',
                deploymentId: 'customdeploy_jcs_update_runs_stream',
                returnExternalUrl: false
            });

            try {
                suiteletURL += '&jobId=' + newRecord.id;

            } catch (e) {
                alert(JSON.stringify(e))
            }
            return suiteletURL
        }
        function clearFilter() {
            var rec = currentRecord.get();
            var serviceType = rec.getValue('custpage_service_type');
            rec.setValue('custpage_service_type', '')
            rec.setValue('custpage_service_type', serviceType)
            rec.getField('custpage_service_type').isDisabled = true;

        }






        return {
            pageInit: pageInit,
            popupButton_OnClick: popupButton_OnClick,
            popupButton_OnClick_Update: popupButton_OnClick_Update,
            clearFilter: clearFilter,
            createVariationJob: createVariationJob,

        };
    });



