import { AutoInjectable } from '@ramboqui/nestjs-autodi';
import { UserModel } from '../../domain/models/user.model';
import { IUserRepositoryPort } from '../../domain/ports/repositories/user.repository.port';
import { IUserUseCasePort } from '../../domain/ports/use-case/user.use-case.port';

@AutoInjectable({ interfaceMetadata: IUserUseCasePort })
export class UserUseCase implements IUserUseCasePort {
	constructor(private readonly repository: IUserRepositoryPort) {}

	async create(data: any): Promise<UserModel> {
		const entity = new UserModel(Date.now().toString(), data.name);
		return this.repository.save(entity);
	}

	async list(): Promise<UserModel[]> {
		return this.repository.findAll();
	}
}
