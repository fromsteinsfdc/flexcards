// const DEFAULTS = {
//     ACTION_LABEL: '[Select Action]'
// };

const FLEXCARD_ELEMENT_TYPES = {
    FIELD: { label: 'Record Field', value: 'field', icon: 'utility:display_text' },
    IMAGE: { label: 'Image', value: 'image', icon: 'utility:image' },
    RICHTEXT: { label: 'Rich Text', value: 'richtext', icon: 'utility:display_rich_text' },
    MENU: { label: 'Action Menu', value: 'menu', icon: 'utility:down' },
    ACTION: { label: 'Action Button/Link', value: 'action', icon: 'utility:button_choice' },
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

const BUTTON_CONTENT_VARIANTS = {
    TEXT: { label: 'Text Only', value: 'text', default: true },
    ICON: { label: 'Icon Only', value: 'icon' },
    BOTH: { label: 'Text and Icon', value: 'both' },
};


const LABEL_VARIANTS = {
    STANDARD: { label: 'Use Standard Label', value: 'standard' },
    CUSTOM: { label: 'Use Custom Label', value: 'custom' },
    HIDDEN: { label: 'Hide Label', value: 'hidden' },
};


const MENU_DISPLAY_TYPES = {
    DROPDOWN: { label: 'Dropdown Menu', value: 'dropdown' },
    BUTTON_GROUP: { label: 'Horizontal Button Group', value: 'group' },
    // VERTICAL_BUTTONS: { label: 'Vertical Button Group', value: 'buttons' },
};

const SIZES = {
    NONE: { label: 'None', value: 'none' },
    XXX_SMALL: { label: 'XXX-Small', value: 'xxx-small' },
    XX_SMALL: { label: 'XX-Small', value: 'xx-small', default: true },
    X_SMALL: { label: 'X-Small', value: 'x-small' },
    SMALL: { label: 'Small', value: 'small' },
    MEDIUM: { label: 'Medium', value: 'medium' },
    LARGE: { label: 'Large', value: 'large' },
    X_LARGE: { label: 'X-Large', value: 'x-large' },
    XX_LARGE: { label: 'XX-Large', value: 'xx-large' },
}

const generateElementId = (existingIdList) => {
    let newId;
    do {
        newId = Math.random().toString().substring(2); // Generate a random number then remove the '0.'
    } while(existingIdList.includes(newId));
    return newId;
}

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

class FlexcardElementClass {
    formatterProperties = {};
    formatterClassString;
    index = 0;

    constructor(elementType, currentElementList = [], menuId ) {
        console.log('in FlexcardElementClass constructor');
        this.elementType = elementType;
        this[`is${elementType}`] = true;
        this.id = generateElementId(currentElementList.map(el => el.id));

        // switch(elementType.value) {
        //     case FLEXCARD_ELEMENT_TYPES.FIELD.value:
        //         this.fieldLabelStyle = transformConstantObject(LABEL_VARIANTS).default.value;
        //     case FLEXCARD_ELEMENT_TYPES.ACTION.value:
        //         this.label = DEFAULTS.ACTION_LABEL;
        //         this.variant = transformConstantObject(BUTTON_VARIANTS).default.value;
        //         this.menuId = menuId;
        //     case FLEXCARD_ELEMENT_TYPES.MENU.value:
        //         this.actions = [this.addMenuAction()];
        //         this.menuDisplayType = transformConstantObject(MENU_DISPLAY_TYPES).default.value;
        //     // case FLEXCARD_ELEMENT_TYPES.SECTION.value:

        // }
    }

    getThis() {
        return this;
    }

    addMenuAction() {
        // this.actions.push()
    }

    resizeColumns(indexToPreserve) {

    }

    cloneElement(sourceElement) {
        let clone = new FlexcardElementClass();
        for (let [key, value] of Object.entries(sourceElement)) {
            clone[key] = value;
        }
        console.log(`in flexcardUtils, clone: ${JSON.stringify(clone)}`);
        return clone;
    }
}

const DEFAULT_FLEXCARD_PROPERTIES = {
    color: '#FFFFFF',
    flexcardSize: 300,
    showHeader: true,
    showFooter: false,
    headerActionMenu: new FlexcardElementClass(FLEXCARD_ELEMENT_TYPES.MENU)
};

export { FlexcardElementClass, FLEXCARD_ELEMENT_TYPES, BUTTON_VARIANTS, BUTTON_CONTENT_VARIANTS, LABEL_VARIANTS, DEFAULT_FLEXCARD_PROPERTIES, MENU_DISPLAY_TYPES, SIZES, transformConstantObject }