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
        'font-weight': (this.bold ? 'bold' : 'normal'),
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

Cell.prototype.setForeground = function(color) {
    this.foreground = color;
    this.update();
};

Cell.prototype.setBackground = function(color) {
    this.background = color;
    this.update();
};

Cell.prototype.setBold = function(bold) {
    this.bold = bold;
    this.update();
};

Cell.prototype.resetFormatting = function() {
    this.foreground = 'gray';
    this.background = 'black';
    this.bold = false;
    this.update();
};

Cell.prototype.clearContents = function() {
    this.resetFormatting();
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
    this.resetColors();

    this.state = 'character';

    this.frame = $('<pre />');
    this.container.append(this.frame);

    this.recreateCells();
};

Screen.prototype.resetColors = function() {
    this.foreground = 'gray';
    this.background = 'black';
    this.bold = false;
};

Screen.prototype.swapColors = function() {
    var temporary = this.foreground;
    this.foreground = this.background;
    this.background = temporary;
};

Screen.prototype.setBold = function() {
    this.bold = true;
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

Screen.prototype.processEscapeSequence = function(command, parameter) {
    var darkColorCodeToCSS = function(colorCode) {
        if (colorCode < 0 || colorCode > 7) {
            colorCode = 0;
        }
        return [
            'rgb(0,0,0)',
            'rgb(170,0,0)',
            'rgb(0,170,0)',
            'rgb(170,85,0)',
            'rgb(0,0,170)',
            'rgb(170,0,170)',
            'rgb(0,170,170)',
            'rgb(170,170,170)'
        ][colorCode];
    };
    var lightColorCodeToCSS = function(colorCode) {
        if (colorCode < 0 || colorCode > 7) {
            colorCode = 0;
        }
        return [
            'rgb(85,85,85)',
            'rgb(255,85,85)',
            'rgb(85,255,85)',
            'rgb(255,255,85)',
            'rgb(85,85,255)',
            'rgb(255,85,255)',
            'rgb(85,255,255)',
            'rgb(255,255,255)'
        ][colorCode];
    };
    var colorIndexToCSS = function(colorIndex) {
        if (colorIndex >= 0x0 && colorIndex <= 0x7) {
            return darkColorCodeToCSS(colorIndex);
        } else if (colorIndex >= 0x8 && colorIndex <= 0xF) {
            return lightColorCodeToCSS(colorIndex);
        } else {
            console.log('Unimplemented color index ' + colorIndex);
            return 'black';
        }
    };

    var parameters = parameter.split(';');
    switch (command) {
    case 'H':
        var row = parameters[0] || 1;
        var column = parameters[1] || 1;
        this.moveCursor(column - 1, row - 1);
        break;
    case 'd':
        this.performLineReturn();
        break;
    case 'm':
        for (var i = 0; i < parameters.length; i++) {
            var format = parameters[i];
            console.log('format ' + format);
            if (format >= 30 && format <= 37) {
                this.foreground = darkColorCodeToCSS(format - 30);
            } else if (format >= 40 && format <= 47) {
                this.background = darkColorCodeToCSS(format - 40);
            } else if (format >= 90 && format <= 97) {
                this.foreground = lightColorCodeToCSS(format - 90);
            } else if (format >= 100 && format <= 107) {
                this.background = lightColorCodeToCSS(format - 100);
            } else if (format == 38 || format == 48) {
                if (i + 1 >= parameters.length) {
                    console.log('Missing argument for color selection');
                    return;
                }
                var colorMode = parameters[++i];
                switch (colorMode) {
                case '5':
                    if (i + 1 >= parameters.length) {
                        console.log('Missing argument for color selection mode 5');
                        return;
                    }
                    var colorIndex = parameters[++i];
                    var colorCSS = colorIndexToCSS(colorIndex);
                    if (format == 38) {
                        this.foreground = colorCSS;
                    } else {
                        this.background = colorCSS;
                    }
                    break;
                default:
                    console.log('Unknown color mode ' + colorMode);
                    break;
                }
            } else if (format == 1) {
                this.setBold();
            } else if (format == 7) {
                this.swapColors();
            } else if (format == 0) {
                this.resetColors();
            }
        }
        break;
    }
};

Screen.prototype.print = function(text) {
    for (var i = 0; i < text.length; i++) {
        var character = text.charAt(i);
        var characterCode = text.charCodeAt(i);
        switch (this.state) {
        case 'character':
            if (character === '\n') {
                this.performLineReturn();
            } else if (characterCode >= 32 && characterCode <= 126) {
                this.currentCell.setCharacter(character);
                this.currentCell.setForeground(this.foreground);
                this.currentCell.setBackground(this.background);
                this.currentCell.setBold(this.bold);
                this.advanceCursor();
            } else if (characterCode === 27) {
                this.state = 'escape1';
            } else {
                this.currentCell.setCharacter(' ');
                this.advanceCursor();
            }
            break;
        case 'escape1':
            if (character === '[' || character === '(') {
                this.state = 'escape2';
                this.escapeCharacter = character;
                this.escapeParameters = '';
            } else {
                this.state = 'character';
                console.log('Unexpected byte ' + characterCode + ' in state escape1');
            }
            break;
        case 'escape2':
            if (character >= 'A' && character <= 'z') {
                var sequence = this.escapeCharacter + this.escapeParameters + character;
                switch (this.escapeCharacter) {
                case '[':
                    console.log('Processing escape sequence ' + sequence);
                    this.processEscapeSequence(character, this.escapeParameters);
                    break;
                default:
                    console.log('Unknown escape sequence ' + sequence);
                    break;
                }
                this.state = 'character';
            } else {
                this.escapeParameters += character;
            }
            break;
        default:
            console.log('Unknown state ' + this.state);
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
