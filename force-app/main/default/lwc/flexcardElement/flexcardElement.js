import { LightningElement, api } from 'lwc';
import { MENU_DISPLAY_TYPES, SIZES } from 'c/flexcardUtils';

const EVENTS = {
    HOVER: 'hoverchange',
    SELECT: 'select',
    DELETE: 'delete',
    DRAG: 'elementdrag',
}

export default class FlexcardElement extends LightningElement {
    @api
    get element() {
        return this._element;
    }
    set element(value) {
        // console.log(`in flexcardElement: setting element value to ${JSON.stringify(value)}`);
        this._element = JSON.parse(JSON.stringify(value));  // Clone the value so it's mutable
    }
    _element;

    @api selectedElementId;
    @api hoveredElementId;

    /* GENERAL ELEMENT PROPERTIES */
    @api objectApiName;
    @api recordId;
    @api isEditMode = false;

    /* FIELD PROPERTIES */
    fieldLoaded;
    actionIsFromColumnElement = false;

    /* SECTION PROPERTIES */
    // @api sectionColumns;
    // columnElementIsHovered;
    // columnElementIsDragged;
    get columnElementIsSelected() {
        if (!this.element.issection) {
            return false;
        }
        return this.element.sectionColumns.some(column => {
            return column.flexcardElements.some(el => el.id == this.selectedElementId)
        });
    }

    get computedElementClass() {
        let classList = ['elementContainer'];
        // Add default horizontal spacing, if not otherwise specified
        if (!this.element.formatterClassString?.includes('slds-p-horizontal')) {
            classList.push('slds-p-horizontal_xx-small');
        }
        // Add default vertical spacing, if not otherwise specified
        if (!this.element.formatterClassString?.includes('slds-p-vertical')) {
            classList.push('slds-p-vertical_xx-small')
        }
        // Add class for selected or hovered, respectively
        if (this.isSelected) {
            classList.push('selected');
        } else if (this.isHovered) {
            classList.push('hovered');
        }

        if (this.element.formatterClassString) {
            classList.push(this.element.formatterClassString);
        }

        // Join selected classes into a string, separated by spaces
        return classList.join(' ');
    }

    get isHovered() {
        return this.element.id == this.hoveredElementId;
    }

    get isSelected() {
        return this.element.id == this.selectedElementId;
    }

    get showHovered() {
        return this.isEditMode && this.element.isHovered;
    }

    get showSelected() {
        return this.isEditMode && this.element.isSelected;
    }

    get typeIs() {
        return {
            [this.elementType]: true
        }
    }

    get richTextDisplayValue() {
        return this.element.value || '[Display Text]';
    }

    get menuTypeIs() {
        // let classes = this.computedElementClass.split(' ');
        // const padHoriz = 'slds-p-horizontal_';
        // let padHorClass = classes.find(c => c.startsWith(padHoriz));
        // let paddingValue = padHorClass ? padHorClass.replace(padHoriz, '') : '';
        // if (this.element.menuDisplayType == MENU_DISPLAY_TYPES.BUTTON_GROUP.value && paddingValue != SIZES.NONE.value ) {
        //     return {
        //         [MENU_DISPLAY_TYPES.VERTICAL_BUTTONS.value]: true
        //     }
        // } else {
            return {
                [this.element.menuDisplayType]: true
            };
        // }
    }

    get elementString() {
        return JSON.stringify(this.element);
    }

    get columnsString() {
        return JSON.stringify(this.sectionColumns);
    }

    handleElementDeleteClick(event) {
        console.log('in element handleElementDeleteClick');
        event.stopPropagation();
        this.dispatchBasicEvent(EVENTS.DELETE, this.element.id);
        // const detail = {
        //     value: this.element.id
        // };
        // this.dispatchEvent(new CustomEvent('elementdeleteclick', { detail }));
    }

    handleSectionColumnDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        console.log(`in handleSectionColumnDrop (in section ${this.element.id})`);
        console.log(event.detail.value);
        console.log(event.target.dataset.index);
        const detail = {
            sectionId: this.element.id,
            columnIndex: event.target.dataset.index,
            dropIndex: event.detail.value
        };
        this.dispatchEvent(new CustomEvent('sectioncolumndrop', { detail }));
    }

    handleElementMouseEnter() {
        // if (!this.columnElementIsHovered) {
            this.dispatchBasicEvent(EVENTS.HOVER, this.element.id);
        // }
    }

    handleElementMouseLeave() {
        this.dispatchBasicEvent(EVENTS.HOVER, null);
    }


    handleElementClick(event) {
        this.dispatchBasicEvent(EVENTS.SELECT, this.element.id);
    }

    handleElementDragStart() {
        // if (!this.columnElementIsDragged) {
            console.log(`in handleElementDragStart for element ${this.element.id}`);
            this.dispatchBasicEvent(EVENTS.DRAG, this.element.id);
        // }
    }

    handleElementDragEnd() {
        this.dispatchBasicEvent(EVENTS.DRAG, null);
    }

    handleColumnElementHoverChange(event) {
        // console.log('in handleColumnElementHoverChange, ' + event.detail.value);
        // this.columnElementIsHovered = Boolean(event.detail.value);
        this.dispatchBasicEvent(EVENTS.HOVER, event.detail.value || this.element.id);
    }

    handleColumnElementSelect(event) {
        this.dispatchBasicEvent(EVENTS.SELECT, event.detail.value);
        this.actionIsFromColumnElement = true;
    }

    handleColumnElementDelete(event) {
        this.dispatchBasicEvent(EVENTS.DELETE, event.detail.value);
        this.actionIsFromColumnElement = true;
    }

    handleColumnElementDrag(event) {
        const detail = { ...event.detail }
        // this.columnElementIsDragged = Boolean(event.detail.value);
        this.dispatchEvent(new CustomEvent(EVENTS.DRAG, { detail }));
        this.actionIsFromColumnElement = true;
        // this.dispatchBasicEvent(EVENTS.DRAG, event.detail.value);
    }

    dispatchBasicEvent(eventName, value) {
        if (this.isEditMode) {
            if (this.actionIsFromColumnElement) {
                this.actionIsFromColumnElement = false;
            } else {
                const detail = {
                    value,
                    sectionId: this.element.sectionId
                }
                this.dispatchEvent(new CustomEvent(eventName, { detail }));
            }
        }
    }

    handleRecordViewFormLoad(event) {
        this.fieldLoaded = true;
    }
}