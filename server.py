#!/usr/bin/python

import base64
import fcntl
import pty
import struct
import subprocess
import termios
import tornado.ioloop
import tornado.iostream
import tornado.web
import tornado.websocket

class TerminalHandler(tornado.websocket.WebSocketHandler):
    def open(self):
        (master, slave) = pty.openpty()
        fcntl.ioctl(master, termios.TIOCSWINSZ, struct.pack('HHHH', 24, 79, 100, 100))
        self.process = subprocess.Popen([ 'top', '-d', '1' ], \
            stdin=slave, stdout=slave, stderr=slave)
        self.stdout = tornado.iostream.PipeIOStream(master)
        self.stdout.read_until_close(callback=self.send_string, \
            streaming_callback=self.send_string)
        pass

    def on_message(self):
        pass

    def on_close(self):
        pass

    def send_string(self, string):
        self.write_message(base64.b64encode(string))

if __name__ == '__main__':
    tornado.web.Application([
        (r'/()', tornado.web.StaticFileHandler, { 'path': './static/index.html' }),
        (r'/wsterm', TerminalHandler),
    ], static_path='./static/').listen(8080, address='127.0.0.1')
    tornado.ioloop.IOLoop.instance().start()
