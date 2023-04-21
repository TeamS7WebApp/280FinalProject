declare class RosefireUser {
  token: string;
  name: string;
  group: string;
  email: string;
  username: string;
}

declare var Rosefire: { 
  signIn: (registryToken: string, callback: (err: any, user: RosefireUser) => void) => void,
};
