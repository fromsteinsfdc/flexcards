import { LightningElement, api, track } from 'lwc';
import { SIZES, transformConstantObject } from 'c/flexcardUtils';

const DEFAULT_COLOR = '#FFFFFF';

export default class FlexcardFormatter extends LightningElement {
    @api name;
    @api showTextSizes = false;
    @api showHorizontalAlign = false;
    @api showColorPicker = false;
    @api showSizePicker = false;

    @api colorPickerLabel = 'Background Color';
    @api colorPropertyName = 'color';

    @api sizePickerLabel = 'Select Size';
    @api sizePropertyName = 'size';

    @api properties = {};
    // @api 
    // get properties() {        
    //     return this._properties;
    // }
    // set properties(value) {
    //     // console.log(`setting properties value to ${JSON.stringify(value)}`);
    //     this._properties = JSON.parse(JSON.stringify(value));
    // }
    // @track _properties = {};

    sizes = transformConstantObject(SIZES);

    get selectedTextSize() {
        return this.textSizeOptions.find(textSize => textSize.value == this.properties.textSize) || this.textSizeOptions.find(textSize => textSize.default); 
    }

    get selectedHorizontalAlign() {
        return this.horizontalAlignOptions.find(alignOption => alignOption.value == this.properties.horizontalAlign) || this.horizontalAlignOptions.find(alignOption => alignOption.default);
    }

    get colorValue() {
        return this.properties[this.colorPropertyName] || DEFAULT_COLOR;
    }

    get selectedSize() {
        return this.properties[this.sizePropertyName] || this.sizes.default.value; 
    }

    get propertiesString() {
        return JSON.stringify(this.properties);
    }

    textSizeOptions = [
        { label: 'Header - Large', value: 'slds-text-heading_large' },
        { label: 'Header - Medium', value: 'slds-text-heading_medium' },
        { label: 'Header - Small', value: 'slds-text-heading_small' },
        { label: 'Bold', value: 'slds-text-title_bold' },
        { label: 'Normal', value: '', default: true  },
        { label: 'Small', value: 'slds-text-body_regular' },
        { label: 'Extra Small', value: 'slds-text-title' },
    ];

    @track horizontalAlignOptions = [
        { label: 'Left Aligned', value: 'slds-text-align_left', icon: 'utility:left_align_text', default: true },
        { label: 'Center Aligned', value: 'slds-text-align_center', icon: 'utility:center_align_text' },
        { label: 'Right Aligned', value: 'slds-text-align_right', icon: 'utility:right_align_text' },
    ];

    connectedCallback() {
        this.updateAlignmentVariants();
    }

    openCombobox(comboboxName) {
        let combobox = this.template.querySelector(`.slds-combobox[data-combobox-name="${comboboxName}"]`);
        if (combobox) {
            combobox.classList.add('slds-is-open');
        }
    }

    closeCombobox(comboboxName) {
        let combobox = this.template.querySelector(`.slds-combobox[data-combobox-name="${comboboxName}"]`);
        if (combobox) {
            combobox.classList.remove('slds-is-open');
        }
    }

    updateAlignmentVariants() {
        for (let alignment of this.horizontalAlignOptions) {
            
            alignment.variant = (this.selectedHorizontalAlign.value == alignment.value) ? 'brand' : 'border';
        }
    }

    setProperty(propertyName, value) {
        console.log('in setProperty', propertyName, value);
        console.log(`starting properties = ${JSON.stringify(this.properties)}`);        
        this.properties = {
            ...this.properties,
            [propertyName]: value
        };
        // this.properties[propertyName] = value;
        console.log(`updated properties = ${JSON.stringify(this.properties)}`);        
        const detail = {
            value: this.properties,
            changedProperty: propertyName
        }
        this.dispatchEvent(new CustomEvent('change', { detail }));
    }
    
    handleComboboxClick(event) {
        this.openCombobox(event.currentTarget.dataset.comboboxName);
        // 
        // this.openCombobox(`data-combobox-name="${event.target.dataset.comboboxName}"`);
    }

    handleComboboxBlur(event) {
        this.closeCombobox(event.currentTarget.dataset.comboboxName);
        // this.closeCombobox(`data-combobox-name="${event.target.dataset.comboboxName}"`);
    }

    handleComboboxOptionClick(event) {
        let dataset = event.currentTarget.dataset;
        // this.propertiesdataset.comboboxName] = dataset.value;
        this.setProperty(dataset.comboboxName, dataset.value)
        this.closeCombobox(dataset.comboboxName);
    }

    handleAlignmentClick(event) {
        this.setProperty('horizontalAlign', event.target.value);
        this.updateAlignmentVariants();
    }

    handleValueChange(event) {
        console.log('in flexcard formatter > handleValueChange', event.target.name, event.target.value);
        this.setProperty(event.target.name, event.target.value);
    }
}