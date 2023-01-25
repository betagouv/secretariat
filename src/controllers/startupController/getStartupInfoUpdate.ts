import betagouv from "@/betagouv";
import { StartupInfoUpdatePage } from '@views';
import { PULL_REQUEST_STATE } from "@/models/pullRequests";
import db from "@/db";
import { StartupInfo } from "@/models/startup";
import config from "@/config";

export async function getStartupInfoUpdate(req, res) {
    try {
      const title = 'Changer une startup de phase';
      const formValidationErrors = {}
      const startups : StartupInfo[] = await betagouv.startupsInfos();
      const startupOptions = startups.map(startup => {
        return {
          value: startup.id,
          label: startup.attributes.name
        }
      })
      const updatePullRequest = await db('pull_requests')
        .where({
          status: PULL_REQUEST_STATE.PR_STARTUP_UPDATE_CREATED,
          startup: req.params.startup,
        })
        .orderBy('created_at', 'desc')
        .first()
      res.send(
        StartupInfoUpdatePage({
          title,
          formValidationErrors,
          currentUserId: req.auth.id,
          startupOptions,
          isAdmin: config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id),
          startup: req.params.startup,
          startupsInfos: startups,
          activeTab: 'startups',
          subActiveTab: 'udpate-phase',
          username: req.auth.id,
          updatePullRequest,
          formData: {
          },
          errors: req.flash('error'),
          messages: req.flash('message'),
          request: req
        })
      )
    } catch (err) {
      console.error(err);
      req.flash('error', 'Impossible de récupérer les information de la startup.');
      return res.redirect('/');
    }
  }
  
