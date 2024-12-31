import { convertInterface } from '@ramboqui/nestjs-autodi';

export interface IUserRepositoryPort {
	save(entity: any): Promise<any>;
	findAll(): Promise<any[]>;
}

export const IUserRepositoryPort = convertInterface<IUserRepositoryPort>('IUserRepositoryPort');
