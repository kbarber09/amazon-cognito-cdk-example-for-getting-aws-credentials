import { Auth } from "aws-amplify";
import React from "react";
import { Button, Grid, Header, Segment, Image } from "semantic-ui-react";
import {config} from "../../config/config";

export const SignInPage = () => (
  <Grid
    textAlign="center"
    style={{ background: "#262626", height: "100vh", margin: 0 }}
    verticalAlign="middle"
  >
    <Grid.Column style={{ maxWidth: 450 }} textAlign="left">
      <Image
        size="small"
        src="logo.png"
        style={{ position: "absolute", top: "-26px" }}
      />
      <Segment stacked>
        <Header as="h2">
          <Image src="athena.svg" /> {config.SignInHeader}
        </Header>
        <Button
          fluid
          style={{ background: "#693cc5", color: "white" }}
          size="large"
          labelPosition="right"
          icon="sign-in"
          content="Sign In"
          onClick={() => Auth.federatedSignIn()}
          
        />
      </Segment>
    </Grid.Column>
  </Grid>
);
