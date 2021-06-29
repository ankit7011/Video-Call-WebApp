let express = require('express');
let app=express();
let server=require('http').Server(app)
let io=require('socket.io')(server)
let path=require('path')
let favicon = require('serve-favicon')
let stream = require( './ws/stream' );

app.use(favicon (path.join(__dirname,'video-call.png')) )
app.use('/assets',express.static(path.join(__dirname,'assets')))


app.get('/',(req,res) => {
    res.sendFile(__dirname + '/index.html')
})

io.of('/stream').on('connection',stream);

server.listen(3030)