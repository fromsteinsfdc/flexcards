import { LightningElement, api } from 'lwc';

const ACTIVE = 'active';
const ORIENTATIONS = { 
    VERTICAL: 'vertical', 
    HORIZONTAL: 'horizontal'
};

export default class FlexcardDropzone extends LightningElement {

    @api elementSelector;   // CSS selector used to define what constitutes the draggable children elements of the dropzone
    @api publicClass;   // Public class string to allow parent component to set SLDS styling
    @api orientation = ORIENTATIONS.VERTICAL;
    index;  // Tracks the index position of where the drop occurs
    inNestedDropzone = false;   // Reserved for future use

    // Combines `dropzone` class with parent-supplied public class, if applicable
    get dropzoneClass() {
        let classString = 'dropzone';
        if (this.publicClass) {
            classString = `${this.publicClass} ${classString}`;
        }
        return classString;
    }

    // Returns dropzone element
    get dropzone() {
        return this.template.querySelector('.dropzone');
    }

    // Returns dropzone indicator (horizontal line) element
    get dropzoneIndicator() {
        return this.template.querySelector('.dropzoneIndicator');
    }

    // Returns draggable elements based on the element selector if provided, OR just grab the top-level children passed into the slot
    get draggableElements() {
        if (this.elementSelector) {
            return this.querySelectorAll(this.elementSelector);
        } else {
            return this.template.querySelector('slot').assignedElements();
        }
    }

    get orientationTerms() {
        if (this.orientation == ORIENTATIONS.VERTICAL) {
            return {
                offsetStart: 'offsetTop',
                offsetSize: 'offsetHeight',
                start: 'top',
                end: 'bottom',
                clientPos: 'clientY',
            }
        } else {
            return {
                offsetStart: 'offsetLeft',
                offsetSize: 'offsetWidth',
                start: 'left',
                end: 'right',
                clientPos: 'clientX',
            }
        }
    }

    // Returns a simplified rectange object for each draggable element
    get elementRects() {
        return [...this.draggableElements].map(element => {
            const terms = this.orientationTerms;
            return {
                start: element[terms.offsetStart],
                middle: element[terms.offsetStart] + element[terms.offsetSize] / 2,
                end: element[terms.offsetStart] + element[terms.offsetSize],
            }
        })
    }

    // Fires every few ms as an element is dragged over the dropzone.
    // Uses the mouse position to determine where to show the indicator line (if applicable).
    // Sets the `index` variable to the value of the element index where the drop takes place.
    // If there are no elements, this value is always 0.
    // If there are elements, loop through them and use the mouse position to determine the current index.
    handleDropzoneDragOver(event) {
        event.stopPropagation();
        event.preventDefault();

        const terms = this.orientationTerms;
        

        this.dropzone.classList.add(ACTIVE); // Provide visual feedback to user by making dropzone area "active"
        let index = 0;  // Begin by assuming that the drop index is 0 (which will be true if there are no elements)

        // If there are no draggable elements, no indicator is shown and we can simply use the default index of 0.
        if (this.draggableElements.length > 0) {
            const dropzoneRect = this.dropzone.getBoundingClientRect(); // Get the rectangle of the dropzone area
            // let mouseY = event.clientY - dropzoneRect.top; // Find the vertical (y) position of the cursor relative to the drop of the dropzone
            let mousePos = event[terms.clientPos] - dropzoneRect[terms.start];
            // let indicatorY;    // Used to store the vertical position of the indicator line
            let indicatorPos;
            let indicatorOffset = 2;    // Used to slightly offset the indicator line above or below the dragover element

            // Loop through the draggable elements until we find the first one where the cursor is at or above the halfway point
            for (let elRect of this.elementRects) {
                // if (mouseY <= elRect.middle) {
                if (mousePos <= elRect.middle) {
                    // console.log(`terms.start = ${terms.start}, ${elRect.start}, ${JSON.stringify(elRect)}`);
                    // indicatorY = elRect.top;    // Set the indicator line to the top of the element's rectangle
                    indicatorPos = elRect.start;
                    // console.log(`indicatorPos = ${indicatorPos}`);
                    indicatorOffset *= -1;  // Reverse the offset so the line is above the element's top (rather than below its bottom)
                    break;
                }
                index++;    // For each element that doesn't meet our criteria, increment the index by 1
            };

            // If we have looped through all the elements and it is not in/above the top half of any of them, then the indicator goes after the last element
            // if (indicatorY === undefined) {
            if (indicatorPos == undefined) {
                // indicatorY = this.elementRects[this.elementRects.length - 1].bottom;
                indicatorPos = this.elementRects[this.elementRects.length - 1].end;
                indicatorOffset = 0;    // Because we're setting this relative to the bottom of the element rather than the top, we don't need an offset
            }

            // Position the indicator above or below the dragover element, and make it visible (`active`)
            // this.dropzoneIndicator.style.top = `${indicatorY + indicatorOffset}px`;
            this.dropzoneIndicator.style[terms.start] = `${indicatorPos + indicatorOffset}px`;
            if (this.orientation == ORIENTATIONS.HORIZONTAL) {
                let highlightedRect = this.elementRects[Math.min(index, this.elementRects.length - 1)];
                this.dropzoneIndicator.style.top = highlightedRect.start;
                this.dropzoneIndicator.style.top = highlightedRect.end;
            } else {
                this.dropzoneIndicator.style.width = '100%';
            }
            this.dropzoneIndicator.classList.add(ACTIVE);
        }
        this.index = index; // Set the global index value
    }

    // Upon drop, dispatch the appropriate element index as determined by `handleDropzoneDragOver`.
    // Use event handler for `ondropzonedrop` in parent element and retrieve value with `event.detail.value`.
    handleDropzoneDrop(event) {
        event.preventDefault();
        const detail = {
            value: this.index
        }
        this.dispatchEvent(new CustomEvent('dropzonedrop', { detail }));
        this.clearDropzone();
    }

    // Clears dropzone when dragged element leaves dropzone area
    handleDropzoneDragLeave() {
        this.clearDropzone();
    }

    // "Clear" the dropzone by removing the `active` class from the dropzone and indcator
    clearDropzone() {
        this.dropzone.classList.remove(ACTIVE);
        this.dropzoneIndicator.classList.remove(ACTIVE);
        this.dispatchEvent(new CustomEvent('dropzoneclear'));
    }
}