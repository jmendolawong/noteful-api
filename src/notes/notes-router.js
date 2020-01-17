// Require different dependencies along with NotesService
const express = require('express')
const xss = require('xss')
const path = require('path')
const NotesService = require('./notes-service')

// Assign the router and the jsonParser (which is just a way to ready the JSON body)
const notesRouter = express.Router()
const bodyParser = express.json()

// Sanitize to prevent malicious data
const sanitizeNote = note => ({
  id: note.id,
  name: xss(note.name),
  modified: note.modified,
  folderid: note.folderid,
  content: xss(note.content)
})


/* Router
   add the router base path '/'
   then each CRUD operation associated with that path
*/
notesRouter
  .route('/')
  .get((req, res, next) => {
    NotesService.getAllNotes(
      req.app.get('db') //need to add this in the app.js
    )
      .then(notes => {
        res.json(notes.map(sanitizeNote))
      })
      .catch(next)
  })
  .post(bodyParser, (req, res, next) => {
    // Get the data from the request body (readable by bodyParser) and then put it in newNote
    const { name, modified, folderid, content = "" } = req.body
    const newNote = { name, modified, folderid}
    

    // Run through to make sure supplied data is there for non null column
    for (const [key, value] of Object.entries(newNote)) {
      if (value == null) {
        return res
          .status(400)
          .json({
            error: { message: `Missing ${key} in request body` }
          })
      }
    }

    // Add nullible column data, i.e. 'content'
    newNote.content = content

    // Now call service for knex calls
    NotesService.addNote(
      req.app.get('db'),
      newNote
    )
      // Send 201 status - successful creation
      // Location of the newly created note
      // Response json after sanitization

      .then(note => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/notes/${note.id}`))
          .json(sanitizeNote(note))
      })
      .catch(next)

  })


/* Router
 add the router base path - '/:notes_id
 then each CRUD operation associated with that path
 updateNote, deleteNote, getNoteById
*/
notesRouter
  .route('/:note_id')
  // Use the .all handler to catch error for all following CRUD operations if note doesn't exist
  .all((req, res, next) => {
    NotesService.getNoteById(
      req.app.get('db'),
      req.params.note_id
    )
      .then(note => {
        if (!note) {
          return res
            .status(404)
            .json({
              error: { message: `Note doesn't exist` }
            })
        }
        res.note = note
        next()
      })
      .catch(next)
  })
  .get((req, res, next) =>
    // req is not needed here because .all handler has already moved to the response
    // specifically for getNoteById
    res.json(sanitizeNote(res.note))
  )
  .delete((req, res, next) => {
    NotesService.deleteNote(
      req.app.get('db'),
      req.params.note_id
    )
      .then(() => {
        res.status(204).end()
      })
      .catch(next)
  })
  // Similar to post, need to extract key, value pairs
  // make sure they're not trying to update to null
  // then plug them in
  .patch(bodyParser, (req, res, next) => {
    const { name, modified, folderid, content = "" } = req.body
    const noteToUpdate = { name, modified, folderid, contents }

    const numOfValues = Object.values(noteToUpdate).filter(Boolean).length
    if (numOfValues === 0) {
      return res
        .status(400)
        .json({
          error: { message: `Req body must contain at least 'name', 'modified', or 'folderid` }
        })
    }

    NotesService.updateNote(
      req.app.get('db'),
      req.params.note_id,
      noteToUpdate
    )
    .then(numOfRowsAffected => {
      res.status(204).end()
    })
    .catch(next)
  })

  module.exports = notesRouter