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

var usersRef = db.ref('users')

// Attach an asynchronous callback to read the data at our posts reference
usersRef.on('value', function (snapshot) {
  console.log(snapshot.val())
  users = snapshot.val()
}, function (errorObject) {
  console.log('The read failed: ' + errorObject.code)
})

// HTTP Endpoints
// 1. get users
app.get('/get-users', (req, res) => {
  res.send({
    users: users
  })
})

// 2. add user
app.post('/add-user', (req, res) => {
  admin.auth().createUser({
    email: req.body.email,
    password: req.body.password
  })
    .then(function (userRecord) {
      // Add user to database
      usersRef.child(userRecord.uid).set({
        email: req.body.email,
        privileges: req.body.privileges
      })

      console.log('Successfully created new user:' + userRecord.uid)
      res.send('added user with id: ' + userRecord.uid)
    })
    .catch(function (error) {
      console.log('Error creating new user:' + error)
      res.send('Error creating new user: ' + error)
    })
})

// 3. update user privileges
app.post('/update-user-privileges/:uid', (req, res) => {
  console.log(req.params.uid)
  var currentUserRef = usersRef.child(req.params.uid)
  currentUserRef.update({
    'privileges': req.body.privileges
  })
})

app.listen(process.env.PORT || 8081)
