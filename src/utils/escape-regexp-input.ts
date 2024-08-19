// https://stackoverflow.com/a/6969486
export function escapeRegExpInput(regExpInput: string) {
    return regExpInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
