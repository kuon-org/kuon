import { v1, v3, v4, v5, v6, v7 } from 'uuid';
const toUUID = (id) => id;
export const uuidv1 = () => toUUID(v1());
export const uuidv3 = (name, namespace) => toUUID(v3(name, namespace));
export const uuidv4 = () => toUUID(v4());
export const uuidv5 = (name, namespace) => toUUID(v5(name, namespace));
export const uuidv6 = () => toUUID(v6());
export const uuidv7 = () => toUUID(v7());
export const asUUID = (id) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id))
        throw new Error('Invalid UUID format');
    return id;
};
