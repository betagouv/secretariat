import betagouv from '@/betagouv';
import { addEvent, EventCode } from '@lib/events';

export async function deleteEmailResponderApi(req, res) {
  deleteEmailResponderHandler(
    req,
    res,
    () => {
      res.json({
        message: 'Success',
      });
    },
    () => {
      res.json({
        error: req.flash('error'),
      });
    }
  );
}

export async function deleteEmailResponder(req, res) {
  deleteEmailResponderHandler(
    req,
    res,
    () => {
      res.redirect('/account');
    },
    () => {
      res.redirect('/account');
    }
  );
}
export async function deleteEmailResponderHandler(
  req,
  res,
  onSuccess,
  onError
) {
  try {
    await betagouv.deleteResponder(req.auth.id);
    addEvent(EventCode.MEMBER_RESPONDER_DELETED, {
      created_by_username: req.auth.id,
      action_on_username: req.auth.id,
    });
  } catch (err) {
    const errorMessage = `Une erreur est intervenue lors de la suppression de la réponse automatique : ${err}`;
    console.error(errorMessage);
    req.flash('error', errorMessage);
    return onError();
  }
  return onSuccess();
}
