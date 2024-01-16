const errorHandler = (err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    // redirect to login and keep the requested url in the '?next=' query param
    if (req.method === 'GET') {
      req.flash(
        'message',
        'Pour accéder à cette page vous devez vous identifier, vous pouvez le faire en renseignant votre email juste en dessous.'
      );
      const nextParam = req.url ? `?next=${req.url}` : '';
      return res.redirect(`/login${nextParam}`);
    }
  }
  return next(err);
};

export { errorHandler };
