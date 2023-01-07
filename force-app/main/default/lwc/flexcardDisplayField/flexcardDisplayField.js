import { LightningElement, api } from 'lwc';

export default class FlexcardDisplayField extends LightningElement {
    @api objectApiName;
    @api recordId;
    @api fieldName;
    @api customLabel;
    @api fieldLabelVariant;
    @api fieldClass

    @api messageIfFieldNameMissing = 'Field Name Missing';
    @api messageIfRecordIdMissing = 'Record ID Missing';
    fieldLoaded = false;

    handleRecordViewFormLoad() {
        this.fieldLoaded = true;
    }
}