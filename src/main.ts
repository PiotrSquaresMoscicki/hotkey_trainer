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

interface ModelObserver {
    onOperationSuccess(): void
    opOperationFailure(): void
    onActionSuccess(): void
    onActionFailure(): void
}

class Model {
    // set of operations from which the user is supposed to learn
    operationsSet: Operation[] = [];

    // index of the next required action in the current operation
    nextRequiredActionIndex: number = 0;

    // actions performed in the current operation
    actionsPerformed: Action[] = [];

    // observer that is notified about the model state changes
    observer: ModelObserver;
    

    // returns the next required operation or null if there are no more operations
    getNextRequiredOperation(): Operation | null {
        if (this.operationsSet.length === 0) {
            return null;
        }

        return this.operationsSet[0];
    }

    // selects the next required action or null if there are no more operations
    getNextRequiredAction(): Action | null {
        const requiredOperation = this.getNextRequiredOperation();
        if (requiredOperation === null) {
            return null;
        }

        return requiredOperation.actions[this.nextRequiredActionIndex];
    }

    registerAction(action: Action): boolean {
        const requiredOperation = this.getNextRequiredOperation();
        const requiredAction = this.getNextRequiredAction();
        if (requiredAction === null || requiredOperation === null) {
            return false;
        }

        if (requiredAction.equal(action)) {
            this.nextRequiredActionIndex++;
            this.observer.onActionSuccess();
            if (this.nextRequiredActionIndex === requiredOperation.actions.length) {
                this.observer.onOperationSuccess();
                this.nextRequiredActionIndex = 0;
                this.actionsPerformed = [];
                this.operationsSet.shift();
            }
        } else {
            this.observer.onActionFailure();
            this.nextRequiredActionIndex = 0;
            this.actionsPerformed = [];
        }

        return true;
    }

    generateOperationsSet(allowedOperations: Operation[], numberOfOperations: number): void {
        this.operationsSet = [];
        for (let i = 0; i < numberOfOperations; i++) {
            const randomIndex = Math.floor(Math.random() * allowedOperations.length);
            this.operationsSet.push(allowedOperations[randomIndex]);
        }
    }

    constructor(observer: ModelObserver) {
        this.observer = observer;
    }
}

class View {
    pressedKeys: string[] = [];

    onKeyDown(event: KeyboardEvent): void {
        this.pressedKeys.push(event.key);
        this.update();
        event.preventDefault();
    }

    onKeyUp(event: KeyboardEvent): void {
        this.pressedKeys = [];
        this.update();
        event.preventDefault();
    }

    update(): void {
        const displayElement = document.getElementById('actionsMiddle');
        if (displayElement) {
            displayElement.innerHTML = this.pressedKeys.join(' + ');
        }
    }

    constructor() {
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    }
}

const view = new View();
