/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @Name LMRY_AR_Wht_Send_Email_STLT_V2.1.js
 * @Author LatamReady - Giussepe Delgado
 * @Date 29/01/2024
 */
define([
    'N/log',
    'N/search',
    'N/redirect',
    'N/runtime',
    'N/ui/serverWidget',
    'N/url',
    'N/task',
    "../Latam Tools/Router/LMRY_AR_Library_ROUT",
    "../Constants/LMRY_AR_Features_CONST",
    "../Constants/LMRY_AR_GlobalConstants_LBRY"
],
    (
        log,
        search,
        redirect,
        runtime,
        serverWidget,
        url,
        task,
        Router_LBRY,
        Features,
        Constants,
    ) => {
        const CLIENT_SCRIPT_PATH = "./LMRY_AR_Wht_Send_Email_CLNT_V2.1.js";
        const LMRY_SCRIPT = "LMRY_AR_Wht_Send_Email_STLT_V2.1.js";
        const { Error_LBRY, Licenses_LBRY } = Router_LBRY;
        const onRequest = (context) => {
            const scriptContext = {
                scriptId: runtime.getCurrentScript().id,
                deploymentId: runtime.getCurrentScript().deploymentId,
                params: context.request.parameters,
                method: context.request.method,
                response: context.response
            };

            const handler = new SuiteletFormManager({
                params: scriptContext.params,
                method: scriptContext.method
            });

            scriptContext.method === "GET" ? processGETRequest(handler, scriptContext) : processPOSTRequest(handler, scriptContext);
        };

        const processGETRequest = (handler, { params, response }) => {
            try {


                const status = Number(params.status);
                const { form, active } = handler.createForm();
                if (active) {

                    status ? handler.setFormValues() : handler.loadFormValues();
                    handler.createTransactionSublist(
                            "custpage_results_list",
                            "transactions_tab",
                            handler.translations.LMRY_WITH_EMAIL,
                            true
                        );
                    handler.createTransactionSublist(
                            "custpage_results_list_no_email",
                            "transactions_tab_no_email",
                            handler.translations.LMRY_WITHOUT_EMAIL,
                            false
                        );
                    if (status){
                        handler.getVendorPaymentDetails();
                        log.error("data",handler.data);
                        handler.loadTransactionSublist("custpage_results_list",true);
                        handler.loadTransactionSublist("custpage_results_list_no_email",false);
                    } 
                    form.clientScriptModulePath = CLIENT_SCRIPT_PATH;
                }

                response.writePage(form);

            } catch (err) {
                
                log.error("[ onRequest - GET ]", err);
                log.error("[ onRequest - GET stack ]", err.stack);
                Error_LBRY.handleError({ title: "[onRequest - GET]", err, script: LMRY_SCRIPT ,suiteAppId: Constants.APP_ID });
            }
        };

        const processPOSTRequest = (handler, { params, scriptId, deploymentId }) => {
            try {
                const status = Number(params.custpage_status);
                if (!status) {
                    redirect.toSuitelet({
                        scriptId,
                        deploymentId,
                        parameters: handler.getRedirectParams()
                    });

                } else {
                    const parameters = {
                        state: params.custpage_log_id,
                        user: runtime.getCurrentUser().id
                    };
                    handler.runMapReduce(parameters);
                    handler.toLogSuitelet();
                }
            } catch (err) {
                Error_LBRY.handleError({ title: "[onRequest - POST]", err, script: LMRY_SCRIPT ,suiteAppId: Constants.APP_ID });
                log.error("[ onRequest - POST ]", err);
            }
        };

        class SuiteletFormManager {
            constructor(options) {
                this.params = options.params || {};
                this.method = options.method;
                this.FEAT_SUBS = this.isValid(runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' }));
                this.FEAT_CALENDAR = this.isValid(runtime.isFeatureInEffect({ feature: 'MULTIPLECALENDARS' }));
                let language = runtime.getCurrentScript().getParameter({ name: "LANGUAGE" }).substring(0, 2);
                language = language === "es" ? language : "en";
                this.translations = this.getTranslations(language);
                this.subsidiaries = [];
                this.deploy = runtime.getCurrentScript().deploymentId;
                this.names = this.getNames(this.deploy);
                this.data = [];
            }

            getNames(deploy) {
                let nameList = {
                    customdeploy_lmry_ste_ar_wht_se_stlt: {
                        scriptid: 'customscript_lmry_ste_ar_wht_se_log_stlt',
                        deployid: 'customdeploy_lmry_ste_ar_wht_se_log_stlt',
                        scriptMapReduce: 'customscript_lmry_ste_ar_wht_se_mprd',
                        deployMapReduce: 'customdeploy_lmry_ste_ar_wht_se_mprd',
                        paramuser: 'custscript_lmry_ste_ar_wht_se_user',
                        paramstate: 'custscript_lmry_ste_ar_wht_se_state'
                    }
                };
                return nameList[deploy];
            }

            createForm() {

                this.form = serverWidget.createForm({
                    title: 'LR AR Wht Send Email'
                });

                if (!this.areThereSubsidiaries()) {
                    this.addNoSubsidiaryMessage();
                    return { form: this.form, active: false };
                }

                this.setupFormWithSubsidiaries();

                return { form: this.form, active: true };
            }

            addNoSubsidiaryMessage() {
                let myInlineHtml = this.form.addField({
                    id: 'custpage_lmry_v_message',
                    label: this.translations.LMRY_MESSAGE,
                    type: serverWidget.FieldType.INLINEHTML
                }).updateLayoutType({
                    layoutType: serverWidget.FieldLayoutType.OUTSIDEBELOW
                }).updateBreakType({
                    breakType: serverWidget.FieldBreakType.STARTCOL
                });

                const messageHtml = `
                <html>
                    <head>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                background-color: #f7f7f7;
                                margin: 0;
                                padding: 0;
                            }
                            .container {
                                width: 100%;
                                max-width: 600px;
                                margin: 0 auto;
                                padding: 20px;
                                border-top: 2px solid red;
                            }
                            .message {
                                color: #555555;
                                font-size: 16px;
                                line-height: 1.5;
                            }
                            .message a {
                                color: #007bff;
                                text-decoration: none;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <p class="message">
                                ${this.translations.LMRY_MESSAGE_LICENSE}. <br>
                                ${this.translations.LMRY_MESSAGE_CONTACT} <a href="https://www.Latamready.com" target="_blank">www.Latamready.com</a>
                            </p>
                        </div>
                    </body>
                </html>`;
                myInlineHtml.defaultValue = messageHtml;
            }

            setupFormWithSubsidiaries() {
                this.form.addButton({
                    label: this.translations.LMRY_VIEW_LOG,
                    id: "custpage_btn_log",
                    functionName: "backLog"
                });
                this.addGroup('mainGroup', this.translations.LMRY_PRIMARY_INFO);
                if (this.FEAT_SUBS) {
                    this.addSelectField('custpage_subsidiary', this.translations.LMRY_SUBSIDIARY, 'mainGroup').isMandatory();
                }
                this.addSelectField('custpage_entity', this.translations.LMRY_VENDOR, 'mainGroup')
                this.addCheckField('custpage_view_sent', this.translations.LMRY_VIEW_SENT, 'mainGroup');
                this.addDateField('custpage_period_start', this.translations.LMRY_PERIOD_START, 'mainGroup').isMandatory();
                this.addDateField('custpage_period_end', this.translations.LMRY_PERIOD_END, 'mainGroup').isMandatory();
                
                this.addSimpleField('custpage_status', 'Status', 'mainGroup').isHidden();
                this.addAreaField('custpage_log_id', 'Log ID', 'mainGroup').isHidden();
                this.addSimpleField('custpage_deploy_id', 'Deploy ID', 'mainGroup').setDefautValue(runtime.getCurrentScript().deploymentId).isHidden();

                this.addFormButtons();
            }

            addGroup(groupId, label) {
                this.form.addFieldGroup({
                    id: groupId,
                    label: label
                });
            }

            addCustomField(id, type, label, container) {
                let field = this.form.addField({
                    id: id,
                    type: type,
                    label: label,
                    container: container
                });
                return {
                    field: field,
                    isMandatory: function () {
                        this.field.isMandatory = true;
                        return this;
                    },
                    setHelpText: function (help) {
                        this.field.setHelpText(help);
                        return this;
                    },
                    isHidden: function () {
                        this.field.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.HIDDEN
                        });
                        return this;
                    },
                    setDefautValue: function (value) {
                        this.field.defaultValue = value;
                        return this;
                    }
                };
            }


            addSelectField(id, label, container) {
                return this.addCustomField(id, serverWidget.FieldType.SELECT, label, container).setHelpText({ help: id });
            }

            addDateField(id, label, container) {
                return this.addCustomField(id, serverWidget.FieldType.DATE, label, container).setHelpText({ help: id });
            }

            addCheckField(id, label, container) {
                return this.addCustomField(id, serverWidget.FieldType.CHECKBOX, label, container).setHelpText({ help: id });
            }

            addSimpleField(id, label, container) {
                return this.addCustomField(id, serverWidget.FieldType.TEXT, label, container).setHelpText({ help: id });
            }
            addAreaField(id, label, container) {
                return this.addCustomField(id, serverWidget.FieldType.TEXTAREA, label, container).setHelpText({ help: id });
            }

            addFormButtons() {
                if (!Number(this.params.status)) {
                    this.form.addSubmitButton({ label: this.translations.LMRY_FILTER });
                } else {
                    this.form.addSubmitButton({ label: this.translations.LMRY_SEND });
                    this.form.addButton({
                        id: 'btn_back',
                        label: this.translations.LMRY_BACK,
                        functionName: 'back'
                    });
                    // Deshabilitar campos si es necesario

                    this.disableFields();
                }
                this.form.addResetButton({ label: this.translations.LMRY_RESTART });
            }


            disableFields() {
                const fieldsToDisable = ['custpage_subsidiary','custpage_entity', 'custpage_view_sent', 'custpage_period_start', 'custpage_period_end'];
                fieldsToDisable.forEach(fieldId => {
                    let field = this.form.getField({ id: fieldId });
                    if (field) {
                        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    }
                });
            }


            areThereSubsidiaries() {
                let anySubsidiaryActive = false;

                if (this.FEAT_SUBS) {
                    this.subsidiaries = this.getSubsidiaries();
                    this.subsidiaries.forEach(subsidiary => {

                        subsidiary.active = this.isFeatureActive(Features.AR_BASIC_LOCALIZATION, subsidiary.value);
                        if (subsidiary.active) {
                            anySubsidiaryActive = true;
                        }
                    });
                } else { // COMPROBAR
                    const isAuthorized = this.isFeatureActive(Features.AR_BASIC_LOCALIZATION, "1");;
                    this.subsidiaries = [{
                        value: 1,
                        text: 'Company',
                        active: isAuthorized
                    }];
                    anySubsidiaryActive = isAuthorized;
                }
                return anySubsidiaryActive;
            }



            getSubsidiaries() {

                let searchSubs = search.create({
                    type: search.Type.SUBSIDIARY,
                    filters: [['isinactive', 'is', 'F'], 'AND', ['country', 'is', 'AR']],
                    columns: ['internalid', 'name']
                });

                return searchSubs.run().getRange(0, 1000).map(result => ({
                    value: result.getValue('internalid'),
                    text: result.getValue('name'),
                    active: false
                }));
            }

            createTransactionSublist(listID,tabID,titleTab,isWithEmail) {
                this.form.addTab({
                    id: tabID,
                    label: titleTab
                });

                this.sublist = this.form.addSublist({
                    id: listID,
                    label: titleTab,
                    tab: 'transactions_tab',
                    type: serverWidget.SublistType.LIST
                });
                let fields;
                if (isWithEmail) {
                    fields = [
                        { id: 'apply', label: this.translations.LMRY_APPLY, type: serverWidget.FieldType.CHECKBOX },
                        { id: 'tranid', label: this.translations.LMRY_DOCUMENT_NUMBER, type: serverWidget.FieldType.TEXT },
                        { id: 'entity', label: this.translations.LMRY_VENDOR, type: serverWidget.FieldType.TEXT },
                        { id: 'email', label: this.translations.LMRY_EMAIL, type: serverWidget.FieldType.TEXT },
                        { id: 'sent', label: this.translations.LMRY_SENT, type: serverWidget.FieldType.CHECKBOX },
                        { id: 'internalidtext', label: 'internal_id', type: serverWidget.FieldType.TEXT, displayType: serverWidget.FieldDisplayType.HIDDEN },
                        { id: 'entity_id', label: 'entity_id', type: serverWidget.FieldType.TEXT, displayType: serverWidget.FieldDisplayType.HIDDEN }
                    ];
                    
                }else{
                    fields = [
                        { id: 'tranid_out', label: this.translations.LMRY_DOCUMENT_NUMBER, type: serverWidget.FieldType.TEXT },
                        { id: 'entity_out', label: this.translations.LMRY_VENDOR, type: serverWidget.FieldType.TEXT },
                        { id: 'email_out', label: this.translations.LMRY_EMAIL, type: serverWidget.FieldType.TEXT },
                        { id: 'sent_out', label: this.translations.LMRY_SENT, type: serverWidget.FieldType.CHECKBOX },
                        { id: 'internalidtext_out', label: 'internal_id', type: serverWidget.FieldType.TEXT, displayType: serverWidget.FieldDisplayType.HIDDEN },
                        { id: 'entity_id_out', label: 'entity_id', type: serverWidget.FieldType.TEXT, displayType: serverWidget.FieldDisplayType.HIDDEN }
                    ];
                }
                

                fields.forEach(fieldInfo => {
                    let field = this.sublist.addField(fieldInfo);
                    if (fieldInfo.displayType) {
                        field.updateDisplayType({ displayType: fieldInfo.displayType });
                    }
                });

                if (isWithEmail) {
                    this.sublist.addButton({
                        id: 'markAll',
                        label: this.translations.LMRY_SELECT_ALL,
                        functionName: 'toggleCheckBoxes(true)'
                    });
                    this.sublist.addButton({
                        id: 'desmarkAll',
                        label: this.translations.LMRY_DESELECT_ALL,
                        functionName: 'toggleCheckBoxes(false)'
                    });
                }
                
                
                return this.sublist;
            }

            loadFormValues() {
                if (this.FEAT_SUBS) {
                    this.fillSubsidiaries();
                }
                this.fillPeriods();
            }

            fillSubsidiaries() {
                let subsidiaryField = this.form.getField({ id: 'custpage_subsidiary' });
                if (subsidiaryField) {
                    subsidiaryField.addSelectOption({ value: 0, text: '&nbsp;' });
                    this.subsidiaries?.filter(sub => sub.active).forEach(activeSub => {
                        subsidiaryField.addSelectOption({ value: activeSub.value, text: activeSub.text });
                    });
                }
            }

            fillPeriods() {
                const startPeriod = this.form.getField({ id: 'custpage_period_start' });
                const endPeriod = this.form.getField({ id: 'custpage_period_end' });
                startPeriod.defaultValue = new Date();
                endPeriod.defaultValue = new Date();
            }


            setFormValues() {
                const {
                    subsidiary,
                    startDate,
                    endDate,
                    viewSent,
                    vendor
                } = this.params;
                let form = this.form;

                log.error("setFormValues params",this.params);
                if (this.FEAT_SUBS == true || this.FEAT_SUBS == 'T') {
                    if (Number(subsidiary)) {
                        let subsidiaryField = form.getField({ id: 'custpage_subsidiary' });
                        let name = search.lookupFields({
                            type: 'subsidiary',
                            id: subsidiary,
                            columns: ['name']
                        }).name;
                        subsidiaryField.addSelectOption({ value: subsidiary, text: name });
                        subsidiaryField.defaultValue = subsidiary;
                    }

                    if (vendor && vendor !=="0") {
                        let vendorField = form.getField({ id: 'custpage_entity' });
                        const vendors = this.getVendors(subsidiary)
                        vendors.forEach( ({value,text}) => {
                            vendorField.addSelectOption({ value, text });
                        })
                        vendorField.defaultValue = vendor;
                    }
                }

                
                
                form.updateDefaultValues({
                    custpage_status: '1',
                    custpage_period_start: startDate || '',
                    custpage_period_end: endDate || '',
                    custpage_view_sent: viewSent
                });
            }

            loadTransactionSublist(listID,isWithEmail) {
                
                log.error("listID",listID)
                let sublist = this.form.getSublist({ id: listID });
                let countData=0;
                let countDataOut=0;
                this.data.forEach((billPayment, i) => {
                    const {
                        paymentID,
                        tranID,
                        recordType,
                        vendorID,
                        vendorName,
                        email,
                        sent
                    } = billPayment;
                    
                    if (email && isWithEmail) {
                        log.error("billPayment with email",billPayment)
                        const setSublistValue = (colId, value) => sublist.setSublistValue({ id: colId, line: countData, value });
                        setSublistValue("internalidtext", paymentID);
                        setSublistValue("entity_id", vendorID);

                        const tranUrl = url.resolveRecord({ recordType, recordId: paymentID, isEditMode: false });
                        setSublistValue("tranid", `<a class="dottedlink" href="${tranUrl}" target="_blank">${tranID}</a>`);

                        const tranUrlEntity = url.resolveRecord({ recordType: "vendor", recordId: vendorID, isEditMode: false });
                        setSublistValue("entity", `<a class="dottedlink" href="${tranUrlEntity}" target="_blank">${vendorName}</a>`);
                        setSublistValue("email", email);
                        setSublistValue("sent", sent);
                        log.error("countData with email antes",countData)
                        countData++;
                        log.error("countData with email despues",countData)
                    } 
                    if (!email && !isWithEmail) {
                        log.error("billPayment without email",billPayment)
                        const setSublistValue = (colId, value) => sublist.setSublistValue({ id: colId, line: countDataOut, value });
                        setSublistValue("internalidtext_out", paymentID);
                        setSublistValue("entity_id_out", vendorID);
                        const tranUrl = url.resolveRecord({ recordType, recordId: paymentID, isEditMode: false });
                        setSublistValue("tranid_out", `<a class="dottedlink" href="${tranUrl}" target="_blank">${tranID}</a>`);

                        const tranUrlEntity = url.resolveRecord({ recordType: "vendor", recordId: vendorID, isEditMode: false });
                        setSublistValue("entity_out", `<a class="dottedlink" href="${tranUrlEntity}" target="_blank">${vendorName}</a>`);
                        setSublistValue("sent_out", sent);
                        log.error("countData without email antes",countDataOut)
                        countDataOut++;
                        log.error("countData without email despues",countDataOut)
                    }
                    
                })
                log.error("countData",countData)
                if (countData && isWithEmail) {
                    sublist.label = `${sublist.label} (${countData})`;
                }
                if (countDataOut && !isWithEmail) {
                    sublist.label = `${sublist.label} (${countDataOut})`;
                }
            }

            getVendorPaymentDetails() {
                try {
                    const {startDate,endDate, vendor, viewSent} = this.params;
                    let jsonData = {};
                    let filters = [];
                    if (this.FEAT_SUBS) {
                        const { subsidiary } = this.params;
                        filters = [
                            ['custrecord_lmry_ste_ar_whtvpd_payment.subsidiary', 'is', subsidiary]
                        ];
                    }
                    log.error("params",this.params);
                    if (vendor && vendor !== "0") {
                        log.error("entre","entre vendor");
                        filters.push('AND',['custrecord_lmry_ste_ar_whtvpd_vendor', 'is', vendor]);
                    }

                    if (startDate && endDate) {
                        filters.push('AND',['custrecord_lmry_ste_ar_whtvpd_payment.trandate', 'onorafter', startDate]);
                        filters.push('AND',['custrecord_lmry_ste_ar_whtvpd_payment.trandate', 'onorbefore', endDate]);
                    }

                    let columns = [
                        search.createColumn({ name: 'formulatext', formula: '{custrecord_lmry_ste_ar_whtvpd_payment.id}' }),         //.0
                        search.createColumn({ name: 'formulatext', formula: '{custrecord_lmry_ste_ar_whtvpd_payment}' }),   //.1
                        search.createColumn({ name: 'formulatext', formula: '{custrecord_lmry_ste_ar_whtvpd_payment.recordType}' }), //.2
                        search.createColumn({ name: 'formulatext', formula: '{custrecord_lmry_ste_ar_whtvpd_vendor}' }),           //.3
                        search.createColumn({ name: 'formulatext', formula: '{custrecord_lmry_ste_ar_whtvpd_vendor.email}' }),       //.4
                        search.createColumn({ name: 'formulatext', formula: '{custrecord_lmry_ste_ar_whtvpd_vendor.id}' }),
                        search.createColumn({ name: 'formulatext', formula: '{custrecord_lmry_ste_ar_whtvpd_status.custrecord_lmry_ste_procstatus_code}' }),
                    ];

                    const searchBillPayments = search.create({
                        type: "customrecord_lmry_ste_ar_wht_vp_details",
                        filters: filters,
                        columns: columns
                    });
            
                    let pageData = searchBillPayments.runPaged({ pageSize: 1000 });
                    if (pageData) {
                        pageData.pageRanges.forEach(function (pageRange) {
                            let page = pageData.fetch({ index: pageRange.index });
                            page.data.forEach(function (result) {
            
                                const columns = result.columns;
                                const statusCode = result.getValue(columns[6]);
                                if (statusCode === "DONE") {
                                    const vendorID = result.getValue(columns[5]);
                                    const paymentID = result.getValue(columns[0]);
                                    if (!jsonData[vendorID]) {
                                        jsonData[vendorID] = { payments: [], paymentIDs: new Set() };
                                    }
            
                                    // Añadir solo si el paymentID no está ya en el Set
                                    if (!jsonData[vendorID].paymentIDs.has(paymentID)) {
                                        jsonData[vendorID].paymentIDs.add(paymentID);
                                        jsonData[vendorID].payments.push({
                                            paymentID: paymentID,
                                            tranID: result.getValue(columns[1]) || " - ",
                                            recordType: result.getValue(columns[2]),
                                            vendorID,
                                            vendorName: result.getValue(columns[3]) || " ",
                                            email: result.getValue(columns[4]),
                                            sent: "F"
                                        });
                                    }
                                }
                            });
                        });
                    }
            
                    let payments = [];
                    for (let vendorID in jsonData) {
                        payments = payments.concat(jsonData[vendorID].payments);
                    }

                    const paymentsSent = this.getPaymentsSent();

                    if (paymentsSent.size) {
                        if (this.isValid(viewSent)) {
                            // Se obtiene todos los payments
                            payments = payments.map((payment) => {
                                const isSent = paymentsSent.has(payment.paymentID);
                                payment.sent = isSent ? "T": "F";
                            } );
                        }else{
                            // Se obtiene los payments que no han sido enviados
                            payments = payments.reduce((paymentsResult,payment) =>{
                                if (!paymentsSent.has(payment.paymentID)) {
                                    payment.sent = "F"
                                    paymentsResult.push(payment);
                                }
                            },[]);
                        }
                    }
                    

                    this.data = payments;
                } catch (error) {
                    log.error('Error', error)
                }
            }


            getPaymentsSent() { // falta revisar
                let paymentsSent = [];
                const searchBillPaymentsSent = search.create({
                    type: "customrecord_lmry_ste_ar_wht_send",
                    filters: [
                        ["custrecord_lmry_ste_ar_wht_se_status.custrecord_lmry_ste_procstatus_code","is","DONE"]
                    ],
                    columns: ["custrecord_lmry_ste_ar_wht_se_payments"]
                });

                let pageData = searchBillPaymentsSent.runPaged({ pageSize: 1000 });
                if (pageData) {
                    pageData.pageRanges.forEach(function (pageRange) {
                        let page = pageData.fetch({ index: pageRange.index });
                        page.data.forEach(function (result) {
                            const billpayments = result.getValue("custrecord_lmry_ste_ar_wht_se_payments");
                            paymentsSent = paymentsSent.concat(JSON.parse(billpayments));
                        });
                    });
                }
                
                const paymentsIds =  new Set(paymentsSent.map(({id}) => (id)));
                return paymentsIds;
            }
            

            generatePeriodFormula(idsPeriod) {
                const periodsString = idsPeriod.map(id => `'${id}'`).join(', ');
                return `CASE WHEN {custbody_lmry_reference_transaction.postingperiod.id} IN (${periodsString}) THEN 1 ELSE 0 END`;
            }

            getRedirectParams() {
                const {
                    custpage_subsidiary,
                    custpage_period_start,
                    custpage_period_end,
                    custpage_view_sent,
                    custpage_entity
                } = this.params;

                return {
                    subsidiary: custpage_subsidiary || '',
                    startDate:  custpage_period_start || '',
                    endDate:    custpage_period_end || '',
                    viewSent:   custpage_view_sent || '',
                    vendor: custpage_entity || 0,
                    status: '1'
                };
            }

            getTranslations(country) {
                const translatedFields = {
                    "es": {
                        "LMRY_MESSAGE": "Mensaje",
                        "LMRY_MESSAGE_LICENSE": "AVISO: Actualmente la licencia para este módulo está vencida, por favor contacte al equipo comercial de LatamReady.",
                        "LMRY_MESSAGE_CONTACT": "También puedes contactar con nosotros a",
                        "LMRY_PRIMARY_INFO": "Informacion primaria",
                        "LMRY_SUBSIDIARY": "Subsidiaria",
                        "LMRY_WTH_TYPE": "Tipo de retención",
                        "LMRY_PERIOD_INTERVAL": "Intervalo de periodos",
                        "LMRY_START_DATE": "Fecha de inicio",
                        "LMRY_END_DATE": "Fecha final",
                        "LMRY_PERIOD": "Periodo contable",
                        "LMRY_START_PERIOD": "Periodo contable inicial",
                        "LMRY_FINAL_PERIOD": "Perido contable final",
                        "LMRY_FILTER": "Filtrar",
                        "LMRY_SEND": "Enviar",
                        "LMRY_BACK": "Atras",
                        "LMRY_RESTART": "Reiniciar",
                        "LMRY_PERIOD_TYPE": "Tipo de período",
                        "LMRY_TRANSACTIONS": "Transacciones",
                        "LMRY_RESULTS": "Resultados",
                        "LMRY_APPLY": "Aplicar",
                        "LMRY_DOCUMENT_NUMBER": "Nùmero de Documento",
                        "LMRY_INTERNALID": "ID Interno",
                        "LMRY_TRANSACTION_TYPE": "Tipo de transaccion",
                        "LMRY_FISCAL_DOCUMENT": "Numero de documento fiscal",
                        "LMRY_AMOUNT": "Importe",
                        "LMRY_SELECT_ALL": "Seleccionar todo",
                        "LMRY_DESELECT_ALL": "Deseleccionar todo",
                        "LMRY_WHT_HEADER": "Cabecera",
                        "LMRY_WHT_LINE": "Linea",
                        "LMRY_DATE_RANGE": "Rango de fechas",
                        "LMRY_TYPE_PROCESS": "Proceso",
                        "LMRY_SALES": "Ventas",
                        "LMRY_PURCHASES": "Compras",
                        "LMRY_ENTITY": "Entidad",
                        "LMRY_CURRENCY": "Moneda",
                        "LMRY_VIEW_LOG": "Ver registro",
                        "LMRY_RETEICA": "ReteICA",
                        "LMRY_RETEIVA": "ReteIVA",
                        "LMRY_RETEFTE": "ReteFte",
                        "LMRY_RETECRE": "ReteCre",
                        "LMRY_RECLASIFICATION": "Reclasificación",

                        "LMRY_VENDOR":"Proveedor",
                        "LMRY_PERIOD_START":"Fecha desde :",
                        "LMRY_PERIOD_END":"Fecha hasta :",
                        "LMRY_VIEW_SENT": "Mostrar enviados",
                        "LMRY_EMAIL": "CORREO",
                        "LMRY_SENT": "Enviado",
                        "LMRY_WITHOUT_EMAIL": "Sin Correo",
                        "LMRY_WITH_EMAIL": "Con correo"
                    },
                    "en": {
                        "LMRY_MESSAGE": "Message",
                        "LMRY_MESSAGE_LICENSE": "NOTICE: Currently the license for this module is expired, please contact the LatamReady sales team.",
                        "LMRY_MESSAGE_CONTACT": "You can also contact us through",
                        "LMRY_PRIMARY_INFO": "Primary information",
                        "LMRY_SUBSIDIARY": "Subsidiary",
                        "LMRY_WTH_TYPE": "Withholding type",
                        "LMRY_PERIOD_INTERVAL": "Period interval",
                        "LMRY_START_DATE": "Start date",
                        "LMRY_END_DATE": "End date",
                        "LMRY_PERIOD": "Accounting period",
                        "LMRY_START_PERIOD": "Initial Accounting period",
                        "LMRY_FINAL_PERIOD": "Final Accounting period",
                        "LMRY_FILTER": "Filter",
                        "LMRY_SEND": "Send",
                        "LMRY_BACK": "Back",
                        "LMRY_RESTART": "Restart",
                        "LMRY_PERIOD_TYPE": "Type of period",
                        "LMRY_TRANSACTIONS": "Transactions",
                        "LMRY_RESULTS": "Results",
                        "LMRY_APPLY": "Apply",
                        "LMRY_DOCUMENT_NUMBER": "Document Number",
                        "LMRY_INTERNALID": "Internal ID",
                        "LMRY_TRANSACTION_TYPE": "Transaction type",
                        "LMRY_FISCAL_DOCUMENT": "Fiscal document number",
                        "LMRY_AMOUNT": "Amount",
                        "LMRY_SELECT_ALL": "Select all",
                        "LMRY_DESELECT_ALL": "Deselect all",
                        "LMRY_WHT_HEADER": "Header",
                        "LMRY_WHT_LINE": "Line",
                        "LMRY_DATE_RANGE": "Date range",
                        "LMRY_TYPE_PROCESS": "Process",
                        "LMRY_SALES": "Sales",
                        "LMRY_PURCHASES": "Purchases",
                        "LMRY_ENTITY": "Entity",
                        "LMRY_CURRENCY": "Currency",
                        "LMRY_VIEW_LOG": "View Log",
                        "LMRY_RETEICA": "ReteICA",
                        "LMRY_RETEIVA": "ReteIVA",
                        "LMRY_RETEFTE": "ReteFte",
                        "LMRY_RETECRE": "ReteCre",
                        "LMRY_RECLASIFICATION": "Reclasification",


                        "LMRY_VENDOR":"Vendor",
                        "LMRY_PERIOD_START":"Date From :",
                        "LMRY_PERIOD_END":"Date To :",
                        "LMRY_VIEW_SENT": "View Sent",
                        "LMRY_EMAIL": "EMAIL",
                        "LMRY_SENT": "Sent",
                        "LMRY_WITHOUT_EMAIL": "Without Email",
                        "LMRY_WITH_EMAIL": "With Email"
                    }
                }
                return translatedFields[country];
            }


            toLogSuitelet() {
                redirect.toSuitelet({
                    scriptId: this.names.scriptid,
                    deploymentId: this.names.deployid
                });
            }

            runMapReduce({ state, user }) {

                const { scriptMapReduce: MPRD_SCRIPT_ID, deployMapReduce: MPRD_DEPLOY_ID } = this.names;
                const parameters = {
                    custscript_lmry_ste_ar_wht_se_user: user,
                    custscript_lmry_ste_ar_wht_se_state: state
                };

                task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: MPRD_SCRIPT_ID,
                    deploymentId: MPRD_DEPLOY_ID,
                    params: parameters
                }).submit();
            }


            isValid(bool) {
                return (bool === "T" || bool === true);
            }

            setParams(parameters) {
                this.params = parameters;
            }

            isFeatureActive(feature, subsidiary) {
                const Licenses = new Licenses_LBRY.Licenses({ subsidiaryId: subsidiary });
                return Licenses.getAuthorization(feature)
            }

            getVendors(subsidiary){
                
                let vendors = [];
                const newSearchVendor = search.create({
                    type: "vendor",
                    filters: [
                        ['subsidiary', 'is', subsidiary]
                    ],
                    columns: [
                        search.createColumn({
                            name: "formulatext",
                            formula: "CASE WHEN {isperson} = 'T' THEN {firstname} ELSE '' END",
                            label: "0. Nombres"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "CASE WHEN {isperson} = 'T' THEN {middlename} ELSE '' END",
                            label: "1. Segundo nombre"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "CASE WHEN {isperson} = 'T' THEN {lastname} ELSE '' END",
                            label: "2. Apellidos"
                        }),    
                        search.createColumn({
                            name: "formulatext",
                            formula: "CASE WHEN {isperson} = 'F' THEN {companyname} ELSE '' END",
                            label: "3. Razón Social"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "{isperson}",
                            label: "4. tipo de entidad"
                        }),                        
                    ]
                }); 
            
                newSearchVendor.run().each(result =>{
                    const columns = result.columns;
            
                    const isPerson = result.getValue(columns[4]);
            
                    if (isPerson ==="T" || isPerson === true) {
                        const firstname = result.getValue(columns[0]);
                        const middlename = result.getValue(columns[1]);
                        const lastname = result.getValue(columns[2]);
                        const fullname = `${firstname} ${middlename} ${lastname}`;
                        vendors.push({
                            value:result.id,
                            text:fullname
                        });
                    }else{
                        const companyname = result.getValue(columns[3]);
                        vendors.push({
                            value:result.id,
                            text:companyname
                        });
                    }
                    return true;
                });
            
                return vendors;
            }

        }

        return { onRequest, SuiteletFormManager };
    });