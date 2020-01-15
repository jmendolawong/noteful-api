// Require different dependencies along with FoldersService
const express = require('express')
const path = require('path')
const xss = require('xss')
const FoldersService = require('./folders-service')

// Assign the router and the jsonParser (which is just a way to ready the JSON body)
const foldersRouter = express.Router()
const bodyParser = express.json()

// Sanitize to prevent malicious data - simple with limited amount of column data
sanitizeFolders = folder => ({
  id: xss(folder.id),
  name: xss(folder.name)
})

/* Router
   add the router base path '/'
   then each CRUD operation associated with that path
*/
foldersRouter
  .route('/')
  .get((req, res, next) => {
    FoldersService.getAllFolders(
      req.app.get('db')
    )
      .then(folders => {
        res.json(folders.map(sanitizeFolders))
      })
      .catch(next)
  })
  // Get the data from the request body (readable by bodyParser) and then put it in newNote
  .post(bodyParser, (req, res, next) => {
    const { id, name } = req.body
    const newFolder = { id, name }

    // Run through to make sure supplied data is there for non null column
    for (const [key, value] of Object.entries(newFolder)) {
      if (value == null) {
        res
          .status(400)
          .json({
            error: { message: `Missing folder ${key} in request body` }
          })
      }
    }

    // Now call service for knex calls
    FoldersService.addFolder(
      req.app.get('db'),
      newFolder
    )
      // Send 201 status - successful creation
      // Location of the newly created note
      // Response json after sanitization
      .then(folder => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/folders/${folder.id}`))
          .json(sanitizeFolders(folder))
      })
      .catch(next)
  })

/* Router
 add the router base path - '/:notes_id
 then each CRUD operation associated with that path
 updateNote, deleteNote, getNoteById
*/
foldersRouter
  .route('/:folder_id')

  // Use the .all handler to catch error for all following CRUD operations if note doesn't exist
  .all((req, res, next) => {
    FoldersService.getFolderById(
      req.app.get('db'),
      req.params.folder_id
    )
      .then(folder => {
        if (!folder) {
          return res
            .status(404)
            .json({
              error: { message: `Folder doesn't exist` }
            })
        }
        res.folder = folder
        next()
      })
      .catch(next)
  })
  // req is not needed here because .all handler has already moved to the response
  // specifically for getNoteById
  .get((req, res, next) => {
    res.json(sanitizeFolders(res.folder))
  })
  // Delete is easy because it just sends the status, nothing else is needed
  .delete((req, res, next) => {
    FoldersService.deleteFolder(
      req.app.get('db'),
      req.params.folder_id
    )
      .then(() => {
        res
          .status(204)
          .end()
      })
      .catch(next)
  })

  // Similar to post, need to extract key, value pairs
  // make sure they're not trying to update to null
  // then plug them in
  .patch(bodyParser, (req, res, next) => {
    const { name } = req.body
    const folderToUpdate = { name }

    const numberOfValues = Object.values(folderToUpdate).filter(Boolean).length
    if (numberOfValues === 0) {
      return res
        .status(400)
        .json({
          error: { message: `Req body must contain name to update` }
        })
    }

    FoldersService.updateFolder(
      req.app.get('db'),
      req.params.folder_id,
      folderToUpdate
    )
      .then(rowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })

module.exports = foldersRouter