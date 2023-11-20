/**
* @NApiVersion 2.1
* @NScriptType Suitelet
*/
define(['N/log', 'N/record'],
    /**
    * @param{log} log
    * @param{record} record
    */
    (log, record) => {
        /**
        * Defines the Suitelet script trigger point.
        * @param {Object} scriptContext
        * @param {ServerRequest} scriptContext.request - Incoming request
        * @param {ServerResponse} scriptContext.response - Suitelet response
        * @since 2015.2
        */
        const onRequest = (scriptContext) => {
            let rID = scriptContext.request.parameters.rid || '';
            let rType = scriptContext.request.parameters.rtype || '';
            log.debug({
                title: 'rID',
                details: rID
            });
            log.debug({
                title: 'rType',
                details: rType
            });
            try {
                if (rID != '' && rType != '') {
                    try {
                        var rec = record.load({
                            type:rType,
                            id: rID,
                        });
                        var recID = rec.save();
                        log.debug("recID",recID);
                        log.debug("recID",recID);
                        scriptContext.response.setHeader({
                            name: 'Content-Type',
                            value: 'application/json; charset=utf-8'
                        });
                        scriptContext.response.write({
                            output: JSON.stringify({ recid: recID })
                        });
                    } catch (error) {
                        log.debug("error", error)
                        scriptContext.response.setHeader({
                            name: 'Content-Type',
                            value: 'application/json; charset=utf-8'
                        });
                        scriptContext.response.write({
                            output: JSON.stringify({ recID: "" })
                        });
                    }


                }
            } catch (e) {
                log.audit({
                    title: 'Error on triggering UE script RID:' + rID + ', RTYPE: ' + rType,
                    details: 'Error Stack :' + e
                });
            }
        }

        return { onRequest }

    });
