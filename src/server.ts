import { server } from './server-config'

const port = process.env.SERVERPORT || 3001

server.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
