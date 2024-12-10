import { ModuleMetadata } from '@nestjs/common/interfaces';

/**
 * Extended ModuleMetadata to support automatic scanning of providers and controllers.
 */
export interface AutoModuleMetadata extends ModuleMetadata {
	/**
	 * Glob patterns for scanning providers.
	 */
	providersPath?: string[];
	/**
	 * Glob patterns for scanning controllers.
	 */
	controllersPath?: string[];
}
