import { LightningElement } from 'lwc';
// import { FlexcardModal } from 'c/flexcardModal';

export default class FlexcardCpe extends LightningElement {
    handleOpenDesignerClick() {
        // const result = await FlexcardModal.open();
        console.log('in FlexcardCpe handleOpenDesignerClick');
        const modal = this.template.querySelector('c-fsc_lwc-modal');
        console.log('modal = '+ modal);
        modal.open();
    }
}