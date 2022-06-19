/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

import crypto from 'crypto';
import { DBUser } from '../src/models/dbUser'

exports.up = async function(knex) {
    const users: DBUser[] = await knex('users')
    const salt : string = process.env.HASH_SALT as string
    for (const user of users) {
        var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
        hash.update(user.username);
        var value = hash.digest('hex');
        await knex('user_details').insert({
            hash: value,
            gender: user.gender,
            tjm: user.tjm
        })
    }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    await knex('user_details').truncate()
};
