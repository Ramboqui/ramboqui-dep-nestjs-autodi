import { AutoModule } from '@ramboqui/nestjs-autodi';

@AutoModule({
	providersPath: ['application/use-cases/*.use-case.ts', 'infrastructure/adapters/repositories/*.repository.ts'],
	controllersPath: ['infrastructure/adapters/controllers/*.controller.ts'],
	debug: true,
})
export class AppModule {}
