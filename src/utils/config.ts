export const id = "materials-cli"
export const baseURL = "https://api-materials.doc.ic.ac.uk";
export const legacyBaseURL = "https://materials.doc.ic.ac.uk"
export const year = () => {
    let date = new Date();
    const finalYear = date.getFullYear() - 2000
    if (date.getMonth() >= 9) {
        return (finalYear * 100) + (finalYear + 1)
    } else {
        return ((finalYear - 1) * 100) + finalYear
    }
}
