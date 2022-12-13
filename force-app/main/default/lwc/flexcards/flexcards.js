import { LightningElement, api } from 'lwc';

export default class Flexcards extends LightningElement {
    @api flexcardElements;
    @api flexcardProperties;
    @api objectApiName;
    @api records = [];
}