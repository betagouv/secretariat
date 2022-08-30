import betagouv from "@/betagouv";
import { addEvent, EventCode } from "@/lib/events";

export async function setEmailResponder(req, res) {
    const formValidationErrors: string[] = [];
  
    function requiredError(field) {
      formValidationErrors.push(`${field} : le champ n'est pas renseigné`);
    }
  
    function isValidDate(field, date) {
      if (date instanceof Date && !Number.isNaN(date.getTime())) {
        return date;
      }
      formValidationErrors.push(`${field} : la date n'est pas valide`);
      return null;
    }
  
    const { from, to } = req.body;
    const content = req.body.content || requiredError('content')
    const startDate = isValidDate('nouvelle date de debut', new Date(from));
    const endDate = isValidDate('nouvelle date de fin', new Date(to));
  
    if (startDate && endDate) {
      if (endDate < startDate) {
        formValidationErrors.push('nouvelle date de fin : la date doit être supérieure à la date de début');
      }
    }
  
    try {
      if (formValidationErrors.length) {
        req.flash('error', formValidationErrors);
        throw new Error();
      }
  
      if (req.body.method !== 'update') {
        await betagouv.setResponder(req.auth.id, {
          from: startDate,
          to: endDate,
          content
        })
        addEvent(EventCode.MEMBER_RESPONDER_CREATED, {
          created_by_username: req.auth.id,
          action_on_username: req.auth.id,
          action_metadata: {
            value: content
          }
        })
      } else {
        const responder = await betagouv.getResponder(req.auth.id)
        await betagouv.updateResponder(req.auth.id, {
          from: startDate,
          to: endDate,
          content
        })
        addEvent(EventCode.MEMBER_RESPONDER_UPDATED, {
          created_by_username: req.auth.id,
          action_on_username: req.auth.id,
          action_metadata: {
            value: content,
            old_value: responder.content,
          }
        })
      }
    } catch(err) {
      console.error(err);
      if (err.message) {
        const errors = req.flash('error');
        req.flash('error', [...errors, err.message]);
      }
    }
    return res.redirect('/account');
  }
  