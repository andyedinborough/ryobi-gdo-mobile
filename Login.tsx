import * as React from "react";
import { View, TextInput, Text, Button } from "react-native";
import { ryobiClient } from "./RyobiClient";
import { LoginResponse, LoginResult } from "./LoginResponse";
import { Storage, setStore, getStore } from "./Storage";

interface LoginProps {
  onLoggedIn: (response: LoginResponse) => void;
}

interface LoginState {
  disabled?: boolean;
  email?: string;
  password?: string;
  error?: string;
}

export class Login extends React.Component<LoginProps, LoginState> {
  state: LoginState = {};

  public render() {
    const { disabled, error } = this.state;
    return (
      <View>
        <Text style={{ textAlign: "center" }}>Email</Text>
        <TextInput
          editable={!disabled}
          keyboardType="email-address"
          onChangeText={this.handleEmailChange}
          style={{
            backgroundColor: "#eee",
            marginBottom: 20
          }}
        />

        <Text style={{ textAlign: "center" }}>Password</Text>
        <TextInput
          editable={!disabled}
          onChangeText={this.handlePasswordChange}
          secureTextEntry={true}
          style={{
            backgroundColor: "#eee",
            marginBottom: 20
          }}
        />

        <Button
          title="Login"
          disabled={disabled}
          onPress={this.handleLoginPress}
        />

        {disabled && <Text>Logging in ... </Text>}
        {error && <Text style={{ color: "red" }}>{error}</Text>}
      </View>
    );
  }

  private handleEmailChange = (email: string) => {
    this.setState({ email });
  };

  private handlePasswordChange = (password: string) => {
    this.setState({ password });
  };

  private handleLoginPress = async () => {
    this.setState({ disabled: true, error: undefined });
    const { email, password } = this.state;
    if (!email || !password) {
      return;
    }

    const result = await ryobiClient.login(email, password);

    const fail = result as { result: string };
    if (fail && typeof fail.result === "string") {
      this.setState({ error: fail.result, disabled: false });
      return;
    }

    const response = result as LoginResponse;
    const storage = await getStore();
    storage.email = email;
    storage.password = password;
    await setStore(storage);
    this.props.onLoggedIn(response);
  };
}
