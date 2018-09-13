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

interface AppState {
  devices?: GetDeviceResponse;
  login?: LoginResponse;
  statuses?: { [key: string]: DeviceStatusResult };
}

const EMAIL = "";
const PASSWORD = "";

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
    const { devices } = this.state;
    return (
      <View style={styles.container}>
        {!devices && <Text>Loading</Text>}
        {devices &&
          devices.result
            .filter(
              x =>
                x.enabled &&
                x.activated &&
                !x.deleted &&
                !x.metaData.description.match(/Hub/)
            )
            .map(this.renderDevice)}
      </View>
    );
  }

  private renderDevice = (device: GetDevicesResult) => {
    const { statuses } = this.state;
    const status = statuses && statuses[device.varName];
    const doorState = status && getVariableFromDevice(status, "doorState");
    const state =
      doorState && doorState.enum && doorState.enum[doorState.value as number];
    return (
      <View key={device._id}>
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
        <Button
          onPress={() => this.handleLightOnPress(device.varName)}
          title="Light On"
        />
        <Button
          onPress={() => this.handleLightOffPress(device.varName)}
          title="Light Off"
        />
      </View>
    );
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
    const { login, statuses } = this.state;
    const statusResult = statuses && statuses[id];
    const device =
      statusResult && ryobiClient.getDevice(statusResult, "garageDoor");

    if (!device || !login) {
      return;
    }

    const cmd =
      cmdName === "door"
        ? ryobiClient.door(device, value)
        : ryobiClient.light(device, value);
    await ryobiClient.sendCommand(EMAIL, login.result.auth.apiKey, cmd);
  };

  private async load() {
    const login = await ryobiClient.login(EMAIL, PASSWORD);
    this.setState({ login });
    await this.loadDevices();
  }

  private loadDevices = async () => {
    const devices = await ryobiClient.getDevices();
    const statusResult = await Promise.all(
      devices.result.map(x => ryobiClient.getStatus(x.varName))
    );
    const statuses: { [key: string]: DeviceStatusResult } = {};
    for (let status of statusResult) {
      const result = status.result[0];
      statuses[result.varName] = result;
    }
    this.setState({ devices, statuses });
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
