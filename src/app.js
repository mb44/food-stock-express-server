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
app.get('/users', (req, res) => {
  res.send({
    users: users
  })
})

// 2. add user
app.post('/users', (req, res) => {
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
app.patch('/users/:uid', (req, res) => {
  var currentUserRef = usersRef.child(req.params.uid)
  currentUserRef.update({
    'privileges': req.body.privileges
  }, function (error) {
    if (error) {
      console.log('User privileges not updated: ' + error)
      res.send('User privileges not updated: ' + error)
    } else {
      console.log('User privileges successfully updated')
      res.send('User privileges successfully updated')
    }
  })
})

// 4. delete user
app.delete('/users/:uid', (req, res) => {
  var currentUserRef = usersRef.child(req.params.uid)

  admin.auth().deleteUser(req.params.uid)
    .then(function () {
      currentUserRef.remove().then(function () {
        console.log('uid: ' + req.params.uid + ' succcessfully deleted')
        res.send('uid: ' + req.params.uid + ' succcessfully deleted')
      })
    })
    .catch(function (error) {
      console.log('Error deleting user:' + error)
      res.send('Error deleting user:' + error)
    })
})

app.listen(process.env.PORT || 8081)
