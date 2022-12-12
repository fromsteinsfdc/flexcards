import { LightningElement, api } from 'lwc';

export default class Flexcard extends LightningElement {
    @api flexcardElements = [];
    @api recordId;
    @api objectApiName;

    @api showHeader;
    @api hideFooter;

    @api isEditMode;


    get computedHeaderClass() {
        return 'slds-card__header slds-grid' + (this.isEditMode ? ' editMode slds-m-horizontal_medium slds-m-vertical_xx-small' : '');
    }

    connectedCallback() {
        console.log('in flexcard connectedCallback');
    }
}