var Screen = function(container) {
    this.container = container;
    this.width = 80;
    this.height = 24;

    this.scrollTop = 0;
    this.scrollBottom = this.height - 1;
    this.x = 0;
    this.y = 0;

    this.currentStyle = null;
    this.resetStyle();

    this.cells = null;
    this.currentCell = null;
    this.state = 'character';

    this.frame = $('<pre />');
    this.container.append(this.frame);

    this.recreateCells();
};

Screen.prototype.resetStyle = function() {
    this.currentStyle = {
        'foreground': 'gray',
        'background': 'black',
        'bold': false,
    };
};

Screen.prototype.swapColors = function() {
    var temporary = this.currentStyle.foreground;
    this.currentStyle.foreground = this.currentStyle.background;
    this.currentStyle.background = temporary;
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

Screen.prototype.scrollUp = function() {
    for (var y = this.scrollTop; y <= this.scrollBottom; y++) {
        for (var x = 0; x < this.width; x++) {
            if (y < this.scrollBottom) {
                this.cells[y][x].copyPropertiesFrom(this.cells[y + 1][x]);
            } else {
                this.cells[y][x].resetProperties();
            }
        }
    }
};

Screen.prototype.scrollDown = function() {
    for (var y = this.scrollBottom; y >= this.scrollTop; y--) {
        for (var x = 0; x < this.width; x++) {
            if (y > this.scrollTop) {
                this.cells[y][x].copyPropertiesFrom(this.cells[y - 1][x]);
            } else {
                this.cells[y][x].resetProperties();
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

Screen.prototype.advanceCursor = function(avoidLineReturn) {
    if (this.x < this.width - 1) {
        this.moveCursor(this.x + 1, this.y);
    } else if (!avoidLineReturn) {
        this.performLineReturn();
    }
};

Screen.prototype.performLineReturn = function() {
    if (this.y < this.scrollBottom) {
        this.moveCursor(0, this.y + 1);
    } else {
        this.scrollUp();
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
            return lightColorCodeToCSS(colorIndex - 0x8);
        } else if (colorIndex >= 0x10 && colorIndex <= 0xE7) {
            var n = colorIndex - 0x10;
            var b = n % 6; n /= 6;
            var g = n % 6; n /= 6;
            var r = n % 6;
            return 'rgb(' +
                Math.floor(r * 255 / 5) + ',' +
                Math.floor(g * 255 / 5) + ',' +
                Math.floor(b * 255 / 5) + ')';
        } else if (colorIndex >= 0xE8 && colorIndex <= 0xFF) {
            var n = colorIndex - 0xE8;
            var grayness = Math.floor(n * 255 / 24);
            return 'rgb(' + grayness + ',' + grayness + ',' + grayness + ')';
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
    case 'C':
        var n = parameter || 1;
        for (var i = 0; i < n; i++) {
            this.advanceCursor(true);
        }
        break;
    case 'd':
        this.performLineReturn();
        break;
    case 'J':
    case 'K':
        var n = parameter || '0';
        var fromX, toX, fromY, toY;
        switch (n) {
        case '0': // Clear to end of line
            fromX = this.x;
            toX = this.width - 1;
            fromY = this.y + 1;
            toY = this.height - 1;
            break;
        case '1': // Clear to beginning of line
            fromX = 0;
            toX = this.x;
            fromY = 0;
            toY = this.y - 1;
            break;
        case '2': // Clear all
            from = 0;
            to = this.width - 1;
            fromY = 0;
            toY = this.height - 1;
            break;
        default:
            console.log('Invalid argument \'' + parameter + '\' for escape sequence ' + command);
            return;
        }
        for (var x = fromX; x <= toX; x++) {
            this.cells[this.y][x].resetProperties();
        }
        if (command === 'J') {
            for (var y = Math.max(fromY, 0); y <= Math.min(toY, this.height - 1); y++) {
                for (var x = 0; x < this.width; x++) {
                    this.cells[y][x].resetProperties();
                }
            }
        }
        break;
    case 'm':
        for (var i = 0; i < parameters.length; i++) {
            var format = parameters[i];
            if (format >= 30 && format <= 37) {
                this.currentStyle.foreground = darkColorCodeToCSS(format - 30);
            } else if (format >= 40 && format <= 47) {
                this.currentStyle.background = darkColorCodeToCSS(format - 40);
            } else if (format >= 90 && format <= 97) {
                this.currentStyle.foreground = lightColorCodeToCSS(format - 90);
            } else if (format >= 100 && format <= 107) {
                this.currentStyle.background = lightColorCodeToCSS(format - 100);
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
                        this.currentStyle.foreground = colorCSS;
                    } else {
                        this.currentStyle.background = colorCSS;
                    }
                    break;
                default:
                    console.log('Unknown color mode ' + colorMode);
                    break;
                }
            } else if (format == 1) {
                this.currentStyle.bold = true;
            } else if (format == 7) {
                this.swapColors();
            } else if (format == 0) {
                this.resetStyle();
            }
        }
        break;
    case 'l':
        if (parameter === '?25') {
            // TODO: Hide cursor
        } else {
            console.log('Unknown argument for escape sequence l: \'' + parameter + '\')');
        }
        break;
    case 'h':
        if (parameter === '?25') {
            // TODO: Show cursor
        } else {
            console.log('Unknown argument for escape sequence h: \'' + parameter + '\')');
        }
        break;
    case 'r':
        this.scrollTop = parameters[0] - 1;
        this.scrollBottom = parameters[1] - 1;
        break;
    case 'L':
        var n = parameter || 1;
        for (var i = 0; i < n; i++) {
            this.scrollDown();
        }
        break;
    case 'M':
        var n = parameter || 1;
        for (var i = 0; i < n; i++) {
            this.scrollUp();
        }
        break;
    default:
        console.log('Unimplemented escape sequence: command \'' + command + '\', parameters \'' + parameters + '\')');
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
                this.currentCell.updateProperties({ 'character': character });
                this.currentCell.updateProperties(this.currentStyle);
                this.currentCell.refresh();
                this.advanceCursor(false);
            } else if (characterCode === 27) {
                this.state = 'escape1';
            } else if (characterCode === 13) {
                // Ignore
            } else {
                console.log('Unknown character code to print ' + characterCode);
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
            break;
        }
    }
};
