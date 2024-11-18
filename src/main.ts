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

export class Action {
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

    // observer that is notified about the model state changes
    observer: ModelObserver;

    lastActionTime: number = 0;

    // stats
    numberOfSuccessfulOperations: number = 0;
    numberOfFailedOperations: number = 0;
    reactionTimes: number[] = [];
    
    getSuccessRate(): number {
        return this.numberOfSuccessfulOperations / (this.numberOfSuccessfulOperations + this.numberOfFailedOperations);
    }

    getAverageReactionTime(): number {
        if (this.reactionTimes.length === 0) {
            return 0;
        }

        // as seconds
        return this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length / 1000;
    }

    getScore(): number {
        return this.getSuccessRate() * (this.getAverageReactionTime()/600) * 100;
    }

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

    registerKey(key: string, ctrl: boolean, shift: boolean, alt: boolean): boolean {
        const requiredOperation = this.getNextRequiredOperation();
        const requiredAction = this.getNextRequiredAction();
        if (requiredAction === null || requiredOperation === null) {
            return false;
        }

        // log information about registered key
        var message = ''
        if (ctrl) {
            message += 'CTRL + ';
        }
        if (shift) {
            message += 'SHIFT + ';
        }
        if (alt) {
            message += 'ALT + ';
        }
        message += key;
        console.log(message);

        if (requiredAction.key === key &&
            requiredAction.ctrl === ctrl &&
            requiredAction.shift === shift &&
            requiredAction.alt === alt) 
        {
            this.nextRequiredActionIndex++;
            this.observer.onActionSuccess();
            if (this.nextRequiredActionIndex === requiredOperation.actions.length) {
                this.observer.onOperationSuccess();
                this.numberOfSuccessfulOperations++;
                this.nextRequiredActionIndex = 0;
                this.operationsSet.shift();
                this.reactionTimes.push(Date.now() - this.lastActionTime);
                this.lastActionTime = Date.now();
            }
            return true;
        } else {
            this.observer.onActionFailure();
            this.numberOfFailedOperations++;
            this.nextRequiredActionIndex = 0;
            return false;
        }
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
        this.lastActionTime = Date.now();
    }
}

class View implements ModelObserver {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;

    pressedKeys: string[] = [];

    model: Model;

    onKeyDown(event: KeyboardEvent): void {
        this.pressedKeys.push(event.code);
        
        // if event.code does not contain control, alt or shift we can register the key
        if (!event.code.includes('Control') && !event.code.includes('Alt') && !event.code.includes('Shift')) {
            const ctrl = this.pressedKeys.includes('ControlLeft') || this.pressedKeys.includes('ControlRight');
            const alt = this.pressedKeys.includes('AltLeft') || this.pressedKeys.includes('AltRight');
            this.model.registerKey(event.code, ctrl, event.shiftKey, alt);
        }

        this.update();
        event.preventDefault();
    }

    onKeyUp(event: KeyboardEvent): void {
        this.pressedKeys = [];
        this.update();
        event.preventDefault();
    }

    update(): void {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawCurrentAction();
        this.drawExpectedOperations();
        this.drawStatistics();
    }

    drawExpectedOperations(): void {
        // list of operations to execute should be displayed on the left side of the canvas going 
        // from the top to the middle of the canvas
        // each operation should be displayed in a separate line
        // first operation from the list should be displayed in the middle, the next one one line 
        // above and so on until we run out of space

        this.context.fillStyle = 'black';
        this.context.font = '30px Arial';
        this.context.textAlign = 'left';
        this.context.textBaseline = 'middle';

        const operations = this.model.operationsSet;
        const operationsCount = operations.length;
        const lineHeight = 40;
        const startY = this.canvas.height / 2;
        const maxLines = Math.floor(startY / lineHeight);
        
        for (let i = 0; i < operationsCount && i < maxLines; i++) {
            this.context.fillText(operations[i].name, 10, startY - i * lineHeight);
        }

        // draw a frame around the first operation (from left side of the canvas to the 1/3 of the width)
        this.context.strokeStyle = 'black';
        this.context.lineWidth = 3;
        this.context.strokeRect(0, startY - lineHeight / 2, this.canvas.width / 3, lineHeight);
    }

    drawCurrentAction(): void {
        // draw pressed keys in the middle of the canvas
        this.context.fillStyle = 'black';
        this.context.font = '30px Arial';
        this.context.textAlign = 'center';
        this.context.textBaseline = 'middle';
        this.context.fillText(this.pressedKeys.join(' + '), this.canvas.width / 2, this.canvas.height / 2);

        // draw a frame around the pressed keys (from 1/3 of the width to 2/3 of the width)
        this.context.strokeStyle = 'black';
        this.context.lineWidth = 3;
        this.context.strokeRect(this.canvas.width / 3, this.canvas.height / 2 - 20, this.canvas.width / 3, 40);
    }

    drawStatistics(): void {
        // draw statistics on the right side of the canvas
        // statistics should contain the following information:
        // - success rate
        // - average reaction time
        // - score
        // - number of successful operations
        // - number of failed operations

        this.context.fillStyle = 'black';
        this.context.font = '30px Arial';
        this.context.textAlign = 'left';
        this.context.textBaseline = 'top';

        const successRate = this.model.getSuccessRate();
        const averageReactionTime = this.model.getAverageReactionTime();
        const score = this.model.getScore();
        const successfulOperations = this.model.numberOfSuccessfulOperations;
        const failedOperations = this.model.numberOfFailedOperations;

        // limit number of digits to two after the decimal point
        this.context.fillText('Success rate: ' + successRate.toFixed(2), this.canvas.width * 2 / 3, 10);
        this.context.fillText('Average reaction time: ' + averageReactionTime.toFixed(2), this.canvas.width * 2 / 3, 50);
        this.context.fillText('Score: ' + score.toFixed(2), this.canvas.width * 2 / 3, 90);
        this.context.fillText('Successful operations: ' + successfulOperations, this.canvas.width * 2 / 3, 130);
        this.context.fillText('Failed operations: ' + failedOperations, this.canvas.width * 2 / 3, 170);
    }

    generateOperationsSet(allowedOperations: Operation[], numberOfOperations: number): void {
        this.model.generateOperationsSet(allowedOperations, numberOfOperations);
        this.update();
    }

    onOperationSuccess(): void {
        // notify the user that the operation was successful
        // play a sound
        // update the statistics
    }

    opOperationFailure(): void {
        // notify the user that the operation was not successful
        // play a sound
        // update the statistics
    }

    onActionSuccess(): void {
        // notify the user that the action was successful
        // play a sound
        // update the statistics
    }

    onActionFailure(): void {
        // notify the user that the action was not successful
        // play a sound
        // update the statistics
    }

    constructor() {
        this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
        this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;

        // set canvas size to the window size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.model = new Model(this);
        
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));

        this.update();
    }
}

// actions

const morphDrone = new Action('Morph Drone', 'KeyP');
const morphOverlord = new Action('Morph Overlord', 'Slash');
const morphZergling = new Action('Morph Zergling', 'Semicolon');

const selectInjectQueens = new Action('Select Inject Queens', 'KeyI');
const selectHatcheries = new Action('Select Hatcheries', 'KeyO');
const selectHarrasArmy = new Action('Select Harras Army', 'KeyJ');
const selectMainArmy = new Action('Select Main Army', 'KeyL');
const selectCreepQueens = new Action('Select Creep Queens', 'KeyH');

const goToCameraLocation1 = new Action('Go To Camera Location 1', 'Digit0');
const goToCameraLocation2 = new Action('Go To Camera Location 2', 'Digit9');
const goToCameraLocation3 = new Action('Go To Camera Location 3', 'Digit8');
const goToCameraLocation4 = new Action('Go To Camera Location 4', 'KeyU');

const createCameraLocation1 = new Action('Create Camera Location 1', 'Digit0', true, false, true);
const createCameraLocation2 = new Action('Create Camera Location 2', 'Digit9', true, false, true);
const createCameraLocation3 = new Action('Create Camera Location 3', 'Digit8', true, false, true);
const createCameraLocation4 = new Action('Create Camera Location 4', 'KeyU', true, false, true);

const addtoInjectQueens = new Action('Add to Inject Queens', 'KeyI', true, false, false);
const addtoHatcheries = new Action('Add to Hatcheries', 'KeyO', true, false, false);
const addtoHarrasArmy = new Action('Add to Harras Army', 'KeyJ', true, false, false);
const addtoMainArmy = new Action('Add to Main Army', 'KeyL', true, false, false);
const addtoCreepQueens = new Action('Add to Creep Queens', 'KeyH', true, false, false);

// operations

// just every action gets its own operation - later we'll add more compilcated operations

const morphDroneOperation = new Operation('Morph Drone', [morphDrone]);
const morphOverlordOperation = new Operation('Morph Overlord', [morphOverlord]);
const morphZerglingOperation = new Operation('Morph Zergling', [morphZergling]);

const selectInjectQueensOperation = new Operation('Select Inject Queens', [selectInjectQueens]);
const selectHatcheriesOperation = new Operation('Select Hatcheries', [selectHatcheries]);
const selectHarrasArmyOperation = new Operation('Select Harras Army', [selectHarrasArmy]);
const selectMainArmyOperation = new Operation('Select Main Army', [selectMainArmy]);
const selectCreepQueensOperation = new Operation('Select Creep Queens', [selectCreepQueens]);

const goToCameraLocation1Operation = new Operation('Go To Camera Location 1', [goToCameraLocation1]);
const goToCameraLocation2Operation = new Operation('Go To Camera Location 2', [goToCameraLocation2]);
const goToCameraLocation3Operation = new Operation('Go To Camera Location 3', [goToCameraLocation3]);
const goToCameraLocation4Operation = new Operation('Go To Camera Location 4', [goToCameraLocation4]);

const createCameraLocation1Operation = new Operation('Create Camera Location 1', [createCameraLocation1]);
const createCameraLocation2Operation = new Operation('Create Camera Location 2', [createCameraLocation2]);
const createCameraLocation3Operation = new Operation('Create Camera Location 3', [createCameraLocation3]);
const createCameraLocation4Operation = new Operation('Create Camera Location 4', [createCameraLocation4]);

const addtoInjectQueensOperation = new Operation('Add to Inject Queens', [addtoInjectQueens]);
const addtoHatcheriesOperation = new Operation('Add to Hatcheries', [addtoHatcheries]);
const addtoHarrasArmyOperation = new Operation('Add to Harras Army', [addtoHarrasArmy]);
const addtoMainArmyOperation = new Operation('Add to Main Army', [addtoMainArmy]);
const addtoCreepQueensOperation = new Operation('Add to Creep Queens', [addtoCreepQueens]);

const allowedOperations = [
    morphDroneOperation,
    morphOverlordOperation,
    morphZerglingOperation,
    selectInjectQueensOperation,
    selectHatcheriesOperation,
    selectHarrasArmyOperation,
    selectMainArmyOperation,
    selectCreepQueensOperation,
    goToCameraLocation1Operation,
    goToCameraLocation2Operation,
    goToCameraLocation3Operation,
    goToCameraLocation4Operation,
    createCameraLocation1Operation,
    createCameraLocation2Operation,
    createCameraLocation3Operation,
    createCameraLocation4Operation,
    addtoInjectQueensOperation,
    addtoHatcheriesOperation,
    addtoHarrasArmyOperation,
    addtoMainArmyOperation,
    addtoCreepQueensOperation
];

const view = new View();
view.generateOperationsSet(allowedOperations, 50);
