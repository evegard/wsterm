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
