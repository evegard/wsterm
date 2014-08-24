var Cell = function() {
    this.element = $('<span />').text(' ');
    this.currentProperties = {};
    this.previousProperties = {};
    this.resetProperties();
};

Cell.prototype.resetProperties = function() {
    this.currentProperties = {
        'character': ' ',
        'foreground': 'gray',
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
            case 'character': this.element[0].childNodes[0].data = value; break;
            case 'foreground': this.element.css('color', value); break;
            case 'background': this.element.css('background-color', value); break;
            case 'bold': this.element.css('font-weight', value ? 'bold' : 'normal'); break;
            case 'cursor': this.element.css('opacity', value ? 0.5 : 1.0); break;
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
    var copyProperties = [ 'character', 'foreground', 'background', 'bold' ];
    for (var i in copyProperties) {
        var property = copyProperties[i];
        this.currentProperties[property] = other.currentProperties[property];
    }
    this.refresh();
};

Cell.prototype.updateProperties = function(newProperties) {
    for (var property in newProperties) {
        this.currentProperties[property] = newProperties[property];
    }
};
