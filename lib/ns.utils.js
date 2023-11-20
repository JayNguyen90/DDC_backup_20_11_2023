
/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 */
/*
 * @Author: lc 
 * @Date: 2019-22-05 23:01:42 
 * @Last Modified by: lc
 * @Last Modified time: 2020-10-02 21:57:21
 */
define(['N', './moment.min'], function (N, moment) {

    const exports = {}

    exports.isOneWorld = () => {
        return N.runtime.isFeatureInEffect({ 
            feature: 'MULTISUBSIDIARYCUSTOMER' 
        })
    }

    exports.currentDomain = () => {
        const accountId = N.runtime.accountId
        const domain = N.url.resolveDomain({
            hostType: N.url.HostType.APPLICATION,
            accountId: accountId
        })
        return domain
    }

    exports.userDateFormat = () => {
        const user = N.runtime.getCurrentUser()
        return user.getPreference ({ name: 'DATEFORMAT' })
    }

    exports.dateNowByCompanyTimezone = () => {
        const date = new Date()
        const tzt = N.config.load({ type: 'companyinformation' }).getText({ fieldId: 'timezone' })
        date.setMinutes(date.getMinutes() + date.getTimezoneOffset() + (parseFloat(tzt.substring(tzt.indexOf('+') == -1 ? tzt.indexOf('-') : tzt.indexOf('+'), tzt.indexOf(')')).substring(0, tzt.substring(tzt.indexOf('+') == -1 ? tzt.indexOf('-') : tzt.indexOf('+'), tzt.indexOf(')')).indexOf(':'))) * 60 + (parseFloat(tzt.substring(tzt.indexOf('+') == -1 ? tzt.indexOf('-') : tzt.indexOf('+'), tzt.indexOf(')')).substring(0, tzt.substring(tzt.indexOf('+') == -1 ? tzt.indexOf('-') : tzt.indexOf('+'), tzt.indexOf(')')).indexOf(':'))) < 0 ? parseFloat(tzt.substring(tzt.indexOf('+') == -1 ? tzt.indexOf('-') : tzt.indexOf('+'), tzt.indexOf(')')).substring(tzt.substring(tzt.indexOf('+') == -1 ? tzt.indexOf('-') : tzt.indexOf('+'), tzt.indexOf(')')).indexOf(':') + 1)) * -1 : parseFloat(tzt.substring(tzt.indexOf('+') == -1 ? tzt.indexOf('-') : tzt.indexOf('+'), tzt.indexOf(')')).substring(tzt.substring(tzt.indexOf('+') == -1 ? tzt.indexOf('-') : tzt.indexOf('+'), tzt.indexOf(')')).indexOf(':') + 1)))))
        return date
    }
    /**
     * Parse string date to date object
     * @param {String} dateString String date
     */
    exports.toDateObject = dateString => {
        if (!dateString) return ''
        const dateMomentObject = moment(dateString, "DD/MM/YYYY")
        const dateObject = dateMomentObject.toDate() 
        return dateObject
    }
    /**
     * Parse string date to date object | date object to string date
     * @param {String} date Date value
     * @param {String} type s=String;d=DateObject
     */
    exports.systemDateFormat = (date, type) => {
        return date ? (type == 's'? N.format.format({
            value: date,
            type: N.format.Type.DATE
        }): type == 'd'? N.format.parse({
            value: date,
            type: N.format.Type.DATE
        }) : date) : ''
    }
    /**
     * Fetch record url
     * @param {String} recordType   Record type
     * @param {String} recordId     Record internalid
     * @param {Boolean} isEditMode  If set to true, returns a URL for the record in Edit mode. If set to false, returns a URL for the record in View mode. The default value is View.
     */
    exports.resolveRecordUrl = (recordType, recordId, isEditMode) => {
        const scheme = 'https://'
        const host = N.url.resolveDomain({ hostType: N.url.HostType.APPLICATION })
        const relativePath = N.url.resolveRecord({ recordType, recordId, isEditMode })
        return scheme + host + relativePath
    }
    /**
     * Expand saved search results
     * @param {Object} set Search object
     */
    exports.expandSearch = set => {
        let results = set.run(), index = 0, range = 1000, resultSet = 0, sets = []
        do {
            resultSet = results.getRange(index, index + range)
            sets = sets.concat(resultSet)
            index += range
        } while (resultSet.length > 0)
        return sets
    }
    /**
     * Encode string to base64
     * @param {*} inpt Input value
     */
    exports.btoa = inpt => {
        if (N.util.isObject(inpt) || N.util.isArray(inpt)) 
            inpt = JSON.stringify(inpt)
        return N.encode.convert({
            string: inpt,
            inputEncoding: N.encode.Encoding.UTF_8,
            outputEncoding: N.encode.Encoding.BASE_64
        })
    }
    /**
     * Encode string to utf_8 then parse it to object
     * @param {*} inpt Input value
     */
    exports.atob = inpt => {
        if (N.util.isObject(inpt) || N.util.isArray(inpt)) 
            inpt = JSON.stringify(inpt)
        let result = N.encode.convert({
            string: inpt,
            inputEncoding: N.encode.Encoding.BASE_64,
            outputEncoding: N.encode.Encoding.UTF_8
        })
        try {
            return JSON.parse(result)
        } catch(e) {
            return result
        }
    }

    // NetSuite Record Types
    exports.NS_RecType = () => {
        return {
            EntityTypes: [
                'customer',
                'prospect',
                'lead',
                'vendor',
                'partner'
            ],
            ItemTypes: [
                'assemblyitem',
                'descriptionitem',
                'discountitem',
                'downloaditem',
                'giftcertificateitem',
                'inventoryitem',
                'itemgroup',
                'kititem',
                'lotnumberedassemblyitem',
                'lotnumberedinventoryitem',
                'markupitem',
                'noninventoryitem',
                'otherchargeitem',
                'paymentitem',
                'serializedassemblyitem',
                'serializedinventoryitem',
                'serviceitem',
                'subscriptionplan',
                'subtotalitem'
            ],
            TransTypes: [
                'advintercompanyjournalentry',
                'assemblybuild',
                'assemblyunbuild',
                'bintransfer',
                'blanketpurchaseorder',
                'cashrefund',
                'cashsale',
                'subscriptionchangeorder',
                'charge',
                'check',
                'creditcardcharge',
                'creditcardrefund',
                'creditmemo',
                'customerdeposit',
                'customerrefund',
                'customerpayment',
                'estimate',
                'expensereport',
                'intercompanyjournalentry',
                'intercompanytransferorder',
                'inventoryadjustment',
                'inventorycostrevaluation',
                'inventorycount',
                'inventorystatuschange',
                'inventorytransfer',
                'invoice',
                'itemfulfillment',
                'itemreceipt',
                'itemsupplyplan',
                'journalentry',
                'opportunity',
                'paycheckjournal',
                'purchasecontract',
                'purchaseorder',
                'purchaserequisition',
                'returnauthorization',
                'revenuearrangement',
                'salesorder',
                'statisticaljournalentry',
                'subscription',
                'timebill',
                'transferorder',
                'usage',
                'vendorbill',
                'vendorcredit',
                'vendorpayment',
                'vendorreturnauthorization',
                'workorder'
            ]
        }
    }

    exports.NS_SublistId = () => {
        return {
            'cashsale'              : 'item',
            'salesorder'            : 'item',
            'itemfulfillment'       : 'item',
            'invoice'               : 'item',
            'cashrefund'            : 'item',
            'inventorytransfer'     : 'inventory',
            'inventoryadjustment'   : 'inventory',
        }
    }

    exports.NS_CountryList = () => {
        return [{
            "value": "",
            "text": ""
        }, {
            "value": "AF",
            "text": "Afghanistan"
        }, {
            "value": "AX",
            "text": "Aland Islands"
        }, {
            "value": "AL",
            "text": "Albania"
        }, {
            "value": "DZ",
            "text": "Algeria"
        }, {
            "value": "AS",
            "text": "American Samoa"
        }, {
            "value": "AD",
            "text": "Andorra"
        }, {
            "value": "AO",
            "text": "Angola"
        }, {
            "value": "AI",
            "text": "Anguilla"
        }, {
            "value": "AQ",
            "text": "Antarctica"
        }, {
            "value": "AG",
            "text": "Antigua and Barbuda"
        }, {
            "value": "AR",
            "text": "Argentina"
        }, {
            "value": "AM",
            "text": "Armenia"
        }, {
            "value": "AW",
            "text": "Aruba"
        }, {
            "value": "AU",
            "text": "Australia"
        }, {
            "value": "AT",
            "text": "Austria"
        }, {
            "value": "AZ",
            "text": "Azerbaijan"
        }, {
            "value": "BS",
            "text": "Bahamas"
        }, {
            "value": "BH",
            "text": "Bahrain"
        }, {
            "value": "BD",
            "text": "Bangladesh"
        }, {
            "value": "BB",
            "text": "Barbados"
        }, {
            "value": "BY",
            "text": "Belarus"
        }, {
            "value": "BE",
            "text": "Belgium"
        }, {
            "value": "BZ",
            "text": "Belize"
        }, {
            "value": "BJ",
            "text": "Benin"
        }, {
            "value": "BM",
            "text": "Bermuda"
        }, {
            "value": "BT",
            "text": "Bhutan"
        }, {
            "value": "BO",
            "text": "Bolivia"
        }, {
            "value": "BQ",
            "text": "Bonaire, Saint Eustatius and Saba"
        }, {
            "value": "BA",
            "text": "Bosnia and Herzegovina"
        }, {
            "value": "BW",
            "text": "Botswana"
        }, {
            "value": "BV",
            "text": "Bouvet Island"
        }, {
            "value": "BR",
            "text": "Brazil"
        }, {
            "value": "IO",
            "text": "British Indian Ocean Territory"
        }, {
            "value": "BN",
            "text": "Brunei Darussalam"
        }, {
            "value": "BG",
            "text": "Bulgaria"
        }, {
            "value": "BF",
            "text": "Burkina Faso"
        }, {
            "value": "BI",
            "text": "Burundi"
        }, {
            "value": "KH",
            "text": "Cambodia"
        }, {
            "value": "CM",
            "text": "Cameroon"
        }, {
            "value": "CA",
            "text": "Canada"
        }, {
            "value": "IC",
            "text": "Canary Islands"
        }, {
            "value": "CV",
            "text": "Cape Verde"
        }, {
            "value": "KY",
            "text": "Cayman Islands"
        }, {
            "value": "CF",
            "text": "Central African Republic"
        }, {
            "value": "EA",
            "text": "Ceuta and Melilla"
        }, {
            "value": "TD",
            "text": "Chad"
        }, {
            "value": "CL",
            "text": "Chile"
        }, {
            "value": "CN",
            "text": "China"
        }, {
            "value": "CX",
            "text": "Christmas Island"
        }, {
            "value": "CC",
            "text": "Cocos (Keeling) Islands"
        }, {
            "value": "CO",
            "text": "Colombia"
        }, {
            "value": "KM",
            "text": "Comoros"
        }, {
            "value": "CD",
            "text": "Congo, Democratic Republic of"
        }, {
            "value": "CG",
            "text": "Congo, Republic of"
        }, {
            "value": "CK",
            "text": "Cook Islands"
        }, {
            "value": "CR",
            "text": "Costa Rica"
        }, {
            "value": "CI",
            "text": "Cote d\u0027Ivoire"
        }, {
            "value": "HR",
            "text": "Croatia/Hrvatska"
        }, {
            "value": "CU",
            "text": "Cuba"
        }, {
            "value": "CW",
            "text": "Curaçao"
        }, {
            "value": "CY",
            "text": "Cyprus"
        }, {
            "value": "CZ",
            "text": "Czech Republic"
        }, {
            "value": "DK",
            "text": "Denmark"
        }, {
            "value": "DJ",
            "text": "Djibouti"
        }, {
            "value": "DM",
            "text": "Dominica"
        }, {
            "value": "DO",
            "text": "Dominican Republic"
        }, {
            "value": "TL",
            "text": "East Timor"
        }, {
            "value": "EC",
            "text": "Ecuador"
        }, {
            "value": "EG",
            "text": "Egypt"
        }, {
            "value": "SV",
            "text": "El Salvador"
        }, {
            "value": "GQ",
            "text": "Equatorial Guinea"
        }, {
            "value": "ER",
            "text": "Eritrea"
        }, {
            "value": "EE",
            "text": "Estonia"
        }, {
            "value": "ET",
            "text": "Ethiopia"
        }, {
            "value": "FK",
            "text": "Falkland Islands"
        }, {
            "value": "FO",
            "text": "Faroe Islands"
        }, {
            "value": "FJ",
            "text": "Fiji"
        }, {
            "value": "FI",
            "text": "Finland"
        }, {
            "value": "FR",
            "text": "France"
        }, {
            "value": "GF",
            "text": "French Guiana"
        }, {
            "value": "PF",
            "text": "French Polynesia"
        }, {
            "value": "TF",
            "text": "French Southern Territories"
        }, {
            "value": "GA",
            "text": "Gabon"
        }, {
            "value": "GM",
            "text": "Gambia"
        }, {
            "value": "GE",
            "text": "Georgia"
        }, {
            "value": "DE",
            "text": "Germany"
        }, {
            "value": "GH",
            "text": "Ghana"
        }, {
            "value": "GI",
            "text": "Gibraltar"
        }, {
            "value": "GR",
            "text": "Greece"
        }, {
            "value": "GL",
            "text": "Greenland"
        }, {
            "value": "GD",
            "text": "Grenada"
        }, {
            "value": "GP",
            "text": "Guadeloupe"
        }, {
            "value": "GU",
            "text": "Guam"
        }, {
            "value": "GT",
            "text": "Guatemala"
        }, {
            "value": "GG",
            "text": "Guernsey"
        }, {
            "value": "GN",
            "text": "Guinea"
        }, {
            "value": "GW",
            "text": "Guinea-Bissau"
        }, {
            "value": "GY",
            "text": "Guyana"
        }, {
            "value": "HT",
            "text": "Haiti"
        }, {
            "value": "HM",
            "text": "Heard and McDonald Islands"
        }, {
            "value": "VA",
            "text": "Holy See (City Vatican State)"
        }, {
            "value": "HN",
            "text": "Honduras"
        }, {
            "value": "HK",
            "text": "Hong Kong"
        }, {
            "value": "HU",
            "text": "Hungary"
        }, {
            "value": "IS",
            "text": "Iceland"
        }, {
            "value": "IN",
            "text": "India"
        }, {
            "value": "ID",
            "text": "Indonesia"
        }, {
            "value": "IR",
            "text": "Iran (Islamic Republic of)"
        }, {
            "value": "IQ",
            "text": "Iraq"
        }, {
            "value": "IE",
            "text": "Ireland"
        }, {
            "value": "IM",
            "text": "Isle of Man"
        }, {
            "value": "IL",
            "text": "Israel"
        }, {
            "value": "IT",
            "text": "Italy"
        }, {
            "value": "JM",
            "text": "Jamaica"
        }, {
            "value": "JP",
            "text": "Japan"
        }, {
            "value": "JE",
            "text": "Jersey"
        }, {
            "value": "JO",
            "text": "Jordan"
        }, {
            "value": "KZ",
            "text": "Kazakhstan"
        }, {
            "value": "KE",
            "text": "Kenya"
        }, {
            "value": "KI",
            "text": "Kiribati"
        }, {
            "value": "KP",
            "text": "Korea, Democratic People\u0027s Republic"
        }, {
            "value": "KR",
            "text": "Korea, Republic of"
        }, {
            "value": "XK",
            "text": "Kosovo"
        }, {
            "value": "KW",
            "text": "Kuwait"
        }, {
            "value": "KG",
            "text": "Kyrgyzstan"
        }, {
            "value": "LA",
            "text": "Lao People\u0027s Democratic Republic"
        }, {
            "value": "LV",
            "text": "Latvia"
        }, {
            "value": "LB",
            "text": "Lebanon"
        }, {
            "value": "LS",
            "text": "Lesotho"
        }, {
            "value": "LR",
            "text": "Liberia"
        }, {
            "value": "LY",
            "text": "Libya"
        }, {
            "value": "LI",
            "text": "Liechtenstein"
        }, {
            "value": "LT",
            "text": "Lithuania"
        }, {
            "value": "LU",
            "text": "Luxembourg"
        }, {
            "value": "MO",
            "text": "Macau"
        }, {
            "value": "MK",
            "text": "Macedonia"
        }, {
            "value": "MG",
            "text": "Madagascar"
        }, {
            "value": "MW",
            "text": "Malawi"
        }, {
            "value": "MY",
            "text": "Malaysia"
        }, {
            "value": "MV",
            "text": "Maldives"
        }, {
            "value": "ML",
            "text": "Mali"
        }, {
            "value": "MT",
            "text": "Malta"
        }, {
            "value": "MH",
            "text": "Marshall Islands"
        }, {
            "value": "MQ",
            "text": "Martinique"
        }, {
            "value": "MR",
            "text": "Mauritania"
        }, {
            "value": "MU",
            "text": "Mauritius"
        }, {
            "value": "YT",
            "text": "Mayotte"
        }, {
            "value": "MX",
            "text": "Mexico"
        }, {
            "value": "FM",
            "text": "Micronesia, Federal State of"
        }, {
            "value": "MD",
            "text": "Moldova, Republic of"
        }, {
            "value": "MC",
            "text": "Monaco"
        }, {
            "value": "MN",
            "text": "Mongolia"
        }, {
            "value": "ME",
            "text": "Montenegro"
        }, {
            "value": "MS",
            "text": "Montserrat"
        }, {
            "value": "MA",
            "text": "Morocco"
        }, {
            "value": "MZ",
            "text": "Mozambique"
        }, {
            "value": "MM",
            "text": "Myanmar (Burma)"
        }, {
            "value": "NA",
            "text": "Namibia"
        }, {
            "value": "NR",
            "text": "Nauru"
        }, {
            "value": "NP",
            "text": "Nepal"
        }, {
            "value": "NL",
            "text": "Netherlands"
        }, {
            "value": "AN",
            "text": "Netherlands Antilles (Deprecated)"
        }, {
            "value": "NC",
            "text": "New Caledonia"
        }, {
            "value": "NZ",
            "text": "New Zealand"
        }, {
            "value": "NI",
            "text": "Nicaragua"
        }, {
            "value": "NE",
            "text": "Niger"
        }, {
            "value": "NG",
            "text": "Nigeria"
        }, {
            "value": "NU",
            "text": "Niue"
        }, {
            "value": "NF",
            "text": "Norfolk Island"
        }, {
            "value": "MP",
            "text": "Northern Mariana Islands"
        }, {
            "value": "NO",
            "text": "Norway"
        }, {
            "value": "OM",
            "text": "Oman"
        }, {
            "value": "PK",
            "text": "Pakistan"
        }, {
            "value": "PW",
            "text": "Palau"
        }, {
            "value": "PA",
            "text": "Panama"
        }, {
            "value": "PG",
            "text": "Papua New Guinea"
        }, {
            "value": "PY",
            "text": "Paraguay"
        }, {
            "value": "PE",
            "text": "Peru"
        }, {
            "value": "PH",
            "text": "Philippines"
        }, {
            "value": "PN",
            "text": "Pitcairn Island"
        }, {
            "value": "PL",
            "text": "Poland"
        }, {
            "value": "PT",
            "text": "Portugal"
        }, {
            "value": "PR",
            "text": "Puerto Rico"
        }, {
            "value": "QA",
            "text": "Qatar"
        }, {
            "value": "RE",
            "text": "Reunion Island"
        }, {
            "value": "RO",
            "text": "Romania"
        }, {
            "value": "RU",
            "text": "Russian Federation"
        }, {
            "value": "RW",
            "text": "Rwanda"
        }, {
            "value": "BL",
            "text": "Saint Barthélemy"
        }, {
            "value": "SH",
            "text": "Saint Helena"
        }, {
            "value": "KN",
            "text": "Saint Kitts and Nevis"
        }, {
            "value": "LC",
            "text": "Saint Lucia"
        }, {
            "value": "MF",
            "text": "Saint Martin"
        }, {
            "value": "VC",
            "text": "Saint Vincent and the Grenadines"
        }, {
            "value": "WS",
            "text": "Samoa"
        }, {
            "value": "SM",
            "text": "San Marino"
        }, {
            "value": "ST",
            "text": "Sao Tome and Principe"
        }, {
            "value": "SA",
            "text": "Saudi Arabia"
        }, {
            "value": "SN",
            "text": "Senegal"
        }, {
            "value": "RS",
            "text": "Serbia"
        }, {
            "value": "CS",
            "text": "Serbia and Montenegro (Deprecated)"
        }, {
            "value": "SC",
            "text": "Seychelles"
        }, {
            "value": "SL",
            "text": "Sierra Leone"
        }, {
            "value": "SG",
            "text": "Singapore"
        }, {
            "value": "SX",
            "text": "Sint Maarten"
        }, {
            "value": "SK",
            "text": "Slovak Republic"
        }, {
            "value": "SI",
            "text": "Slovenia"
        }, {
            "value": "SB",
            "text": "Solomon Islands"
        }, {
            "value": "SO",
            "text": "Somalia"
        }, {
            "value": "ZA",
            "text": "South Africa"
        }, {
            "value": "GS",
            "text": "South Georgia"
        }, {
            "value": "SS",
            "text": "South Sudan"
        }, {
            "value": "ES",
            "text": "Spain"
        }, {
            "value": "LK",
            "text": "Sri Lanka"
        }, {
            "value": "PM",
            "text": "St. Pierre and Miquelon"
        }, {
            "value": "PS",
            "text": "State of Palestine"
        }, {
            "value": "SD",
            "text": "Sudan"
        }, {
            "value": "SR",
            "text": "Suriname"
        }, {
            "value": "SJ",
            "text": "Svalbard and Jan Mayen Islands"
        }, {
            "value": "SZ",
            "text": "Swaziland"
        }, {
            "value": "SE",
            "text": "Sweden"
        }, {
            "value": "CH",
            "text": "Switzerland"
        }, {
            "value": "SY",
            "text": "Syrian Arab Republic"
        }, {
            "value": "TW",
            "text": "Taiwan"
        }, {
            "value": "TJ",
            "text": "Tajikistan"
        }, {
            "value": "TZ",
            "text": "Tanzania"
        }, {
            "value": "TH",
            "text": "Thailand"
        }, {
            "value": "TG",
            "text": "Togo"
        }, {
            "value": "TK",
            "text": "Tokelau"
        }, {
            "value": "TO",
            "text": "Tonga"
        }, {
            "value": "TT",
            "text": "Trinidad and Tobago"
        }, {
            "value": "TN",
            "text": "Tunisia"
        }, {
            "value": "TR",
            "text": "Turkey"
        }, {
            "value": "TM",
            "text": "Turkmenistan"
        }, {
            "value": "TC",
            "text": "Turks and Caicos Islands"
        }, {
            "value": "TV",
            "text": "Tuvalu"
        }, {
            "value": "UG",
            "text": "Uganda"
        }, {
            "value": "UA",
            "text": "Ukraine"
        }, {
            "value": "AE",
            "text": "United Arab Emirates"
        }, {
            "value": "GB",
            "text": "United Kingdom"
        }, {
            "value": "US",
            "text": "United States"
        }, {
            "value": "UY",
            "text": "Uruguay"
        }, {
            "value": "UM",
            "text": "US Minor Outlying Islands"
        }, {
            "value": "UZ",
            "text": "Uzbekistan"
        }, {
            "value": "VU",
            "text": "Vanuatu"
        }, {
            "value": "VE",
            "text": "Venezuela"
        }, {
            "value": "VN",
            "text": "Vietnam"
        }, {
            "value": "VG",
            "text": "Virgin Islands (British)"
        }, {
            "value": "VI",
            "text": "Virgin Islands (USA)"
        }, {
            "value": "WF",
            "text": "Wallis and Futuna"
        }, {
            "value": "EH",
            "text": "Western Sahara"
        }, {
            "value": "YE",
            "text": "Yemen"
        }, {
            "value": "ZM",
            "text": "Zambia"
        }, {
            "value": "ZW",
            "text": "Zimbabwe"
        }]
    }
    /* Sample JSON (data param key) for createRecord, editRecord, transformRecord function(s)
    {
        "tranid": "123456 - test 2",
        "entity": 138740,
        "otherrefnum": "testPO",
        "memo": "TEST123",
        "salesrep": "",
        "department": "15",
        "class": "3",
        "location": "1",
        "custbody_hrx_order_source": "9",
        "custbodycustomer_id": "custid123",
        "custbody_hrx_multi_order": true,
        "shipmethod": "5499",
        "shippingcost": 30,
        "shippingaddress": {
            "country": "GB",
            "attention": "Arrow ECS Australia Pty Ltd",
            "addr1": "nit 24, Hume Ave",
            "addr2": "nit 25, Hume Ave",
            "city": "Dublin",
            "state": "Nairshire",
            "colIdip": 2000
        },
        "inventorydetail": {
            "inventoryassignment": [{
                "issueinventorynumber": "9452",
                "binnumber": "354",
                "quantity": 3
            }]
        },
        "custbody_cc_paid": true,
        "custbody_cc_paid_amount": "",
        "sublist": {
            "item": [{
                "item": "{internalid}",
                "quantity": 12,
                "price": -1,
                "rate": 123.45,
                "inventorydetail": {
                    "inventoryassignment": [{
                        "issueinventorynumber": "9743",
                        "binnumber": "2262",
                        "quantity": 3
                    }]
                },
                "custcol_special_price": "",
                "custcol_credit_amount": "",
                "custcol_hrx_net_amount": "",
                "custcol_sd": true,
                "custcol_sd_expiration": "30-Apr-2019",
                "location": ""
            }, {
                "item": "{internalid}",
                "quantity": 3,
                "price": -1,
                "rate": 5.00,
                "inventorydetail": {
                    "inventoryassignment": [{
                        "issueinventorynumber": "9452",
                        "binnumber": "354",
                        "quantity": 3
                    }]
                },
                "custcol_special_price": "",
                "custcol_credit_amount": "",
                "custcol_hrx_net_amount": "",
                "custcol_sd": true,
                "custcol_sd_expiration": "30-Apr-2019",
                "location": ""
            }, {
                "item": "{internalid}",
                "quantity": 1,
                "price": -1,
                "rate": 28.48,
                "inventorydetail": {
                    "inventoryassignment": [{
                        "issueinventorynumber": "9452",
                        "binnumber": "354",
                        "quantity": 3
                    }]
                },
                "custcol_special_price": "",
                "custcol_credit_amount": "",
                "custcol_hrx_net_amount": "",
                "custcol_sd": true,
                "custcol_sd_expiration": "30-Apr-2019",
                "location": ""
            }],
            "salesteam": [{
                "employee": "139474",
                "contribution": "100",
                "isprimary": true,
                "issalesrep": true,
                "salesrole": "-2"
            }]
        }
    }
    /**
     * @param  {String}  rectype Record type
     * @param  {Object}  data    Key value pairs
     * @param  {Boolean} dynamic Dynamic mode
     * @param  {Object}  defVal  Default values
     * @param  {Object}  textIds List fields for setText || setSublistText commands
     * @return {Number}          Record id
     */
    exports.createRecord = (rectype, data, dynamic, defVal, textIds) => {
        textIds = textIds || []
        
        const rec = N.record.create({ 
            type: rectype, 
            isDynamic: dynamic,
            defaultValues: defVal
        })
        Object.keys(data).forEach(fieldId => {
            if (fieldId == 'sublist') {
                Object.keys(data[fieldId]).forEach(sublistId => {
                    const _loop = i =>  {
                        if (!dynamic) {
                            Object.keys(data[fieldId][sublistId][i]).forEach((colId) => {
                                if (colId.match(/inventorydetail|addressbook/g)) {
                                    try { // Create/Edit Subrecord
                                        var j
                                        (() => {
                                            const subrec = rec.getSublistSubrecord(sublistId, colId, parseInt(i))
                                            const sublistSubRecFieldIds = Object.keys(data[fieldId][sublistId][i][colId])
                                            for (k in sublistSubRecFieldIds) {
                                                const sublistSubRecFieldId = sublistSubRecFieldIds[k]
                                                if (!N.util.isArray(data[fieldId][sublistId][i][colId][sublistSubRecFieldId])) { // Ex. addressbookaddress
                                                    if (textIds.indexOf(sublistSubRecFieldId) > -1) {
                                                        subrec.setText(sublistSubRecFieldId, data[fieldId][sublistId][i][colId][sublistSubRecFieldId])
                                                    } else {
                                                        subrec.setValue(sublistSubRecFieldId, data[fieldId][sublistId][i][colId][sublistSubRecFieldId])
                                                    }
                                                } else { // Ex. inventoryassignment
                                                    const _loop2 = j =>  {
                                                        Object.keys(data[fieldId][sublistId][i][colId][sublistSubRecFieldId][j]).forEach(colId2 => {
                                                            if (textIds.indexOf(colId2) > -1) {
                                                                subrec.setSublistText(sublistSubRecFieldId, colId2, parseInt(j), data[fieldId][sublistId][i][colId][sublistSubRecFieldId][j][colId2])
                                                            } else {
                                                                subrec.setSublistValue(sublistSubRecFieldId, colId2, parseInt(j), data[fieldId][sublistId][i][colId][sublistSubRecFieldId][j][colId2])
                                                            }
                                                        })
                                                    }
                                                    for (const j in data[fieldId][sublistId][i][colId][sublistSubRecFieldId]) {
                                                        _loop2(j)
                                                    }
                                                }
                                            }
                                        })()
                                    } catch (e) {
                                        log.debug('error', e.message)
                                    }
                                } else {
                                    if (textIds.indexOf(colId) > -1) {
                                        rec.setSublistText(sublistId, colId, parseInt(i), data[fieldId][sublistId][i][colId])
                                    } else {
                                        rec.setSublistValue(sublistId, colId, parseInt(i), data[fieldId][sublistId][i][colId])
                                    }
                                }
                            })
                        } else {
                            rec.selectNewLine(sublistId)
                            Object.keys(data[fieldId][sublistId][i]).forEach(colId => {
                                if (colId.match(/inventorydetail|addressbook/g)) { // Create/Edit Subrecord
                                    const invdetail = rec.getCurrentSublistValue(sublistId, 'inventorydetailavail')
                                    const invdetailreq = rec.getCurrentSublistValue(sublistId, 'inventorydetailreq')
                                    const isserial = rec.getCurrentSublistValue(sublistId, 'isserial')
                                    const compdetailreq = rec.getCurrentSublistValue(sublistId, 'componentinventorydetailreq') // For AB
                                    if (invdetail == 'T' || invdetailreq == 'T' || rectype == 'vendorbill' || compdetailreq == 'T' || colId == 'addressbookaddress') {
                                        (() => {
                                            const subrec = rec.getCurrentSublistSubrecord(sublistId, colId)
                                            const sublistSubRecFieldIds = Object.keys(data[fieldId][sublistId][i][colId])
                                            for (k in sublistSubRecFieldIds) {
                                                const sublistSubRecFieldId = sublistSubRecFieldIds[k]
                                                if (!N.util.isArray(data[fieldId][sublistId][i][colId][sublistSubRecFieldId])) { // Ex. addressbookaddress
                                                    if (textIds.indexOf(sublistSubRecFieldId) > -1) {
                                                        subrec.setText(sublistSubRecFieldId, data[fieldId][sublistId][i][colId][sublistSubRecFieldId])
                                                    } else {
                                                        subrec.setValue(sublistSubRecFieldId, data[fieldId][sublistId][i][colId][sublistSubRecFieldId])
                                                    }
                                                } else { // Ex. inventoryassignment
                                                    const _loop2 = j =>  {
                                                        subrec.selectNewLine(sublistSubRecFieldId)
                                                        Object.keys(data[fieldId][sublistId][i][colId][sublistSubRecFieldId][j]).forEach(colId2 => {
                                                            if (textIds.indexOf(colId2) > -1) {
                                                                subrec.setCurrentSublistText(sublistSubRecFieldId, colId2, data[fieldId][sublistId][i][colId][sublistSubRecFieldId][j][colId2])
                                                            } else {
                                                                subrec.setCurrentSublistValue(sublistSubRecFieldId, colId2, data[fieldId][sublistId][i][colId][sublistSubRecFieldId][j][colId2])
                                                            }
                                                        })
                                                        subrec.commitLine(sublistSubRecFieldId)
                                                    }
                                                    for (const j in data[fieldId][sublistId][i][colId][sublistSubRecFieldId]) {
                                                        _loop2(j)
                                                    }
                                                }
                                            }
                                        })()
                                    }
                                } else {
                                    if (textIds.indexOf(colId) > -1) {
                                        rec.setCurrentSublistText(sublistId, colId, data[fieldId][sublistId][i][colId])
                                    } else {
                                        rec.setCurrentSublistValue(sublistId, colId, data[fieldId][sublistId][i][colId])
                                    }
                                }
                            })
                            rec.commitLine(sublistId)
                        }
                    }
                    for (const i in data[fieldId][sublistId]) { // Sublist ID(s)
                        _loop(i)
                    }
                })
            } else if (fieldId != 'sublist' && N.util.isObject(data[fieldId]) && !N.util.isDate(data[fieldId])) {
                const subrec = rec.getSubrecord(fieldId)
                Object.keys(data[fieldId]).forEach((sublistId, colId2) => {
                    if (N.util.isObject(data[fieldId][sublistId]) && !N.util.isDate(data[fieldId][sublistId])) {
                        const _loop3 = i =>  {
                            if (!dynamic) {
                                Object.keys(data[fieldId][sublistId][i]).forEach(colId => { // Subrecord sublist
                                    if (textIds.indexOf(colId) > -1) {
                                        subrec.setSublistText(sublistId, colId, parseInt(i), data[fieldId][sublistId][i][colId])
                                    } else {
                                        subrec.setSublistValue(sublistId, colId, parseInt(i), data[fieldId][sublistId][i][colId])
                                    }
                                })
                            } else {
                                subrec.selectNewLine(sublistId)
                                Object.keys(data[fieldId][sublistId][i]).forEach(colId => { // Subrecord sublist
                                    if (textIds.indexOf(colId) > -1) {
                                        subrec.setCurrentSublistText(sublistId, colId, data[fieldId][sublistId][i][colId])
                                    } else {
                                        subrec.setCurrentSublistValue(sublistId, colId, data[fieldId][sublistId][i][colId])
                                    }
                                })
                                subrec.commitLine(sublistId)
                            }
                        }
                        for (const i in data[fieldId][sublistId]) {
                            _loop3(i)
                        }
                    } else {
                        if (textIds.indexOf(sublistId) > -1) {
                            subrec.setText(sublistId, data[fieldId][sublistId])
                        } else {
                            subrec.setValue(sublistId, data[fieldId][sublistId])
                        }
                    }
                })
            } else {
                if (textIds.indexOf(fieldId) > -1) {
                    rec.setText(fieldId, data[fieldId])
                } else {
                    rec.setValue(fieldId, data[fieldId])
                }
            }
        })
        const id = rec.save({ ignoreMandatoryFields: true })
        log.debug('Data Created', { type: rectype, id, data })
        return id
    }

    /**
     * @param  {String}  rectype Record type
     * @param  {String}  recid   Record id
     * @param  {Object}  data    Key value pairs
     * @param  {Boolean} dynamic Dynamic mode
     * @param  {Object}  defVal  Default values
     * @param  {Object}  textIds List fields for setText || setSublistText commands
     * @return {Number}          Record id
     */
    exports.editRecord = (rectype, recid, data, dynamic, defVal, textIds) => {
        textIds = textIds || []
        
        const rec = N.record.load({
            type: rectype,
            id: recid,
            isDynamic: dynamic,
            defaultValues: defVal
        })
        Object.keys(data).forEach(fieldId => {
            if (fieldId == 'sublist') {
                Object.keys(data[fieldId]).forEach(sublistId => {
                    const lc = rec.getLineCount(sublistId)
                    const _loop4 = i =>  {
                        const col1 = Object.keys(data[fieldId][sublistId][i])[0]
                        const item = data[fieldId][sublistId][i][col1]
                        const index = rec.findSublistLineWithValue(sublistId, col1, item)
                        log.debug('col1', {recid,sublistId,col1,item,index})
                        if (index != -1) {
                            if (!dynamic) {
                                Object.keys(data[fieldId][sublistId][i]).forEach(colId => {
                                    if (colId.match(/inventorydetail|addressbook/g)) {
                                        const invdetail = rec.getSublistValue(sublistId, 'inventorydetailavail', index)
                                        const invdetailreq = rec.getSublistValue(sublistId, 'inventorydetailreq', index)
                                        const isserial = rec.getSublistValue(sublistId, 'isserial', index)
                                        const compdetailreq = rec.getSublistValue(sublistId, 'componentinventorydetailreq', index) // For AB
                                        if (invdetail == 'T' || invdetailreq == 'T' || rectype == 'vendorbill' || compdetailreq == 'T' || colId == 'addressbookaddress') {
                                            (() => {
                                                const subrec = rec.getSublistSubrecord(sublistId, colId, index)
                                                const sublistSubRecFieldIds = Object.keys(data[fieldId][sublistId][i][colId])
                                                for (k in sublistSubRecFieldIds) {
                                                    const sublistSubRecFieldId = sublistSubRecFieldIds[k]
                                                    if (!N.util.isArray(data[fieldId][sublistId][i][colId][sublistSubRecFieldId])) { // Ex. addressbookaddress
                                                        if (textIds.indexOf(sublistSubRecFieldId) > -1) {
                                                            subrec.setText(sublistSubRecFieldId, data[fieldId][sublistId][i][colId][sublistSubRecFieldId])
                                                        } else {
                                                            subrec.setValue(sublistSubRecFieldId, data[fieldId][sublistId][i][colId][sublistSubRecFieldId])
                                                        }
                                                    } else { // Ex. inventoryassignment
                                                        const subRecLineCount = subrec.getLineCount(sublistSubRecFieldId)
                                                        const _loop5 = j =>  {
                                                            Object.keys(data[fieldId][sublistId][i][colId][sublistSubRecFieldId][j]).forEach(colId2 => {
                                                                if (textIds.indexOf(colId2) > -1) {
                                                                    subrec.setSublistText(sublistSubRecFieldId, colId2, parseInt(j)+subRecLineCount, data[fieldId][sublistId][i][colId][sublistSubRecFieldId][j][colId2])
                                                                } else {
                                                                    subrec.setSublistValue(sublistSubRecFieldId, colId2, parseInt(j)+subRecLineCount, data[fieldId][sublistId][i][colId][sublistSubRecFieldId][j][colId2])
                                                                }
                                                            })
                                                        }
                                                        for (j in data[fieldId][sublistId][i][colId][sublistSubRecFieldId]) {
                                                            _loop5(j)
                                                        }
                                                    }
                                                }
                                            })()
                                        }
                                    } else {
                                        if (textIds.indexOf(colId) > -1) {
                                            rec.setSublistText(sublistId, colId, index, data[fieldId][sublistId][i][colId])
                                        } else {
                                            rec.setSublistValue(sublistId, colId, index, data[fieldId][sublistId][i][colId])
                                        }
                                    }
                                })
                            } else {
                                rec.selectLine(sublistId, parseInt(index))
                                Object.keys(data[fieldId][sublistId][i]).forEach(colId => {
                                    if (colId.match(/inventorydetail|addressbook/g)) {
                                        const invdetail = rec.getCurrentSublistValue(sublistId, 'inventorydetailavail')
                                        const invdetailreq = rec.getCurrentSublistValue(sublistId, 'inventorydetailreq')
                                        const isserial = rec.getCurrentSublistValue(sublistId, 'isserial')
                                        const compdetailreq = rec.getCurrentSublistValue(sublistId, 'componentinventorydetailreq') // For AB
                                        if (invdetail == 'T' || invdetailreq == 'T' || rectype == 'vendorbill' || compdetailreq == 'T' || colId == 'addressbookaddress') {
                                            (() => {
                                                const subrec = rec.getCurrentSublistSubrecord(sublistId, colId)
                                                const sublistSubRecFieldIds = Object.keys(data[fieldId][sublistId][i][colId])
                                                for (k in sublistSubRecFieldIds) {
                                                    const sublistSubRecFieldId = sublistSubRecFieldIds[k]
                                                    subrec.selectNewLine(sublistSubRecFieldId)
                                                    if (!N.util.isArray(data[fieldId][sublistId][i][colId][sublistSubRecFieldId])) { // Ex. addressbookaddress
                                                        if (textIds.indexOf(sublistSubRecFieldId) > -1) {
                                                            subrec.setText(sublistSubRecFieldId, data[fieldId][sublistId][i][colId][sublistSubRecFieldId])
                                                        } else {
                                                            subrec.setValue(sublistSubRecFieldId, data[fieldId][sublistId][i][colId][sublistSubRecFieldId])
                                                        }
                                                    } else { // Ex. inventoryassignment
                                                        const _loop5_1 = j =>  {
                                                            Object.keys(data[fieldId][sublistId][i][colId][sublistSubRecFieldId][j]).forEach(colId2 => {
                                                                if (textIds.indexOf(colId2) > -1) {
                                                                    subrec.setCurrentSublistText(sublistSubRecFieldId, colId2, data[fieldId][sublistId][i][colId][sublistSubRecFieldId][j][colId2])
                                                                } else {
                                                                    subrec.setCurrentSublistValue(sublistSubRecFieldId, colId2, data[fieldId][sublistId][i][colId][sublistSubRecFieldId][j][colId2])
                                                                }
                                                            })
                                                        }
                                                        for (j in data[fieldId][sublistId][i][colId][sublistSubRecFieldId]) {
                                                            _loop5_1(j)
                                                        }
                                                    }
                                                    subrec.commitLine(sublistSubRecFieldId)
                                                }
                                            })()
                                        }
                                    } else {
                                        if (textIds.indexOf(colId) > -1) {
                                            rec.setCurrentSublistText(sublistId, colId, data[fieldId][sublistId][i][colId])
                                        } else {
                                            rec.setCurrentSublistValue(sublistId, colId, data[fieldId][sublistId][i][colId])
                                        }
                                    }
                                })
                                rec.commitLine(sublistId)
                            }
                        } else {
                            log.debug('ITEM_NOT_EXIST', 'Item does not exist in the current record')
                            if (!dynamic) {
                                Object.keys(data[fieldId][sublistId][i]).forEach(colId => {
                                    if (colId.match(/inventorydetail|addressbook/g)) {
                                        const invdetail = rec.getSublistValue(sublistId, 'inventorydetailavail', lc)
                                        const invdetailreq = rec.getSublistValue(sublistId, 'inventorydetailreq', lc)
                                        const isserial = rec.getSublistValue(sublistId, 'isserial', lc)
                                        const compdetailreq = rec.getSublistValue(sublistId, 'componentinventorydetailreq', lc) // For AB
                                        if (invdetail == 'T' || invdetailreq == 'T' || rectype == 'vendorbill' || compdetailreq == 'T' || colId == 'addressbookaddress') {
                                            (() => {
                                                const subrec = rec.getSublistSubrecord(sublistId, colId, lc)
                                                const sublistSubRecFieldIds = Object.keys(data[fieldId][sublistId][i][colId])
                                                for (k in sublistSubRecFieldIds) {
                                                    const sublistSubRecFieldId = sublistSubRecFieldIds[k]
                                                    if (!N.util.isArray(data[fieldId][sublistId][i][colId][sublistSubRecFieldId])) { // Ex. addressbookaddress
                                                        if (textIds.indexOf(sublistSubRecFieldId) > -1) {
                                                            subrec.setText(sublistSubRecFieldId, data[fieldId][sublistId][i][colId][sublistSubRecFieldId])
                                                        } else {
                                                            subrec.setValue(sublistSubRecFieldId, data[fieldId][sublistId][i][colId][sublistSubRecFieldId])
                                                        }
                                                    } else { // Ex. inventoryassignment
                                                        const _loop6 = j =>  {
                                                            Object.keys(data[fieldId][sublistId][i][colId][sublistSubRecFieldId][j]).forEach(colId2 => {
                                                                if (textIds.indexOf(colId2) > -1) {
                                                                    subrec.setSublistText(sublistSubRecFieldId, colId2, j, data[fieldId][sublistId][i][colId][sublistSubRecFieldId][j][colId2])
                                                                } else {
                                                                    subrec.setSublistValue(sublistSubRecFieldId, colId2, j, data[fieldId][sublistId][i][colId][sublistSubRecFieldId][j][colId2])
                                                                }
                                                            })
                                                        }
                                                        for (const j in data[fieldId][sublistId][i][colId][sublistSubRecFieldId]) {
                                                            _loop6(j)
                                                        }
                                                    }
                                                }
                                                })()
                                        }
                                    } else {
                                        if (textIds.indexOf(colId) > -1) {
                                            rec.setSublistText(sublistId, colId, lc, data[fieldId][sublistId][i][colId])
                                        } else {
                                            rec.setSublistValue(sublistId, colId, lc, data[fieldId][sublistId][i][colId])
                                        }
                                    }
                                })
                            } else {
                                rec.selectNewLine(sublistId)
                                Object.keys(data[fieldId][sublistId][i]).forEach(colId => {
                                    if (colId.match(/inventorydetail|addressbook/g)) { // Create/Edit Subrecord
                                        const invdetail = rec.getCurrentSublistValue(sublistId, 'inventorydetailavail')
                                        const invdetailreq = rec.getCurrentSublistValue(sublistId, 'inventorydetailreq')
                                        const isserial = rec.getCurrentSublistValue(sublistId, 'isserial')
                                        const compdetailreq = rec.getCurrentSublistValue(sublistId, 'componentinventorydetailreq') // For AB
                                        if (invdetail == 'T' || invdetailreq == 'T' || rectype == 'vendorbill' || compdetailreq == 'T' || colId == 'addressbookaddress') {
                                            (() => {
                                                const subrec = rec.getCurrentSublistSubrecord(sublistId, colId)
                                                const sublistSubRecFieldId = Object.keys(data[fieldId][sublistId][i][colId])[0]
                                                const _loop7 = j =>  {
                                                    subrec.selectNewLine(sublistSubRecFieldId)
                                                    Object.keys(data[fieldId][sublistId][i][colId][sublistSubRecFieldId][j]).forEach(colId2 => {
                                                        if (textIds.indexOf(colId2) > -1) {
                                                            subrec.setCurrentSublistText(sublistSubRecFieldId, colId2, data[fieldId][sublistId][i][colId][sublistSubRecFieldId][j][colId2])   
                                                        } else {
                                                            subrec.setCurrentSublistValue(sublistSubRecFieldId, colId2, data[fieldId][sublistId][i][colId][sublistSubRecFieldId][j][colId2])
                                                        }
                                                    })
                                                    subrec.commitLine(sublistSubRecFieldId)
                                                }
                                                for (const j in data[fieldId][sublistId][i][colId][sublistSubRecFieldId]) {
                                                    _loop7(j)
                                                }
                                            })()
                                        }
                                    } else {
                                        if (textIds.indexOf(colId) > -1) {
                                            rec.setCurrentSublistText(sublistId, colId, data[fieldId][sublistId][i][colId])
                                        } else {
                                            rec.setCurrentSublistValue(sublistId, colId, data[fieldId][sublistId][i][colId])
                                        }
                                    }
                                })
                                rec.commitLine(sublistId)
                            }
                        }
                    }
                    for (var i in data[fieldId][sublistId]) { // Sublist ID(s)
                        _loop4(i)
                    }
                })
            } else if (fieldId != 'sublist' && N.util.isObject(data[fieldId]) && !N.util.isDate(data[fieldId])) {
                const subrec = rec.getSubrecord(fieldId)
                Object.keys(data[fieldId]).forEach((sublistId, colId2) => {
                    if (N.util.isObject(data[fieldId][sublistId]) && !N.util.isDate(data[fieldId][sublistId])) {
                        const _loop8 = i =>  {
                            if (!dynamic) {
                                Object.keys(data[fieldId][sublistId][i]).forEach(colId => { // Subrecord sublist
                                    if (textIds.indexOf(colId) > -1) {
                                        subrec.setSublistText(sublistId, colId, parseInt(i), data[fieldId][sublistId][i][colId])
                                    } else {
                                        subrec.setSublistValue(sublistId, colId, parseInt(i), data[fieldId][sublistId][i][colId])
                                    }
                                })
                            } else {
                                subrec.selectNewLine(sublistId)
                                Object.keys(data[fieldId][sublistId][i]).forEach(colId => { // Subrecord sublist
                                    if (textIds.indexOf(colId) > -1) {
                                        subrec.setCurrentSublistText(sublistId, colId, data[fieldId][sublistId][i][colId])
                                    } else {
                                        subrec.setCurrentSublistValue(sublistId, colId, data[fieldId][sublistId][i][colId])
                                    }
                                })
                                subrec.commitLine(sublistId)
                            }
                        }
                        for (const i in data[fieldId][sublistId]) {
                            _loop8(i)
                        }
                    } else {
                        if (textIds.indexOf(sublistId) > -1) {
                            subrec.setText(sublistId, data[fieldId][sublistId])
                        } else {
                            subrec.setValue(sublistId, data[fieldId][sublistId])
                        }
                    }
                })
            } else {
                if (textIds.indexOf(fieldId) > -1) {
                    rec.setText(fieldId, data[fieldId])
                } else {
                    rec.setValue(fieldId, data[fieldId])
                }
            }
        })
        const id = rec.save({ ignoreMandatoryFields: true })
        log.debug('Data Edited', { type: rectype, id, data })
        return id
    }

    /**
     * @param  {String}  rectype    From record type
     * @param  {String}  recid      From record id
     * @param  {String}  toRectype Transformed record type
     * @param  {Object}  data       Key value pairs
     * @param  {Boolean} dynamic    Dynamic mode
     * @param  {Object}  defVal     Default values
     * @param  {Object}  textIds    List fields for setText || setSublistText commands
     * @return {Number}             Record id
     */
    exports.transformRecord = (rectype, recid, toRectype, data, dynamic, defVal, textIds) => {
        textIds = textIds || []
        
        const rec = N.record.transform({
            fromType: rectype,
            fromId: recid,
            toType: toRectype,
            isDynamic: dynamic,
            defaultValues: defVal
        })
        Object.keys(data).forEach(fieldId => {
            if (fieldId == 'sublist') {
                Object.keys(data[fieldId]).forEach(sublistId => {
                    if (toRectype == N.record.Type.ITEM_FULFILLMENT || toRectype == N.record.Type.ITEM_RECEIPT) { // Sublist ID(s)
                        const lc = rec.getLineCount(sublistId)
                        for (var i = 0; i < lc; i++) {
                            if (dynamic) {
                                rec.selectLine(sublistId, parseInt(i))
                                rec.setCurrentSublistValue(sublistId, 'itemreceive', false) // Untick fulfill / receive
                                rec.commitLine(sublistId)
                            } else {
                                rec.setSublistValue(sublistId, 'itemreceive', parseInt(i), false) // Untick fulfill / receive
                            }
                        }
                    }
                    if (rectype == N.record.Type.SALES_ORDER && toRectype == N.record.Type.RETURN_AUTHORIZATION) {
                        const lc = rec.getLineCount(sublistId)
                        for (var i = lc - 1; i >= 0; i--) {
                            const col1 = Object.keys(data[fieldId][sublistId][0])[0]
                            const item = rec.getSublistValue(sublistId, col1, i)
                            const index = data[fieldId][sublistId].findIndex(fi => fi[col1] == item)
                            if (index == -1) {
                                if (dynamic) 
                                    rec.selectLine(sublistId, parseInt(i))
                                rec.removeLine(sublistId, parseInt(i));
                            }
                        }
                    }
                    const _loop9 = (i)  => {
                        const col1 = Object.keys(data[fieldId][sublistId][i])[0]
                        const item = data[fieldId][sublistId][i][col1]
                        const index = rec.findSublistLineWithValue(sublistId, col1, item)

                        log.debug('col1', {recid,sublistId,col1,item,index})
                        if (index != -1) {
                            if (!dynamic) {
                                Object.keys(data[fieldId][sublistId][i]).forEach(colId => {
                                    if (colId.match(/inventorydetail|addressbook/g)) {
                                        const invdetail = rec.getSublistValue(sublistId, 'inventorydetailavail', index)
                                        const invdetailreq = rec.getSublistValue(sublistId, 'inventorydetailreq', index)
                                        const isserial = rec.getSublistValue(sublistId, 'isserial', index)
                                        const compdetailreq = rec.getSublistValue(sublistId, 'componentinventorydetailreq', index) // For AB
                                        if (invdetail == 'T' || invdetailreq == 'T' || rectype == 'vendorbill' || compdetailreq == 'T' || colId == 'addressbookaddress') {
                                            (() => {
                                                const subrec = rec.getSublistSubrecord(sublistId, colId, index)
                                                const sublistSubRecFieldId = Object.keys(data[fieldId][sublistId][i][colId])[0]
                                                const _loop10 = j =>  {
                                                    Object.keys(data[fieldId][sublistId][i][colId][sublistSubRecFieldId][j]).forEach(colId2 => {
                                                        if (textIds.indexOf(colId2) > -1) {
                                                            subrec.setSublistText(sublistSubRecFieldId, colId2, parseInt(j), data[fieldId][sublistId][i][colId][sublistSubRecFieldId][j][colId2])
                                                        } else {
                                                            subrec.setSublistValue(sublistSubRecFieldId, colId2, parseInt(j), data[fieldId][sublistId][i][colId][sublistSubRecFieldId][j][colId2])
                                                        }
                                                    })
                                                }
                                                for (const j in data[fieldId][sublistId][i][colId][sublistSubRecFieldId]) {
                                                    _loop10(j)
                                                }
                                            })()
                                        }
                                    } else {
                                        rec.setSublistValue(sublistId, 'itemreceive', parseInt(index), true) // tick fulfill / receive
                                        if (textIds.indexOf(colId) > -1) {
                                            rec.setSublistText(sublistId, colId, index, data[fieldId][sublistId][i][colId])
                                        } else {
                                            rec.setSublistValue(sublistId, colId, index, data[fieldId][sublistId][i][colId])
                                        }
                                    }
                                })
                            } else {
                                rec.selectLine(sublistId, parseInt(index))
                                Object.keys(data[fieldId][sublistId][i]).forEach(colId => {
                                    if (colId.indexOf('inventorydetail') == -1) {
                                        if (textIds.indexOf(colId) > -1) {
                                            rec.setCurrentSublistText(sublistId, colId, data[fieldId][sublistId][i][colId])
                                        } else {
                                            rec.setCurrentSublistValue(sublistId, colId, data[fieldId][sublistId][i][colId])
                                        }
                                    }
                                })
                                rec.commitLine(sublistId)
                            }
                        } else { // Return 'Item does not exist in current record'
                            if (!dynamic) {
                                Object.keys(data[fieldId][sublistId][i]).forEach(colId => {
                                    if (colId.match(/inventorydetail|addressbook/g)) {
                                        const invdetail = rec.getSublistValue(sublistId, 'inventorydetailavail', index)
                                        const invdetailreq = rec.getSublistValue(sublistId, 'inventorydetailreq', index)
                                        const isserial = rec.getSublistValue(sublistId, 'isserial', index)
                                        const compdetailreq = rec.getSublistValue(sublistId, 'componentinventorydetailreq', index) // For AB
                                        if (invdetail == 'T' || invdetailreq == 'T' || rectype == 'vendorbill' || compdetailreq == 'T' || colId == 'addressbookaddress') {
                                            (() => {
                                                const subrec = rec.getSublistSubrecord(sublistId, colId, index)
                                                const sublistSubRecFieldId = Object.keys(data[fieldId][sublistId][i][colId])[0]
                                                const lc2 = subrec.getLineCount(sublistSubRecFieldId)
                                                const _loop6 = j =>  {
                                                    Object.keys(data[fieldId][sublistId][i][colId][sublistSubRecFieldId][j]).forEach(colId2 => {
                                                        try {
                                                            if (textIds.indexOf(colId2) > -1) {
                                                                subrec.setSublistText(sublistSubRecFieldId, colId2, parseInt(j), data[fieldId][sublistId][i][colId][sublistSubRecFieldId][j][colId2])
                                                            } else {
                                                                subrec.setSublistValue(sublistSubRecFieldId, colId2, parseInt(j), data[fieldId][sublistId][i][colId][sublistSubRecFieldId][j][colId2])
                                                            }
                                                        } catch (e) {
                                                            log.debug('error', e.message)
                                                        }
                                                    })
                                                }
                                                for (const j in data[fieldId][sublistId][i][colId][sublistSubRecFieldId]) {
                                                    _loop6(j)
                                                }
                                            })()
                                        }
                                    } else {
                                        if (textIds.indexOf(colId) > -1) {
                                            rec.setSublistText(sublistId, colId, parseInt(i), data[fieldId][sublistId][i][colId])
                                        } else {
                                            rec.setSublistValue(sublistId, colId, parseInt(i), data[fieldId][sublistId][i][colId])
                                        }
                                    }
                                })
                            } else {
                                rec.selectNewLine(sublistId)
                                Object.keys(data[fieldId][sublistId][i]).forEach(colId => {
                                    if (colId.match(/inventorydetail|addressbook/g)) { // Create/Edit Subrecord
                                        const invdetail = rec.getCurrentSublistValue(sublistId, 'inventorydetailavail')
                                        const invdetailreq = rec.getCurrentSublistValue(sublistId, 'inventorydetailreq')
                                        const isserial = rec.getCurrentSublistValue(sublistId, 'isserial')
                                        const compdetailreq = rec.getCurrentSublistValue(sublistId, 'componentinventorydetailreq') // For AB
                                        if (invdetail == 'T' || invdetailreq == 'T' || rectype == 'vendorbill' || compdetailreq == 'T' || colId == 'addressbookaddress') {
                                            (() => {
                                                const subrec = rec.getCurrentSublistSubrecord(sublistId, colId)
                                                const sublistSubRecFieldId = Object.keys(data[fieldId][sublistId][i][colId])[0]
                                                const _loop7 = j =>  {
                                                    subrec.selectNewLine(sublistSubRecFieldId)
                                                    Object.keys(data[fieldId][sublistId][i][colId][sublistSubRecFieldId][j]).forEach(colId2 => {
                                                        subrec.setCurrentSublistValue(sublistSubRecFieldId, colId2, data[fieldId][sublistId][i][colId][sublistSubRecFieldId][j][colId2])
                                                    })
                                                    subrec.commitLine(sublistSubRecFieldId)
                                                }
                                                for (const j in data[fieldId][sublistId][i][colId][sublistSubRecFieldId]) {
                                                    _loop7(j)
                                                }
                                            })()
                                        }
                                    } else {
                                        if (textIds.indexOf(colId) > -1) {
                                            rec.setCurrentSublistText(sublistId, colId, data[fieldId][sublistId][i][colId])
                                        } else {
                                            rec.setCurrentSublistValue(sublistId, colId, data[fieldId][sublistId][i][colId])
                                        }
                                    }
                                })
                                rec.commitLine(sublistId)
                            }
                        }
                    }
                    for (var i in data[fieldId][sublistId]) {
                        _loop9(i)
                    }
                })
            } else if (fieldId != 'sublist' && N.util.isObject(data[fieldId]) && !N.util.isDate(data[fieldId])) {
                const subrec = rec.getSubrecord(fieldId)
                Object.keys(data[fieldId]).forEach((sublistId, colId2) => {
                    if (N.util.isObject(data[fieldId][sublistId]) && !N.util.isDate(data[fieldId][sublistId])) {
                        const _loop11 = i =>  {
                            if (!dynamic) {
                                Object.keys(data[fieldId][sublistId][i]).forEach(colId => { // Subrecord sublist
                                    if (textIds.indexOf(colId) > -1) {
                                        subrec.setSublistText(sublistId, colId, parseInt(i), data[fieldId][sublistId][i][colId])
                                    } else {
                                        subrec.setSublistValue(sublistId, colId, parseInt(i), data[fieldId][sublistId][i][colId])
                                    }
                                })
                            } else {
                                subrec.selectNewLine(sublistId)
                                Object.keys(data[fieldId][sublistId][i]).forEach(colId => { // Subrecord sublist
                                    if (textIds.indexOf(colId) > -1) {
                                        subrec.setCurrentSublistText(sublistId, colId, data[fieldId][sublistId][i][colId])
                                    } else {
                                        subrec.setCurrentSublistValue(sublistId, colId, data[fieldId][sublistId][i][colId])
                                    }
                                })
                                subrec.commitLine(sublistId)
                            }
                        }
                        for (const i in data[fieldId][sublistId]) {
                            _loop11(i)
                        }
                    } else {
                        if (textIds.indexOf(sublistId) > -1) {
                            subrec.setText(sublistId, data[fieldId][sublistId])
                        } else {
                            subrec.setValue(sublistId, data[fieldId][sublistId])
                        }
                    }
                })
            } else {
                if (textIds.indexOf(fieldId) > -1) {
                    rec.setText(fieldId, data[fieldId])
                } else {
                    rec.setValue(fieldId, data[fieldId])
                }
            }
        })
        const id = rec.save({ ignoreMandatoryFields: true })
        log.debug('Data transformed', { from: { type: rectype, id: recid }, to: { type: toRectype, id }, data })
        return id
    }

    return exports
})