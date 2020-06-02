import { Hub, Auth } from "aws-amplify";
import { useState, useEffect } from "react";

export function useAuth() {
  const [authState, setAuthState] = useState("signIn");
  const [authData, setAuthData] = useState(null);
  const [authError, setAuthError] = useState(null);

  async function handleSignOut() {
    await Auth.signOut();
    setAuthState("signIn");
    setAuthData(null);
    setAuthError(null);
  }

  useEffect(() => {
    const listener = data => {
      switch (data.payload.event) {
        case "signIn":
          setAuthState("signedIn");
          setAuthData(data.payload.data);
          break;
        case "signIn_failure":
          setAuthState("signIn");
          setAuthData(null);
          setAuthError(data.payload.data);
         // console.log('Auth Failure', data.payload.data);
          break;
        default:
          break;
      }
    };

    Hub.listen("auth", listener);

    return () => Hub.remove("auth", listener);
  }, []);

  return {
    authState,
    authData,
    authError,
    handleSignOut
  };
}
