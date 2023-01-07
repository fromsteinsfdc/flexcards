import { LightningElement, api, track } from 'lwc';
import LightningConfirm from 'lightning/confirm';
import { FlexcardElementClass, transformConstantObject, FLEXCARD_ELEMENT_TYPES, BUTTON_VARIANTS, BUTTON_CONTENT_VARIANTS, LABEL_VARIANTS, DEFAULT_FLEXCARD_PROPERTIES, MENU_DISPLAY_TYPES, SIZES } from 'c/flexcardUtils';

const DEFAULT_ACTION_LABEL = '[Select Action]';
const MAX_NUM_COLUMNS = 4;
const HEADER_ACTION_MENU_ID = 'HEADER_MENU';
const COMPONENT_TYPES = {
    HEADER: 'header',
    FOOTER: 'footer',
    ELEMENT: 'element',
    FLEXCARD: 'flexcard',
    ACTIONS: 'headerActions',
    ACTION: 'action'
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
        this._flexcardElements = JSON.parse(JSON.stringify(value)) || [];
    }
    @track _flexcardElements = [];

    @api
    get flexcardProperties() {
        return this._flexcardProperties || {};
    }
    set flexcardProperties(value) {
        console.log('in set flexcardProperties');
        this._flexcardProperties = JSON.parse(JSON.stringify(value)) || {};
        this.cardBodyStyle = `background-color: ${this.flexcardProperties.color}`;
        console.log('finished set flexcardProperties');
    }
    @track _flexcardProperties = DEFAULT_FLEXCARD_PROPERTIES;

    @api objectApiName;
    @api previewRecordId;

    @api
    get valuesHaveChanged() {
        return !(this.initialValues.properties === JSON.stringify(this.flexcardProperties)
            && this.initialValues.elements === JSON.stringify(this.flexcardElements));
    }

    @track dragDetails;
    @track sectionColumnDrop;
    @track menuActionDragIndex;
    // @track elementIds = [];
    @track initialValues;

    flexcardSize = 300;
    hideHeader;
    showFooter;
    flexcardColor = '#FFFFFF';
    cardBodyStyle;
    isBuilderMode = true;
    actionMenuClass;
    // showDesignerModal = true;

    headerFieldName;

    selectedComponentType = COMPONENT_TYPES.FLEXCARD;
    selectedActionId;
    _hoveredElementId;
    _selectedElementId;

    // flexcardElementsConstant = transformConstantObject(FLEXCARD_ELEMENT_TYPES);
    // buttonVariantsConstant = transformConstantObject(BUTTON_VARIANTS);
    // fieldLabelsConstant = transformConstantObject(LABEL_VARIANTS);
    // actionContentsConstant = transformConstantObject(BUTTON_CONTENT_VARIANTS);

    // flexcardElementTypes = this.flexcardElementsConstant.options;
    // buttonVariantOptions = this.buttonVariantsConstant.options;
    // fieldLabelOptions = this.fieldLabelsConstant.options;
    // actionContentOptions = this.actionContentsConstant.options;

    flexcardElementTypes = transformConstantObject(FLEXCARD_ELEMENT_TYPES);
    buttonVariants = transformConstantObject(BUTTON_VARIANTS);
    fieldLabels = transformConstantObject(LABEL_VARIANTS);
    actionContents = transformConstantObject(BUTTON_CONTENT_VARIANTS);
    menuDisplayTypes = transformConstantObject(MENU_DISPLAY_TYPES);
    sizes = transformConstantObject(SIZES);

    get columnWidthOptions() {
        let numColumns = this.selectedElement?.sectionColumns?.length - 1;
        if (!numColumns) {
            return [{ label: `Full width`, value: MAX_NUM_COLUMNS }];
        } else {
            let options = [];
            for (let i = 1; i <= MAX_NUM_COLUMNS - numColumns; i++) {
                let newOption = { label: `${i} of ${MAX_NUM_COLUMNS}`, value: i };
                if (i == MAX_NUM_COLUMNS / 2) {
                    newOption.label += ' (half width)';
                }
                options.push(newOption);
            }
            return options;
        }
    }

    actionContentOptions = [
        { label: 'Text', value: 'text', default: true },
        { label: 'Icon', value: 'icon' },
        { label: 'Text and Icon', value: 'both' },
    ];

    get selectedComponentIs() {
        return {
            [this.selectedComponentType]: true
        }
    }

    get computedFlexcardStyle() {
        return `width: ${+this.flexcardProperties.flexcardSize + 1}px; height: ${+this.flexcardProperties.flexcardSize + 1}px`;
    }

    get selectedElement() {
        return this.getElementFromId(this.selectedElementId) || {};
    }

    get selectedActionMenu() {
        if (this.selectedActionId) {
            return null;
        }
        if (this.selectedElement.ismenu) {
            return this.selectedElement;
        }
        if (this.selectedComponentType == COMPONENT_TYPES.ACTIONS) {
            return this.flexcardProperties.headerActionMenu;
        }
        return null;
    }

    get selectedAction() {
        if (this.selectedActionId) {
            // if (this.selectedElementId == this.selectedActionId) {
            //     return this.selectedElement;
            // }
            return this.getElementFromId(this.selectedActionId) || this.flexcardProperties.headerActionMenu.actions.find(act => act.id == this.selectedActionId);
        //     if (!action) {
        //         action = this.flexcardProperties.headerActionMenu.actions.find(act => act.id == this.selectedActionId);
        //     }
        }
        return null;
    }

    get addColumnButtonDisabled() {
        return this.selectedElement?.sectionColumns?.length >= MAX_NUM_COLUMNS;
    }

    get headerIsSelected() {
        return this.selectedComponentType === COMPONENT_TYPES.HEADER || this.selectedActionMenu?.id === HEADER_ACTION_MENU_ID || this.selectedAction?.menuId === HEADER_ACTION_MENU_ID;
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
            if (element.ismenu) {
                for (let action of element.actions) {
                    elements.push(action);
                }
            }
        }
        return elements;
    }

    get selectedElementId() {
        return this._selectedElementId;
    }
    set selectedElementId(value) {
        // console.log(`in selectedElementId, value = ${value}`)
        this._selectedElementId = value;
        if (value) {
            this.selectedComponentType = COMPONENT_TYPES.ELEMENT;            
        }
        this.selectedActionId = (this.selectedElement && this.selectedElement.isaction) ? value : null;
        this.reorderElements();
    }

    get hoveredElementId() {
        return this._hoveredElementId;
    }
    set hoveredElementId(value) {
        this._hoveredElementId = value;
        this.reorderElements();
    }

    get elementsString() {
        return JSON.stringify(this.flexcardElements);
    }

    get selectedElementString() {
        return JSON.stringify(this.selectedElement);
    }

    /* LIFECYCLE HOOKS */
    constructor() {
        super(); // this is required
        console.log('constructing');
    }
    
    connectedCallback() {
        console.log('in flexcardDesigner connectedCallback');

        // Upon loading, store the initial flexcard details (as strings) so that if the user clicks
        // 'Cancel', they can be compared later to see if any changes have been made and warn them
        this.initialValues = {
            elements: JSON.stringify(this.flexcardElements),
            properties: JSON.stringify(this.flexcardProperties)
        }

        // Create the header action menu if it doesn't already exist
        if (!this.flexcardProperties.headerActionMenu) {
            this.flexcardProperties.headerActionMenu = this.newFlexcardElement(FLEXCARD_ELEMENT_TYPES.MENU, HEADER_ACTION_MENU_ID);
            // this.flexcardProperties.headerActionMenu.id = HEADER_ACTION_MENU_ID;
        }

        let testColumn = this.newSectionColumn();
        console.log(`testColumn widthLabel #1 = ${testColumn.widthLabel}`);
        testColumn.index = 1;
        console.log(`testColumn widthLabel #2 = ${testColumn.widthLabel}`);
        testColumn = Object.assign({}, testColumn);
        testColumn.index = 2;
        console.log(`testColumn widthLabel #3 = ${testColumn.widthLabel}`);        

        let newColumn = new FlexcardElementClass(FLEXCARD_ELEMENT_TYPES.MENU, this.flattenedElements, HEADER_ACTION_MENU_ID);
        console.log('newColumn created');
        console.log(`newColumn starting widthLabel = ${newColumn.widthLabel}`);
        newColumn.index = 1;
        console.log(`newColumn ending widthLabel = ${newColumn.widthLabel}`);
        newColumn = new FlexcardElementClass().cloneElement(newColumn);
        newColumn.index = 2;
        console.log(`testColumn widthLabel #3 = ${newColumn.widthLabel}`);
        
        // console.log(JSON.stringify(newColumn.getThis()));
    }

    /* ACTION FUNCTIONS */
    deleteElement(id) {
        console.log('in deleteElement, deleting id ' + id);
        let listResponse = this.getElementList(id);
        listResponse.list.splice(listResponse.indexInList, 1);
        this.clearSelection();

        // this.selectedComponentType = COMPONENT_TYPES.FLEXCARD;
        this.reorderElements();
    }

    clearSelection() {
        this.selectedElementId = null;
        this.selectedComponentType = COMPONENT_TYPES.FLEXCARD;
    }

    resizeSectionColumns(section, indexToPreserve) {
        let columns = section.sectionColumns;
        // console.log(`in resizeSectionColumns, indexToPreserve = ${indexToPreserve}`);
        let widthToPreserve = 0;
        if (indexToPreserve == 0 || indexToPreserve > 0) {
            widthToPreserve = columns[indexToPreserve].width;
            // console.log(`widthToPreserve = ${widthToPreserve}`);
            columns[indexToPreserve].columnClass = this.getColumnClass(widthToPreserve);
            // console.log(`columns[indexToPreserve].columnClass = ${columns[indexToPreserve].columnClass}`);
            console.log(`going to keep col# ${indexToPreserve} at ${widthToPreserve}`);
        }
        let remainingWidth = MAX_NUM_COLUMNS - widthToPreserve;
        console.log(`that means there are ${remainingWidth} columns left to be assigned`);
        let columnIndex = 0;
        columns.forEach((column, index) => {
            if (index != indexToPreserve) {
                column.width = 0;
            }
        });

        while (remainingWidth > 0) {
            if (columnIndex != indexToPreserve) {
                columns[columnIndex].width++;
                columns[columnIndex].columnClass = this.getColumnClass(columns[columnIndex].width);
                console.log(`adding 1 to col# ${columnIndex}, so it's now ${columns[columnIndex].width}`);
                remainingWidth--;
            }
            columnIndex++;
            console.log(`now remainingWidth is ${remainingWidth}`);
            if (columnIndex >= columns.length) {
                columnIndex = 0;
            }
        }
        section.sectionColumns = [...columns];
        this.reorderElements();
    }

    /* EVENT HANDLERS */
    // If the container is clicked, deselect everything (if an element within the container is clicked, it should stopPropagation to prevent this parent handler from firing)
    handlePreviewContainerClick(event) {
        this.clearSelection();
        // this.selectedComponentType = COMPONENT_TYPES.FLEXCARD;
    }

    handlePreviewBuilderToggleChange(event) {
        // console.log(`in handlePreviewBuilderToggleChange, ${event.target.value}`);
        this.isBuilderMode = event.target.value != 'preview';
        for (let toggleButton of this.template.querySelectorAll('.previewBuilderToggleButton')) {
            toggleButton.variant = (toggleButton.value == event.target.value) ? 'brand' : '';
        }
        // console.log(this.isBuilderMode);
    }

    /* FLEXCARD PROPERTY EVENT HANDLERS */
    handleFlexcardPropertyChange(event) {
        console.log('in handleFlexcardPropertyChange');
        if (event.detail && event.currentTarget.name) {            
            let newValue = event.currentTarget.type === 'checkbox' ? event.currentTarget.checked : event.detail.value;
            this.flexcardProperties[event.currentTarget.name] = newValue;
        }
    }

    handleShowHeaderActionsChange(event) {
        // if (event.detail.checked && !this.flexcardProperties.headerActionMenu) {
        //     this.flexcardProperties.headerActionMenu = this.newFlexcardElement(FLEXCARD_ELEMENT_TYPES.MENU);
        // }
        this.flexcardProperties.showHeaderActions = event.detail.checked;
    }

    handleShowHeaderChange(event) {
        this.hideHeader = !event.detail.checked;
    }

    handleShowFooterChange(event) {
        this.showFooter = event.detail.checked;
    }

    handlePreviewRecordChange(event) {
        this.previewRecordId = event.detail.value;
    }

    // handleFlexcardSizeChange(event) {
    //     this.flexcardSize = event.detail.value;
    // }

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
        // console.log(JSON.stringify(event.detail));
        let fields = event.detail.value;
        // this.headerFieldName = fields.length ? fields[0].name : null;
        this.flexcardProperties.headerFieldName = fields.length ? fields[0].name : null;
    }

    handleHeaderIconChange(event) {
        this.flexcardProperties.headerIcon = event.detail;
    }

    handleManageHeaderActionsClick() {
        this.selectedComponentType = COMPONENT_TYPES.ACTIONS;
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

    handleActionIconChange(event) {
        this.selectedAction.iconName = event.detail;
        this.reorderElements();
    }

    /* ACTION MENU EVENT HANDLERS */
    handleElementFormatterChange(event) {
        // This is super hacky, but for some reason I can't figure out, this event handler is getting called twice. The event payload should be an object; if it's a string, something's wrong.
        if (typeof event.detail.value === 'string') {
            return;
        }
        // console.log(`in handleElementFormatterChange from ${event.target.name}: ${JSON.stringify(event.detail.value)}`);
        const styleProperties = ['--slds-c-input-text-color', 'background-color', '--lwc-colorBackgroundInput'];
        const prefixes = ['slds-p-'];
        let classPropertyValues = [];
        let stylePropertyValues = [];
        for (let [propertyName, value] of Object.entries(event.detail.value)) {
            // console.log(propertyName, value);
            // if (propertyName.startsWith('slds-p-')) {
            let matchingPrefix = prefixes.find(prefix => propertyName.startsWith(prefix));
            if (prefixes.find(prefix => propertyName.startsWith(prefix))) {
                classPropertyValues.push(`${propertyName}_${value}`);
            } else if (styleProperties.includes(propertyName)) {
                stylePropertyValues.push(`${propertyName}=${value}`);
            } else {
                classPropertyValues.push(value);
            }
        }
        // console.log(JSON.stringify(classPropertyValues));
        this.selectedElement.formatterProperties = event.detail.value;
        // this.selectedElement.formatterClassString = Object.values(event.detail.value).join(' ');
        if (this.selectedElement.isfield) {
            this.selectedElement.fieldClass = classPropertyValues.join(' ');
        } else {
            this.selectedElement.formatterClassString = classPropertyValues.join(' ');
        }
        this.selectedElement.formatterStyleString = stylePropertyValues.join('; ');
        console.log(`formatterClassString = ${this.selectedElement.formatterClassString}`);
        console.log(`formatterStyleString = ${this.selectedElement.formatterStyleString}`);
        this.reorderElements();
    }

    handleFlowSelect(event) {
        console.log('in handleFlowSelect: ', JSON.stringify(event.detail));
        // let action = this.getElementFromId(event.target.dataset.id);
        console.log(`index = ${event.target.dataset.index}`);
        console.log(`actions = ${JSON.stringify(this.selectedActionMenu.actions)}`);
        let action = this.selectedActionMenu.actions[event.target.dataset.index];
        console.log(`action = ${JSON.stringify(action)}`);
        action.flowName = event.detail.value;
        action.label = event.detail.label;
        this.reorderElements();
    }

    handleMenuActionClick(event) {
        console.log(`in handleMenuActionClick, menu id=${event.currentTarget.dataset.menuId}, action id=${event.currentTarget.dataset.id}, action name = ${event.target.dataset.actionName}`);
        let buttonAction = event.target.dataset.actionName;
        if (buttonAction == 'edit') {
            this.selectedActionId = event.currentTarget.dataset.id;
        }
        if (buttonAction == 'delete') {
            console.log(`in delete, index = ${event.currentTarget.dataset.index}`);
            // let menu = this.getElementFromId(event.currentTarget.dataset.menuId);
            this.selectedActionMenu.actions.splice(event.currentTarget.dataset.index, 1);
            if (this.selectedActionMenu.actions.length == 0) {
                this.selectedActionMenu.actions.push(this.newFlexcardElement(FLEXCARD_ELEMENT_TYPES.ACTION, menu.id));
            }
        }
        this.reorderElements();
    }

    handleMenuDisplayTypeChange(event) {
        console.log(`in handleMenuDisplayTypeChange, setting menuDisplayType to ${event.detail.value}`);
        this.selectedActionMenu.menuDisplayType = event.detail.value;
        this.reorderElements();
        console.log(`finished handleMenuDisplayTypeChange`);
    }

    handleMenuActionDragStart(event) {
        this.menuActionDragIndex = event.currentTarget.dataset.index;
    }

    handleMenuActionDrop(event) {
        console.log(`in handleMenuActionDrop`);
        let dropPos = event.detail.value;
        console.log(`dropPos = ${dropPos}`);
        console.log(`menuActionDragIndex = ${this.menuActionDragIndex}`);
        if (this.menuActionDragIndex < dropPos) {
            dropPos--;
        }
        console.log(`menuId = ${event.currentTarget.dataset.menuId}`);
        // let menu = this.getElementFromId(event.currentTarget.dataset.menuId);
        // console.log(`menu = ${JSON.stringify(menu)}`);
        let draggedAction = this.selectedActionMenu.actions.splice(this.menuActionDragIndex, 1);
        if (draggedAction.length) {
            this.selectedActionMenu.actions.splice(dropPos, 0, draggedAction[0]);
        }
        this.menuActionDragIndex = null;
        this.reorderElements();
    }

    handleAddActionClick() {
        this.selectedActionMenu.actions.push(this.newFlexcardElement(FLEXCARD_ELEMENT_TYPES.ACTION, this.selectedActionMenu.id));
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
        if (!this.dragDetails) {
            console.log('Error: no drag information found');
        }
        // console.log(`dragDetails = ${JSON.stringify(this.dragDetails)}`);
        let dropPos = this.sectionColumnDrop ? this.sectionColumnDrop.dropIndex : event.detail.value;
        // if (this.sectionColumnDrop) {
        // console.log(`sectionColumnDrop = ${JSON.stringify(this.sectionColumnDrop)}`);
        // dropPos = this.sectionColumnDrop.dropIndex;
        // }
        console.log(`dropPos = ${dropPos}`);
        let draggedElement;
        // If dragType = new, add a new element to the canvas of the selected component type
        if (this.dragDetails.dragType === DRAG_TYPES.NEW) {
            let componentTypeName = this.dragDetails.componentType;
            // let componentType = this.flexcardElementTypes.find(type => type.value == componentTypeName);
            let componentType = this.flexcardElementTypes.findFromValue(componentTypeName);
            draggedElement = this.newFlexcardElement(componentType);
            if (this.sectionColumnDrop) {
                let section = this.flexcardElements.find(el => el.id == this.sectionColumnDrop.sectionId);
                let column = section.sectionColumns[this.sectionColumnDrop.columnIndex];
                // console.log(`column = ${JSON.stringify(column)}`);
                // column.flexcardElements.splice(dropPos, 0, draggedElement);
                // console.log(`dropPos = ${dropPos}`);
                // console.log(`draggedElement.id = ${draggedElement.id}`);
                // column.addElement(draggedElement, dropPos);
                draggedElement.sectionId = section.id;
                draggedElement.columnIndex = column.index;
                column.flexcardElements.splice(dropPos, 0, draggedElement);
            } else {
                this.flexcardElements.splice(dropPos, 0, draggedElement);
            }
        }
        // If dragType = move, rearrange the existing elements on the canvas to reflect the new order        
        else if (this.dragDetails.dragType === DRAG_TYPES.MOVE) {
            let dragOrigin = this.getElementList(this.dragDetails.elementId);
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
            console.log(`dropInOriginList = ${dropInOriginList}`);

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
            // console.log(`draggedElement = ${JSON.stringify(draggedElement)}`);            

            // draggedElement = this.flexcardElements.splice(this.dragDetails.elementIndex, 1);
            if (draggedElement.length) {
                draggedElement = draggedElement[0];
                if (this.sectionColumnDrop) {
                    let section = this.flexcardElements.find(el => el.id == this.sectionColumnDrop.sectionId);
                    let column = section.sectionColumns[this.sectionColumnDrop.columnIndex];
                    // column.addElement(draggedElement, dropPos);
                    draggedElement.sectionId = section.id;
                    draggedElement.columnIndex = column.index;
                    column.flexcardElements.splice(dropPos, 0, draggedElement);
                } else {
                    // Since the dragged element is being dropped in the main flexcard body and not a section column, clear any section/column identity
                    draggedElement.sectionId = undefined;
                    draggedElement.columnIndex = undefined;
                    this.flexcardElements.splice(dropPos, 0, draggedElement)
                }
            }
        }
        // this.selectedElementIndex = dropPos;
        // console.log(`setting selectedElementId to ${draggedElement.id}`);
        console.log('about to conclude handleDropzoneDrop');
        this.sectionColumnDrop = null;
        this.hoveredElementId = null;
        this.selectedElementId = draggedElement.id;
        this.reorderElements();
        // console.log(JSON.stringify(this.flexcardElements));
        console.log('finished handleDropzoneDrop');
    }

    /* COMPONENT MENU EVENT HANDLERS */
    handleComponentTypeDragStart(event) {
        let componentType = event.target.dataset.value;
        // console.log(`dragging ${componentType}`);
        event.dataTransfer.setData("text/plain", componentType);
        // console.log(`dataTransfer.getData = ${event.dataTransfer.getData("text/plain")}`);
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
        });

        if (result) {
            this.deleteElement(event.detail.value);
        }
        // this.deleteElement(event.currentTarget.dataset.index);
        event.stopPropagation();
    }

    /* SECTION COLUMN EVENT HANDLERS */
    handleSectionColumnDrop(event) {
        console.log('in handleSectionColumnDrop');
        console.log(JSON.stringify(event.detail));
        this.sectionColumnDrop = event.detail;
    }

    handleAddColumnClick() {
        let section = this.selectedElement;
        let index = section.sectionColumns.length;
        // section.sectionColumns.push(new SectionColumn(this.generateElementId(), section.id, section.sectionColumns.length));
        section.sectionColumns.push(this.newSectionColumn(1, index, section.id));
        this.resizeSectionColumns(section);
    }

    handleColumnWidthChange(event) {
        let columnIndex = event.target.dataset.index;
        this.selectedElement.sectionColumns[columnIndex].width = +event.detail.value;
        this.resizeSectionColumns(this.selectedElement, columnIndex);
    }

    async handleColumnDeleteClick(event) {
        let columnIndex = event.currentTarget.dataset.index;
        console.log(`about to delete columnIndex ${columnIndex}`);
        const result = await LightningConfirm.open({
            message: `Are you sure you want to delete this column? All the column's child components will be deleted. You can't undo this action.`,
            theme: 'error',
            label: 'Delete component?',
        });
        if (result) {
            this.selectedElement.sectionColumns.splice(columnIndex, 1);        
            if (this.selectedElement.sectionColumns.length == 0) {
                // If there are no remaining section columns, add a new one
                this.selectedElement.sectionColumns.push(this.newSectionColumn(MAX_NUM_COLUMNS, index, section.id));
            } else {
                // Otherwise, resize the remaining columns
                this.resizeSectionColumns(this.selectedElement);
            }
        }
    }




    handleElementHoverChange(event) {
        this.hoveredElementId = event.detail.value;
    }

    handleElementSelect(event) {
        // console.log(`in handleElementSelect, ${event.detail.value}`);
        this.selectedElementId = event.detail.value;
        event.stopPropagation();
    }

    handleElementClick(event) {
        event.stopPropagation();
    }

    handleElementDrag(event) {
        console.log(`in handleElementDrag, detail=${JSON.stringify(event.detail)}`);
        if (event.detail.value) {
            // this.draggedElementId = event.detail.value;
            this.dragDetails = {
                dragType: DRAG_TYPES.MOVE,
                elementId: event.detail.value,
                sectionId: event.detail.sectionId
            }
        } else {
            this.dragDetails = null;
        }
    }

    /* UTILITY FUNCTIONS */
    newFlexcardElement(elementType, menuId) {
        console.log('in newFlexcardElement');
        let newElement = {
            elementType,
            [`is${elementType.value}`]: true,
            id: this.generateElementId(),
            formatterProperties: {},
            formatterClassString: null,
        }
        if (newElement.isfield) {
            newElement = {
                ...newElement,
                fieldLabelStyle: this.fieldLabels.default.value,
                fieldName: null
            }
        }
        if (newElement.issection) {
            newElement.sectionColumns = [
                this.newSectionColumn(MAX_NUM_COLUMNS, 0, newElement.id),
            ];
        }
        if (newElement.isaction) {
            newElement = {
                ...newElement,
                menuId,
                label: DEFAULT_ACTION_LABEL,
                variant: this.buttonVariants.default.value,
                // ...this.newAction(),
            };
        }
        if (newElement.ismenu) {
            // const menuTypes = this.menuDisplayTypes;
            if (menuId) {
                newElement.id = menuId;
            }
            newElement.actions = [this.newFlexcardElement(FLEXCARD_ELEMENT_TYPES.ACTION, newElement.id)];
            newElement.menuDisplayType = this.menuDisplayTypes.default.value;
        }
        console.log(`finishing newFlexcardElement: ${JSON.stringify(newElement)}`);
        return newElement;
    }

    newSectionColumn(width, index, sectionId) {
        return {
            width,
            sectionId,
            id: this.generateElementId(),
            index,
            // index: this.flexcardElements.find(el => el.id == sectionId).sectionColumns.length,
            flexcardElements: [],
            columnClass: this.getColumnClass(width),
            // get columnClass() {
            //     return `slds-col slds-size_${this.width}-of-${MAX_NUM_COLUMNS} sectionColumn`;
            // },
            get widthLabel() {
                return `Column ${+this.index + 1} Width`;
            },
            /*
            addElement(element, indexInColumn = this.flexcardElements.length) {
                console.log(`in addElement`);
                element = {
                    ...element,
                    sectionId,
                    columnIndex: this.index
                }
                this.flexcardElements.splice(indexInColumn, 0, element);
                console.log(`finished addElement`);
            }
            */
        }
    }

    // newAction(menuId) {
    //     return {
    //         menuId,
    //         label: DEFAULT_ACTION_LABEL,
    //         variant: this.buttonVariants.default.value,
    //         id: this.generateElementId(),
    //     }
    // }

    reorderElements() {
        this.flexcardElements = this.flexcardElements;
        this.flexcardProperties = this.flexcardProperties;
        // this.flexcardElements = this.flexcardElements.map(el => {
        //     return Object.defineProperties(el, Object.getOwnPropertyDescriptors(el));
        // });
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

    getColumnClass(width) {
        return `slds-col slds-size_${width}-of-${MAX_NUM_COLUMNS} sectionColumn`;
    }

    generateElementId() {
        let newId = Math.random().toString().substring(2); // Generate a random number then remove the '0.'
        let elementIds = this.flattenedElements.map(element => element.id);
        while (elementIds.includes(newId)) {   // On the very, very, very slim chance that this random number has already been generated, generate a new one
            newId = Math.random().toString().substring(2);
        }
        // this.elementIds = [...this.elementIds, newId];
        return newId;
    }

    getElementFromId(id) {
        return this.flattenedElements.find(el => el.id == id);
    }

    getElementList(id) {
        console.log(`in getElementList for id ${id}`);
        let el = this.getElementFromId(id);
        console.log(`el = ${JSON.stringify(el)}`);
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
    // get cardBody() {
    //     return this.template.querySelector('.cardBody');
    // }

    // get dropzoneIndicator() {
    //     return this.template.querySelector('.dropzoneIndicator');
    // }

    // handleFlexcardElementClick(event) {
    //     console.log('in handleFlexcardElementClick, '+ event.currentTarget.dataset.index);
    //     // this.selectedElementIndex = event.currentTarget.dataset.index;
    //     this.selectedElementId = event.currentTarget.dataset.id;
    //     // this.clearSelection();
    //     event.stopPropagation(); // Prevent handlePreviewContainerClick from firing
    // }

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

    /*
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
    */
}