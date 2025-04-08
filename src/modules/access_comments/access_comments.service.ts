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
        //     prompt = `
        //   Écrivez un commentaire détaillé pour le bulletin de l'élève, basé sur les données suivantes. Le commentaire doit être informatif, détaillé, mais ne pas dépasser 6 lignes. Utilisez le ton suivant : '${feedbackData?.toneOfVoice
        //         }'.  
        //   Un 'true' signifie que l'élève doit améliorer ses compétences, tandis qu'un 'false' signifie que l'élève fait bien dans ce domaine.  
        //   Ne commencez ni ne terminez le commentaire par des phrases génériques. 

        //   Améliorations nécessaires : ${improvementComments || "Aucune amélioration nécessaire"
        //         }

        //   Autres commentaires : ${JSON.stringify(others)}

        //   Commentaires : ${JSON.stringify(feedbackData)}

        //   Exemple de commentaire :  
        //   "Micheal a montré des progrès notables dans plusieurs domaines; ${pronoun} vocabulaire en langue parlée s'élargit et ${pronoun} commence à former des phrases simples. ${pronoun} lit des syllabes et des mots, fait des calculs, ${possessive} écriture s'améliore également et ${pronoun} écrit plus vite. Cependant, Micheal doit encore apprendre à être plus responsable et respecter les règles. Cette attitude l'aidera à améliorer ${possessive} résultats. Ses réussites sont encore fragiles mais progressent cette année. Il faut continuer à fournir des efforts. Les sessions de soutien en langue française l'aideront à consolider ses bases linguistiques."
        //   `;

        // ----------------------------new feedback-------------------------
        prompt = `Rédigez un commentaire détaillé pour le bulletin de l'élève en vous basant sur les données suivantes. Le commentaire doit être à la fois fluides, précises, et positives, et ne pas dépasser 6 lignes. L'objectif est de rendre le texte plus facile à comprendre. Adoptez le ton suivant : '${feedbackData?.toneOfVoice
            }'. 
Un "true" indique que l'élève doit renforcer ses compétences dans ce domaine, tandis qu'un "false" signifie qu'il maîtrise bien cette compétence. 

Un "false" dans les points à améliorer signifie qu'il y a un besoin de faire des progrès dans ce domaine. En revanche, un "false" dans les domaines d'apprentissage indique qu'une compétence est déjà maîtrisée. Il est important de ne pas confondre les deux.

Il est essentiel d’ajouter des transitions naturelles et logiques entre les phrases pour garantir une lecture fluide et cohérente.
Les compétences académiques et les comportements doivent être traités séparément. Ne mélangez pas les difficultés d’apprentissage avec des observations sur le comportement de l’élève. Par exemple, si un élève a des difficultés en mathématiques, précisez les compétences spécifiques à améliorer sans faire de lien direct avec son attitude ou comportement en classe.
Pour les matières fondamentales comme les mathématiques ou le français, soyez particulièrement précis lorsqu’un élève rencontre des difficultés. Par exemple, au lieu d’indiquer simplement qu’il a du mal en mathématiques, précisez s’il s’agit de la résolution de problèmes, de la compréhension des nombres ou de l’application des opérations. En revanche, pour les compétences bien maîtrisées, une formulation plus concise suffit, sans entrer dans un niveau de détail excessif.
Pour les autres disciplines, comme les sciences, l’histoire ou l’éducation artistique, un commentaire plus global peut suffire, en mettant en avant les aspects généraux des compétences acquises ou en développement, sans nécessairement détailler chaque point spécifique.


Améliorations nécessaires : ${improvementComments || "Aucune amélioration nécessaire"} Autres commentaires : ${JSON.stringify(others)
            }
 Commentaires : ${JSON.stringify(feedbackData)} 
Exemple de commentaire : "Micheal a montré des progrès notables dans plusieurs domaines; ${pronoun} vocabulaire en langue parlée s'élargit et ${pronoun} commence à former des phrases simples. ${pronoun} lit des syllabes et des mots, fait des calculs, ${possessive} écriture s'améliore également et ${pronoun} écrit plus vite. Cependant, Micheal doit encore apprendre à être plus responsable et respecter les règles. Cette attitude l'aidera à améliorer ${possessive} résultats. Ses réussites sont encore fragiles mais progressent cette année. Il faut continuer à fournir des efforts. Les sessions de soutien en langue française l'aideront à consolider ses bases linguistiques.
`


    } else {
        // English language prompt
        const pronoun = feedbackData.gender === "Girl" ? "she" : "he";
        const possessive = feedbackData.gender === "Girl" ? "her" : "his";

        // Build the full prompt
        //     prompt = `
        //   Write a detailed comment for the student's report card based on the following feedback. The comment should be informative, detailed, and no more than 6 lines. Use the following tone: '${feedbackData?.toneOfVoice
        //         }'.  
        //   A 'true' means the student needs improvement, while a 'false' means the student is doing well in that area.  
        //   Do not begin or end the comment with generic sentences. 

        //   Improvements needed in the following areas: ${improvementComments || "No improvements needed"
        //         }

        //   Other feedback: ${JSON.stringify(others)}

        //   Feedback: ${JSON.stringify(feedbackData)}

        //   Example comment:  
        //   "Micheal has made significant progress in several areas; ${pronoun} vocabulary is expanding in spoken language and ${pronoun} is starting to form simple sentences. ${pronoun} reads syllables and words, performs calculations, ${possessive} handwriting is improving, and ${pronoun} writes faster. However, Micheal still needs to develop a more responsible attitude and respect the rules. This behavior will help ${pronoun} improve ${possessive} results. ${pronoun} achievements are still fragile but progressing this semester. Continued efforts are needed. French language support sessions will help Micheal strengthen ${possessive} linguistic foundations."
        //   `;


        // ----------------------------new feedback-------------------------
        prompt = `Write a detailed comment for the student's report card based on the following data. The comment should be fluid, precise, and positive, and should not exceed 6 lines. The goal is to make the text easier to understand. Use the following tone: '${feedbackData?.toneOfVoice}'.
A "true" indicates that the student needs to strengthen their skills in this area, while a "false" means they have mastered the skill. Do not begin or end the comment with generic sentences.

A "false" in the areas for improvement means that there is a need for progress in this area. However, a "false" in the learning areas indicates that the student has already mastered the skill. It is important not to confuse the two.

It is essential to add natural and logical transitions between sentences to ensure smooth and coherent reading.
Academic skills and behaviors should be addressed separately. Do not mix learning difficulties with observations about the student's behavior. For example, if a student struggles in mathematics, specify the exact skills that need improvement without directly linking them to their attitude or behavior in class.
For fundamental subjects like mathematics or French, it is important to specify the exact skills that need improvement rather than detailing those the student has already mastered. For example, instead of simply stating that the student struggles in mathematics, specify whether the difficulty lies in problem-solving, number comprehension, or applying operations. Similarly, in French, indicate whether progress is needed in fluent reading, text comprehension, or sentence construction. This level of precision helps better target areas for improvement and adapt the necessary support.
Do not begin or end the comment with generic sentences.
For other subjects, such as science, history, or artistic education, a more general comment may be sufficient, highlighting the overall aspects of the skills acquired or in development without necessarily detailing each specific point.
Improvements needed in the following areas: ${improvementComments || "No improvements needed"
            } 
Other feedback: ${JSON.stringify(others)}
Feedback: ${JSON.stringify(feedbackData)} 
Example comment: 
"Micheal has made significant progress in several areas; ${pronoun} vocabulary is expanding in spoken language and ${pronoun} is starting to form simple sentences. ${pronoun} reads syllables and words, performs calculations, ${possessive} handwriting is improving, and ${pronoun} writes faster. However, Micheal still needs to develop a more responsible attitude and respect the rules. This behavior will help ${pronoun} improve ${possessive} results. ${pronoun} achievements are still fragile but progressing this semester. Continued efforts are needed. French language support sessions will help Micheal strengthen ${possessive} linguistic foundations."`

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
                    'Your free limit has expired!',
                );
            }
        } else {
            throw new AppError(
                httpStatus.FORBIDDEN,
                'Your free limit has expired!',
            );
        }
    }

    if (role == '4' || role == '3') {
        if ((userAccess.plans.premium_pro?.comment_generate_limit || 0) <= 0) {
            throw new AppError(
                httpStatus.FORBIDDEN,
                `You don’t have an active subscription`,
            );
        }
        if (userAccess.plans.premium_pro?.expiredAt && (new Date(userAccess.plans.premium_pro?.expiredAt) > new Date())) {
            if (userAccess.plans.premium_pro?.comment_generate_limit > userAccess.plans.premium_pro?.comment_generated) {
                usedPlan = 'premium_pro'
                return { usedPlan, accessCycle: 'all' }
            } else {
                throw new AppError(
                    httpStatus.FORBIDDEN,
                    role == '4' ? "Contact your school administrator to renew the plan" : 'Your School comment generate limit expired !',
                );
            }
        } else {
            throw new AppError(
                httpStatus.FORBIDDEN,
                role == '4' ? "Contact your school administrator to renew the plan" : 'Your School subscription expired !',
            );
        }
    }

    // check user initially purchase a subscription for handle message
    let msg = ''

    if ((userAccess.plans.standard?.comment_generate_limit || 0) <= 0) {
        msg = `You don’t have an active subscription`;
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
                        msg = `You don’t have an active subscription`;
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
            `You don’t have an active subscription`,
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
                { "plans.premium.expiredAt": { $gte: targetDate, $lt: nextDay } },
                { "plans.premium_pro.expiredAt": { $gte: targetDate, $lt: nextDay } }
            ]
        }).populate("user").lean() as unknown as {
            plans: { standard: { expiredAt: string }, premium: { expiredAt: string }, premium_pro: { expiredAt: string } },
            user: { email: string, name: string, role: number }
        }[];

        const emailPath = path.join(
            __dirname,
            '../../public/view/Subscription_reminder.html',
        );

        // send reminder email all founded users
        for (const user of users) {

            if (!user.user || !user.user.email) continue; // Skip if user is missing

            let plan = "Standard";

            if (new Date(user?.plans?.premium?.expiredAt) >= targetDate && new Date(user?.plans?.premium?.expiredAt) <= nextDay) {
                plan = "Premium";
            } else if (new Date(user?.plans?.premium_pro?.expiredAt) >= targetDate && new Date(user?.plans?.premium_pro?.expiredAt) <= nextDay) {
                plan = "Premium Pro";
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

//send subscription remionder email
cron.schedule('0 0 * * *', sendReminderEmail);


export const access_commentsService = {
    generate_comment,
    checkAccess,
    sendReminderEmail
}