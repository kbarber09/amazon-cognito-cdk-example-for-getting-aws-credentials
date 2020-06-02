import React from "react";
import { useCognitoGroups } from "../useCognitoGroups";

import { Button, Item, Loader, Segment, Message } from "semantic-ui-react";

export function GroupList({ consoleSignInHandler, accessKeyHandler }) {
  const [groups, banner, loading, error] = useCognitoGroups();

  if (error) return <div>Something went wrong...</div>;

    if (loading) {
    return (
      <Loader active size="massive">
        Loading Groups
      </Loader>
    );
  }

  if (groups.length=== 0){
  
    return (
      <Message>
        <Message.Header>
          Welcome {banner.Name} to the {banner.ProjectName} Project
        </Message.Header>
        <p>
          {banner.SupportGroupName} has been notified of your successful login
          and is processing your access permissions. You will be notified by
          email at {banner.Email} when your access is available.
        </p>
        <p>
          Please contact {banner.SupportGroupName} at{" "}
          <a href={`mailto:${banner.SupportGroupContact}`}>
            {" "}
            {banner.SupportGroupContact}
          </a>{" "}
          if you have any issues or questions.
        </p>
      </Message>
    );
  }

  return (
    <Segment>
      <Item.Group divided>
        {groups &&
          groups.map(({ GroupName, Description, RoleArn }, i) => (
            <Item key={i}>
              <Item.Image size="tiny" src="db.png" />
              <Item.Content>
                <Item.Header>{GroupName}</Item.Header>
                <Item.Meta>{Description}</Item.Meta>
                <Item.Extra>
                  <Button
                    onClick={() => consoleSignInHandler(RoleArn, GroupName)}
                  >
                    Console Sign-in
                  </Button>
                  <Button onClick={() => accessKeyHandler(RoleArn, GroupName)}>
                    Access Keys
                  </Button>
                </Item.Extra>
              </Item.Content>
            </Item>
          ))}
      </Item.Group>
    </Segment>
  );
}
