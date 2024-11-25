const paths = {
  lmrylocalizationcore: { //Core
      dataConfigPath: "../../Custom Data/Loading Data/data_load_config.json",
      recordStructurePath: "../../Custom Data/Loading Data/record_structure.json",
      dataFilePath: "../../Custom Data/Loading Data/data"
  },
  lmryarlocalization: { //Argentina
      dataConfigPath: "SuiteApps/com.latamready.lmryarlocalization/Custom Data/Loading Data/data_load_config.json",
      recordStructurePath: "SuiteApps/com.latamready.lmryarlocalization/Custom Data/Loading Data/record_structure.json",
      dataFilePath: "SuiteApps/com.latamready.lmryarlocalization/Custom Data/Loading Data/data"
  },
  lmrybolocalization: { //Bolivia
      dataConfigPath: "SuiteApps/com.latamready.lmrybolocalization/Custom Data/Loading Data/data_load_config.json",
      recordStructurePath: "SuiteApps/com.latamready.lmrybolocalization/Custom Data/Loading Data/record_structure.json",
      dataFilePath: "SuiteApps/com.latamready.lmrybolocalization/Custom Data/Loading Data/data"
  },
  lmrybrlocalization: {   //Brasil
      dataConfigPath: "SuiteApps/com.latamready.lmrybrlocalization/Custom Data/Loading Data/data_load_config.json",
      recordStructurePath: "SuiteApps/com.latamready.lmrybrlocalization/Custom Data/Loading Data/record_structure.json",
      dataFilePath: "SuiteApps/com.latamready.lmrybrlocalization/Custom Data/Loading Data/data"
  },
  lmrycllocalization: {   // CHile
      dataConfigPath: "/SuiteApps/com.latamready.lmrycllocalization/Custom Data/Loading Data/data_load_config.json",
      recordStructurePath: "SuiteApps/com.latamready.lmrycllocalization/Custom Data/Loading Data/record_structure.json",
      dataFilePath: "SuiteApps/com.latamready.lmrycllocalization/Custom Data/Loading Data/data"
  },
  lmrycolocalization: {   //Colombia
      dataConfigPath: "SuiteApps/com.latamready.lmrycolocalization/Custom Data/Loading Data/data_load_config.json",
      recordStructurePath: "SuiteApps/com.latamready.lmrycolocalization/Custom Data/Loading Data/record_structure.json",
      dataFilePath: "SuiteApps/com.latamready.lmrycolocalization/Custom Data/Loading Data/data"
  },
  lmrycrlocalization: {   //Costa rica
      dataConfigPath: "SuiteApps/com.latamready.lmrycrlocalization/Custom Data/Loading Data/data_load_config.json",
      recordStructurePath: "SuiteApps/com.latamready.lmrycrlocalization/Custom Data/Loading Data/record_structure.json",
      dataFilePath: "SuiteApps/com.latamready.lmrycrlocalization/Custom Data/Loading Data/data"
  },
  lmryeclocalization: {   //Ecuador
      dataConfigPath: "SuiteApps/com.latamready.lmryeclocalization/Custom Data/Loading Data/data_load_config.json",
      recordStructurePath: "SuiteApps/com.latamready.lmryeclocalization/Custom Data/Loading Data/record_structure.json",
      dataFilePath: "SuiteApps/com.latamready.lmryeclocalization/Custom Data/Loading Data/data"
  },
  lmrygtlocalization: {   //Guatemala
      dataConfigPath: "SuiteApps/com.latamready.lmrygtlocalization/Custom Data/Loading Data/data_load_config.json",
      recordStructurePath: "SuiteApps/com.latamready.lmrygtlocalization/Custom Data/Loading Data/record_structure.json",
      dataFilePath: "SuiteApps/com.latamready.lmrygtlocalization/Custom Data/Loading Data/data"
  },
  lmrymxlocalization: {   //Mexico
      dataConfigPath: "SuiteApps/com.latamready.lmrymxlocalization/Custom Data/Loading Data/data_load_config.json",
      recordStructurePath: "SuiteApps/com.latamready.lmrymxlocalization/Custom Data/Loading Data/record_structure.json",
      dataFilePath: "SuiteApps/com.latamready.lmrymxlocalization/Custom Data/Loading Data/data"
  },
  lmrypalocalization: {   //Panama
      dataConfigPath: "SuiteApps/com.latamready.lmrypalocalization/Custom Data/Loading Data/data_load_config.json",
      recordStructurePath: "SuiteApps/com.latamready.lmrypalocalization/Custom Data/Loading Data/record_structure.json",
      dataFilePath: "SuiteApps/com.latamready.lmrypalocalization/Custom Data/Loading Data/data"
  },
  lmrypelocalization: {   //Peru
      dataConfigPath: "SuiteApps/com.latamready.lmrypelocalization/Custom Data/Loading Data/data_load_config.json",
      recordStructurePath: "SuiteApps/com.latamready.lmrypelocalization/Custom Data/Loading Data/record_structure.json",
      dataFilePath: "SuiteApps/com.latamready.lmrypelocalization/Custom Data/Loading Data/data"
  },
};


validateMandatoryFieldBody() {
    const legalDocumentBody = this.currentRCD.getValue('custbody_lmry_document_type');
    const operationTypeBody = this.currentRCD.getValue('custpage_lmry_operation_type');

    console.log("legalDocumentBody", legalDocumentBody)
    console.log("operationTypeBody", operationTypeBody)
    //operationType
    this.fieldValidations.forEach(field => {
        const { legalDocument, operationType, nameFieldID } = field;
        const currentField = this.currentRCD.getField({ fieldId: nameFieldID });
        const fieldExist = currentField["isDisplay"] === "T" || currentField["isDisplay"] === true;
        if (field.section !== "Cust Col") {
            if (operationType) {
                if (!!operationTypeBody && operationType == operationTypeBody) {
                    if (fieldExist) {
                        if (currentField && currentField.hasOwnProperty("isDisplay")) {
                            if (fieldExist) {
                                field.marked = true;
                            }else{
                                field.marked = false;
                            }      
                        }else{
                            field.marked = false;
                        }
                    }else{
                        field.marked = false;
                    }
                }else{
                    field.marked = false;
                }
            }else{
                if (!legalDocument || (!!legalDocumentBody && legalDocumentBody == legalDocument)) {
                    if (currentField && currentField.hasOwnProperty("isDisplay")) {
                        if (fieldExist) {
                            field.marked = true;
                        }else{
                            field.marked = false;
                        }
                    }else{
                        field.marked = false;
                    }
                } else {
                    field.marked = false;
                }
            }
            
        }
    });
}