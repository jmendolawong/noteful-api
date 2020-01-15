const app = require('./app')
const knex = require('knex')
const { PORT, DB_URL } = require('./config.js')

const db = knex({
  client: 'pg',
  connection: DB_URL
})

app.set('db', db)


app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})