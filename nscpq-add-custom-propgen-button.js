/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define([], function() {
  'use strict';
  return {
    beforeLoad: beforeLoad
  };

  function beforeLoad(context) {
    var form = context.form;
    form.clientScriptModulePath = '/SuiteScripts/nscpq-campaign-milestones-button.js';
    //form.clientScriptFileId = '1376';
    form.addButton({
      label: 'Campaign Milestone',
      id: 'custpage_campaign_milestones_btn',
      functionName: 'camplaignMilestonesBtnClickHandler'
    });
  }
});
