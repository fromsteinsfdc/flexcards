import { LightningElement, api, track } from 'lwc';
import { transformConstantObject, FLEXCARD_ELEMENT_TYPES, BUTTON_VARIANTS } from 'c/flexcardUtils';

const COMPONENT_TYPES = {
    HEADER: 'header',
    FOOTER: 'footer',
    ELEMENT: 'element',
    FLEXCARD: 'flexcard',
}

const DRAG_TYPES = {
    NEW: 'new',
    MOVE: 'move'
}

export default class FlexcardDesigner extends LightningElement {

    @api 
    get flexcardElements() {
        return this._flexcardElements;
    }
    set flexcardElements(value) {
        this._flexcardElements = value;
    }
    @track _flexcardElements = [];

    @api objectApiName = 'Account';
    @track dragDetails = {};
    @track sectionColumnDrop;
    @track elementIds = [];
    flexcardSize = 300;
    recordId;
    hideHeader;
    showFooter;
    flexcardColour = '#FFFFFF';

    headerIcon;
    headerFieldName;
    headerActionType = 'none';

    cardIsSelected = true;
    dropzoneIndex = 0;
    selectedComponentType = COMPONENT_TYPES.FLEXCARD;
    dragIsOverSection = false;
    _hoveredElementIndex;
    _selectedElementIndex;

    flexcardElementTypes = transformConstantObject(FLEXCARD_ELEMENT_TYPES).options;
    // flexcardElementTypes = [
    //     { label: 'Record fField', value: 'field', icon: 'utility:display_text' },
    //     { label: 'Image', value: 'image', icon: 'utility:image' },
    //     { label: 'Rich Text', value: 'richtext', icon: 'utility:display_rich_text' },
    //     { label: 'Action Menu', value: 'menu', icon: 'utility:down' },
    //     { label: 'Action Button/Link', value: 'button', icon: 'utility:button_choice' },
    //     { label: 'Section', value: 'section', icon: 'utility:section' },
    // ];

    fieldLabelOptions = [
        { label: 'Use Standard Label', value: 'standard' },
        { label: 'Use Custom Label', value: 'custom' },
        { label: 'Hide Label', value: 'hidden' },        
    ];

    buttonVariantOptions = transformConstantObject(BUTTON_VARIANTS).options;
    // buttonVariantOptions = [
    //     { label: 'Neutral (default)', value: 'neutral' },
    //     { label: 'Base (link)', value: 'base' },
    //     { label: 'Brand (blue)', value: 'brand' },
    //     { label: 'Brand Outline', value: 'brand-outline' },
    //     { label: 'Destructive (red)', value: 'destructive' },
    //     { label: 'Destructive Text', value: 'destructive-text' },
    //     { label: 'Success (green)', value: 'success' },
    // ]

    columnWidthOptions = [
        { label: '1 of 4', value: '1' },
        { label: '2 of 4 (half width)', value: '2' },
        { label: '3 of 4', value: '3' },
        { label: '4 of 4', value: '4' },        
    ];

    headerActionOptions = [
        { label: 'No Action', value: 'none' },
        { label: 'Action Button/Link', value: 'button' },
        { label: 'Action Menu', value: 'menu' },
    ]

    get cardBody() {
        return this.template.querySelector('.cardBody');
    }

    get dropzoneIndicator() {
        return this.template.querySelector('.dropzoneIndicator');
    }

    get selectedComponentIs() {
        return {
            [this.selectedComponentType]: true
        }
    }

    get computedFlexcardStyle() {
        return `width: ${+this.flexcardSize + 1}px; height: ${+this.flexcardSize + 1}px`;
    }

    get selectedElement() {
        if ((this.selectedElementIndex || this.selectedElementIndex === 0) && this.flexcardElements[this.selectedElementIndex]) {
            return this.flexcardElements[this.selectedElementIndex];
        } else {
            return {};
        }
    }

    get elementsString() {
        return JSON.stringify(this.flexcardElements);
    }

    get selectedElementString() {
        return JSON.stringify(this.selectedElement);
    }

    get selectedElementIndex() {
        return this._selectedElementIndex;
    }
    set selectedElementIndex(value) {
        // console.log('setting selectedElementIndex to '+ value);
        this._selectedElementIndex = value;
        if (value || value === 0) {
            this.selectedComponentType = COMPONENT_TYPES.ELEMENT;
        }
        this.hoveredElementIndex = null;
        this.flexcardElements = this.flexcardElements.map((el, index) => {
            el.isSelected = index == value;
            return el;
        });
        // console.log(JSON.stringify(this.selectedElement));
        // console.log('finished set selectedElementIndex');
    }

    get hoveredElementIndex() {
        return this._hoveredElementIndex;
    }
    set hoveredElementIndex(value) {
        this._hoveredElementIndex = value;
        this.flexcardElements = this.flexcardElements.map((el, index) => {
            el.isHovered = index == value;
            return el;
        });
    }

    /* LIFECYCLE HOOKS */
    connectedCallback() {
    }

    renderAction;
    renderedCallback() {
        if (this.renderAction) {
            console.log('in unhide');
            // let el = this.template.querySelector(`c-flexcard-element`);
            let el = this.template.querySelector('c-flexcard-element[element-id="'+ this.renderAction +'"]');
            el.classList.remove('slds-hide');
            this.renderAction = null;
        }
    }

    /* ACTION FUNCTIONS */
    // addFlexcardElement(name) {
    //     console.log('in addFlexcardElement');
    //     this.flexcardElements = [...this.flexcardElements, this.newFlexcardElement(name)];
    // }

    deleteElement(index) {
        console.log('in deleteElement, deleting index '+ index);
        this.flexcardElements.splice(index, 1);
        this.selectedElementIndex = null;
        this.selectedComponentType = COMPONENT_TYPES.FLEXCARD;
    }

    /* EVENT HANDLERS */
    // If the container is clicked, deselect everything (if an element within the container is clicked, it should stopPropagation to prevent this parent handler from firing)
    handlePreviewContainerClick(event) {
        this.selectedElementIndex = null;   // Setting selectedElementIndex to a NaN value automatically sets selectedComponentType to `flexcard`
        this.selectedComponentType = COMPONENT_TYPES.FLEXCARD;        
    }

    /* FLEXCARD PROPERTY EVENT HANDLERS */
    handleShowHeaderChange(event) {
        this.hideHeader = !event.detail.checked;
    }

    handleShowFooterChange(event) {
        this.showFooter = event.detail.checked;
    }

    handleRecordIdChange(event) {
        console.log('in handleRecordIdChange');        
        this.recordId = event.target.value;
        console.log(this.recordId);
    }

    handlePreviewRecordChange(event) {
        console.log('in handlePreviewRecordChange');
        try {
            console.log(JSON.stringify(event.detail));
            this.recordId = event.detail.value;
        } catch (error) {
            console.log('ERROR');
            console.error(error);
          }          
    }

    handleFlexcardSizeChange(event) {
        this.flexcardSize = event.detail.value;
    }

    /* HEADER PROPERTY EVENT HANDLERS */
    handleHeaderFieldNameChange(event) {
        console.log(JSON.stringify(event.detail));
        let fields = event.detail.value;
        this.headerFieldName = fields.length ? fields[0].name : null;
    }    

    handleHeaderIconChange(event) {
        this.headerIcon = event.detail;
    }    

    /* RECORD FIELD PROPERTY EVENT HANDLERS */
    handleFieldNameUpdate(event) {
        console.log('in handleFieldNameUpdate, '+ JSON.stringify(event.detail.value));
        // let fields = event.detail.value;
        // let field = fields.length ? fields[0] : {};
        this.selectedElement.fieldName = event.detail.value;
        this.reorderElements();
        // this.updateSelectedElement('fieldName', event.detail.value);
        // this.selectedElement.field = event.detail.value[0];
        // this.flexcardElements = this.flexcardElements;
    }

    handleFieldLabelStyleChange(event) {
        // this.updateSelectedElement('fieldLabelStyle', event.detail.value);
        // this.updateSelectedElement('fieldLabelVariant', event.detail.value == 'standard' ? 'standard' : 'label-hidden');
        // this.updateSelectedElement('showCustomLabel', event.detail.value == 'custom');
        this.selectedElement.fieldLabelStyle = event.detail.value;
        this.selectedElement.fieldLabelVariant = event.detail.value == 'standard' ? 'standard' : 'label-hidden';
        this.selectedElement.showCustomLabel = event.detail.value == 'custom';
        this.reorderElements();
        // this.selectedElement.fieldLabelStyle = event.detail.value;
    }

    handleCustomLabelChange(event) {
        // this.updateSelectedElement('customLabel', event.target.value);
        this.selectedElement.customLabel = event.target.value;
        this.reorderElements();
    }

    /* RICH TEXT PROPERTY EVENT HANDLERS */
    handleRichTextChange(event) {
        this.updateSelectedElement('value', event.detail.value);
        // this.selectedElement.value = event.target.value;
    }

    /* BUTTON PROPERTY EVENT HANDLERS */
    handleButtonLabelChange(event) {
        // this.selectedElement.label = event.target.value;
        this.updateSelectedElement('label', event.target.value);
    }

    handleButtonVariantChange(event) {
        this.selectedElement.variant = event.detail.value;
        this.reorderElements();

        // this.selectedElement = {
        //     ...this.selectedElement,
        //     variant: event.detail.value
        // }

        // this.updateSelectedElement('variant', event.detail.value);
    }

    handleButtonStretchChange(event) {
        this.selectedElement.stretch = event.detail.checked;
        this.reorderElements();
        // this.updateSelectedElement('stretch', event.detail.checked);
    }

    /* DROPZONE EVENT HANDLERS */
    handleDropzoneDrop(event) {
        console.log('in handleDropzoneDrop');
        console.log(event.detail.value);
        let dropPos = event.detail.value;
        console.log(JSON.stringify(this.dragDetails));
        // If dragType = new, add a new element to the canvas of the selected component type
        if (this.dragDetails.dragType === DRAG_TYPES.NEW) {
            console.log('in new');
            // let componentTypeName = event.dataTransfer.getData("text/plain");
            let componentTypeName = this.dragDetails.componentType;
            let componentType = this.flexcardElementTypes.find(type => type.value == componentTypeName);
            console.log(JSON.stringify(componentType));
            if (this.sectionColumnDrop) {
                let section = this.flexcardElements.find(el => el.id == this.sectionColumnDrop.sectionId);
                console.log(`section = ${JSON.stringify(section)}`);
                let column = section.sectionColumns[this.sectionColumnDrop.columnIndex];
                column.flexcardElements.splice(dropPos, 0, this.newFlexcardElement(componentType));
                column.flexcardElements = column.flexcardElements;
                section.sectionColumns = section.sectionColumns;
                section = section;
                this.flexcardElements = this.flexcardElements;
                let el = this.template.querySelector('c-flexcard-element[element-id="'+this.sectionColumnDrop.sectionId+'"]');
                // let el = this.template.querySelector(`c-flexcard-element`);
                console.log(`el = ${el}`);
                el.classList.add('slds-hide');
                this.renderAction = this.sectionColumnDrop.sectionId;
                this.sectionColumnDrop = null;
            } else {
                this.flexcardElements.splice(dropPos, 0, this.newFlexcardElement(componentType));
            }
            
            console.log('finished splicing');
        } 
        // If dragType = move, rearrange the existing elements on the canvas to reflect the new order        
        else if (this.dragDetails.dragType === DRAG_TYPES.MOVE) {
            // Remove the dragged element from the list and store it in a variable
            let draggedElement = this.flexcardElements.splice(this.dragDetails.elementIndex, 1);
            // My head hurts when I try to remember why, but if the origin index is less than the drop position, we need to substract 1
            if (this.dragDetails.elementIndex < dropPos) {
                dropPos--;
            }
            if (draggedElement.length) {
                this.flexcardElements.splice(dropPos, 0, draggedElement[0]);
            }
        }
        // this.flexcardElements = this.flexcardElements;  // Reset the list for reactivity
        this.selectedElementIndex = dropPos;
        this.reorderElements();
        console.log(JSON.stringify(this.flexcardElements));
        console.log('finished handleDropzoneDrop');
    }

    /* COMPONENT MENU EVENT HANDLERS */
    handleComponentTypeDragStart(event) {
        let componentType = event.target.dataset.value;
        console.log(`dragging ${componentType}`);
        event.dataTransfer.setData("text/plain", componentType);
        console.log(`dataTransfer.getData = ${event.dataTransfer.getData("text/plain")}`);
        this.dragDetails = {
            dragType: DRAG_TYPES.NEW,
            componentType: componentType
        }
        // const img = new Image();
        // img.src = "https://i.imgur.com/IjljSvo.png";
        // event.dataTransfer.setDragImage(img, 10, 10);
    }

    /* CARD BODY EVENT HANDLERS */
    handleCardBodyDragEnter(event) {
        event.preventDefault();
        if (!this.dragIsOverSection) {
        // console.log('in handleCardBodyDragEnter');
            this.cardBody?.classList.add('dropzoneActive');
        }
    }

    handleCardBodyDragLeave(event) {
        console.log('in handleCardBodyDragLeave, dragIsOverFlexcardElement = '+ this.dragIsOverFlexcardElement);
        // if (!this.dragIsOverFlexcardElement) {
            this.cardBody?.classList.remove('dropzoneActive');
        // }
    }

    handleCardBodyDrop(event) {
        // Clear classes that indicate an active dropzone
        this.cardBody?.classList.remove('dropzoneActive');
        this.dropzoneIndicator?.classList.remove('active');

        let dropPos = this.dropzoneIndex;

        // If dragType = new, add a new element to the canvas of the selected component type
        if (this.dragDetails.dragType === DRAG_TYPES.NEW) {
            let componentTypeName = event.dataTransfer.getData("text/plain");
            let componentType = this.flexcardElementTypes.find(type => type.value == componentTypeName);
            this.flexcardElements.splice(dropPos, 0, this.newFlexcardElement(componentType));
        } 
        // If dragType = move, rearrange the existing elements on the canvas to reflect the new order        
        else if (this.dragDetails.dragType === DRAG_TYPES.MOVE) {
            // Remove the dragged element from the list and store it in a variable
            let draggedElement = this.flexcardElements.splice(this.dragDetails.elementIndex, 1);
            // My head hurts when I try to remember why, but if the origin index is less than the drop position, we need to substract 1
            if (this.dragDetails.elementIndex < dropPos) {
                dropPos--;
            }
            if (draggedElement.length) {
                this.flexcardElements.splice(dropPos, 0, draggedElement[0]);
            }
        }
        this.flexcardElements = this.flexcardElements;  // Reset the list for reactivity
        this.selectedElementIndex = dropPos;
        this.reorderElements();
        event.preventDefault(); // Prevent handlePreviewContainerClick from firing
        // console.log(JSON.stringify(this.selectedElement));
        // console.log(JSON.stringify(this.flexcardElements));
        console.log('finished handleCardBodyDrop');
    }

    handleRecordViewFormLoad(event) {
        console.log('in handleRecordViewFormLoad');
        console.log(event.detail);
    }

    /* FLEXCARD HEADER & FOOTER EVENT HANDLERS */
    handleHeaderFooterMouseEnter(event) {
        event.currentTarget.dataset.isHovered = true;
    }

    handleHeaderFooterMouseLeave(event) {
        event.currentTarget.dataset.isHovered = false;
    }

    handleHeaderFooterClick(event) {
        console.log('in handleHeaderFooterClick for '+ event.currentTarget.dataset.name);
        this.selectedElementIndex = null;
        event.currentTarget.dataset.isHovered = false;
        // event.currentTarget.dataset.isSelected = true;
        this.selectedComponentType = event.currentTarget.dataset.name;
        event.stopPropagation();
    }

    /* FLEXCARD ELEMENT EVENT HANDLERS */
    handleFlexcardElementClick(event) {
        console.log('in handleFlexcardElementClick, '+ event.currentTarget.dataset.index);
        this.selectedElementIndex = event.currentTarget.dataset.index;
        event.stopPropagation(); // Prevent handlePreviewContainerClick from firing
    }

    handleFlexcardElementDragStart(event) {
        this.dragDetails = {
            dragType: DRAG_TYPES.MOVE,
            elementIndex: event.currentTarget.dataset.index
        }
    }

    handleFlexcardElementDragOver(event) {
        // if (this.dropzoneIndicator && event.currentTarget.dataset.elementType != 'section') {
        if (this.dropzoneIndicator) {
            this.dropzoneIndicator.classList.add('active');
            let containerRect = event.currentTarget.closest('.dropzone').getBoundingClientRect();
            let elementRect = event.currentTarget.getBoundingClientRect();
            let yPos = (this.isMouseInTopHalf(event) ? elementRect.top : elementRect.bottom) - containerRect.top;
            this.dropzoneIndex = (+event.currentTarget.dataset.index || 0) + (this.isMouseInTopHalf(event) ? 0 : 1);
            this.dropzoneIndicator.style.left = 0;
            this.dropzoneIndicator.style.width = `${containerRect.width}px`;
            this.dropzoneIndicator.style.top = `${yPos}px`;
        }
    }

    handleFlexcardElementDragLeave(event) {
        // this.dragIsOverFlexcardElement = false;
        this.dropzoneIndicator?.classList.remove('active');
    }

    handleFlexcardElementMouseEnter(event) {
        this.hoveredElementIndex = event.target.dataset.index;
    }

    handleFlexcardElementMouseLeave(event) {
        this.hoveredElementIndex = null;
    }

    handleElementDeleteClick(event) {
        this.deleteElement(event.detail.value);
        // this.deleteElement(event.currentTarget.dataset.index);
        event.stopPropagation();
    }

    /* SECTION COLUMN EVENT HANDLERS */    
    handleSectionColumnDragEnter(event) {
        event.preventDefault();
        console.log('in handleSectionColumnDragEnter');
        this.dragIsOverSection = true;
        console.log(event.currentTarget.dataset.index);
        this.cardBody.classList.remove('dropzoneActive');
        // TODO: Need to add check to make sure the element being dragged over is not another section
        event.currentTarget.classList.add('dropzoneActive');
        console.log('finished handleSectionColumnDragEnter');
    }

    handleSectionColumnDragLeave(event) {
        this.dragIsOverSection = false;
        console.log('in handleSectionColumnDragLeave');
        console.log(event.currentTarget.dataset.index);
        event.currentTarget.classList.remove('dropzoneActive');
        console.log('finished handleSectionColumnDragLeave');
    }

    handleSectionColumnDrop(event) {
        console.log('in handleSectionColumnDrop');
        console.log(JSON.stringify(event.detail));
        this.sectionColumnDrop = event.detail;
    }

    /* UTILITY FUNCTIONS */
    newFlexcardElement(elementType) {
        console.log('in newFlexcardElement');
        let newElement = {
            elementType,
            [`is${elementType.value}`]: true,
            id: this.generateElementId()
        }
        if (newElement.isfield) {
            newElement = {
                ...newElement,
                fieldLabelStyle: this.fieldLabelOptions[0].value,
                field: {},
                // get fieldLabelVariant() {
                //     return this.fieldLabelStyle == 'standard' ? 'standard' : 'label-hidden'
                // }
            }
            // newElement.objectApiName = this.objectApiName;
            // newElement.fieldLabelStyle = this.fieldLabelOptions[0].value;
            // newElement.field = {};
        }
        if (newElement.issection) {
            newElement.sectionColumns = [
                this.newSectionColumn('2', 1),
                this.newSectionColumn('2', 2),
            ];
            console.log('new element has '+ newElement.sectionColumns.length +' columns');
        }
        if (newElement.isbutton) {
            newElement.label = 'Click Me';
            newElement.variant = 'neutral';
        }
        return newElement;
    }    

    newSectionColumn(width, index) {
        return {
            width,
            flexcardElements: [
                // this.newFlexcardElement('field')
            ],
            get columnClass() {
                return `slds-col slds-size_${width}-of-4 sectionColumn dropzone`;
            },
            get widthLabel() {
                return `Column ${index} Width`;
            }
        }
    }

    isMouseInTopHalf(event) {
        let rect = event.currentTarget.getBoundingClientRect();
        let mouseY = event.clientY - rect.top;
        let isTopHalf = (mouseY / rect.height < 0.5);
        return isTopHalf;
    }

    updateSelectedElement(fieldName, newValue) {
        this.selectedElement[fieldName] = newValue;
        this.flexcardElements = this.flexcardElements;
    }

    reorderElements() {
        this.flexcardElements = this.flexcardElements.map((el, index) => {
            el.index = index;
            return el;
        })
    }

    generateElementId() {
        let newId = Math.random();
        while (this.elementIds.includes(newId)) {
            newId = Math.random();
        }
        this.elementIds = [...this.elementIds, newId];
        return newId;
    }
}