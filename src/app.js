const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const morgan = require('morgan')

const app = express()
app.use(morgan('combined')) // for printing out logs
app.use(bodyParser.json()) // allow the app to easily parse json requsts
app.use(cors()) // allow any client to access this server (security risk)

app.get('/status', (req, res) => {
  res.send({
    message: 'hello world!'
  })
})

app.listen(process.env.PORT || 8081)
