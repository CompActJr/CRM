export const normalizeString = (string) => {
    const normalized = string?.trim().toLowerCase()
    return normalized || null
}