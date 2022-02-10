import { Request, Response } from "express";
import { IUserService } from "../services/UserService";

function makeApiController(userService: IUserService) {
  return {
    async getUsersPublicInfos(_req: Request, res: Response) {
      const result = await userService.getUsersPublicInfos();
      return res.json(result);
    }
  } as IAPIController
}

export interface IAPIController {
  getUsersPublicInfos(_req: Request, res: Response): any
}

export default makeApiController;
