import { ModuleMetadata } from '@nestjs/common/interfaces';

export interface AutoModuleMetadata extends ModuleMetadata {
	providersPath?: string[];
	controllersPath?: string[];
}
