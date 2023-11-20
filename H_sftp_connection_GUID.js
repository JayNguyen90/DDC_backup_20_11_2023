/**
*@NApiVersion 2.x
*@NScriptType Suitelet
*/
define([
'N/ui/serverWidget',
'N/https',
'N/sftp'
],
function (
    ui,
    https,
    sftp
) {
    var HOST_KEY_TOOL_URL = 'https://ursuscode.com/tools/sshkeyscan.php?url=';

    function getFormTemplate() {
        var form;
        form = ui.createForm({
            title: 'Password Form'
        });
        form.addSubmitButton({
            label: 'Submit'
        });

        return form;
    }

    function testSFTPConnection(response) {
        var _sftp = {}
        _sftp.url           = 'sftp3.bluestargroup.com.au'//script.getParameter({ name: 'custscript_sftp_url' })
        _sftp.username      = 'netsuite_uat'//script.getParameter({ name: 'custscript_sftp_username' })
        //_sftp.passwordGuid  = '61abc8b6629d4bff9e293379c9265657'//script.getParameter({ name: 'custscript_sftp_pwdguid' })
        _sftp.hostKey       = 'AAAAB3NzaC1yc2EAAAABEQAAAQEAve7vBuFSWrUHWOvlIRsNCaI1oiArJFtsOdqSs8ZiDLatF8RKwBSS9YQ+lI7tOBB/1LfpmLATVoBSwktS99oPYO4ukbiWB8Ym7cyWMDaICFOnzEQKZB9LSEs2T7oh2cNhEWWrZFr7jKWOd9CfffPA7kCdDy4IsOkSk5U/qtAQfXxdDP2MslhXj9l9JlvGeSVblqw3o/u0UQI5KIqqU688atbH7CtzDVH77mzWECXZ70Fc0XO+U8UsPp0KGq0O7VWt/87OX/n6p5gh5IXD8g6D9dPJXh+ZjP4Sqz5ceY7pRmMa+lTTr/Jz0X291ZUqM6SySS+XWR59sjFggLGm2Gxxuw=='//script.getParameter({ name: 'custscript_sftp_hostkey' })
        _sftp.directory     = '/'//script.getParameter({ name: 'custscript_sftp_targetdir' })
        _sftp.port          = 22//script.getParameter({ name: 'custscript_sftp_port' })
        _sftp.keyId        = 'custkey_westpac_ppk'//script.getParameter({ name: 'custscript_sftp_keyid' })
        log.debug('Params', _sftp)
        var sftpConn = sftp.createConnection(_sftp)
        var files = sftpConn.list({ 
            sort: 'DATE' 
        }) 
        // file = file.slice(0, 10) // Temporary set to max per batch
        log.debug('SFTP dir files', files)
        response.write(JSON.stringify(files))
    }

    function addSelectorFields(form) {
        var select = form.addField({
            id: 'selectaction',
            type: ui.FieldType.SELECT,
            label: 'Select Action'
        });
        select.addSelectOption({
            value: 'getpasswordguid',
            text: 'Get Password GUID'
        });
        select.addSelectOption({
            value: 'gethostkey',
            text: 'Get Host Key'
        });
        return form;
    }

    function addPasswordGUID1Fields(form) {
        var frm = form;

        frm.addField({
            id: 'restricttoscriptids',
            type: ui.FieldType.TEXT,
            label: 'Restrict To Script Ids'
        }).isMandatory = true;
        frm.addField({
            id: 'restricttodomains',
            type: ui.FieldType.TEXT,
            label: 'Restrict To Domains'
        }).isMandatory = true;

        return frm;
    }

    function addPasswordGUID2Fields(form, restrictToScriptIds, restrictToDomains) {
        form.addCredentialField({
            id: 'password',
            label: 'Password',
            restrictToScriptIds: restrictToScriptIds.replace(/ /g, '').split(','),
            restrictToDomains: restrictToDomains.replace(/ /g, '').split(',')
        });
        return form;
    }

    function addHostKeyFields(form) {
        form.addField({
            id: 'url',
            type: ui.FieldType.TEXT,
            label: 'URL (Required)'
        });

        form.addField({
            id: 'port',
            type: ui.FieldType.INTEGER,
            label: 'Port (Optional)'
        });

        form.addField({
            id: 'hostkeytype',
            type: ui.FieldType.TEXT,
            label: 'Type (Optional)'
        });
        return form;
    }

    function onRequest(option) {
        var method;
        var form;
        var selectAction;
        var port;
        var hostKeyType;
        var restricttoscriptids;
        var restricttodomains;
        var password;

        var theResponse;
        var myUrl;
        var url;
        method = option.request.method;
        form = getFormTemplate(method);
        if (method === 'GET') {
            form = addSelectorFields(form);
            if (option.request.parameters.test_sftp) {
                testSFTPConnection(option.response)
            }
        }
        if (method === 'POST') {
            selectAction = option.request.parameters.selectaction;
            if (selectAction === 'getpasswordguid') {
                form = addPasswordGUID1Fields(form);

            } else if (selectAction === 'gethostkey') {
                form = addHostKeyFields(form);
            } else {
                password = option.request.parameters.password;
                url = option.request.parameters.url;
                port = option.request.parameters.port;
                hostKeyType = option.request.parameters.hostkeytype;
                restricttoscriptids = option.request.parameters.restricttoscriptids;
                restricttodomains = option.request.parameters.restricttodomains;

                if (restricttoscriptids && restricttodomains) {
                    form = addPasswordGUID2Fields(form, restricttoscriptids, restricttodomains);
                }

                if (password) {
                    form.addField({
                        id: 'passwordguidresponse',
                        type: ui.FieldType.LONGTEXT,
                        label: 'PasswordGUID Response',
                        displayType: ui.FieldDisplayType.INLINE
                    }).defaultValue = password;
                }
                if (url) {
                    myUrl = HOST_KEY_TOOL_URL + url + '&port=' + port + '&type=' + hostKeyType;
                    theResponse = https.get({ url: myUrl }).body;
                    form.addField({
                        id: 'hostkeyresponse',
                        type: ui.FieldType.LONGTEXT,
                        label: 'Host Key Response',
                        displayType: ui.FieldDisplayType.INLINE
                    }).defaultValue = theResponse;
                }
            }
        }
        option.response.writePage(form);
    }
    return {
        onRequest: onRequest
    };
});