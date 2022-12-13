import { LightningElement, api } from 'lwc';

export default class FlexcardFormatter extends LightningElement {
    @api showTextSizes = false;
    @api showHorizontalAlign = false;
    @api showColorPicker;

    @api colorPickerLabel = 'Background Color';

    @api properties = {}

    get selectedTextSize() {
        return this.textSizeOptions.find(textSize => textSize.value == this.properties.textSize) || this.textSizeOptions.find(textSize => textSize.default); 
    }

    get selectedHorizontalAlign() {
        return this.horizontalAlignOptions.find(alignOption => alignOption.value == this.properties.horizontalAlign) || this.horizontalAlignOptions.find(alignOption => alignOption.default);
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

    horizontalAlignOptions = [
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
        this.properties = {
            ...this.properties,
            [propertyName]: value
        }
        const detail = {
            value: this.properties,
            changedProperty: propertyName
        }
        this.dispatchEvent(new CustomEvent('change', { detail }));
    }
    
    handleComboboxClick(event) {
        console.log(`in handleComboboxClick, ${event.currentTarget.dataset.comboboxName}`);
        this.openCombobox(event.currentTarget.dataset.comboboxName);
        // 
        // this.openCombobox(`data-combobox-name="${event.target.dataset.comboboxName}"`);
    }

    handleComboboxBlur(event) {
        this.closeCombobox(event.currentTarget.dataset.comboboxName);
        // this.closeCombobox(`data-combobox-name="${event.target.dataset.comboboxName}"`);
    }

    handleComboboxOptionClick(event) {
        console.log('in handleComboboxOptionClick');
        let dataset = event.currentTarget.dataset;
        console.log(JSON.stringify(dataset));
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