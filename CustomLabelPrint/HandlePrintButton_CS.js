/**
* @NApiVersion 2.x
*/
/*
* @name:                                       HandlePrintButton_CS.js
* @author:                                     Kamlesh Patel
* @summary:                                    Script Description
* @copyright:                                  © Copyright by Jcurve Solutions
* Date Created:                                Thu June 01 2023 09:21:37
* Change Logs:
* Date                          Author               Description
* Thu June 01 2023 09:21:37 -- Kamlesh Patel -- Initial Creation
*/

define(['N/url', 'N/record', 'N/runtime'],
/**
* @param{record} record
*/
function(url, record, runtime) {
  //handle IR Lable print button clieck event
  function IR_PrintButton_Click(recId) {
    const slUrl = url.resolveScript({
      scriptId: 'customscript_jcs_ir_cstlbl_prnt_popup_sl',
      deploymentId: 'customdeploy_jcs_ir_cstlbl_prnt_popup_sl',
      params: {
        recId: recId
      }
    });
    var newwindow = window.open(slUrl, "_blank", "toolbar=yes,scrollbars=yes,resizable=yes,top=500,left=500,width=1000,height=550");
    if (window.focus) {newwindow.focus()}
    return false;
  }
  
  //handle Bin Transfer print button clieck event
  function BT_PrintButton_Click(recId) {
    const slUrl = url.resolveScript({
      scriptId: 'customscript_jcs_bintrans_print_sl',
      deploymentId: 'customdeploy_jcs_bintrans_print_sl',
      params: {
        recId: recId
      }
    });
    var newwindow = window.open(slUrl, "_blank");
    if (window.focus) {newwindow.focus()}
    return false;
  }
  
  //handle generate print button on suitelet popup
  function IR_POPUP_PrintButton_Click() {
    dataJSON = [];
    //****to do get list of items with each fields value */
    for(var i=1;i<=nlapiGetLineItemCount('resultlist');i++){
      dataJSON.push({
        lineId : nlapiGetLineItemValue('resultlist', 'sblfld_lineid', i)||'',
        itemId : (nlapiGetLineItemValue('resultlist', 'sblfld_itemid', i)||'').replace('&','&amp;'),
        description : (nlapiGetLineItemValue('resultlist', 'sblfld_itemdescription', i)||'').replace('&','&amp;'),
        formerStockCode : nlapiGetLineItemValue('resultlist', 'sblfld_formarstockcode', i)||'',
        customerStockCode : nlapiGetLineItemValue('resultlist', 'sblfld_custstockcode', i)||'',
        ownedByCustomer : nlapiGetLineItemValue('resultlist', 'sblfld_ownbycustomer', i)||'',
        serialLotNumber : nlapiGetLineItemValue('resultlist', 'sblfld_srnumber', i)||'',
        binNumber : nlapiGetLineItemValue('resultlist', 'sblfld_binnumbers', i)||'',
        quantity : nlapiGetLineItemValue('resultlist', 'sblfld_quantity', i)||'',
        uom : nlapiGetLineItemValue('resultlist', 'sblfld_uom', i)||'',
        memomain : nlapiGetLineItemValue('resultlist', 'sblfld_memomain', i)||'',
        labelQty : nlapiGetLineItemValue('resultlist', 'sblfld_print_label_qty', i)||0
      });
    }
    
    const slUrl = url.resolveScript({
      scriptId: 'customscript_jcs_cust_label_print_sl',
      deploymentId: 'customdeploy_jcs_cust_label_print_sl'
    });
    
    var windowName = 'w_' + Date.now() + Math.floor(Math.random() * 100000).toString();
    var form = document.createElement("form");
    form.setAttribute("method", "post");
    form.setAttribute("action", slUrl);
    
    form.setAttribute("target", windowName);
    
    var hiddenField = document.createElement("input"); 
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", "dataJson");
    hiddenField.setAttribute("value", JSON.stringify(dataJSON));
    form.appendChild(hiddenField);
    
    var hiddenField = document.createElement("input"); 
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", "type");
    hiddenField.setAttribute("value", 'generate');
    form.appendChild(hiddenField);
    
    document.body.appendChild(form);
    
    window.open('', windowName);
    
    form.submit();
    //var newwindow = window.open(slUrl, "_blank");
    //if (window.focus) {newwindow.focus()}
    close();
    return false;
  }
  
  //handle download print button on suitelet popup
  function IR_POPUP_DownloadButton_Click() {
    dataJSON = [];
    //****to do get list of items with each fields value */
    for(var i=1;i<=nlapiGetLineItemCount('resultlist');i++){
      dataJSON.push({
        lineId : nlapiGetLineItemValue('resultlist', 'sblfld_lineid', i)||'',
        itemId : (nlapiGetLineItemValue('resultlist', 'sblfld_itemid', i)||'').replace('&','&amp;'),
        description : (nlapiGetLineItemValue('resultlist', 'sblfld_itemdescription', i)||'').replace('&','&amp;'),
        formerStockCode : nlapiGetLineItemValue('resultlist', 'sblfld_formarstockcode', i)||'',
        customerStockCode : nlapiGetLineItemValue('resultlist', 'sblfld_custstockcode', i)||'',
        ownedByCustomer : nlapiGetLineItemValue('resultlist', 'sblfld_ownbycustomer', i)||'',
        serialLotNumber : nlapiGetLineItemValue('resultlist', 'sblfld_srnumber', i)||'',
        binNumber : nlapiGetLineItemValue('resultlist', 'sblfld_binnumbers', i)||'',
        quantity : nlapiGetLineItemValue('resultlist', 'sblfld_quantity', i)||'',
        uom : nlapiGetLineItemValue('resultlist', 'sblfld_uom', i)||'',
        memomain : nlapiGetLineItemValue('resultlist', 'sblfld_memomain', i)||'',
        labelQty : nlapiGetLineItemValue('resultlist', 'sblfld_print_label_qty', i)||0
      });
    }
    
    const slUrl = url.resolveScript({
      scriptId: 'customscript_jcs_cust_label_print_sl',
      deploymentId: 'customdeploy_jcs_cust_label_print_sl'
    });
    
    var windowName = 'w_' + Date.now() + Math.floor(Math.random() * 100000).toString();
    var form = document.createElement("form");
    form.setAttribute("method", "post");
    form.setAttribute("action", slUrl);
    
    form.setAttribute("target", '_self');
    
    var hiddenField = document.createElement("input"); 
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", "dataJson");
    hiddenField.setAttribute("value", JSON.stringify(dataJSON));
    form.appendChild(hiddenField);
    
    var hiddenField = document.createElement("input"); 
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", "type");
    hiddenField.setAttribute("value", 'download');
    form.appendChild(hiddenField);
    
    document.body.appendChild(form);
    
    //window.open('', '_self');
    // Create a new FormData object from the form
    const formData = new FormData(form);
    
    
    const xhr = new XMLHttpRequest();
    
    xhr.open('POST', form.action, true); // Configure the request
    xhr.responseType = 'blob';
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); // Set the request header
    
    xhr.onreadystatechange = function() {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status === 200) {
          const responseBlob = xhr.response;
          const filename = 'CustomLabels.pdf';
          
          // Create a temporary link element
          const downloadLink = document.createElement('a');
          downloadLink.href = URL.createObjectURL(responseBlob);
          downloadLink.download = filename;
          
          // Programmatically trigger the download
          downloadLink.click();
          
          // Clean up the temporary link
          URL.revokeObjectURL(downloadLink.href);
          
          close();
          // Process the response data or perform further actions
        } else {
          // Request failed
          console.error('Request failed with status:', xhr.status);
          // Handle the error or display an error message to the user
        }
      }
    };
    const serializedData = new URLSearchParams(formData).toString();
    xhr.send(serializedData); 
    
    
    
    // form.submit();
    //var newwindow = window.open(slUrl, "_blank");
    //if (window.focus) {newwindow.focus()}
    //close();
    return false;
  }
  
  
  return {
    IR_PrintButton_Click : IR_PrintButton_Click,
    BT_PrintButton_Click : BT_PrintButton_Click,
    IR_POPUP_PrintButton_Click : IR_POPUP_PrintButton_Click,
    IR_POPUP_DownloadButton_Click : IR_POPUP_DownloadButton_Click
  };
  
});
