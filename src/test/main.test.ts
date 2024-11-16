describe('Key press and release handling', () => {
    let displayElement: HTMLElement | null;

    beforeEach(() => {
        document.body.innerHTML = '<div id="display"></div>';
        displayElement = document.getElementById('display');
    });

    test('displays pressed key with modifiers on keydown', () => {
        const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true, shiftKey: true });
        window.dispatchEvent(event);
        expect(displayElement?.textContent).toBe('Ctrl + Shift + a');
    });

    test('clears display on keyup', () => {
        const keydownEvent = new KeyboardEvent('keydown', { key: 'a' });
        window.dispatchEvent(keydownEvent);
        const keyupEvent = new KeyboardEvent('keyup');
        window.dispatchEvent(keyupEvent);
        expect(displayElement?.textContent).toBe('');
    });
});
