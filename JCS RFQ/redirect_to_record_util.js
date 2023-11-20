/**
* @name:                                       redirect_to_record_util.js

 * @author:                                     Patrick Lising

 * @summary:                                    This is a utility script to go back to the Vendor RFQ record from the Suitelet

 * @copyright:                                  © Copyright by Jcurve Solutions

 * Date Created:                                09/14/2022

 * Change Log:

 *  09/14/2022 -- Patrick Lising -- Initial version
 *@NApiVersion 2.x
 */
define([], function() {

    function redirectToRecord(recordId) {


        window.location.replace('https://5281669-sb1.app.netsuite.com/app/accounting/transactions/vendrfq.nl?id='+recordId+'&whence=')

    }

    return {
        redirectToRecord: redirectToRecord
    }

});
