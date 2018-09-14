import { AsyncStorage } from "react-native";

export interface Storage {
  email: string;
  password: string;
}

export const getStore = async () => {
  try {
    return JSON.parse((await AsyncStorage.getItem("store")) || "{}") as Storage;
  } catch {
    return { email: "", password: "" };
  }
};

export const setStore = async (storage: Storage) => {
  await AsyncStorage.setItem("store", JSON.stringify(storage));
};
