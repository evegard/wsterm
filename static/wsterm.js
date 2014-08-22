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
