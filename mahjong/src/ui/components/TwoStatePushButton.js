// -*- coding: utf-8 -*-

/**
 * Compact, accessible two-state button with an independently editable icon.
 */
export class TwoStatePushButton {
    constructor({ label, icon, pressed = false, className = '', onToggle = () => {} }) {
        this._pressed = Boolean(pressed);
        this._onToggle = onToggle;
        this.element = document.createElement('button');
        this.element.type = 'button';
        this.element.className = `two-state-push-button ${className}`.trim();
        this.element.setAttribute('aria-label', label);
        this.element.title = label;
        this.element.setAttribute('aria-pressed', String(this._pressed));

        const image = document.createElement('img');
        image.src = icon;
        image.alt = '';
        image.setAttribute('aria-hidden', 'true');
        this.element.appendChild(image);

        this.element.addEventListener('click', () => {
            this.setPressed(!this._pressed);
            this._onToggle(this._pressed);
        });
    }

    get pressed() {
        return this._pressed;
    }

    setPressed(pressed) {
        this._pressed = Boolean(pressed);
        this.element.setAttribute('aria-pressed', String(this._pressed));
    }

    setLabel(label) {
        this.element.setAttribute('aria-label', label);
        this.element.title = label;
    }

    setIcon(icon) {
        this.element.querySelector('img').src = icon;
    }
}
