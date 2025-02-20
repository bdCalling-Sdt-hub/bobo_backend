import Api_key from "./apiKey.model"

const getOpenAi_key = async () => {
    const result = await Api_key.findOne({ name: 'open_ai' })
    return result;
}

const updateOpenAi_key = async (value: string) => {
    const result = await Api_key.updateOne({ name: 'open_ai' }, { key: value })
    return result;
}

export const apiKeyService = {
    getOpenAi_key,
    updateOpenAi_key
}