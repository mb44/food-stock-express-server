const express = require('express')
const bodyParser = require('body-parser')
// const cors = require('cors')
const morgan = require('morgan')

const app = express()
app.use(morgan('combined')) // for printing out logs
// allow the app to easily parse json requsts
app.use(bodyParser.json())
// app.use(cors()) // allow any client to access this server (security risk)

var admin = require('firebase-admin')
var serviceAccount = require('../serviceAccountKey.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://foodwastereduction-6ca48.firebaseio.com'
})

// Firebase
// Get a database reference to our posts
var db = admin.database()

var usersRef = db.ref('users')

app.all('/', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', 'Origin')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Accept')
  next()
})

// 1. add user
app.post('/v1/users', (req, res) => {
  // Check authentication and authorization
  admin.auth().verifyIdToken(req.query.auth)
    .then(function (decodedToken) {
      // Get the user id
      var uid = decodedToken.uid

      // Look up requesting user
      var requestingUserRef = usersRef.child(uid)

      // Check user privileges
      if (requestingUserRef.child('privileges') !== admin) {
        res.set(403)
      }

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
          res.status(200).send('Successfully adder new user')
        })
        .catch(function (error) {
          console.log('Error creating new user:' + error.code)

          if (error.code === 'auth/email-already-exists') {
            res.send(409)
          }
          res.status(409).send('Error creating new user')
        })
        .catch(function (error) {
          console.log('Error updating user:', error)
          res.send('erorr')
        })
    }).catch(function (error) {
      console.log(error)
      res.send(403)
    })
})

// 2. update user (email and privileges)
app.patch('/v1/users/:uid', (req, res) => {
  // Check authentication and authorization
  admin.auth().verifyIdToken(req.query.auth)
    .then(function (decodedToken) {
      // Get the user id
      var uid = decodedToken.uid

      // Look up requesting user
      var requestingUserRef = usersRef.child(uid)

      // Check user privileges
      if (requestingUserRef.child('privileges') !== admin) {
        res.set(403)
      }

      // Look up user to update
      var currentUserRef = usersRef.child(req.params.uid)

      admin.auth().updateUser(req.params.uid, {
        email: req.body.email
      })
        .then(function (userRecord) {
          currentUserRef.update({
            'email': req.body.email,
            'privileges': req.body.privileges
          }, function (error) {
            if (error) {
              console.log('User privileges not updated: ' + error)
              res.send('User privileges not updated')
            } else {
              // See the UserRecord reference doc for the contents of userRecord.
              console.log('Successfully updated user', userRecord.toJSON())
              res.status(200).send('Successfully updated user')
            }
          })
        })
        .catch(function (error) {
          console.log('Error updating user:', error)
          res.send('errrrorrr')
        })
    }).catch(function (error) {
      console.log(error)
      res.send(403)
    })
})

// 3. delete user
app.delete('/v1/users/:uid', (req, res) => {
  // Check authentication and authorization
  admin.auth().verifyIdToken(req.query.auth)
    .then(function (decodedToken) {
      // Get the user id
      var uid = decodedToken.uid

      // Look up requesting user
      var requestingUserRef = usersRef.child(uid)

      // Check user privileges
      if (requestingUserRef.child('privileges') !== admin) {
        res.set(403)
      }

      var currentUserRef = usersRef.child(req.params.uid)

      admin.auth().deleteUser(req.params.uid)
        .then(function () {
          currentUserRef.remove().then(function () {
            console.log('uid: ' + req.params.uid + ' succcessfully deleted')
            res.status(200).type('json').send('{}')
          })
        })
        .catch(function (error) {
          console.log('Error deleting user:' + error)
          res.status(500).send('Error deleting user')
        })
    }).catch(function (error) {
      console.log(error)
      res.send(403)
    })
})

var port = 8081
app.listen(port, function () {
  console.log('Server running on port ' + port)
})
