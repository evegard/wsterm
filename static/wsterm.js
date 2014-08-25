var WSTerm = function(url, secret, container) {
    this.url = url;
    this.secret = secret;
    this.container = container;

    this.socket = new WebSocket(this.url);
    this.screen = new Screen(this.container);

    this.registerSocketHandlers();
    this.registerKeyHandlers();
};

WSTerm.prototype.registerSocketHandlers = function() {
    this.socket.onopen = function() {
        this.socket.send(JSON.stringify({
            'type': 'secret',
            'secret': this.secret,
        }));
    }.bind(this);

    this.socket.onmessage = function(e) {
        var message = JSON.parse(e.data);
        switch (message.type) {
        case 'size':
            this.screen.width = message.width;
            this.screen.height = message.height;
            this.screen.recreateCells();
            break;
        case 'output':
            this.handleOutput(window.atob(message.output));
            break;
        }
    }.bind(this);
};

WSTerm.prototype.registerKeyHandlers = function() {
    $('body').keypress(function(ev) {
        this.sendInput(ev.keyCode);
        return false;
    }.bind(this));

    $('body').keydown(function(ev) {
        if (ev.keyCode === 27) {
            this.sendInput(ev.keyCode);
            return false;
        }
    }.bind(this));
};

WSTerm.prototype.sendInput = function(keyCode) {
    this.socket.send(JSON.stringify({
        'type': 'input',
        'key': keyCode,
    }));
};

WSTerm.prototype.handleOutput = function(output) {
    console.log(output);
    this.screen.print(output);
};
