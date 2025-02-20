import OpenAI from "openai";
import AppError from "../../error/AppError";
import httpStatus from 'http-status'
import config from "../../config";
import Access_comments from "./access_comments.model";
import path from 'path';
import { sendEmail } from '../../utils/mailSender';
import fs from 'fs';
import cron from 'node-cron';

const generate_comment = async (body: { feedbackData: any, language: string }, apiKey: string) => {
    const { feedbackData, language } = body;
    const { improvements, ...others } = feedbackData;

    const client = new OpenAI({
        apiKey: apiKey,
    });

    // const responses = await client.models.list();
    // console.log("model", responses);

    // if (!feedbackData) {
    //     return new Response(JSON.stringify({ error: "Missing feedback data" }), {
    //         status: 400,
    //         headers: { "Content-Type": "application/json" },
    //     });
    // }

    // Convert the improvements object to a string, only including areas that need improvement (i.e., where true)
    const improvementComments = improvements
        ? Object.entries(improvements)
            .filter(([area, needsImprovement]) => needsImprovement === true) // Only include areas that need improvement
            .map(([area]) => `${area} needs improvement`) // Generate improvement statements
            .join(", ") // Join all statements with commas
        : ""; // De

    let prompt = "";

    if (language === "fr") {
        // French language prompt
        const pronoun = feedbackData.gender === "Girl" ? "elle" : "il";
        const possessive = feedbackData.gender === "Girl" ? "sa" : "son";

        // Build the full prompt
        prompt = `
      Écrivez un commentaire détaillé pour le bulletin de l'élève, basé sur les données suivantes. Le commentaire doit être informatif, détaillé, mais ne pas dépasser 6 lignes. Utilisez le ton suivant : '${feedbackData?.toneOfVoice
            }'.  
      Un 'true' signifie que l'élève doit améliorer ses compétences, tandis qu'un 'false' signifie que l'élève fait bien dans ce domaine.  
      Ne commencez ni ne terminez le commentaire par des phrases génériques. 
      
      Améliorations nécessaires : ${improvementComments || "Aucune amélioration nécessaire"
            }
      
      Autres commentaires : ${JSON.stringify(others)}

      Commentaires : ${JSON.stringify(feedbackData)}

      Exemple de commentaire :  
      "Micheal a montré des progrès notables dans plusieurs domaines; ${pronoun} vocabulaire en langue parlée s'élargit et ${pronoun} commence à former des phrases simples. ${pronoun} lit des syllabes et des mots, fait des calculs, ${possessive} écriture s'améliore également et ${pronoun} écrit plus vite. Cependant, Micheal doit encore apprendre à être plus responsable et respecter les règles. Cette attitude l'aidera à améliorer ${possessive} résultats. Ses réussites sont encore fragiles mais progressent cette année. Il faut continuer à fournir des efforts. Les sessions de soutien en langue française l'aideront à consolider ses bases linguistiques."
      `;
    } else {
        // English language prompt
        const pronoun = feedbackData.gender === "Girl" ? "she" : "he";
        const possessive = feedbackData.gender === "Girl" ? "her" : "his";

        // Build the full prompt
        prompt = `
      Write a detailed comment for the student's report card based on the following feedback. The comment should be informative, detailed, and no more than 6 lines. Use the following tone: '${feedbackData?.toneOfVoice
            }'.  
      A 'true' means the student needs improvement, while a 'false' means the student is doing well in that area.  
      Do not begin or end the comment with generic sentences. 

      Improvements needed in the following areas: ${improvementComments || "No improvements needed"
            }
      
      Other feedback: ${JSON.stringify(others)}

      Feedback: ${JSON.stringify(feedbackData)}

      Example comment:  
      "Micheal has made significant progress in several areas; ${pronoun} vocabulary is expanding in spoken language and ${pronoun} is starting to form simple sentences. ${pronoun} reads syllables and words, performs calculations, ${possessive} handwriting is improving, and ${pronoun} writes faster. However, Micheal still needs to develop a more responsible attitude and respect the rules. This behavior will help ${pronoun} improve ${possessive} results. ${pronoun} achievements are still fragile but progressing this semester. Continued efforts are needed. French language support sessions will help Micheal strengthen ${possessive} linguistic foundations."
      `;
    }

    const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.7,
    });

    const comment = response.choices[0]?.message?.content?.trim();
    if (!comment) {
        // throw new Error("No valid comment generated.");
        throw new AppError(
            httpStatus.NOT_FOUND,
            'No valid comment generated.',
        );
    }

    return comment;

    // return new Response(JSON.stringify({ comment }), {
    //     status: 200,
    //     headers: { "Content-Type": "application/json" },
    // });
}

const checkAccess = async (
    userId: string,
    role: string,
    cycle: string
): Promise<{ usedPlan: string; accessCycle: string }> => {

    const userAccess = await Access_comments.findOne({ user: userId });

    if (!userAccess) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'You have not any subscription',
        );
    }

    let usedPlan = 'premium';

    //check user role is 1 and his free comment limit is finish or not
    if (role == '1') {

        if (userAccess.plans.free?.comment_generate_limit || userAccess.plans.free?.comment_generated) {

            if (userAccess.plans.free?.comment_generate_limit > userAccess.plans.free?.comment_generated) {
                usedPlan = 'free'
                return { usedPlan, accessCycle: 'all' }
            }
            else {
                throw new AppError(
                    httpStatus.FORBIDDEN,
                    'Your free limit is expired!',
                );
            }
        } else {
            throw new AppError(
                httpStatus.FORBIDDEN,
                'Your free limit is expired!',
            );
        }
    }

    if (role == '4') {
        if ((userAccess.plans.premium?.comment_generate_limit || 0) <= 0) {
            throw new AppError(
                httpStatus.FORBIDDEN,
                `You have not any subscription`,
            );
        }
        if (userAccess.plans.premium?.expiredAt && (new Date(userAccess.plans.premium?.expiredAt) > new Date())) {
            if (userAccess.plans.premium?.comment_generate_limit > userAccess.plans.premium?.comment_generated) {
                usedPlan = 'premium'
                return { usedPlan, accessCycle: 'all' }
            } else {
                throw new AppError(
                    httpStatus.FORBIDDEN,
                    'Your School comment generate limit expired !',
                );
            }
        } else {
            throw new AppError(
                httpStatus.FORBIDDEN,
                'Your School subscription expired !',
            );
        }
    }


    // check user initially purchase a subscription for handle message
    let msg = ''

    if ((userAccess.plans.standard?.comment_generate_limit || 0) <= 0) {
        msg = `You have not any subscription`;
    } else {
        msg = ''
    }

    // check user have a standard plan with expire date and comment generate limit and he use previous cycle or not
    if (userAccess.plans.standard?.expiredAt && (new Date(userAccess.plans.standard?.expiredAt) > new Date())) {
        if (userAccess.plans.standard?.comment_generate_limit > userAccess.plans.standard?.comment_generated) {
            if ((userAccess.plans.standard?.accessCycle !== 'all')) {
                if (userAccess.plans.standard?.accessCycle !== cycle) {

                    // check user initially purchase a subscription for handle message
                    if ((userAccess.plans.premium?.comment_generate_limit || 0) <= 0) {
                        msg = `You have not any subscription`;
                    }

                    // check user have a premium plan with expire date and comment generate limit
                    if (userAccess.plans.premium?.expiredAt && (new Date(userAccess.plans.premium?.expiredAt) > new Date())) {
                        if (userAccess.plans.premium?.comment_generate_limit > userAccess.plans.premium?.comment_generated) {
                            usedPlan = 'premium'
                            return { usedPlan, accessCycle: 'all' }
                        }
                        else {
                            // check user initially purchase a subscription for handle message
                            if (msg) {
                                throw new AppError(
                                    httpStatus.FORBIDDEN,
                                    msg,
                                );
                            }
                            throw new AppError(
                                httpStatus.FORBIDDEN,
                                `You can access only cycle ${userAccess.plans.standard?.accessCycle}`,
                            );
                        }
                    }
                    else {
                        // check user initially purchase a subscription
                        throw new AppError(
                            httpStatus.FORBIDDEN,
                            `You can access only cycle ${userAccess.plans.standard?.accessCycle}`,
                        );
                    }
                }
            }
            usedPlan = 'standard'
            return { usedPlan, accessCycle: cycle }
        }
    }


    // check user initially purchase a subscription
    if ((userAccess.plans.premium?.comment_generate_limit || 0) <= 0) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            `You have not any subscription`,
        );
    }
    // check user have a premium plan with expire date and comment generate limit
    if (userAccess.plans.premium?.expiredAt && (new Date(userAccess.plans.premium?.expiredAt) > new Date())) {
        if (userAccess.plans.premium?.comment_generate_limit > userAccess.plans.premium?.comment_generated) {
            usedPlan = 'premium'
            return { usedPlan, accessCycle: 'all' }
        }
    }

    throw new AppError(
        httpStatus.FORBIDDEN,
        'Your subscription or comment generate limit expired !',
    );

    // return { usedPlan, accessCycle }

    // const isExpired = existUser.expiredAt && new Date(existUser?.expiredAt) < new Date();

    // if (isExpired) {
    //     throw new AppError(
    //         httpStatus.FORBIDDEN,
    //         'Your subscription has expired!',
    //     );
    // }

    // if (existUser?.comment_generate_limit <= existUser?.comment_generated) {
    //     throw new AppError(
    //         httpStatus.FORBIDDEN,
    //         'Your comment generate limit has expired!',
    //     );
    // }
    // if (existUser?.cycle !== 'all' && (existUser?.cycle !== cycle)) {
    //     throw new AppError(
    //         httpStatus.FORBIDDEN,
    //         `You can use only ${cycle} cycle`,
    //     );
    // }

}

// const getSubscriptionWithExpired_by_7days = async () => {

//     const targetDate = new Date();
//     targetDate.setDate(targetDate.getDate() + 7); // Get the date 7 days from today
//     targetDate.setHours(0, 0, 0, 0); // Normalize time to 00:00:00.000

//     const nextDay = new Date(targetDate);
//     nextDay.setDate(nextDay.getDate() + 1); // Move to the next day
//     nextDay.setHours(0, 0, 0, 0);


//     const users = await Access_comments.find({
//         $or: [
//             { "plans.standard.expiredAt": { $gte: targetDate, $lt: nextDay } },
//             { "plans.premium.expiredAt": { $gte: targetDate, $lt: nextDay } }
//         ]
//     }).populate("user", "email name").lean();

//     return users
// }

const sendReminderEmail = async () => {

    try {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 7); // Get the date 7 days from today
        targetDate.setHours(0, 0, 0, 0); // Normalize time to 00:00:00.000

        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1); // Move to the next day
        nextDay.setHours(0, 0, 0, 0);

        // get who has 7 days by plan expiry
        const users = await Access_comments.find({
            $or: [
                { "plans.standard.expiredAt": { $gte: targetDate, $lt: nextDay } },
                { "plans.premium.expiredAt": { $gte: targetDate, $lt: nextDay } }
            ]
        }).populate("user").lean() as unknown as {
            plans: { standard: { expiredAt: string }, premium: { expiredAt: string } },
            user: { email: string, name: string, role: number }
        }[];

        const emailPath = path.join(
            __dirname,
            '../../public/view/Subscription_reminder.html',
        );

        // send reminder email all founded users
        for (const user of users) {

            if (!user.user || !user.user.email) continue; // Skip if user is missing

            let plan;

            if (new Date(user?.plans?.premium?.expiredAt) >= targetDate && new Date(user?.plans?.premium?.expiredAt) <= nextDay) {
                plan = "Premium";
            } else {
                plan = "Standard";
            }

            await sendEmail(
                user.user.email,
                "Subscription Reminder from Teachershub",
                fs.readFileSync(emailPath, "utf8")
                    .replace("{{plan}}", plan)
                    .replace("{{current_plan}}", plan)
                    .replace("{{renew_link}}", user?.user?.role == 3 ? `${config.client_Url}/subsCriptionManagement` : `${config.client_Url}/subscriptionDetails`)
            );
        }
    } catch (err) {
        console.error('Error running daily job:', err);
    }

    console.log("reminder job completed")

}

//send remionder email
cron.schedule('0 0 * * *', sendReminderEmail);


export const access_commentsService = {
    generate_comment,
    checkAccess,
    sendReminderEmail
}