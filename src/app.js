/** @file This file is source code for the webservice. The webservice uses Express.js. 
 * @author Morten Fyhn Beuchert
*/

const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const morgan = require('morgan')

/** Express.js is used as server */
const app = express()
// for printing out logs
app.use(morgan('combined')) 
// allow the app to easily parse json requsts
app.use(bodyParser.json())
// allow any client to access this server (security risk)
app.use(cors()) 

var admin = require('firebase-admin')
var serviceAccount = require('../serviceAccountKey.json')

/** This function initialises the Firebase Admin SDK */
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://foodwastereduction-6ca48.firebaseio.com'
})

/** Get a Firebase database reference */
var db = admin.database()

/** Get a reference to the 'users' in the database. The object is realtime updated as the database changes */
var usersRef = db.ref('users')

/** @description Endpoint for adding a user. Uses the HTTP POST method.
 *  req - contains an idToken which is part of the query string as well as an HTTP body containg information
 *  about the user to add
 */
app.post('/v1/users', (req, res) => {
  // Check authentication and authorization
  admin.auth().verifyIdToken(req.query.auth)
    .then(function (decodedToken) {
      // Get the user id
      var uid = decodedToken.uid

      // Look up requesting user
      var requestingUserRef = usersRef.child(uid)

      // Check user privileges
      if (requestingUserRef.child('privileges') !== 'admin') {
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
          console.log('Successfully added new user:' + userRecord.uid)
          res.status(200).send('Successfully added new user')
        })
        .catch(function (error) {
          console.log('Error adding new user:' + error.code)

          if (error.code === 'auth/email-already-exists') {
            res.send(409)
          }
          res.send(500)
        })
        .catch(function (error) {
          console.log('Error adding user:', error)
          res.send('error')
        })
    }).catch(function (error) {
      console.log(error)
      res.send(403)
    })
})

/** Endpoint for updating a user (email and privileges). Uses the HTTP PATCH method.
 *  req - contains an idToken which is part of the query string as well as an HTTP body containg information
 *  about the updated user
 */
app.patch('/v1/users/:uid', (req, res) => {
  // Check authentication and authorization
  admin.auth().verifyIdToken(req.query.auth)
    .then(function (decodedToken) {
      // Get the user id
      var uid = decodedToken.uid

      // Look up requesting user
      var requestingUserRef = usersRef.child(uid)

      // Check user privileges
      if (requestingUserRef.child('privileges') !== 'admin') {
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
          res.send(500)
        })
    }).catch(function (error) {
      console.log(error)
      res.send(403)
    })
})

/** Endpoint for deleting a user (email and privileges). Uses the HTTP DELETE method.
 *  req - contains an idToken which is part of the query string as well as an HTTP body containg information
 *  about the user to delete
 */
app.delete('/v1/users/:uid', (req, res) => {
  // Check authentication and authorization
  admin.auth().verifyIdToken(req.query.auth)
    .then(function (decodedToken) {
      // Get the user id
      var uid = decodedToken.uid

      // Look up requesting user
      var requestingUserRef = usersRef.child(uid)

      // Check user privileges
      if (requestingUserRef.child('privileges') !== 'admin') {
        res.set(403)
      }

      var currentUserRef = usersRef.child(req.params.uid)

      admin.auth().deleteUser(req.params.uid)
        .then(function () {
          currentUserRef.remove().then(function () {
            console.log('uid: ' + req.params.uid + ' succcessfully deleted')
            res.send(200)
          })
        })
        .catch(function (error) {
          console.log('Error deleting user:' + error)
          res.send(500)
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
