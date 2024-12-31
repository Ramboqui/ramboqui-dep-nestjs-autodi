import { AutoInjectable } from '@ramboqui/nestjs-autodi';

import { UserModel } from '../../../domain/models/user.model';
import { IUserRepositoryPort } from '../../../domain/ports/repositories/user.repository.port';

@AutoInjectable({ interfaceMetadata: IUserRepositoryPort })
export class UserRepository implements IUserRepositoryPort {
	private db: UserModel[] = [];

	async save(entity: UserModel): Promise<UserModel> {
		this.db.push(entity);
		return entity;
	}

	async findAll(): Promise<UserModel[]> {
		return this.db;
	}
}
