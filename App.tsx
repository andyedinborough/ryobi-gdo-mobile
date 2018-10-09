import * as React from "react";
import { StyleSheet, Text, View, Button } from "react-native";
import {
  ryobiClient,
  getModuleWithVariable,
  getVariableFromDevice
} from "./RyobiClient";
import { GetDeviceResponse, GetDevicesResult } from "./GetDeviceResponse";
import { LoginResponse } from "./LoginResponse";
import { DeviceStatusResult } from "./DeviceStatusResponse";
import { Login } from "./Login";
import { getStore, Storage, setStore } from "./Storage";

interface AppState {
  devices?: GetDeviceResponse;
  login?: LoginResponse;
  storage?: Storage;
  statuses?: { [key: string]: DeviceStatusResult };
  loading?: boolean;
}

const VALID_DEVICES = (x: GetDevicesResult) => 
  x.enabled &&
  x.activated &&
  !x.deleted &&
  !x.metaData.description.match(/Hub/);

export default class App extends React.Component<{}, AppState> {
  state: AppState = {};
  private tmr: number | undefined;

  componentDidMount() {
    this.load();
  }

  componentWillUnmount() {
    window.clearTimeout(this.tmr);
  }

  render() {
    const { devices, storage, loading } = this.state;
    return (
      <View style={styles.container}>
        {storage &&
          !storage.email && <Login onLoggedIn={this.handleLoggedIn} />}
        {!devices && !storage && <Text>Loading</Text>}
        {devices &&
          devices.result
            .filter(VALID_DEVICES)
            .map(this.renderDevice)}
        {<Text style={{ textAlign: "center" }}>{loading && 'Loading...' || ' '}</Text>}
      </View>
    );
  }

  private renderDevice = (device: GetDevicesResult) => {
    const { statuses } = this.state;
    const status = statuses && statuses[device.varName];
    const doorState = status && getVariableFromDevice(status, "doorState");
    const lightState = status && getVariableFromDevice(status, "lightState");
    const state =
      doorState && doorState.enum && doorState.enum[doorState.value as number];
    return (
      <View key={device._id} style={{ marginBottom: 20 }}>
        <Text style={{ textAlign: "center" }}>
          {device.metaData.name.trim()}: {state}
        </Text>
        <Button
          onPress={() => this.handleOpenPress(device.varName)}
          title="Open"
        />
        <Button
          onPress={() => this.handleClosePress(device.varName)}
          title="Close"
        />
        <Text style={{ textAlign: "center" }}>
          Light: {lightState && lightState.value ? "On" : "Off"}
        </Text>
        <Button
          onPress={() => this.handleLightOnPress(device.varName)}
          title="On"
        />
        <Button
          onPress={() => this.handleLightOffPress(device.varName)}
          title="Off"
        />
      </View>
    );
  };

  private handleLoggedIn = async (login: LoginResponse) => {
    const storage = await getStore();
    this.setState({ login, storage });
  };

  private handleOpenPress = (id: string) => {
    this.send(id, "door", true);
  };

  private handleClosePress = (id: string) => {
    this.send(id, "door", false);
  };

  private handleLightOnPress = (id: string) => {
    this.send(id, "light", true);
  };

  private handleLightOffPress = (id: string) => {
    this.send(id, "light", false);
  };

  private send = async (
    id: string,
    cmdName: "light" | "door",
    value: boolean
  ) => {
    const { login, statuses, storage } = this.state;
    const statusResult = statuses && statuses[id];
    const device =
      statusResult && ryobiClient.getDevice(statusResult, "garageDoor");

    if (!device || !login || !storage) {
      return;
    }

    const cmd =
      cmdName === "door"
        ? ryobiClient.door(device, value)
        : ryobiClient.light(device, value);
    await ryobiClient.sendCommand(storage.email, login.result.auth.apiKey, cmd);
  };

  private async load() {
    const storage = await getStore();
    this.setState({ storage });

    if (!storage.email || !storage.password) {
      return;
    }

    const login = (await ryobiClient.login(
      storage.email,
      storage.password
    )) as LoginResponse;

    if (typeof login.result === "string") {
      alert(login.result);
      storage.email = "";
      storage.password = "";
      await setStore(storage);
      this.setState({ storage });
    }

    this.setState({ login });
    await this.loadDevices();
  }

  private loadDevices = async () => {
    this.setState({ loading: true });
    const devices = await ryobiClient.getDevices();
    const statusResult = await Promise.all(
      devices.result.map(x => ryobiClient.getStatus(x.varName))
    );
    const statuses: { [key: string]: DeviceStatusResult } = {};
    for (let status of statusResult) {
      const result = status.result[0];
      statuses[result.varName] = result;
    }
    this.setState({ devices, statuses, loading: false });
    this.tmr = window.setTimeout(this.loadDevices, 3e3);
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  }
});
