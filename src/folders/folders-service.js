const FoldersService = {

  //GET
  getAllFolders(knex) {
    return knex
      .select('*')
      .from('folders')
  },

  getFolderById(knex, id) {
    return knex
      .select('*')
      .from('folders')
      .where({ id })
      .first()
  },

  //POST
  addFolder(knex, folderData) {
    return knex
      .insert(folderData)
      .into('folders')
      .returning('*')
      .then(rows => {
        return rows[0]
      })
  },

  //UPDATE
  updateFolder(knex, id, newData) {
    return knex
      .update(newData)
      .from('folders')
      .where({ id })
  },

  //DELETE
  deleteFolder(knex, id) {
    return knex
      .delete()
      .from('folders')
      .where({ id })
  },
}

module.exports = FoldersService