import { LightningElement, api, track } from 'lwc';
import LightningConfirm from 'lightning/confirm';
import { transformConstantObject, FLEXCARD_ELEMENT_TYPES, BUTTON_VARIANTS, LABEL_VARIANTS } from 'c/flexcardUtils';

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

    @api
    get flexcardProperties() {
        return this._flexcardProperties;
    }
    set flexcardProperties(value) {
        this._flexcardProperties = value;
        this.cardBodyStyle = `background-color: ${this.flexcardProperties.color}`;
    }
    @track _flexcardProperties = {
        color: '#FFFFFF'
    };

    @api objectApiName = 'Account';
    @track dragDetails = {};
    @track sectionColumnDrop;
    @track elementIds = [];
    flexcardSize = 300;
    recordId;
    hideHeader;
    showFooter;
    flexcardColor = '#FFFFFF';
    cardBodyStyle;
    isBuilderMode = true;

    headerIcon;
    headerFieldName;
    headerActionType = 'none';

    selectedComponentType = COMPONENT_TYPES.FLEXCARD;
    _hoveredElementId;
    _selectedElementId;

    flexcardElementTypes = transformConstantObject(FLEXCARD_ELEMENT_TYPES).options;
    buttonVariantOptions = transformConstantObject(BUTTON_VARIANTS).options;
    fieldLabelOptions = transformConstantObject(LABEL_VARIANTS).options;
    // fieldLabelOptions = [
    //     { label: 'Use Standard Label', value: 'standard' },
    //     { label: 'Use Custom Label', value: 'custom' },
    //     { label: 'Hide Label', value: 'hidden' },
    // ];

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
        return this.flattenedElements.find(el => el.id == this.selectedElementId) || {};
    }

    get flattenedElements() {
        let elements = [];
        for (let element of this.flexcardElements) {
            elements.push(element);
            if (element.issection) {
                for (let column of element.sectionColumns) {
                    for (let columnElement of column.flexcardElements) {
                        elements.push(columnElement);
                    }
                }
            }
        }
        return elements;
    }

    get elementsString() {
        return JSON.stringify(this.flexcardElements);
    }

    get selectedElementString() {
        return JSON.stringify(this.selectedElement);
    }

    get selectedElementId() {
        return this._selectedElementId;
    }
    set selectedElementId(value) {
        // console.log(`in selectedElementId, value = ${value}`)
        if (value) {
            this.selectedComponentType = COMPONENT_TYPES.ELEMENT;
        }
        this._selectedElementId = value;
        this.reorderElements();
    }

    get hoveredElementId() {
        return this._hoveredElementId;
    }
    set hoveredElementId(value) {
        this._hoveredElementId = value;
        this.reorderElements();
    }

    /* ACTION FUNCTIONS */
    deleteElement(id) {
        console.log('in deleteElement, deleting id ' + id);
        let listResponse = this.getElementList(id);
        listResponse.list.splice(listResponse.indexInList, 1);
        // this.flexcardElements.splice(index, 1);
        // this.selectedElementIndex = null;
        this.clearSelection();

        this.selectedComponentType = COMPONENT_TYPES.FLEXCARD;
        this.reorderElements();
    }

    clearSelection() {
        this.selectedElementId = null;
    }

    /* EVENT HANDLERS */
    // If the container is clicked, deselect everything (if an element within the container is clicked, it should stopPropagation to prevent this parent handler from firing)
    handlePreviewContainerClick(event) {
        this.clearSelection();
        this.selectedComponentType = COMPONENT_TYPES.FLEXCARD;
    }

    handlePreviewBuilderToggleChange(event) {
        console.log(`in handlePreviewBuilderToggleChange, ${event.target.value}`);
        this.isBuilderMode = event.target.value != 'preview';
        for (let toggleButton of this.template.querySelectorAll('.previewBuilderToggleButton')) {
            toggleButton.variant = (toggleButton.value == event.target.value) ? 'brand' : '';
        }
        console.log(this.isBuilderMode);
    }

    /* FLEXCARD PROPERTY EVENT HANDLERS */
    handleShowHeaderChange(event) {
        this.hideHeader = !event.detail.checked;
    }

    handleShowFooterChange(event) {
        this.showFooter = event.detail.checked;
    }

    handlePreviewRecordChange(event) {
        this.recordId = event.detail.value;
    }

    handleFlexcardSizeChange(event) {
        this.flexcardSize = event.detail.value;
    }

    handleFlexcardColorChange(event) {
        this.flexcardColor = event.detail.value;
    }

    handleFlexcardFormatterChange(event) {
        console.log(`in handleFlexcardFormatterChange: ${JSON.stringify(event.detail.value)}`);
        this.flexcardProperties = event.detail.value;
        this.reorderElements();
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
        this.selectedElement.fieldName = event.detail.value;
        this.reorderElements();
    }

    handleFieldLabelStyleChange(event) {
        this.selectedElement.fieldLabelStyle = event.detail.value;
        this.selectedElement.fieldLabelVariant = event.detail.value == 'standard' ? 'standard' : 'label-hidden';
        this.selectedElement.showCustomLabel = event.detail.value == 'custom';
        this.reorderElements();
    }

    handleCustomLabelChange(event) {
        this.selectedElement.customLabel = event.target.value;
        this.reorderElements();
    }

    handleFieldFormatterChange(event) {
        // let properties = event.detail.value;        
        this.selectedElement.formatterProperties = event.detail.value;
        this.selectedElement.fieldClass = Object.values(event.detail.value).join(' ');
        this.reorderElements();
    }

    /* RICH TEXT PROPERTY EVENT HANDLERS */
    handleRichTextChange(event) {
        this.selectedElement.value = event.target.value;
        this.reorderElements();
    }

    /* BUTTON PROPERTY EVENT HANDLERS */
    handleButtonLabelChange(event) {
        this.selectedElement.label = event.target.value;
        this.reorderElements();
    }

    handleButtonVariantChange(event) {
        this.selectedElement.variant = event.detail.value;
        this.reorderElements();
    }

    handleButtonStretchChange(event) {
        this.selectedElement.stretch = event.detail.checked;
        this.reorderElements();
    }

    /* DROPZONE EVENT HANDLERS */
    handleDropzoneDragEnter(event) {
        event.preventDefault();
    }

    handleDropzoneDragOver(event) {
        event.preventDefault();
    }

    handleDropzoneDrop(event) {
        console.log('in handleDropzoneDrop');
        console.log(`dragDetails = ${JSON.stringify(this.dragDetails)}`);
        let dropPos = event.detail.value;
        if (this.sectionColumnDrop) {
            dropPos = this.sectionColumnDrop.dropIndex;
        }
        console.log(`dropPos = ${dropPos}`);
        let draggedElement;
        // If dragType = new, add a new element to the canvas of the selected component type
        if (this.dragDetails.dragType === DRAG_TYPES.NEW) {
            console.log('in new');
            let componentTypeName = this.dragDetails.componentType;
            let componentType = this.flexcardElementTypes.find(type => type.value == componentTypeName);
            console.log(JSON.stringify(componentType));
            draggedElement = this.newFlexcardElement(componentType);
            if (this.sectionColumnDrop) {
                let section = this.flexcardElements.find(el => el.id == this.sectionColumnDrop.sectionId);
                let column = section.sectionColumns[this.sectionColumnDrop.columnIndex];
                // column.flexcardElements.splice(dropPos, 0, draggedElement);
                column.addElement(draggedElement, dropPos);
                // this.sectionColumnDrop = null;
            } else {
                this.flexcardElements.splice(dropPos, 0, draggedElement);
            }
        }
        // If dragType = move, rearrange the existing elements on the canvas to reflect the new order        
        else if (this.dragDetails.dragType === DRAG_TYPES.MOVE) {
            console.log(`looking for element list for ${this.dragDetails.elementId}`);
            let dragOrigin = this.getElementList(this.dragDetails.elementId);
            console.log(`dragOrigin = ${JSON.stringify(dragOrigin)}`);
            // Check to see if the drag begins and ends in the same list (either in the main flexcard body or in the same section column)
            let dropInOriginList = false;
            if (this.sectionColumnDrop) {
                if (dragOrigin.section) {
                    if (this.sectionColumnDrop.sectionId == dragOrigin.section.id && this.sectionColumnDrop.columnIndex == dragOrigin.column.index) {
                        dropInOriginList = true;
                    }
                }
            } else {
                if (!dragOrigin.section) {
                    dropInOriginList = true;
                }
            }

            if (dropInOriginList) {
                // if (Math.abs(dropPos - dragOrigin.indexInList) == 1) {
                //     // It's not actually moving, we can just cancel
                //     return;
                // }
                if (dragOrigin.indexInList < dropPos) {
                    dropPos--;
                }
            }

            draggedElement = dragOrigin.list.splice(dragOrigin.indexInList, 1);
            console.log(`draggedElement = ${JSON.stringify(draggedElement)}`);            

            // draggedElement = this.flexcardElements.splice(this.dragDetails.elementIndex, 1);
            if (draggedElement.length) {
                draggedElement = draggedElement[0];
                if (this.sectionColumnDrop) {
                    // console.log(`sectionColumDrop = ${JSON.stringify(this.sectionColumnDrop)}`);
                    // console.log('correction! this element is actually being moved INTO section id ' + this.sectionColumnDrop.sectionId);
                    let section = this.flexcardElements.find(el => el.id == this.sectionColumnDrop.sectionId);
                    let column = section.sectionColumns[this.sectionColumnDrop.columnIndex];
                    column.addElement(draggedElement, dropPos);
                } else {
                    // Since the dragged element is being dropped in the main flexcard body and not a section column, clear any section/column identity
                    draggedElement.sectionId = null;
                    draggedElement.columnIdex = null;
                    this.flexcardElements.splice(dropPos, 0, draggedElement)
                }
            }

            // If the origin index is less than the target index, we need to subtract 1 because splicing the dragged element has shifted the list up by 1
            // if (this.dragDetails.elementIndex < dropPos) {
            //     dropPos--;
            // }
            // if (draggedElement.length) {
            //     draggedElement = draggedElement[0];
            //     dropList.splice(dropPos, 0, draggedElement);
            // }
        }
        // this.selectedElementIndex = dropPos;
        // console.log(`setting selectedElementId to ${draggedElement.id}`);
        this.sectionColumnDrop = null;
        this.selectedElementId = draggedElement.id;
        this.reorderElements();
        // console.log(JSON.stringify(this.flexcardElements));
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
        console.log('in handleHeaderFooterClick for ' + event.currentTarget.dataset.name);
        // this.selectedElementIndex = null;
        this.clearSelection();
        event.currentTarget.dataset.isHovered = false;
        // event.currentTarget.dataset.isSelected = true;
        this.selectedComponentType = event.currentTarget.dataset.name;
        event.stopPropagation();
    }

    /* FLEXCARD ELEMENT EVENT HANDLERS */
    // handleFlexcardElementClick(event) {
    //     console.log('in handleFlexcardElementClick, '+ event.currentTarget.dataset.index);
    //     // this.selectedElementIndex = event.currentTarget.dataset.index;
    //     this.selectedElementId = event.currentTarget.dataset.id;
    //     // this.clearSelection();
    //     event.stopPropagation(); // Prevent handlePreviewContainerClick from firing
    // }

    handleFlexcardElementDragStart(event) {
        this.dragDetails = {
            dragType: DRAG_TYPES.MOVE,
            elementIndex: event.currentTarget.dataset.index,
            elementId: event.currentTarget.dataset.id
        }
    }

    async handleElementDeleteClick(event) {
        console.log('in handleElementDeleteClick');
        const result = await LightningConfirm.open({
            message: 'Are you sure you want to delete this component? You can\'t undo this action.',
            theme: 'error',
            label: 'Delete component?',
            // setting theme would have no effect
        });

        if (result) {
            this.deleteElement(event.detail.value);
        }
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

    handleElementHoverChange(event) {
        this.hoveredElementId = event.detail.value;
    }

    handleElementSelect(event) {
        console.log(`in handleElementSelect, ${event.detail.value}`);
        this.selectedElementId = event.detail.value;
        event.stopPropagation();
    }

    handleElementClick(event) {
        event.stopPropagation();
    }

    handleElementDrag(event) {
        console.log(`in handleElementDrag, detail=${JSON.stringify(event.detail)}`);
        // this.draggedElementId = event.detail.value;
        this.dragDetails = {
            dragType: DRAG_TYPES.MOVE,
            elementId: event.detail.value,
            sectionId: event.detail.sectionId
        }
    }

    /* UTILITY FUNCTIONS */
    newFlexcardElement(elementType) {
        console.log('in newFlexcardElement');
        let newElement = {
            elementType,
            [`is${elementType.value}`]: true,
            id: this.generateElementId(),
            formatterProperties: {}
        }
        if (newElement.isfield) {
            newElement = {
                ...newElement,
                fieldLabelStyle: this.fieldLabelOptions[0].value,
                field: {},
            }
        }
        if (newElement.issection) {
            newElement.sectionColumns = [
                this.newSectionColumn('2', 0, newElement.id),
                this.newSectionColumn('2', 1, newElement.id),
            ];
            console.log('new element has ' + newElement.sectionColumns.length + ' columns');
        }
        if (newElement.isbutton) {
            newElement.label = 'Click Me';
            newElement.variant = 'neutral';
        }
        return newElement;
    }

    newSectionColumn(width, index, sectionId) {
        return {
            width,
            sectionId,
            id: this.generateElementId(),
            index,
            // index: this.flexcardElements.find(el => el.id == sectionId).sectionColumns.length,
            flexcardElements: [
                // this.newFlexcardElement('field')
            ],
            get columnClass() {
                return `slds-col slds-size_${width}-of-4 sectionColumn`;
            },
            get widthLabel() {
                return `Column ${+index + 1} Width`;
            },
            addElement(element, indexInColumn = this.flexcardElements.length) {
                element = {
                    ...element,
                    sectionId,
                    columnIndex: this.index
                }
                this.flexcardElements.splice(indexInColumn, 0, element);
            }
        }
    }

    reorderElements() {
        this.flexcardElements = this.flexcardElements.map(el => {
            return { ...el };
        });
        // this.flexcardElements = this.processElements(this.flexcardElements);
        // this.flexcardElements = this.flexcardElements.map((el, index) => {
        //     return {
        //         ...el,
        //         index,
        //         isHovered: el.id == this.hoveredElementId,
        //         isSelected: el.id == this.selectedElementId,

        //     }
        // })
    }

    generateElementId() {
        let newId = Math.random().toString().substring(2); // Generate a random number then remove the '0.'
        while (this.elementIds.includes(newId)) {   // On the very, very, very slim chance that this random number has already been generated, generate a new one
            newId = Math.random().toString().substring(2);
        }
        this.elementIds = [...this.elementIds, newId];
        return newId;
    }    

    getElementFromId(id) {
        return this.flattenedElements.find(el => el.id == id);
    }

    getElementList(id) {
        console.log(`in getElementList for id ${id}`);
        let el = this.getElementFromId(id);
        if (!el) {
            return {
                errorMessage: `Element with ID ${id} not found`
            }
        }
        let response = {
            list: this.flexcardElements
        }
        if (el.sectionId) {
            let section = this.getElementFromId(el.sectionId);
            // let section = this.flexcardElements.find(el => el.id == el.sectionId);
            let column = section.sectionColumns[el.columnIndex];
            response = {
                section,
                column,
                element: el,
                list: column.flexcardElements,
            }
        }
        response.indexInList = response.list.findIndex(el => el.id == id);
        return response;
    }


    /*** UNUSED CODE GRAVEYARD ***/

    /* CARD BODY EVENT HANDLERS */
    /*
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
    */
    
    /*
    processElements(elements) {
        return elements.map((el, index) => {
            if (el.sectionColumns?.length) {
                for (let column of el.sectionColumns) {
                    column.flexcardElements = this.processElements(column.flexcardElements);
                }
            }
            return {
                ...el,
                index,
                isHovered: el.id == this.hoveredElementId,
                isSelected: el.id == this.selectedElementId,

            }
        })
    }    
    */

    /* 
    // handleFlexcardElementDragOver(event) {
    //     // if (this.dropzoneIndicator && event.currentTarget.dataset.elementType != 'section') {
    //     if (this.dropzoneIndicator) {
    //         this.dropzoneIndicator.classList.add('active');
    //         let containerRect = event.currentTarget.closest('.dropzone').getBoundingClientRect();
    //         let elementRect = event.currentTarget.getBoundingClientRect();
    //         let yPos = (this.isMouseInTopHalf(event) ? elementRect.top : elementRect.bottom) - containerRect.top;
    //         this.dropzoneIndex = (+event.currentTarget.dataset.index || 0) + (this.isMouseInTopHalf(event) ? 0 : 1);
    //         this.dropzoneIndicator.style.left = 0;
    //         this.dropzoneIndicator.style.width = `${containerRect.width}px`;
    //         this.dropzoneIndicator.style.top = `${yPos}px`;
    //     }
    // }

    // handleFlexcardElementDragLeave(event) {
    //     // this.dragIsOverFlexcardElement = false;
    //     this.dropzoneIndicator?.classList.remove('active');
    // }

    // handleFlexcardElementMouseEnter(event) {
    //     // this.hoveredElementIndex = event.target.dataset.index;
    //     this.hoveredElementId = event.target.dataset.id;
    // }

    // handleFlexcardElementMouseLeave(event) {
    //     // this.hoveredElementIndex = null;
    //     this.hoveredElementId = null;
    // }
    */    
}