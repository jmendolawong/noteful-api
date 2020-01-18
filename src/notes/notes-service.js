const NotesService = {
  //GET
  getAllNotes(knex) {
    return knex
      .select('*')
      .from('notes')
  },

  getNoteById(knex, id) {
    return knex
      .select('*')
      .from('notes')
      .where({ id })
      .first()
  },

 

  //POST
  addNote(knex, noteData) {
    return knex
      .insert(noteData)
      .into('notes')
      .returning('*')
      .then(rows => {
        return rows[0]
      })
  },

  //DELETE
  deleteNote(knex, id) {
    return knex
      .delete()
      .from('notes')
      .where({ id })
  },

  //UPDATE
  updateNote(knex, id, newData) {
    return knex
      .update(newData)
      .from('notes')
      .where({ id })
  }
}

module.exports = NotesService