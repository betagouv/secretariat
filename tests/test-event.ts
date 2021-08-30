import { addEvent, EventCode } from '../src/lib/events'
import knex from '../src/db';

describe('Add events', () => {
    it('should add event to db properly', async () => {
        const event = await addEvent(EventCode.CREATE_REDIRECTION, {
            created_by_username: 'membre.actif',
            action_on_username: 'membre.expire',
        });
        console.log(event)
        const res = await knex('events').where({
            id: event.id
        }).then(db => db[0])
        res.action_description.should.equal(`création d'une redirection`)
        res.created_by_username.should.equal('membre.actif')
        res.action_on_username.should.equal('membre.expire')
    })
});
