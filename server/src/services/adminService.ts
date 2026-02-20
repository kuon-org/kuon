import { getUserRole } from "../repositories/usersRepository"

export const isAdmin = async (userId: string) => {
    const role = await getUserRole(userId);
    if(!role || !role.roles) throw new Error("ユーザに権限が付与されていません");
    const isAdmin = role.roles.name === "Admin" ? true : false;
    return isAdmin;
}