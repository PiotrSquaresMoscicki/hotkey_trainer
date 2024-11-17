// This website is intended to build the muscle memory for starcraft 2 and other games where hotkeys
// are heavily used. On the left side of the page there is text field showing an action that the 
// user is supposed to execute. In the center there is a field showing currently prsessed keys and 
// previously pressed keys in the sequence. On the right there is a statistic showing the reaction 
// time, successful and failed operations.
// Definitions:
// - Operation - sequence of actions that lead to a particluar goal (e.g. inject first hatchery, 
//      build extractor, build lings and add to harras control group)
// - Action - single key press together with modifiers (e.g. "O", "CTRL + I", "LMB")
// - Reaction Time - time from when next operation is displayed to the user to the moment when all
//       actions are performed in proper sequence
// - Successful Operation - all actions performed from start to finish in proper order
// - Failed Operation - when at least one action is not correct in the sequence the whole sequence
//      is failed and the user needs to start from the beginning

class Action {
    name: string;
    key: string;
    ctrl: boolean;
    shift: boolean;
    alt: boolean;

    constructor(name: string, 
        key: string, 
        ctrl: boolean = false, 
        shift: boolean = false, 
        alt: boolean = false)
    {
        this.name = name;
        this.key = key;
        this.ctrl = ctrl;
        this.shift = shift;
        this.alt = alt;
    }

    equal(action: Action): boolean {
        return this.name === action.name 
            && this.key === action.key 
            && this.ctrl === action.ctrl 
            && this.shift === action.shift 
            && this.alt === action.alt;
    }
}

class Operation {
    name: string;
    actions: Action[];
    
    constructor(name: string, actions: Action[]) {
        this.name = name;
        this.actions = actions;
    }
}

class OperationsSet {
    operations: Operation[];

    constructor(operations: Operation[]) {
        this.operations = operations;
    }
}

interface ModelObserver {
    onOperationSuccess(): void
    opOperationFailure(): void
    onActionSuccess(): void
    onActionFailure(): void
}

class Model {
    // set of operations from which the user is supposed to learn
    operationsSet: OperationsSet;

    // index of the next required action in the current operation
    nextRequiredActionIndex: number;
    // currently displayed operation
    nextRequiredOperation: Operation;

    observer: ModelObserver;

    getNextRequiredOperation(): Operation {
        return this.nextRequiredOperation;
    }

    getNextRequiredAction(): Action {
        return this.nextRequiredOperation.actions[this.nextRequiredActionIndex];
    }

    registerAction(action: Action): boolean {
        const requiredAction = this.getNextRequiredAction();
        if (requiredAction.equal(action)) {
            this.nextRequiredActionIndex++;
            this.observer.onActionSuccess();
            if (this.nextRequiredActionIndex === this.nextRequiredOperation.actions.length) {
                this.selectNextOperation();
                this.observer.onOperationSuccess();
            }
            return true;
        } else {
            this.resetNextOperationProgress();
            this.observer.onActionFailure();
            return false;
        }
    }

    selectNextOperation(): void {
        this.nextRequiredOperation = this.operationsSet.operations[Math.floor(Math.random() * this.operationsSet.operations.length)];
        this.nextRequiredActionIndex = 0;
    }

    resetNextOperationProgress(): void {
        this.nextRequiredActionIndex = 0;
    }

    constructor(operationsSet: OperationsSet, observer: ModelObserver) {
        this.operationsSet = operationsSet;
        this.nextRequiredActionIndex = 0;
        this.nextRequiredOperation = this.operationsSet.operations[this.nextRequiredActionIndex];
        this.observer = observer;
        this.selectNextOperation();
    }
}

function displayPressedKeys(event: KeyboardEvent): void {
    const displayElement = document.getElementById('middle');
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
    const displayElement = document.getElementById('middle');
    if (displayElement) {
        displayElement.innerHTML = '';
    }
}

document.addEventListener('keydown', displayPressedKeys);
document.addEventListener('keyup', clearDisplay);

// 