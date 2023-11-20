/**
 * ddd@NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(
  [
    'N/runtime',
    'N/search'
  ],

  /**
   * @param{runtime} runtime
   * @param{search} search
   */
  function (
    runtime,
    search
  ) {

    // Script name for logging

    var SCRIPT = 'IVE Populate Tran Line Receiving Sub';

    // script id of the Subsidiary body field

    var FIELD_ID_SUBSIDIARY = 'subsidiary';

    // script id of the Subsidiary field from which the script is to get the Receiving Subsidiary

    var FIELD_ID_BILL_SUBSIDIARY = 'custbody_bill_subsidiary';

    // script id of the Receiving Subsidiary field for the script to set with the Receiving Subsidiary

    var FIELD_ID_RECEIVING_SUBSIDIARY = 'custcol_rec_sub';

    /**
     * Indicates if the script is running on a new transaction. Initialised in pageInit
     * @global
     * @private
     * @type {boolean}
     */
    var _inCreateMode = false;

    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {

      log.debug(
        {
          title: SCRIPT + ':pageInit',
          details: 'Start'
        }
      );

      // Flag whether script is running in create mode

      _inCreateMode = (scriptContext.mode === 'create');

      log.debug(
        {
          title: SCRIPT + ':pageInit:_inCreateMode',
          details: _inCreateMode + ' {' + (typeof _inCreateMode) + '}'
        }
      );

      log.debug(
        {
          title: SCRIPT + ':pageInit',
          details: 'Finished'
        }
      );

      log.audit(
        {
          title: SCRIPT,
          details: 'Initialised'
        }
      );

    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {
    }

    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
    function postSourcing(scriptContext) {

      log.debug(
        {
          title: SCRIPT + ':postSourcing',
          details: 'Start'
        }
      );

      if (scriptContext.sublistId !== 'item') {

        log.debug(
          {
            title: SCRIPT + ':postSourcing',
            details: 'Finished - sublistId !== item'
          }
        );
  
        return;

      }

      if (scriptContext.fieldId !== 'item') {

        log.debug(
          {
            title: SCRIPT + ':postSourcing',
            details: 'Finished - fieldId !== item'
          }
        );

        return;

      }

      var item =
        scriptContext.currentRecord.getCurrentSublistValue(
          {
            sublistId: 'item',
            fieldId: 'item'
          }
        );

      log.debug(
        {
          title: SCRIPT + ':postSourcing:item',
          details: item + ' {' + (typeof item) + '}'
        }
      );

      if (!item) {

        log.debug(
          {
            title: SCRIPT + ':postSourcing',
            details: 'Finished - item is empty'
          }
        );

        return;

      }

      if (!_inCreateMode) {

        log.debug(
          {
            title: SCRIPT + ':postSourcing',
            details: 'Finished - not create mode'
          }
        );

        return;

      }

      var subsidiary = scriptContext.currentRecord.getText({ fieldId: FIELD_ID_SUBSIDIARY });

      log.debug(
        {
          title: SCRIPT + ':postSourcing:subsidiary',
          details: subsidiary + ' {' + (typeof subsidiary) + '}'
        }
      );

      // Ignore if the subsidiary is not Goup Office

      if (subsidiary !== 'IVE - Group Office') {

        log.debug(
          {
            title: SCRIPT + ':postSourcing',
            details: 'Finished - subsidiary not Group Office'
          }
        );

        return;

      }

      var recvSubId =
        Number(
          (
            scriptContext.currentRecord.getValue(
              {
                fieldId: FIELD_ID_BILL_SUBSIDIARY
              }
            ) || '0'
          )
        );

      log.debug(
        {
          title: SCRIPT + ':postSourcing:recvSubId',
          details: recvSubId + ' {' + (typeof recvSubId) + '}'
        }
      );

      if (recvSubId === 0) {

        log.debug(
          {
            title: SCRIPT + ':postSourcing',
            details: 'Finished - No Receiving Subsidiary selected'
          }
        );

        return;

      }

      scriptContext.currentRecord.setCurrentSublistValue(
        {
          sublistId: scriptContext.sublistId,
          fieldId: FIELD_ID_RECEIVING_SUBSIDIARY,
          value: recvSubId,
          ignoreFieldChange: true
        }
      );

      log.audit(
        {
          title: SCRIPT + ':postSourcing',
          details: 'Receiving subsidiary updated'
        }
      );

      log.debug(
        {
          title: SCRIPT + ':postSourcing',
          details: 'Finished'
        }
      );

    }

    /**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function sublistChanged(scriptContext) {
    }

    /**
     * Function to be executed after line is selected.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function lineInit(scriptContext) {
    }

    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    function validateField(scriptContext) {
    }

    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateLine(scriptContext) {
    }

    /**
     * Validation function to be executed when sublist line is inserted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateInsert(scriptContext) {
    }

    /**
     * Validation function to be executed when record is deleted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateDelete(scriptContext) {

    }

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {
    }

    return {
      pageInit: pageInit,
      // fieldChanged: fieldChanged,
      postSourcing: postSourcing,
      // sublistChanged: sublistChanged,
      // lineInit: lineInit,
      // validateField: validateField,
      // validateLine: validateLine,
      // validateInsert: validateInsert,
      // validateDelete: validateDelete,
      // saveRecord: saveRecord
    };
  }
);