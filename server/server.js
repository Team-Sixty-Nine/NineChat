var express = require('express');
var app = express();
const http = require('http');
const url = require('url');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
let Message = require('./model/message.js')
const chatCtrl = require('./controller/chatCtrl')

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname +'./../'));

const msgs = []
const messageGet = (req, res, next)=>{
  console.log('get')
  res.send(msgs)
  next()
}
const messagePost = (req, res, next)=>{
  console.log('posted')
  if(req.body === undefined) res.status(400).send("no body")
  if(req.body.message === undefined || 
    req.body.src === undefined ||
    req.body.dst === undefined){
    res.status(400).send("no message")
    next()
  }
  console.log(req.body)
  let id = msgs.length
  let msg = {
    id: id,
    src: req.body.src,
    dst: req.body.dst,
    message: req.body.message 
  }
  msgs.push(msg)
  res.json(msg)
  next()
}
port = process.env.PORT || 3000
app.get('/', chatCtrl.get);
app.get('/messages', chatCtrl.get);
app.post('/', messagePost);
app.post('/messages', messagePost);

const server = http.createServer(app);
const wss = new WebSocket.Server({ server: server, clientTracking: true });
let connectList = {}
 
const msgConstructor = (type, content) =>{
  return JSON.stringify({type: type, content: content})
}

wss.on('connection', function connection(ws, req) {
  let id = Object.keys(connectList).length
  connectList[id] = {id: id, ws: ws}
  let content = 'connect_id: ' + id.toString()
  ws.send(msgConstructor("wsConfirmed", content))
  const location = url.parse(req.url, true);
  // You might use location.query.access_token to authenticate or share sessions 
  // or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312) 
 
  ws.on('message', function incoming(data) {
    console.log('received: %s', data);
    
    let msg = JSON.parse(data)
    let modifiedMsg = 'msg from server: ' + data
    ws.send(msgConstructor("message", modifiedMsg))
    // connectList[0].ws.send(msgConstructor('message', 'private'))
    let msgDoc = new Message({
      src: 'Jeff',
      dst: 'Gar',
      message: msg.content})
    msgDoc.save((err, doc)=>{
      if (err) return console.error(err)
      console.log('doc saved:', doc)
    })
  });
  ws.on('close', ()=>{
    delete connectList[id]
    console.log('closed %s', id)
  })
});

// app.listen(port)
server.listen(3000)

console.log('server port: ', port)
