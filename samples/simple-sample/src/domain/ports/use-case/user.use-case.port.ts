import { convertInterface } from '@ramboqui/nestjs-autodi';
import { UserModel } from '../../models/user.model';

export interface IUserUseCasePort {
	create(data: UserModel): Promise<UserModel>;
	list(): Promise<UserModel[]>;
}

export const IUserUseCasePort = convertInterface<IUserUseCasePort>('IUserUseCasePort');
