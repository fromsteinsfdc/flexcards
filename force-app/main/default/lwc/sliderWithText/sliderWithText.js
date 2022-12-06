import { LightningElement, api } from 'lwc';

export default class SliderWithText extends LightningElement {
    @api min = 0;
    @api max;
    @api label = 'Select Value';
    @api value = 0;

    handleInputChange(event) {
        this.dispatchValue(event.target.value);
    }

    handleSliderChange(event) {
        this.dispatchValue(event.detail.value);
    }

    dispatchValue(value) {
        const changeEvent = new CustomEvent('change', { detail: { value }});
        this.dispatchEvent(changeEvent);
    }
}