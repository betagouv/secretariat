import betagouv from "@/betagouv";
import knex from "@/db";
import * as utils from "@controllers/utils";
import { DBUser, statusOptions, genderOptions } from "@/models/dbUser/dbUser";
import { BaseInfoUpdatePage } from '@views';
import { MemberWithPermission } from "@/models/member";

export async function getBaseInfoUpdate(req, res) {
    try {
      const [currentUser] : [MemberWithPermission, DBUser] = await Promise.all([
        (async () => utils.userInfos(req.auth.id, true))(),
        (async () => {
          const rows = await knex('users').where({ username: req.auth.id });
          return rows.length === 1 ? rows[0] : null;
        })()
      ]);
      const title = 'Mon compte';
      const formValidationErrors = {}
      const startups = await betagouv.startupsInfos();
      const startupOptions = startups.map(startup => {
        return {
          value: startup.id,
          label: startup.attributes.name
        }
      })
      res.send(
        BaseInfoUpdatePage({
          title,
          formValidationErrors,
          currentUserId: req.auth.id,
          startups,
          genderOptions,
          statusOptions,
          startupOptions,
          activeTab: 'account',
          username: req.auth.id,
          formData: {
            startups: currentUser.userInfos.startups,
            role: currentUser.userInfos.role,
            missions: currentUser.userInfos.missions,
            end: currentUser.userInfos.end,
            start: currentUser.userInfos.start
          },
          errors: req.flash('error'),
          messages: req.flash('message'),
          request: req
        })
      )
    } catch (err) {
      console.error(err);
      req.flash('error', 'Impossible de récupérer vos informations.');
      return res.redirect('/');
    }
  }
  