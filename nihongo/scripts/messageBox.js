/**
 * Reusable MessageBox class for managing floating, animated message displays.
 */
class MessageBox {
    /**
     * @param {string} containerId - Element ID for the message box container.
     */
    constructor(containerId = 'messageBox') {
        this.msgBox = document.getElementById(containerId);
        if (!this.msgBox) {
            this.msgBox = document.createElement('div');
            this.msgBox.id = containerId;
            this.msgBox.className = 'noprint';
            document.body.appendChild(this.msgBox);
        }
        
        // Add the floating box CSS class
        this.msgBox.classList.add('floating-message-box');
        
        this.timeout = null;
    }

    /**
     * Display a message and slide it up from the bottom.
     * @param {string} msg - The message text to display.
     */
    show(msg) {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        this.msgBox.innerText = msg;
        this.msgBox.classList.add('visible');
    }

    /**
     * Defer hiding the message box. The message stays for 5 seconds
     * and then folds away to the bottom.
     */
    hide() {
        if (this.msgBox.classList.contains('visible') && !this.timeout) {
            this.timeout = setTimeout(() => {
                this.msgBox.classList.remove('visible');
                // Wait for the 1s slide-down transition before clearing innerText
                setTimeout(() => {
                    if (!this.msgBox.classList.contains('visible')) {
                        this.msgBox.innerText = "";
                    }
                }, 1000);
                this.timeout = null;
            }, 5000);
        }
    }

    /**
     * Instantly hide and clear the message box without delay.
     */
    clear() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        this.msgBox.classList.remove('visible');
        this.msgBox.innerText = "";
    }
}
