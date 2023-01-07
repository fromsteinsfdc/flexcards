import { LightningElement, api } from 'lwc';

export default class Flexcards extends LightningElement {
    @api 
    get flexcardElements() {
        return this._flexcardElements;
    }
    set flexcardElements(value) {    
        this._flexcardElements = Array.isArray(value) ? value : JSON.parse(value);
    }
    _flexcardElements = [];

    @api
    get flexcardProperties() {
        return this._flexcardProperties;
    }
    set flexcardProperties(value) {    
        this._flexcardProperties = Array.isArray(value) ? value : JSON.parse(value);
    }
    _flexcardProperties = [];

    @api objectApiName;
    @api records = [];
    @api previewRecordId;
}