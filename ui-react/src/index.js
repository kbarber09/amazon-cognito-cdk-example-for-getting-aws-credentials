import Amplify from 'aws-amplify';
import React from 'react';
import ReactDOM from 'react-dom';
import { config } from './config/config';

import 'semantic-ui-css/semantic.min.css'
import './index.css'

import {App} from './App';

Amplify.configure(config)

ReactDOM.render(<App />, document.getElementById('root'));
