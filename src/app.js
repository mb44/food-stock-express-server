const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const morgan = require('morgan')

const app = express()
app.use(morgan('combined')) // for printing out logs
app.use(bodyParser.json()) // allow the app to easily parse json requsts
app.use(cors()) // allow any client to access this server (security risk)

var admin = require('firebase-admin')
var serviceAccount = require('../serviceAccountKey.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://foodwastereduction-6ca48.firebaseio.com'
})

var users = null

// Firebase
// Get a database reference to our posts
var db = admin.database()
var ref = db.ref('users')

// Attach an asynchronous callback to read the data at our posts reference
ref.on('value', function (snapshot) {
  console.log(snapshot.val())
  users = snapshot.val()
}, function (errorObject) {
  console.log('The read failed: ' + errorObject.code)
})

// HTTP Endpoints
app.get('/get-users', (req, res) => {
  res.send({
    users: users
  })
})

app.listen(process.env.PORT || 8081)
