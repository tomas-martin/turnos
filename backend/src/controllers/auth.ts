import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth';

export class AuthController {
  static async registerCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.registerCustomer({
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
    } catch (error) {
      next(error);
    }
  }

  static async registerBusiness(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.registerBusiness({
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
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login({
        email: req.body.email,
        passwordHash: req.body.password
      });

      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.refresh(req.body.refreshToken);

      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (userId) {
        await AuthService.logout(userId);
      }
      return res.status(200).json({
        status: 'success',
        message: 'Sesión cerrada correctamente'
      });
    } catch (error) {
      next(error);
    }
  }
}
