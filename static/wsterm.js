var WSTerm = function(url, container) {
    this.socket = new WebSocket(url);
    this.socket.onmessage = function(e) {
        this.handleInput(window.atob(e.data));
    }.bind(this);

    this.screen = new Screen(container);

    $('body').keypress(function(ev) {
        this.socket.send(ev.keyCode);
        return false;
    }.bind(this));

    $('body').keydown(function(ev) {
        if (ev.keyCode === 27) {
            this.socket.send(ev.keyCode);
            return false;
        }
    }.bind(this));
};

WSTerm.prototype.handleInput = function(input) {
    console.log(input);
    this.screen.print(input);
};
