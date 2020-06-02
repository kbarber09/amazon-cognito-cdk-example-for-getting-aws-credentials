import React, { useState } from "react";
import styled from "styled-components";

import { Button, Menu } from 'semantic-ui-react';

import "./index.css";

const profileTemplate = (profile, accessKey, secretKey, accessToken) => `
[${profile}]
aws_access_key_id=${accessKey}
aws_secret_access_key=${secretKey}
aws_session_token=${accessToken}
`;

const environmentTemplate = (cmd, AccessKeyId, SecretKey, SessionToken) => `
  ${cmd} AWS_ACCESS_Key_ID="${AccessKeyId}"
  ${cmd} AWS_SECRET_ACCESS_KEY="${SecretKey}"
  ${cmd} AWS_SESSION_TOKEN="${SessionToken}"
`;

export function Modal({
  AccessKeyId,
  SecretKey,
  SessionToken,
  Group,
  closeHandler
}) {
  const Profile = "DataLake";

  const [os, setOs] = useState("windows");
  const [isCopied, setIsCopied] = useState(false);

  const scmd = os === "windows" ? "set" : "export";
  const shome =
    os === "windows"
      ? "%USERPROFILE%\\.aws\\credentials"
      : "~/.aws/credentials";

  const copyAccessKeyToClipboard = async e => {
    e.preventDefault();
    await navigator.clipboard.writeText(`${AccessKeyId}`);
  };

  const copySecretKeyToClipboard = async e => {
    e.preventDefault();
    await navigator.clipboard.writeText(`${SecretKey}`);
  };

  const copySessionTokenToClipboard = async e => {
    e.preventDefault();
    await navigator.clipboard.writeText(`${SessionToken}`);
  };

  const copyProfileToClipboard = async e => {
    e.preventDefault();

    await navigator.clipboard.writeText(
      profileTemplate(Profile, AccessKeyId, SecretKey, SessionToken)
    );

    setIsCopied(true);

    setTimeout(() => {
      setIsCopied(false);
    }, 1000);
  };

  const copyEnvToClipboard = async e => {
    e.preventDefault();

    await navigator.clipboard.writeText(
      environmentTemplate(scmd, AccessKeyId, SecretKey, SessionToken)
    );
    setIsCopied(true);

    setTimeout(() => {
      setIsCopied(false);
    }, 1000);
  };

  return (
    <ModalContainer>
      <ModalScrim onClick={closeHandler} />
      <ModalWrapper>
        <ModalHeader>
          <ModalHeaderTitle>
            Get credentials for{" "}
            <span style={{color: '#2185D0'}}>{Group}</span> group
          </ModalHeaderTitle>
          <span className="close-modal-btn" onClick={closeHandler}>
            ×
          </span>
        </ModalHeader>
        <ModalBody>
          <div className="modal-subheader">
            AWS Account account# (AccountName)
          </div>
          <p>
            Use any of the following options to access AWS resources
            programmatically or from the AWS CLI. You can retrieve new
            credentials as often as needed.
          </p>
          <Menu pointing secondary >
            <Menu.Item active={os !== "windows"} onClick={() => setOs("mac")}>macOS and Linux</Menu.Item>
            <Menu.Item active={os === "windows"} onClick={() => setOs("windows")}>Windows</Menu.Item>
          </Menu>

          <OptionSection>
            <OptionSectionHeader>
              <b>Option 1: Set AWS environment variables</b>{" "}
              <a href="https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-envvars.html" target="_blank" rel="noopener noreferrer">
                Learn more
              </a>
            </OptionSectionHeader>
            <Values>
              <Cmd>{scmd}</Cmd>{" "}
              <span className="modal-valuenames">AWS_ACCESS_Key_ID</span>="
              {AccessKeyId}"<br></br>
              <Cmd>{scmd}</Cmd>{" "}
              <span className="modal-valuenames">AWS_SECRET_ACCESS_KEY</span>="
              {SecretKey}"<br></br>
              <Cmd>{scmd}</Cmd>{" "}
              <span className="modal-valuenames">AWS_SESSION_TOKEN</span>="
              {SessionToken}"<br></br>
              <ValueCopy onClick={copyEnvToClipboard}>
                {isCopied ? "Copied" : "Copy to Clipboard"}
              </ValueCopy>
            </Values>
          </OptionSection>

          <OptionSection>
            <OptionSectionHeader>
              <b>Option 2: Add a profile to your AWS credentials file</b>
              <br />
              Paste the following text in your aWS credentials file (typically
              found at {shome}).<br/>
              <a href="https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html" target="_blank" rel="noopener noreferrer">
                Learn more
              </a>
            </OptionSectionHeader>
            <Values>
              [{Profile}]<br />
              <span className="modal-valuenames">aws_access_key_id</span>=
              {AccessKeyId}
              <br></br>
              <span className="modal-valuenames">aws_secret_access_key</span>=
              {SecretKey}
              <br></br>
              <span className="modal-valuenames">aws_session_token</span>=
              {SessionToken}
              <br></br>
              <ValueCopy onClick={copyProfileToClipboard}>
                {isCopied ? "Copied" : "Copy to Clipboard"}
              </ValueCopy>
            </Values>
          </OptionSection>

          <OptionSection>
            <OptionSectionHeader>
              <b>Option 3: Use individual values in your AWS service client</b>{" "}
              <a href="https://aws.amazon.com/tools/" target="_blank" rel="noopener noreferrer">Learn more</a>
            </OptionSectionHeader>
            <Grid>
              <div>AWS Access Key Id</div>
              <div>{AccessKeyId}</div>
              <div>
                <Button
                  basic
                  size="tiny"
                  color="blue"
                  style={{ float: "right" }}
                  onClick={copyAccessKeyToClipboard}
                >
                  COPY
                </Button>
              </div>
              <div>AWS Secret access key</div>
              <div>{SecretKey}</div>
              <div>
                <Button
                  basic
                  size="tiny"
                  color="blue"
                  style={{ float: "right" }}
                  onClick={copySecretKeyToClipboard}
                >
                  COPY
                </Button>
              </div>
              <div>AWS session token</div>
              <div>{SessionToken}</div>
              <div>
                <Button
                  basic
                  size="tiny"
                  color="blue"
                  style={{ float: "right" }}
                  onClick={copySessionTokenToClipboard}
                >
                  COPY
                </Button>
              </div>
            </Grid>
          </OptionSection>
        </ModalBody>
      </ModalWrapper>
    </ModalContainer>
  );
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: 0.3fr 0.6fr 0.3fr;
  grid-gap: 8px;
  width: 100%;

  & > div {
    overflow: hidden;
    white-space: nowrap;
  }
`;

const ModalContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  top: 0;
  z-index: 5000;
`;

const ModalWrapper = styled.div`
  border-radius: 15px;
  position: relative;
  max-width: 750px;
  width: 100%;
`;
const ModalHeader = styled.div`
  align-items: center;
  background: #fff;
  border-top-left-radius: 15px;
  border-top-right-radius: 15px;
  border-bottom: 1px solid rgba(0,0,0,.15);
  color: #000;
  display: flex;
  padding: 24px 16px;
`;

const ModalHeaderTitle = styled.div`
  flex: 1;
  font-size: 24px;
  `;

const ModalBody = styled.div`
  background: #fff;
  border-bottom-left-radius: 15px;
  border-bottom-right-radius: 15px;
  font-size: 13px;
  font-family: Arial, Helvetica, sans-serif;
  padding: 16px;
`;

const ModalScrim = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  transition: all 1.3s;
`;

const OptionSection = styled.section`
  margin-bottom: 16px;
`;

const OptionSectionHeader = styled.div`
  margin-bottom: 4px;
  font-size: 14px;
`;

// const Details = styled.div``;
const Values = styled.div`
  position: relative;
  padding: 12px;
  font-size: 12px;
  background: #ededed;
  border-radius: 6px;
  box-shadow: 0 0 2px inset rgba(0, 0, 0, 0.15);
  overflow-x: hidden;
  white-space: nowrap;
`;

const Cmd = styled.span`
  color: green;
`;

const ValueCopy = styled.div`
  display: none;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
  color: white;
  background: rgba(0, 0, 0, 0.8);

  ${Values}:hover & {
    display: flex;
    cursor: pointer;
  }
`;
