export type RootStackParamList = {
  Login: undefined;
  Tabs: undefined;
  Settings: undefined;
  DeviceDetails: { deviceId: string };
  EventDetails: { eventId: string };
};

export type TabParamList = {
  Devices: undefined;
  Events: undefined;
  Users: undefined;
};
