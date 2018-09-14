import { parseJson } from "./JsonHelper";
import { LoginResponse } from "./LoginResponse";
import { GetDeviceResponse } from "./GetDeviceResponse";
import {
  DeviceStatusResponse,
  DeviceStatusResult,
  Module,
  AT
} from "./DeviceStatusResponse";

export interface Device {
  portId: number;
  moduleId: number;
  id: string;
}

export const hasModuleProfile = (module: Module, profile: string) => {
  const profiles = getVariableValue<string[]>(module, "moduleProfiles");
  if (!profiles) {
    return false;
  }
  return profiles.some(x => x.indexOf(profile + "_") === 0);
};

export const getVariable = (module: Module, name: string): AT | undefined => {
  const variables = objectValues(module.at);
  const variable = variables.find(x => x.varName === name);
  if (!variable) {
    return undefined;
  }
  return variable;
};

export const getVariableFromDevice = (
  device: DeviceStatusResult,
  name: string
) => {
  const variable = objectValues(device.deviceTypeMap)
    .map(x => getVariable(x, name))
    .filter(x => !!x)[0];
  return variable;
};

export const getVariableValue = <T>(module: Module, name: string) => {
  const variable = getVariable(module, name);
  return variable && (variable.value as T);
};

export const getModuleWithVariable = (module: Module, varName: string) =>
  varName in module.at;

export const objectValues = <T extends { [key: string]: T[keyof T] }>(
  value: T
) => Object.keys(value).map(key => value[key]);

export class RyobiClient {
  public login(email: string, password: string) {
    return this.postJsonToJson<LoginResponse | { result: string }>(
      "https://tti.tiwiconnect.com/api/login",
      {
        password,
        email
      }
    );
  }

  public getDevices() {
    return this.getJson<GetDeviceResponse>(
      "https://tti.tiwiconnect.com/api/endnodes"
    );
  }

  public authorize = (email: string, apiKey: string) => ({
    jsonrpc: "2.0",
    id: 3,
    method: "srvWebSocketAuth",
    params: { varName: email, apiKey }
  });

  public door = (device: Device, open: boolean) =>
    this.generateCommand(device, { doorCommand: open ? 1 : 0 });

  public light = (device: Device, lightState: boolean) =>
    this.generateCommand(device, { lightState });

  public connect() {
    return new Promise<WebSocket>(resolve => {
      const socket = new WebSocket(
        "wss://tti.tiwiconnect.com/api/wsrpc",
        "echo-protocol"
      );
      socket.onopen = () => resolve(socket);
    });
  }

  public getStatus(id: string) {
    return this.getJson<DeviceStatusResponse>(
      `https://tti.tiwiconnect.com/api/devices/${id}`
    );
  }

  public async sendCommand(email: string, apiKey: string, command: {}) {
    const socket = await this.connect();
    const promise = new Promise(
      resolve =>
        (socket.onmessage = async e => {
          resolve();
        })
    );

    socket.send(JSON.stringify(this.authorize(email, apiKey)));
    await promise;

    socket.send(JSON.stringify(command));
    setTimeout(() => {
      socket.close();
    }, 5e3);
  }

  public log = (body: {}) => {
    return this.postJson("http://postb.in/ayEnouLK", body);
  };

  public getDevice(
    deviceResult: DeviceStatusResult,
    type: string
  ): Device | undefined {
    const devices = objectValues(deviceResult.deviceTypeMap);
    const device = devices.find(x => hasModuleProfile(x, type));
    if (!device) {
      return undefined;
    }

    var portId = getVariableValue<number>(device, "portId");
    var moduleId = getVariableValue<number>(device, "moduleId");
    if (!portId || !moduleId) {
      return;
    }
    return { portId, moduleId, id: deviceResult.varName };
  }

  private generateCommand(device: Device, moduleMsg: {}) {
    return {
      jsonrpc: "2.0",
      method: "gdoModuleCommand",
      params: {
        msgType: 16,
        moduleType: device.moduleId,
        portId: device.portId,
        moduleMsg,
        topic: device.id
      }
    };
  }

  private postJson(url: string, body: {}) {
    return this.request(url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" }
    });
  }

  private async postJsonToJson<T = {}>(url: string, body: {}) {
    const response = await this.postJson(url, body);
    const result = await parseJson<T>(response);
    return result;
  }

  private async getJson<T = {}>(url: string): Promise<T> {
    const response = await this.request(url);
    const result = await parseJson<T>(response);
    return result;
  }

  private request(url: string, options?: RequestInit) {
    return fetch(url, {
      credentials: "include",
      ...options,
      headers: { ...(options && options.headers) }
    });
  }
}

export const ryobiClient = new RyobiClient();
