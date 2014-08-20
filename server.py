#!/usr/bin/python

import base64
import tornado.ioloop
import tornado.web
import tornado.websocket
import tornado.process

class TerminalHandler(tornado.websocket.WebSocketHandler):
    def open(self):
        self.process = tornado.process.Subprocess([ 'watch', '-c', 'ls -la --color=always' ], \
            stdin=tornado.process.Subprocess.STREAM,
            stdout=tornado.process.Subprocess.STREAM,
            stderr=tornado.process.Subprocess.STREAM)
        self.process.stdout.read_until_close(callback=self.send_string, \
            streaming_callback=self.send_string)
        self.process.stderr.read_until_close(callback=self.send_string, \
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
