/*!
   API to export slides in a multi-page pptx format

   Requires to have PptxGenJS and html2canvas included in the project

  <!-- Include the PptxGenJS script -->
  <script src="https://jsdelivr.net"></script>

  Usage:

  const exporter = new PptxExporter("slides.pptx");
  for all pages
    [set up the page, make sure DOM is resolved]
    await exporter.addSlideFromCurrentPage();
  await exporter.finalize();
*/


class PptxExporter {
    static get SLIDE_WIDTH_INCHES() { return 10; }
    static get SLIDE_HEIGHT_INCHES() { return 5.625; }
    static get MARGIN_INCHES() { return 0.5; }
    static get FLUSH_LEFT_PADDING_INCHES() { return 0.5; }
    static get POINTS_PER_INCH() { return 72; }
    static get TEXT_BOX_PADDING_PX() { return 10; }

    /*!
     * Step 1: Initialize the Presentation
     * @param {string} fileName - The name of the file to save (e.g., "Nihongo_Lessons.pptx")
     */
    constructor(fileName, ratio) {
        this.fileName = fileName || "Presentation.pptx";
        this.ratio = ratio || '16/9';

        // Initialize PptxGenJS instance
        this.pptx = new PptxGenJS();
        if (this.ratio === '4/3') {
            this.pptx.layout = 'LAYOUT_4x3'; // Slide dimensions: 10 x 7.5 inches
            this.slideWidth = 10;
            this.slideHeight = 7.5;
        } else {
            this.pptx.layout = 'LAYOUT_16x9'; // Slide dimensions: 10 x 5.625 inches
            this.slideWidth = 10;
            this.slideHeight = 5.625;
        }

        // The scaling parameters will be computed dynamically on the first slide and reused
        this._scaleInitialized = false;
        this._scale = 1;

        // Bounding rect parameters computed per slide
        this._containerLeft = 0;
        this._containerTop = 0;
        this._containerWidth = 0;
        this._containerHeight = 0;
        this._offsetY = 0;

        console.log(`PPTX initialized: Ready to capture slides for ${this.fileName}`);
    }

    /*!
     * Private structural utility for hex parsing
     * @private
     */
    _rgbToHex(rgbString) {
        if (!rgbString || !rgbString.startsWith('rgb')) return '000000';
        const match = rgbString.match(/\d+/g);
        if (!match) return '000000';
        return match.slice(0, 3).map(x => parseInt(x).toString(16).padStart(2, '0')).join('').toUpperCase();
    }

    /*!
     * Initialize coordinate scaling based on the container of cards
     * @private
     */
    _initCoordinateScaling(containerRect, sampleCard) {
        this._containerLeft = containerRect.left;
        this._containerTop = containerRect.top;
        this._containerWidth = containerRect.width;
        this._containerHeight = containerRect.height;

        if (!this._scaleInitialized && sampleCard) {
            // Get card dimensions from DOM
            const cardRect = sampleCard.getBoundingClientRect();
            const cardWidthPx = cardRect.width;

            // Spacing from parent td (padding left + padding right)
            let spacingPx = 10; // Default spacing fallback
            const tdElement = sampleCard.parentElement;
            if (tdElement) {
                const tdComputed = window.getComputedStyle(tdElement);
                const tdPaddingLeft = parseFloat(tdComputed.paddingLeft) || 0;
                const tdPaddingRight = parseFloat(tdComputed.paddingRight) || 0;
                spacingPx = tdPaddingLeft + tdPaddingRight;
            }

            const usableWidth = this.slideWidth - 2 * PptxExporter.FLUSH_LEFT_PADDING_INCHES;

            // 6 cards + 5 gaps (spacings) between them
            const totalWidth6CardsPx = 6 * cardWidthPx + 5 * spacingPx;

            this._scale = usableWidth / totalWidth6CardsPx;
            this._scaleInitialized = true;
            console.log(`PPTX: Computed fixed web->pptx scale = ${this._scale} (card width: ${cardWidthPx}px, spacing: ${spacingPx}px)`);
        }

        // Center card grid vertically
        const gridHeightPx = this._containerHeight;
        const gridHeightInches = gridHeightPx * this._scale;
        
        // Center vertically on the slide
        const offsetY = (this.slideHeight - gridHeightInches) / 2;
        this._offsetY = Math.max(offsetY, PptxExporter.MARGIN_INCHES);
    }

    /*!
     * Helper methods for coordinate and size transformations
     * @private
     */
    _toSlideX(domX) {
        const relX = domX - this._containerLeft;
        return PptxExporter.FLUSH_LEFT_PADDING_INCHES + relX * this._scale;
    }

    _toSlideY(domY) {
        const relY = domY - this._containerTop;
        return this._offsetY + relY * this._scale;
    }

    _toSlideDim(domDim) {
        return domDim * this._scale;
    }

    _toSlideFontSize(domFontSizePx) {
        return domFontSizePx * this._scale * PptxExporter.POINTS_PER_INCH;
    }

    /*!
     * Parses the text node content and child spans of a DOM element to generate PPTX text runs
     * @private
     */
    _parseTextRuns(el) {
        const runs = [];
        const childNodes = el.childNodes;

        const parentStyle = window.getComputedStyle(el);
        const attrColor = el.getAttribute('data-color');
        const attrSize = el.getAttribute('data-font-size');

        const defaultColor = attrColor || this._rgbToHex(parentStyle.color);
        const defaultFontSize = attrSize ? parseFloat(attrSize) : this._toSlideFontSize(parseFloat(parentStyle.fontSize));
        const defaultFontFace = parentStyle.fontFamily.split(',')[0].replace(/['"]/g, '').trim() || 'Arial';

        if (childNodes.length === 0) {
            const text = el.innerText.trim();
            if (text) {
                runs.push({
                    text: text,
                    options: {
                        color: defaultColor,
                        fontSize: defaultFontSize,
                        fontFace: defaultFontFace
                    }
                });
            }
            return runs;
        }

        for (let i = 0; i < childNodes.length; i++) {
            const node = childNodes[i];

            if (node.nodeType === 3) { // Text node
                const text = node.nodeValue;
                if (text) {
                    runs.push({
                        text: text,
                        options: {
                            color: defaultColor,
                            fontSize: defaultFontSize,
                            fontFace: defaultFontFace
                        }
                    });
                }
            } else if (node.nodeType === 1) { // Element node (e.g. span)
                const text = node.textContent;
                if (text) {
                    const childStyle = window.getComputedStyle(node);
                    const childColor = attrColor || this._rgbToHex(childStyle.color);
                    const childFontSize = attrSize ? parseFloat(attrSize) * (parseFloat(childStyle.fontSize) / parseFloat(parentStyle.fontSize)) : this._toSlideFontSize(parseFloat(childStyle.fontSize));
                    const childFontFace = childStyle.fontFamily.split(',')[0].replace(/['"]/g, '').trim() || 'Arial';

                    runs.push({
                        text: text,
                        options: {
                            color: childColor,
                            fontSize: childFontSize,
                            fontFace: childFontFace
                        }
                    });
                }
            }
        }

        // Clean up leading/trailing whitespaces across the runs
        if (runs.length > 0) {
            runs[0].text = runs[0].text.replace(/^\s+/, '');
            runs[runs.length - 1].text = runs[runs.length - 1].text.replace(/\s+$/, '');
            return runs.filter(run => run.text.length > 0);
        }

        return runs;
    }

    /*!
     * Step 2: Capture the current visible DOM layout and append it as a new Slide
     * Call this inside your loop after navigating to a page and letting it render.
     */
    async addSlideFromCurrentPage() {
        // Create a fresh slide in the deck
        let slide = this.pptx.addSlide();

        // Query all targeted card nodes visible on the current page view
        const cards = document.querySelectorAll('.slide-card');

        if (cards.length === 0) {
            console.warn("No elements matching '.slide-card' were found on this page layout.");
            return;
        }

        // Compute the collective bounding rect of all cards
        let minLeft = Infinity;
        let minTop = Infinity;
        let maxRight = -Infinity;
        let maxBottom = -Infinity;

        for (let card of cards) {
            const rect = card.getBoundingClientRect();
            if (rect.left < minLeft) minLeft = rect.left;
            if (rect.top < minTop) minTop = rect.top;
            if (rect.right > maxRight) maxRight = rect.right;
            if (rect.bottom > maxBottom) maxBottom = rect.bottom;
        }

        const containerRect = {
            left: minLeft,
            top: minTop,
            width: maxRight - minLeft,
            height: maxBottom - minTop
        };

        // Initialize coordinate scaling
        this._initCoordinateScaling(containerRect, cards[0]);

        for (let card of cards) {
            const rect = card.getBoundingClientRect();

            // Map element screen bounding fragments to PowerPoint absolute inches
            const cardLeft = this._toSlideX(rect.left);
            const cardTop = this._toSlideY(rect.top);
            const cardWidth = this._toSlideDim(rect.width);
            const cardHeight = this._toSlideDim(rect.height);

            // --- Pass A: Snapshot background structures (Canvas layout sandbox) ---
            let bgImgData = "";

           /*
              There is a known and long-standing limitation of html2canvas.
              The library does not natively support CSS object-fit: contain (or cover)
              when rendering <img> tags. Instead, it falls back to stretching the source
              image data to match the explicit bounding box coordinates.
              We need to manually fix the width and height
            */

            // Find the specific rectangular images nested inside the
            // card. Assume only one image for now. Can be changed if
            // multiple images are added in the future
            const img = card.querySelector('img')
            if (img) {
                const intrinsicWidth = img.naturalWidth;
                const intrinsicHeight = img.naturalHeight;
                const maxWSize = img.width;
                const maxHSize = img.height;

                if (intrinsicWidth > 0 && intrinsicHeight > 0) {
                    // Calculate the scaling ratio to fit 130x130 boundaries
                    const ratio = Math.min(maxWSize / intrinsicWidth, maxHSize / intrinsicHeight);

                    // Override the stretched dimensions with proportional ones
                    img.style.width = (intrinsicWidth * ratio) + 'px';
                    img.style.height = (intrinsicHeight * ratio) + 'px';

                    // Disable object-fit so html2canvas doesn't use its broken fallback
                    img.style.objectFit = 'initial';
                }
            }

            try {
                bgImgData = await html2canvas(card, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: null,
                    logging: false,
                    onclone: (clonedDoc) => {
                        // Find and mask labeled text variables inside the isolated clone copy
                        const clonedTexts = clonedDoc.querySelectorAll('.as-text');
                        clonedTexts.forEach(el => { el.style.opacity = '0'; });
                    }
                }).then(canvas => canvas.toDataURL("image/png"));
            } catch (e) {
                console.error("Canvas engine failed rendering card background layer asset:", e);
            }

            // --- Pass B: Construct absolute structural group array ---
            // Unfortunately the API does not support group yet. Add directly to the slide in absolute coordinates

            // Anchor style frame backing layout asset
            if (bgImgData) {
                slide.addImage({
                    type: 'image',
                    data: bgImgData,
                    x: cardLeft, y: cardTop, w: cardWidth, h: cardHeight
                });
            }

            // Map foreground text boxes
            const textElements = card.querySelectorAll('.as-text');

            textElements.forEach(el => {
                const pRect = el.getBoundingClientRect();
                const computedStyle = window.getComputedStyle(el);

                const paddingPx = PptxExporter.TEXT_BOX_PADDING_PX;
                const textLeft = this._toSlideX(pRect.left - paddingPx);
                const textTop = this._toSlideY(pRect.top);
                const textWidth = this._toSlideDim(pRect.width + 2 * paddingPx);
                const textHeight = this._toSlideDim(pRect.height);

                const textRuns = this._parseTextRuns(el);

                if (textRuns.length > 0) {
                    slide.addText(textRuns, {
                        type: 'text',

                        // Absolute Position
                        x: textLeft,
                        y: textTop,
                        w: textWidth,
                        h: textHeight,

                        // Style parameters
                        align: computedStyle.textAlign === 'start' ? 'left' : computedStyle.textAlign,
                        margin: 0,
                        valign: 'middle'
                    });
                }
            });
        }

        console.log(`Slide appended successfully. Total slides: ${this.pptx.slides.length}`);
    }

    /*!
     * Step 3: Compiles and triggers the browser download action
     */
    async finalize() {
        if (!this.pptx) {
            throw new Error("No active presentation instance to package.");
        }

        console.log(`Compiling files and generating presentation download package...`);
        await this.pptx.writeFile({ fileName: this.fileName });
        console.log("Download triggered successfully.");
    }

/*
    // Dummy mapping placeholder showing how you might toggle page state inside your SPA code
    async navigateToSpaPage(index) {
        // Example layout hook:
        // myAppRouter.goToPage(index);
        return Promise.resolve();
    }
*/
};

class PptxManager {

    /*!
     */
    constructor(fileName = "Nihongo_Vocabulary.pptx", ratio = '16/9') {
        this._fileName = fileName;
        this._ratio = ratio;
    }

    async runMultiPageExport(options, goToSlideCB, progressCB) {

        // 1. Initialize the exporter wrapper instance
        const exporter = new PptxExporter(this._fileName, this._ratio);
        const totalPages = options.length;

        for (var i=0 ; i<totalPages ; i++) {
            var option = options[i];
            console.log(`Processing page ${option}, ${i}/${totalPages}...`);

            if (progressCB) {
                progressCB('preparing', i + 1, totalPages);
            }

            // 2. Trigger your web app's native layout updates/navigation
            // e.g., update current state, hit the next pagination button element, etc.
            goToSlideCB(option.value)
            //await navigateToSpaPage(pageIndex);

            // 3. MANDATORY CRITICAL PAUSE: Give the DOM runtime engine a moment
            // to paint layouts, resolve components, and display updated texts
            await new Promise(resolve => setTimeout(resolve, 600));

            // 4. Run the screenshot-layer conversion pass for the current page view state
            await exporter.addSlideFromCurrentPage();
        }

        if (progressCB) {
            progressCB('exporting');
        }

        // 5. Finalize file construction and compile the file presentation down to disk
        await exporter.finalize();

        if (progressCB) {
            progressCB('done', null, null, this._fileName);
        }
    }
};
