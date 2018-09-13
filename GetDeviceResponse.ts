 

	export interface WskAuthAttempt {
			varName: string;
			apiKey: string;
			ts: string;
			success: boolean;
	}

	export interface Sys {
			lastSeen: any;
	}

	export interface MetaData {
			name: string;
			version: number;
			icon: string;
			description: string;
			wskAuthAttempts: WskAuthAttempt[];
			authCount: number;
			sys: Sys;
			socketId: string;
	}

	export interface GetDevicesResult {
			_id: string;
			varName: string;
			metaData: MetaData;
			enabled: boolean;
			deleted: boolean;
			createdDate: Date;
			activated: number;
			deviceTypeIds: string[];
			activatedDate: Date;
	}

	export interface GetDeviceResponse {
			result: GetDevicesResult[];
	}

