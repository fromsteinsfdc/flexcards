import { LightningElement, api } from 'lwc';

export default class Flexcard extends LightningElement {
    @api flexcardElements = [];
    @api flexcardProperties = {};
    @api recordId;
    @api objectApiName;

    @api showHeader;
    @api hideFooter;

    @api isEditMode;


    get computedHeaderClass() {
        return 'slds-card__header slds-grid' + (this.isEditMode ? ' editMode slds-m-horizontal_medium slds-m-vertical_xx-small' : '');
    }

    connectedCallback() {
        // console.log(`in flexcard connectedCallback for ${this.recordId}`);
        // console.log(`flexcardElements: ${JSON.stringify(this.flexcardElements)}`);
        console.log(`flexcardProperties: ${JSON.stringify(this.flexcardProperties)}`);

    }
}