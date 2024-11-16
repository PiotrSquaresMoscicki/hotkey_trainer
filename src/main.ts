// log and display key name when its pressed
// use "display" element to show the key name
// document.addEventListener('keydown', (event) => {
//     console.log(`Key pressed: ${event.key}`);
//     // display the key name
//     let display = document.getElementById('display');
//     if (display) {
//         display.innerHTML = event.key;
//     } else {
//         throw new Error('Element with id "display" not found');
//     }
// });

function displayPressedKeys(event: KeyboardEvent): void {
    const displayElement = document.getElementById('display');
    if (displayElement) {
        const keys = [];
        if (event.ctrlKey) keys.push('Ctrl');
        if (event.shiftKey) keys.push('Shift');
        if (event.altKey) keys.push('Alt');
        if (event.metaKey) keys.push('Meta');
        keys.push(event.key);
        displayElement.innerHTML = keys.join(' + ');
    }

    // mark all events as handled
    event.preventDefault();
}

function clearDisplay(): void {
    const displayElement = document.getElementById('display');
    if (displayElement) {
        displayElement.innerHTML = '';
    }
}

document.addEventListener('keydown', displayPressedKeys);
document.addEventListener('keyup', clearDisplay);

// 