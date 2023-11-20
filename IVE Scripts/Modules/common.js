/**
 * @NApiVersion 2.1
 */
define(
  [
    'N/runtime'
  ],

  /**
   * @todo Document the module
   */
  (
    runtime,
  ) => {

    const _context = [];

    const _writeLog =
      (level, details) => {

        let fn =
          {
            'debug': log.debug,
            'audit': log.audit,
            'error': log.error,
            'emergency': log.emergency,
          }[level];

        if (!fn) {

          throw new TypeError('Invalid level specified: ' + level);

        }

        fn(
          {
            title: _context.join(':'),
            details: details
          }
        );

      };

    class CommonModule {

      constructor() {

        this._script =
        {
          scriptId: '',
          deploymentId: '',
          owner: 0,
        };

        this._execution =
        {
          env: '',
          execContext: '',
        };

        this._user =
        {
          name: '',
          id: 0,
          email: '',
          contactId: 0,
          departmentId: 0,
          locationId: 0,
          subsidiaryId: 0,
          role:
          {
            scriptId: '',
            id: 0
          }
        }

        this._record =
        {
          name: '',
          type: '',
          id: 0
        };

      }

      get user() {

        return {
          id: this._user.id,
          name: this._user.name,
          email: this._user.email,
          contact: this._user.contactId,
          department: this._user.departmentId,
          location: this._user.locationId,
          subsidiary: this._user.subsidiaryId,
          role: this._user.role.id,
          roleScriptId: this._user.role.scriptId
        };

      }

      /**
       * @todo Document method
       * @param {object} [scriptContext] Arguments passed by NetSuite into script entry points
       * @private
       */
      _init(scriptContext) {

        try {

          let script = runtime.getCurrentScript();
          let user = runtime.getCurrentUser();

          log.debug(
            {
              title: 'CommonModule._init',
              details: 'user = ' + JSON.stringify(user)
            }
          );

          this._script.scriptId = script.id;
          this._script.deploymentId = script.deploymentId;

          this._user.id = user.id;
          this._user.name = user.name;
          this._user.email = user.email;
          this._user.contactId = user.contact;
          this._user.departmentId = user.department;
          this._user.locationId = user.location;
          this._user.subsidiaryId = user.subsidiary;
          this._user.role.id = user.role;
          this._user.role.scriptId = user.roleId;

          this._execution.env = runtime.envType;
          this._execution.execContext = runtime.executionContext;

          if (scriptContext) {

            if (scriptContext.newRecord) {

              // User Event script

              this._record.id = scriptContext.newRecord.id;

              this._record.name =
                (
                  scriptContext.newRecord.getValue({ fieldId: 'tranid' }) ||
                  scriptContext.newRecord.getValue({ fieldId: 'name' }) ||
                  'Unknown'
                );

              this._record.type = scriptContext.newRecord.type;

              this.enterContext(this._record.type + '#' + this._record.name);

            }

          }

          log.debug(
            {
              title: 'CommonModule._init',
              details: 'this._script = ' + JSON.stringify(this._script)
            }
          );

          log.debug(
            {
              title: 'CommonModule._init',
              details: 'this._user = ' + JSON.stringify(this._user)
            }
          );

          log.debug(
            {
              title: 'CommonModule._init',
              details: 'this._execution = ' + JSON.stringify(this._execution)
            }
          );

          log.debug(
            {
              title: 'CommonModule._init',
              details: 'this._record = ' + JSON.stringify(this._record)
            }
          );

        } catch (e) {

          log.emergency(
            {
              title: 'CommonModule._init',
              details: 'Module initialisation failed: ' + e.name + ' - ' + e.message
            }
          );

        }
      }

      enterContext(context) {

        if (!util.isString(context) || context.trim() === '') {

          throw new TypeError('Invalid context "' + context.trim() + '"');

        }

        _context.push(context);

      }

      leaveContext() {

        if (_context.length > 0) {

          _context.pop();

        }

      }

      /**
       * @deprecated
       * @param {*} employeeId
       */
      emailErrorsTo(employeeId) {
      }

      logMsg(level, msg) {

        _writeLog(level, msg);

      }

      logVal(level, name, val) {

        this.enterContext('`' + name + '` {' + (typeof val) + '}');
        _writeLog(level, val);
        this.leaveContext();

      }

      logErr(level, e, msg) {

        this.enterContext('error');

        try {
          this.logVal('debug', 'stack', JSON.stringify(e.stack));

          if (util.isString(msg) && msg.trim() !== '') {

            this.logMsg(level, msg.trim());

          }

          let stack = e.stack;

          if (Array.isArray(stack)) {

            stack.shift();
            stack = stack.toString();

          } else {

            stack = stack.split('\n').shift();

          }

          this.logMsg(level, e.name + ': ' + e.message + stack);

        } catch (e) {

          log.emergency(
            {
              title: 'Common Module.logErr',
              details: e
            }
          );

        } finally {

          this.leaveContext();

        }

      }

      startScript(scriptContext) {

        this.enterContext('CommonModule.startScript');
        this._init(scriptContext);

        this.logMsg('audit', 'Script starting');

        this.leaveContext();
        this.enterContext('Script');

      }

    }

    return new CommonModule();
  }
);