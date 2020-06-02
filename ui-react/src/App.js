import React from "react";
import styled from "styled-components";
import { Helmet } from "react-helmet";


import { useAuth } from "./components/useAuth";

import { SignInPage } from "./components/SignInPage";
import { GroupsPage } from "./components/GroupsPage";

import { Dimmer, Loader } from "semantic-ui-react";
import {config} from "./config/config";


export function App() {
  const { authState, handleSignOut } = useAuth();

  return (
    <AppLayout>
      <Helmet>
        <title>{config.title}</title>
      </Helmet>
      {authState === "loading" && (
        <Dimmer active>
          <Loader size="massive">Loading</Loader>
        </Dimmer>
      )}
      {authState === "signIn" && <SignInPage />}
      {authState === "signedIn" && (
        <GroupsPage handleSignOut={() => handleSignOut()} />
      )}
    </AppLayout>
  );
}

const AppLayout = styled.div`
  background: #fff;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;
