import express from 'express'
import http from 'http'
import { AddressInfo } from 'net'
import { Server } from 'socket.io'

const app = express()
app.use(express.static(__dirname + '/forward'))
const httpServer = http.createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: '*',
    credentials: true
  },
  allowEIO3: true
})

io.on('connection', (socket) => {
  socket.join('forward')
  console.log('connection~')

  socket.to('forward').emit('join', socket.id)

  socket.on('disconnect', () => {
    socket.to('forward').emit('leave', socket.id)
  })

  socket.on('offer', (offer) => {
    console.log('get offer')
    socket.to('forward').emit('offer', offer)
  })
  socket.on('answer', (answer) => {
    console.log('get answer')
    socket.to('forward').emit('answer', answer)
  })
  socket.on('candidate', (candidate) => {
    console.log('get candidate')
    socket.to('forward').emit('candidate', candidate)
  })
})

export function createServer(port: number) {
  if ((httpServer?.address() as AddressInfo)?.port === port) return
  // 在指定端口启动服务器
  httpServer.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`)
  })
}

export function closeServer() {
  httpServer.close()
}
