import chai from 'chai';
import jwt from 'jsonwebtoken';
import knex from 'knex';
import config from '../src/config';
import app from '../src/index';
import { validateDeparture } from '../src/controllers/departureController';

describe('Departure', () => {

  it('should be validated with the link', (done) => {
    const userId = 'membre.abc';

    knex('users').insert(
    {
      username: userId,
      secondary_email: "test@example.com",
      departure_validated: false,
    })
    .then(() => {
      const token = jwt.sign({ userId }, config.secret);

      chai
        .request(app)
        .get(`/deparure/validation?details=${encodeURIComponent(token)}`)
        .redirects(0)
        .then(() =>
          knex('users').select().where({ username: userId })
        )
        .then((dbRes) => {
          dbRes.length.should.equal(1);
          dbRes[0].count.should.equal(2);
        })
        .then(done)
        .catch(done);
    })
    .then(done)
    .catch(done);
  });
});
    // .then(() => {
    //   const token = jwt.sign({ userId }, config.secret);

    //   chai
    //     .request(app)
    //     .get(`/deparure/validation?details=${encodeURIComponent(token)}`)
    //     .redirects(0)
    //     .then(() =>
    //       knex('users').select().where({ username: userId, departure_validated: true })
    //     )
    //     .then((dbres) => {
    //       dbres.length.should.equal(1);
    //     })
    //     .then(done)
    //     .catch(done);
    // })
    // .then(done)
    // .catch(done);
//   });
// });
