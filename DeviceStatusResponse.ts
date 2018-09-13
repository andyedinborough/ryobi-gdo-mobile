export interface AT {
  value: {};
  _id: string;
  metaData: MetaData;
  defv: {};
  dataType: string;
  varType: string;
  varName: string;
  flags: string[];
  enum?: string[];
  min: {};
  max: {};
}
export interface Module {
  metaData: MetaData;
  ac: {};
  at: { [key: string]: AT };
}

export interface MetaData {
  name: string;
  icon?: string;
}

export interface DeviceStatusResult {
  _id: string;
  varName: string;
  metaData: MetaData;
  enabled: boolean;
  deleted: boolean;
  createdDate: Date;
  activated: number;
  deviceTypeIds: string[];
  deviceTypeMap: { [key: string]: Module };
  activatedDate: Date;
}

export interface DeviceStatusResponse {
  result: DeviceStatusResult[];
}
