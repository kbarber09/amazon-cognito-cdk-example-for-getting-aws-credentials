import React, { useState } from "react";
import { getAWSCreds } from "../../code/getAWSCreds";
import { getConsoleAccess } from "../../code/getConsoleAccess";
import { Container, Menu, Header, Icon } from "semantic-ui-react";
import { GroupList } from "../GroupList";
import { Modal } from "../Modal";
import { config } from "../../config/config";

export function GroupsPage({ handleSignOut }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [credentials, setCredentials] = useState(null);

  const openConsoleHandler = async (RoleArn, GroupName) => {
    getConsoleAccess(RoleArn, GroupName);
  };

  const openModalHandler = async (RoleArn, GroupName) => {
    const data = await getAWSCreds(RoleArn, GroupName);
    if (data) {
      setModalOpen(true);
      setCredentials(data);
    } else {
      alert("Unknown");
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  return (
    <React.Fragment>
      <Menu size="large" inverted fixed="top">
        <Menu.Item header>
          <img src="athena.svg" alt="Athena" style={{ marginRight: "16px" }} />{" "}
          {config.GroupPageHeader}
        </Menu.Item>
        <Menu.Menu position="right">
          <Menu.Item onClick={() => handleSignOut()}>
            <Icon name="sign out alternate" />
            Logout
          </Menu.Item>
        </Menu.Menu>
      </Menu>

      <Container style={{ marginTop: "56px", padding: "16px" }}>
        <Header
          as="h1"
          size="large"
          style={{ marginTop: "64px", fontSize: "2.5rem" }}
        >
          Select Access
        </Header>

        <GroupList
          consoleSignInHandler={openConsoleHandler}
          accessKeyHandler={openModalHandler}
        />
      </Container>

      {modalOpen && (
        <Modal closeHandler={handleCloseModal} {...credentials}></Modal>
      )}
    </React.Fragment>
  );
}
