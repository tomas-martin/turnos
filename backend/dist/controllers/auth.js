"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_1 = require("../services/auth");
class AuthController {
    static async registerCustomer(req, res, next) {
        try {
            const result = await auth_1.AuthService.registerCustomer({
                email: req.body.email,
                passwordHash: req.body.password,
                name: req.body.name,
                lastname: req.body.lastname,
                dni: req.body.dni,
                phone: req.body.phone,
                address: req.body.address
            });
            return res.status(201).json({
                status: 'success',
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async registerBusiness(req, res, next) {
        try {
            const result = await auth_1.AuthService.registerBusiness({
                email: req.body.email,
                passwordHash: req.body.password,
                name: req.body.name,
                lastname: req.body.lastname,
                companyName: req.body.companyName,
                phone: req.body.phone,
                address: req.body.address
            });
            return res.status(201).json({
                status: 'success',
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async login(req, res, next) {
        try {
            const result = await auth_1.AuthService.login({
                email: req.body.email,
                passwordHash: req.body.password
            });
            return res.status(200).json({
                status: 'success',
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async refresh(req, res, next) {
        try {
            const result = await auth_1.AuthService.refresh(req.body.refreshToken);
            return res.status(200).json({
                status: 'success',
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async logout(req, res, next) {
        try {
            const userId = req.user?.id;
            if (userId) {
                await auth_1.AuthService.logout(userId);
            }
            return res.status(200).json({
                status: 'success',
                message: 'Sesión cerrada correctamente'
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
