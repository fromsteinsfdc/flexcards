import { LightningElement, api, track } from 'lwc';
import LightningConfirm from 'lightning/confirm';
import { DEFAULT_FLEXCARD_PROPERTIES } from 'c/flexcardUtils';

const DATA_TYPE = {
    STRING: 'String',
    BOOLEAN: 'Boolean',
    NUMBER: 'Number',
    INTEGER: 'Integer'
};

const FLOW_EVENT_TYPE = {
    DELETE: 'configuration_editor_input_value_deleted',
    CHANGE: 'configuration_editor_input_value_changed',
    GENERIC_TYPE_CHANGE: 'configuration_editor_generic_type_mapping_changed'
}

export default class FlexcardCpe extends LightningElement {

    showDesignerModal = false;

    /* CUSTOM PROPERTY EDITOR SETTINGS */
    // _builderContext;
    _values = [];
    _typeMappings = [];

    // @api genericTypeMappings = [];
    @api automaticOutputVariables;
    @api builderContext;

    // @api
    // get builderContext() {
    //     return this._builderContext;
    // }
    // set builderContext(value) {
    //     this._builderContext = value;
    // }

    @api
    get inputVariables() {
        return this._values;
    }
    set inputVariables(value) {
        console.log(`in set inputVariables, value = ${JSON.stringify(value)}`);
        this._values = value;
        this.initializeValues();
    }

    @api get genericTypeMappings() {
        return this._genericTypeMappings;
    }
    set genericTypeMappings(value) {
        this._typeMappings = value;
        this.initializeTypeMappings();
    }

    @api
    validate() {
        const validity = [];
        console.log(`in validate, returning validity: ${validity}`)
        return validity;
    }

    @track inputValues = {
        flexcardElements: { value: null, valueDataType: DATA_TYPE.STRING, label: 'Flexcard Elements', serialized: true },
        flexcardProperties: { value: DEFAULT_FLEXCARD_PROPERTIES, valueDataType: DATA_TYPE.STRING, label: 'Properties', serialized: true },
        headerActionMenu: { value: null, valueDataType: DATA_TYPE.STRING, label: 'Header Action Menu', serialized: true },        
        objectApiName: { value: null, valueDataType: DATA_TYPE.STRING, label: 'Properties' },
        previewRecordId: { value: null, valueDataType: DATA_TYPE.STRING, label: 'Preview Record ID' },
        records: { value: null, valueDataType: DATA_TYPE.STRING, label: 'Properties' },
    };

    initializeValues() {
        console.log('in initialize values');
        if (this._values && this._values.length) {
            this._values.forEach(curInputParam => {
                console.log(JSON.stringify(curInputParam));
                let inputValue = this.inputValues[curInputParam.name];
                if (curInputParam.name && inputValue) {
                    inputValue.value = inputValue.serialized ? JSON.parse(curInputParam.value) : curInputParam.value;
                    inputValue.valueDataType = curInputParam.valueDataType;

                }
            });
        }
    }

    initializeTypeMappings() {
        console.log('in initializeTypeMappings');
        this._typeMappings.forEach((typeMapping) => {
            console.log(JSON.stringify(typeMapping));
            if (typeMapping.name && typeMapping.value) {
                this.typeValue = typeMapping.value;
            }
        });
    }

    dispatchFlowValueChangeEvent(name, newValue = null, newValueDataType = DATA_TYPE.STRING) {
        console.log('in CPE dispatch to flow: ', name, newValue, newValueDataType);
        const valueChangedEvent = new CustomEvent(FLOW_EVENT_TYPE.CHANGE, {
            bubbles: true,
            cancelable: false,
            composed: true,
            detail: {
                name,
                newValue,
                newValueDataType
            }
        });
        this.dispatchEvent(valueChangedEvent);
    }

    /* COMPONENT CODE */
    get designer() {
        return this.template.querySelector('c-flexcard-designer');
    }

    handleValueChange(event) {
        console.log('in handleValueChange');
        console.log(event.currentTarget.name);
        console.log(event.detail.value);
        if (event.detail && event.currentTarget.name) {
            let dataType = DATA_TYPE.STRING;
            if (event.currentTarget.type == 'checkbox') dataType = DATA_TYPE.BOOLEAN;
            if (event.currentTarget.type == 'number') dataType = DATA_TYPE.NUMBER;
            if (event.currentTarget.type == 'integer') dataType = DATA_TYPE.INTEGER;

            let newValue = event.currentTarget.type === 'checkbox' ? event.currentTarget.checked : event.detail.value;

            console.log(`newValue = ${newValue}`);
            this.dispatchFlowValueChangeEvent(event.currentTarget.name, newValue, dataType);
        }
    }

    handleFlowComboboxValueChange(event) {
        console.log('in handleFlowComboboxValueChange');
        if (event.target && event.detail) {
            console.log(JSON.stringify(event.detail));
            if (event.target.name === 'records') {
                let objectName;
                // To automatically detect the object type, we can check for Flow Variables as well as Record Creates/Lookups/Updates
                const metadataTypesToSearch = ['variables', 'recordCreates', 'recordLookups', 'recordUpdates', 'actionCalls'];
                let metadatatypes = [...metadataTypesToSearch.map(componentType => this.builderContext[componentType])];
                metadatatypes = metadatatypes.flat();
                console.log(`metadatatypes = ${JSON.stringify}`);
                let flowElements = [];
                for (let metadataType of metadataTypesToSearch) {
                    if (this.builderContext[metadataType] && this.builderContext[metadataType].length) {
                        console.log(`${metadataType} = ${JSON.stringify(...this.builderContext[metadataType])}`);
                        // flowElements.push(...this.builderContext[metadataType]);
                        let selectedReference = this.builderContext[metadataType].find(metadata => metadata.name == event.detail.newValue);
                        if (selectedReference) {
                            objectName = this.getObjectApiNameFromMetadata(selectedReference);
                            break;
                        }
                    }
                }

                // If we didn't find it in any of those, check all the screen fields
                // let screenFields = [];
                // for ()
                // metadatatypes.push(this.builderContext.screens.fields);

                if (objectName) {
                    console.log(`found object name: ${objectName}`);
                    this.updateGenericTypeMapping(objectName);
                    this.dispatchFlowValueChangeEvent('objectApiName', objectName, 'String');
                } else {
                    console.log('No matching object found, object name remains blank');
                }
            }
            this.dispatchFlowValueChangeEvent(event.target.name, event.detail.newValue, event.detail.newValueDataType);
        }
    }

    getObjectApiNameFromMetadata(selectedReference) {
        console.log(`in getObjectApiNameFromMetadata, selectedReference = ${JSON.stringify(selectedReference)}`);
        let objectName;
        // ActionCalls and FlowScreenFields define their object type via `dataTypeMappings`
        if (selectedReference.dataTypeMappings?.length) {
            objectName = selectedReference.dataTypeMappings[0].typeValue;
        }
        // Variables define their object type via `objectType`
        else if (selectedReference.objectType) {
            objectName = selectedReference.objectType;
        }
        // Record Creates/Lookups/Updates define their object type via `object`
        else if (selectedReference.object) {
            objectName = selectedReference.object
        }
        console.log(`returning ${objectName}`);
        return objectName;
    }

    updateGenericTypeMapping(objectApiName) {
        let typeValue = objectApiName;
        const typeName = 'T';
        const dynamicTypeMapping = new CustomEvent('configuration_editor_generic_type_mapping_changed', {
            composed: true,
            cancelable: false,
            bubbles: true,
            detail: {
                typeName,
                typeValue,
            }
        });
        this.dispatchEvent(dynamicTypeMapping);
    }

    openDesignerModal() {
        this.showDesignerModal = true;
    }

    closeDesignerModal() {
        this.showDesignerModal = false;
    }


    handleOpenDesignerClick() {
        // console.log('in FlexcardCpe handleOpenDesignerClick');
        // const modal = this.template.querySelector('c-fsc_lwc-modal');
        // console.log('modal = ' + modal);
        // modal.open();
        this.openDesignerModal();
    }

    async handleCancelDesignerClick() {
        if (this.designer.valuesHaveChanged) {
            const result = await LightningConfirm.open({
                message: 'Are you sure you want to close without saving? Any changes will be lost.',
                theme: 'error',
                label: 'Close designer?',
            });
            if (!result) {
                return;
            }
        }
        this.closeDesignerModal();
    }

    handleSaveDesignerClick() {
        let designer = this.template.querySelector('c-flexcard-designer');
        let elements = designer.flexcardElements;
        let properties = designer.flexcardProperties;
        this.dispatchFlowValueChangeEvent('previewRecordId', designer.previewRecordId);        
        this.dispatchFlowValueChangeEvent('flexcardElements', JSON.stringify(elements), 'String');
        this.dispatchFlowValueChangeEvent('flexcardProperties', JSON.stringify(properties), 'String');
        this.closeDesignerModal();
    }

    handleGetTestContent() {
        let designer = this.template.querySelector('c-flexcard-designer');
        console.log(JSON.stringify(designer.flexcardElements));
    }
}