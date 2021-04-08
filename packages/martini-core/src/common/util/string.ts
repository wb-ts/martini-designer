export const generateUnique = (array: string[], initial: string) => {
    if (!array.includes(initial)) return initial;
    let _name = "";
    let i = 1;
    do {
        _name = initial + i++;
    } while (array.includes(_name));

    return _name;
};
