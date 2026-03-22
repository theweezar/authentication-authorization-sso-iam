import { asyncHandler } from "../../shared/async-handler.js";
import { AppError } from "../../shared/app-error.js";
import { requireActor } from "../../shared/request-auth.js";
const getUserId = (request) => {
    const userId = request.params.userId;
    if (typeof userId !== "string" || !userId) {
        throw new AppError("User id is required.", 400);
    }
    return userId;
};
export class UserController {
    userService;
    constructor(userService) {
        this.userService = userService;
    }
    createUser = asyncHandler(async (request, response) => {
        const user = await this.userService.createUser({
            organizationId: request.body.organizationId,
            roleId: request.body.roleId,
            email: request.body.email,
            phone: request.body.phone,
            firstName: request.body.firstName,
            lastName: request.body.lastName,
            password: request.body.password,
        }, requireActor(request));
        response.status(201).json({ user });
    });
    updateUser = asyncHandler(async (request, response) => {
        const user = await this.userService.updateUser(getUserId(request), {
            email: request.body.email,
            phone: request.body.phone,
            firstName: request.body.firstName,
            lastName: request.body.lastName,
            password: request.body.password,
            roleId: request.body.roleId,
        }, requireActor(request));
        response.status(200).json({ user });
    });
    deleteUser = asyncHandler(async (request, response) => {
        await this.userService.deleteUser(getUserId(request), requireActor(request));
        response.status(204).send();
    });
}
