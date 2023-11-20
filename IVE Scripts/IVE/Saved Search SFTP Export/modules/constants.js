/**
 * @NApiVersion 2.1
 */
define(
  [
  ],

  (
  ) => {

    class ConstantsModule {

      get RECORDS() {

        return {

          CUSTOM:
          {

            // IVE SSE SFTP Configuration

            SFTP_CONFIG:
            {

              ID: 'customrecord_ive_sse_sftp_config',

              FIELDS:
              {
                HOST:
                {

                  ID: 'custrecord_ive_sse_aftp_config_host'

                },

                PORT:
                {

                  ID: 'custrecord_ive_sse_aftp_config_port'

                },

                HOST_KEY:
                {

                  ID: 'custrecord_ive_sse_aftp_config_host_key'

                },

                USER_NAME:
                {

                  ID: 'custrecord_ive_sse_aftp_config_username'

                },

                USER_KEY:
                {

                  ID: 'custrecord_ive_sse_aftp_config_user_key'

                },

                HOST_DIR:
                {

                  ID: 'custrecord_ive_sse_aftp_config_host_dir'

                },

                ENVIRON:
                {

                  ID: 'custrecord_ive_sse_sftp_config_env'

                }
              }
            },

            // IVE IVE SSE SFTP Config Env

            SFTP_CONFIG_ENV:
            {

              ID: 'customrecord_ive_sse_sftp_config_env',

              FIELDS:
              {
                NAME:
                {

                  ID: 'name'

                },

                ENV_TYPE:
                {

                  ID: 'custrecord_ive_sse_sftp_config_env_type'

                }
              }
            }

          },

        };
      }

      get SCRIPTS() {

        return {

          // IVE SSE SFTP Exporter

          SAVED_SEARCH_EXPORTER:
          {

            // Saved Search

            SCRIPT_ID: 'customscript_ive_sse_sftp_exporter',

            DEPLOY_ID: 'customdeploy_ive_sse_sftp_exporter',

            PARAMS:
            {

              // Saved Search

              SAVED_SEARCH:
              {

                ID: 'custscript_ive_sse_sftp_exporter_search'

              },

              // SFTP Connection

              SFTP_CONN:
              {

                ID: 'custscript_ive_sse_sftp_exporter_sftp'

              },

              // Search Type

              SEARCH_TYPE:
              {

                ID: 'custscript_ive_sse_sftp_exporter_type'

              },

              // Transformation Mapping

              MAPPING:
              {

                ID: 'custscript_ive_sse_sftp_exporter_map'

              },

              // Exported CSV File Name

              FILE_NAME:
              {

                ID: 'custscript_ive_sse_sftp_exporter_file'

              },

              // Add Additional Blank (same as search export)

              ADD_BLANK:
              {

                ID: 'custscript_ive_sse_sftp_exporter_extra'

              },

              // Line Separator Characters

              LINE_SEP:
              {

                ID: 'custscript_ive_sse_sftp_exporter_eol'

              },

              // Test File Creation

              TEST_CREATE:
              {

                ID: 'custscript_ive_sse_sftp_exporter_test'

              }

            }

          }

        };
      }

      get SEARCHES() {

        return {

          CUSTOMER_BALANCE:
          {

            ID: 'customsearch_ive_clc_customer_balance'

          }

        };

      }
    }

    const module = new ConstantsModule();

    return module;

  }
);