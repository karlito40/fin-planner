import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'plans'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('title').nullable()
      table.integer('time_horizon').notNullable()
      table.integer('initial_capital').notNullable()
      table.integer('monthly_dca').notNullable()
      table.decimal('expected_annual_return', 5, 2).defaultTo(5).notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
