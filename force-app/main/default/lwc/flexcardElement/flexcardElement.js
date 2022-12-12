import { LightningElement, api } from 'lwc';

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
        this._element = JSON.parse(JSON.stringify(value));  // Clone the value so it's mutable
    }
    _element;

    @api selectedElementId;
    @api hoveredElementId;

    /* GENERAL ELEMENT PROPERTIES */
    @api objectApiName;
    @api recordId;
    @api elementType;
    @api elementId;
    @api isEditMode = false;
    @api isSelected;
    @api isHovered;

    /* FIELD PROPERTIES */
    @api fieldName;
    @api showCustomLabel;
    @api customLabel;
    @api fieldLabelVariant;

    @api variant;
    @api label;

    /* SECTION PROPERTIES */
    @api sectionColumns;
    columnElementIsHovered;
    columnElementIsDragged;
    get columnElementIsSelected() {
        if (!this.element.issection) {
            return false;
        }
        return this.element.sectionColumns.some(column => {
            return column.flexcardElements.some(el => el.id == this.selectedElementId)
        });
    }

    // @api content;
    // @api numElementsInRow;
    // @api width = WIDTHS.FULL;

    get computedElementClass() {
        let classString = 'elementContainer slds-p-around_xx-small';
        if (this.isSelected) {
            classString += ' selected';
        } else if (this.isHovered) {
            classString += ' hovered';
        }
        return classString;
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
        if (!this.columnElementIsHovered) {
            this.dispatchBasicEvent(EVENTS.HOVER, this.element.id);
        }
    }

    handleElementMouseLeave() {
        this.dispatchBasicEvent(EVENTS.HOVER, null);
    }


    handleElementClick(event) {
        console.log('in element handleElementClick');
        // console.log(JSON.stringify(event.composedPath()));
        if (!this.columnElementIsSelected) {
            this.dispatchBasicEvent(EVENTS.SELECT, this.element.id);
        }
    }

    handleElementDragStart() {
        if (!this.columnElementIsDragged) {
            console.log(`in handleElementDragStart for element ${this.element.id}`);
            this.dispatchBasicEvent(EVENTS.DRAG, this.element.id);
        }
    }

    handleElementDragEnd() {
        this.dispatchBasicEvent(EVENTS.DRAG, null);
    }

    handleColumnElementHoverChange(event) {
        // console.log('in handleColumnElementHoverChange, ' + event.detail.value);
        this.columnElementIsHovered = Boolean(event.detail.value);
        this.dispatchBasicEvent(EVENTS.HOVER, event.detail.value || this.element.id);
    }

    handleColumnElementSelect(event) {
        this.dispatchBasicEvent(EVENTS.SELECT, event.detail.value);
    }

    handleColumnElementDelete(event) {
        this.dispatchBasicEvent(EVENTS.DELETE, event.detail.value);
    }

    handleColumnElementDrag(event) {
        const detail = { ...event.detail }
        this.columnElementIsDragged = Boolean(event.detail.value);
        this.dispatchEvent(new CustomEvent(EVENTS.DRAG, { detail }));
        // this.dispatchBasicEvent(EVENTS.DRAG, event.detail.value);
    }

    dispatchBasicEvent(eventName, value) {
        if (!this.isEditMode) {
            return;
        }
        const detail = {
            value,
            sectionId: this.element.sectionId
        }
        this.dispatchEvent(new CustomEvent(eventName, { detail }));
    }

    handleRecordViewFormLoad(event) {

    }
}