var Cell = function() {
    this.element = $('<span />');
    this.cursor = false;
    this.clearContents();
};

Cell.prototype.update = function() {
    this.element.css({
        'color': this.foreground,
        'background-color': this.background,
        'opacity': (this.cursor ? 0.5 : 1.0),
    });
    this.element.text(this.character);
};

Cell.prototype.setCursor = function(cursor) {
    this.cursor = cursor;
    this.update();
};

Cell.prototype.setCharacter = function(character) {
    this.character = character;
    this.update();
};

Cell.prototype.copyContentsFrom = function(other) {
    this.foreground = other.foreground;
    this.background = other.background;
    this.character = other.character;
    this.update();
};

Cell.prototype.clearContents = function() {
    this.foreground = 'gray';
    this.background = 'black';
    this.character = ' ';
    this.update();
};

var Screen = function(container) {
    this.container = container;
    this.width = 80;
    this.height = 24;
    this.x = 0;
    this.y = 0;

    this.cells = null;
    this.currentCell = null;

    this.frame = $('<pre />');
    this.container.append(this.frame);

    this.recreateCells();
};

Screen.prototype.recreateCells = function() {
    this.cells = [];
    this.frame.empty();
    for (var y = 0; y < this.height; y++) {
        var row = [];
        for (var x = 0; x < this.width; x++) {
            var cell = new Cell();
            row.push(cell);
            this.frame.append(cell.element);
        }
        this.cells.push(row);
        this.frame.append($('<br />'));
    }
    this.moveCursor(this.x, this.y);
};

Screen.prototype.scroll = function() {
    for (var y = 0; y < this.height; y++) {
        for (var x = 0; x < this.width; x++) {
            if (y < this.height - 1) {
                this.cells[y][x].copyContentsFrom(this.cells[y + 1][x]);
            } else {
                this.cells[y][x].clearContents();
            }
        }
    }
};

Screen.prototype.moveCursor = function(x, y) {
    if (this.currentCell) {
        this.currentCell.setCursor(false);
    }
    this.x = x;
    this.y = y;
    this.currentCell = this.cells[this.y][this.x];
    this.currentCell.setCursor(true);
};

Screen.prototype.advanceCursor = function() {
    if (this.x < this.width - 1) {
        this.moveCursor(this.x + 1, this.y);
    } else {
        this.performLineReturn();
    }
};

Screen.prototype.performLineReturn = function() {
    if (this.y < this.height - 1) {
        this.moveCursor(0, this.y + 1);
    } else {
        this.scroll();
        this.moveCursor(0, this.y);
    }
};

Screen.prototype.print = function(text) {
    for (var i = 0; i < text.length; i++) {
        var character = text.charAt(i);
        var characterCode = text.charCodeAt(i);
        if (character === '\n') {
            this.performLineReturn();
        } else if (characterCode >= 32 && characterCode <= 126) {
            this.currentCell.setCharacter(character);
            this.advanceCursor();
        } else {
            this.currentCell.setCharacter(' ');
            this.advanceCursor();
        }
    }
};

var WSTerm = function(url, container) {
    this.socket = new WebSocket(url);
    this.socket.onmessage = function(e) {
        this.handleInput(window.atob(e.data));
    }.bind(this);

    this.screen = new Screen(container);
};

WSTerm.prototype.handleInput = function(input) {
    console.log(input);
    this.screen.print(input);
};
