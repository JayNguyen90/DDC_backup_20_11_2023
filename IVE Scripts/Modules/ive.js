/**
 * @NApiVersion 2.1
 */
define(
  [
    'N/runtime'
  ],

  /**
   */
  (runtime) => {
    const _context = [];

    // _context.push('job=' + scriptContext.newRecord.getValue({ fieldId: 'tranid' }));

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

    class IVEModule {
      constructor() {
        let script = runtime.getCurrentScript();

        this.context =
        {
          scriptId: script.id,
          deploymentId: script.deploymentId,
          env: runtime.envType,
          execContext: runtime.executionContext,
          urserRole: runtime.roleId,
          name: ''
        };

        _context.push('script=' + this.context.scriptId + '~' + this.context.deploymentId);
      }

      logMsg(level, msg) {
        _writeLog(level, msg);
      }

      logVal(level, name, val) {
        if (util.isObject(val) || Array.isArray(val)) {
          writeLog(level, val);
        }
        else {
          _context.push('name=' + name);
          _context.push('typeof=' + (typeof val));
          writeLog(level, val);
          _context.pop();
          _context.pop();
        }
      }

      startScript (context) {
        if (context) {
          if (context.newRecord) {
            // User Event script

            if (context.oldRecord) {
              // beforeSubmit, afterSubmit
              let name = context.oldRecord.getValue({ fieldId: 'tranid' });

              if (!name) {
                name = context.oldRecord.getValue({ fieldId: 'name' });
                _context.push('rec=' + name);
              }

              if (name) {
                this.context.name = name;
              } else {
                this.context.name = 'Unknown';
              }
            } else {
              // beforeLoad
            }
          } else {
            // TODO:
          }
        }
      }
    }

    return new IVEModule();
  }
);