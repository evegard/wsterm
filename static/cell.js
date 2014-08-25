var Cell = function() {
    this.element = $('<span />').text(' ');
    this.domElement = this.element[0];
    this.textElement = this.domElement.childNodes[0];
    this.currentProperties = {};
    this.previousProperties = {};
    this.resetProperties();
};

Cell.prototype.resetProperties = function() {
    this.currentProperties = {
        'character': ' ',
        'foreground': 'lightgray',
        'background': 'black',
        'bold': false,
        'cursor': false,
    };
    this.refresh();
};

Cell.prototype.refresh = function() {
    for (var property in this.currentProperties) {
        var value = this.currentProperties[property];
        var previousValue = this.previousProperties[property];
        if (value !== previousValue) {
            switch (property) {
            case 'character': this.textElement.data = value; break;
            case 'foreground': this.domElement.style.color = value; break;
            case 'background': this.domElement.style.backgroundColor = value; break;
            case 'bold': this.domElement.style.fontWeight = (value ? 'bold' : 'normal'); break;
            case 'cursor': this.domElement.style.opacity = (value ? 0.5 : 1.0); break;
            default: console.log('Unknown property ' + property); break;
            }
            this.previousProperties[property] = value;
        }
    }
};

Cell.prototype.setCursor = function(cursor) {
    this.currentProperties.cursor = cursor;
    this.refresh();
};

Cell.prototype.copyPropertiesFrom = function(other) {
    this.currentProperties['character'] = other.currentProperties['character'];
    this.currentProperties['foreground'] = other.currentProperties['foreground'];
    this.currentProperties['background'] = other.currentProperties['background'];
    this.currentProperties['bold'] = other.currentProperties['bold'];
    this.refresh();
};

Cell.prototype.updateProperties = function(newProperties) {
    for (var property in newProperties) {
        this.currentProperties[property] = newProperties[property];
    }
};
