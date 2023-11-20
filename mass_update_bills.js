/**
 /**
 * @NApiVersion 2.1
 * @NScriptType MassUpdateScript
 */
define(['N/record', 'N/search'],
    /**
 * @param{record} record
 * @param{search} search
 */
    (record, search) => {
        /**
         * Defines the Mass Update trigger point.
         * @param {Object} params
         * @param {string} params.type - Record type of the record being processed
         * @param {number} params.id - ID of the record being processed
         * @since 2016.1
         */
        const each = (params) => {
            let { type, id } = params
            record.submitFields({
                type: 'vendorbill',
                id,
                values: {
                   custbody_westpac_ref_id: '',
                    custbody_sent_to_sftp: false
                },
                options: {
                    ignoreMandatoryFields: true,
                }
            })
            log.debug('Successfully updated', { id })
        }

        return {each}

    });
