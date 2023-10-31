export async function saveToken(username: string, token: string, email: string) {
    try {
      const expirationDate = new Date();
      expirationDate.setMinutes(expirationDate.getMinutes() + 90); // set duration to 1h30, some users receives emails one hours after
  
      await knex('login_tokens').insert({
        token,
        username,
        email,
        expires_at: expirationDate,
      });
      console.log(`Login token créé pour ${email}`);
    } catch (err) {
      console.error(`Erreur de sauvegarde du token : ${err}`);
      throw new Error('Erreur de sauvegarde du token');
    }
}

export function generateToken() {
    return crypto.randomBytes(256).toString('base64');
}

export async function sendLoginEmail(email: string, username: string, loginUrlWithToken: string) {
    const user = await BetaGouv.userInfosById(username);
    if (!user) {
      throw new Error(
        `Membre ${username} inconnu·e sur ${config.domain}. Avez-vous une fiche sur Github ?`
      );
    }
  
    if (utils.checkUserIsExpired(user, 5)) {
      throw new Error(`Membre ${username} a une date de fin expiré sur Github.`);
    }
  
    try {
      await sendEmail({
        toEmail: [email],
        type: EMAIL_TYPES.LOGIN_EMAIL,
        variables: {
          loginUrlWithToken
        }
      });
    } catch (err) {
      console.error(err);
      throw new Error("Erreur d'envoi de mail à ton adresse.");
    }
  }
