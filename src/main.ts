function displayPressedKeys(event: KeyboardEvent): void {
    const displayElement = document.getElementById('display');
    if (displayElement) {
        const keys = [];
        if (event.ctrlKey) keys.push('Ctrl');
        if (event.shiftKey) keys.push('Shift');
        if (event.altKey) keys.push('Alt');
        if (event.metaKey) keys.push('Meta');
        keys.push(event.key);
        displayElement.textContent = keys.join(' + ');
    }
}

function clearDisplay(): void {
    const displayElement = document.getElementById('display');
    if (displayElement) {
        displayElement.textContent = '';
    }
}

window.addEventListener('keydown', displayPressedKeys);
window.addEventListener('keyup', clearDisplay);
