const KEYS = {
    ESCAPE: 'Escape',
    UP: 'ArrowUp',
    DOWN: 'ArrowDown',
    ENTER: 'Enter'
}

const FLEXCARD_ELEMENT_TYPES = {
    FIELD: { label: 'Record Field', value: 'field', icon: 'utility:display_text' },
    IMAGE: { label: 'Image', value: 'image', icon: 'utility:image' },
    RICHTEXT: { label: 'Rich Text', value: 'richtext', icon: 'utility:display_rich_text' },
    MENU: { label: 'Action Menu', value: 'menu', icon: 'utility:down' },
    BUTTON: { label: 'Action Button/Link', value: 'button', icon: 'utility:button_choice' },
    SECTION: { label: 'Section', value: 'section', icon: 'utility:section' },
};

const BUTTON_VARIANTS = {
    NEUTRAL: { label: 'Neutral (default)', value: 'neutral' },
    BASE: { label: 'Base (link)', value: 'base' },
    BRAND: { label: 'Brand (blue)', value: 'brand' },
    BRAND_OUTLINE: { label: 'Brand Outline', value: 'brand-outline' },
    DESTRUCTIVE: { label: 'Destructive (red)', value: 'destructive' },
    DESTRUCTIVE_TEXT: { label: 'Destructive Text', value: 'destructive-text' },
    SUCCESS: { label: 'Success (green)', value: 'success' },
};

const LABEL_VARIANTS = {
    STANDARD: { label: 'Use Standard Label', value: 'standard' },
    CUSTOM: { label: 'Use Custom Label', value: 'custom' },
    HIDDEN: { label: 'Hide Label', value: 'hidden' },
};


const transformConstantObject = (constant) => {
    return {
        list: constant,
        get options() { return Object.values(this.list).filter(option => !option.hide); },
        get default() { return this.options.find(option => option.default) || this.options[0]; },
        findFromValue: function (value) {
            let entry = this.options.find(option => option.value == value);
            return entry || this.default;
        },
        findFromLabel: function (label) {
            let entry = this.options.find(option => option.label == label);
            return entry || this.default;
        }
    }
}

export { FLEXCARD_ELEMENT_TYPES, BUTTON_VARIANTS, LABEL_VARIANTS, transformConstantObject }