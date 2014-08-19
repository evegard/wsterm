#!/usr/bin/python

import base64
import tornado.ioloop
import tornado.web
import tornado.websocket
import subprocess

class TerminalHandler(tornado.websocket.WebSocketHandler):
    def open(self):
        self.process = subprocess.Popen([ 'ls', '-l' ], \
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE)
        (stdin, stderr) = self.process.communicate()
        self.send_string(stdin)
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
