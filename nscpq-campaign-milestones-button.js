/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define([], function() {
  'use strict';
  return {
    pageInit: pageInit,
    camplaignMilestonesBtnClickHandler: camplaignMilestonesBtnClickHandler
  };

  function camplaignMilestonesBtnClickHandler() {
    var type = nlapiGetRecordType();
    var url = '/app/site/hosting/scriptlet.nl?script=customscript_scpq_st_propgen&deploy=customdeploy_scpq_dpl_propgen&pid=1&type='+ type +'&format=pdf&oid=' + nlapiGetFieldValue('id');
    var wnd = window.open(url);
    
    console.log('clicked');
    debugger;
  }

  function pageInit() {}
});
