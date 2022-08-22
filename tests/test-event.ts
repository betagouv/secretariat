import { addEvent, EventCode } from '@/lib/events'
import knex from '@/db';

describe('Add events', () => {
    it('should add event to db properly', async () => {
        const event = await addEvent(EventCode.MEMBER_REDIRECTION_CREATED, {
            created_by_username: 'membre.actif',
            action_on_username: 'membre.expire',
            action_metadata: {
                value: 'toto@gmail.com'
            }
        });
        const res = await knex('events').select('*').orderBy('created_at', 'desc').then(db => db[0])
        res.action_metadata.should.equal(`"value"=>"toto@gmail.com"`)
        res.created_by_username.should.equal('membre.actif')
        res.action_on_username.should.equal('membre.expire')
    })
});
