/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = pgm => {
  pgm.createTable('reblooms', {
    id: 'id',
    bloom_id: { type: 'bigint', notNull: true, references: 'blooms(id)' },
    user_id: { type: 'int', notNull: true, references: 'users(id)' },
    rebloom_timestamp: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
  });

  pgm.addConstraint('reblooms', 'unique_user_bloom', {
    unique: ['bloom_id', 'user_id']
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */

export const down = pgm => {
  pgm.dropTable('reblooms');
};
