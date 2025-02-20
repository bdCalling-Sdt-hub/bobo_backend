import Comments from "./comments.model"

//create a new Comment
const saveGeneratedComment = async (payload: { cycle: string, language: string, prompt: any, result: string }, userId: string) => {

    const result = await Comments.create({ ...payload, user: userId })
    return result;
     
}

const myGeneratedComments = async (userId: string) => {
    const result = await Comments.find({ user: userId })
    return result
}

export const commentService = {
    saveGeneratedComment,
    myGeneratedComments
}