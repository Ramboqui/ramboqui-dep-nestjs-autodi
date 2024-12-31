import { Body, Get, Post } from '@nestjs/common';

import { AutoController } from '@ramboqui/nestjs-autodi';

import { UserModel } from '../../../domain/models/user.model';
import { IUserUseCasePort } from '../../../domain/ports/use-case/user.use-case.port';

@AutoController('/v1/user')
export class UserController {
	constructor(private readonly userUseCase: IUserUseCasePort) {}

	@Post()
	async create(@Body() data: UserModel): Promise<UserModel> {
		return this.userUseCase.create(data);
	}

	@Get()
	async list(): Promise<UserModel[]> {
		return this.userUseCase.list();
	}
}
