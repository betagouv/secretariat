import betagouv from "@/betagouv";

export enum DAY_OF_THE_WEEK {
     MONDAY=1,
     TUESDAY=2,
     WEDNESDAY=3,
     THURSDAY=4,
     FRIDAY=5,
     SATURDAY=6,
     SUNDAY=7
}

function getAllXDaysOfTheMonth(dayOfTheWeek: DAY_OF_THE_WEEK=0) : Date[] {
     var d = new Date(),
         month = d.getMonth(),
         allXDaysOfTheWeek = [];
 
     d.setDate(1);
 
     // Get the first DaysOfTheWeek in the month
     while (d.getDay() !== dayOfTheWeek) {
          d.setDate(d.getDate() + 1);
     }
 
     // Get all the other DaysOfTheWeek in the month
     while (d.getMonth() === month) {
          allXDaysOfTheWeek.push(new Date(d.getTime()));
          d.setDate(d.getDate() + 7);
     }
 
     return allXDaysOfTheWeek;
}


const datesAreOnSameDay = (first: Date, second: Date) =>
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate();

export const sendGroupDeSoutienReminder = async (canal: string='general', dayOfTheWeek:DAY_OF_THE_WEEK=0, nXDayOfTheWeek: number=0) => {
     const message = `# Groupe de soutien 
Si vous vous trouvez dans une situation de conflit, mal-être ou souffrance, violence ou harcèlement et que vous souhaitez en parler, un groupe de soutien constitué de membres de la communauté est disponible pour vous écouter en respectant la confidentialité de votre situation. 
Vous pouvez les joindre à l'adresse mail soutien@beta.gouv.fr ou individuellement. 
*Les membres du groupe : Anne Poirot, Bréanne Mallat, Camille Garrigue, Caroline Lawson, Clémence Lopez, Denis Baudot, Florian Briand , Mélodie Dahi, Rebecca Dumazert.*` 
     const XMondayOfTheMonth = getAllXDaysOfTheMonth(dayOfTheWeek)[nXDayOfTheWeek]
     if (datesAreOnSameDay(XMondayOfTheMonth, new Date())) {
          await betagouv.sendInfoToChat(message, canal);
     }
}