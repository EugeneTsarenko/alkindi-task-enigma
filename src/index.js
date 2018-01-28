
import update from 'immutability-helper';
import algoreaReactTask from './algorea_react_task';

import 'font-awesome/css/font-awesome.css';
import 'bootstrap/dist/css/bootstrap.css';
import './style.css';

import CipheredTextBundle from './ciphered_text_bundle';
import SelectedTextBundle from './selected_text_bundle';
import FrequencyAnalysisBundle from './frequency_analysis_bundle';
import SchedulingBundle from './scheduling_bundle';
import RotorsBundle from './rotors_bundle';
import DecipheredTextBundle from './deciphered_text_bundle';
import WorkspaceBundle from './workspace_bundle';
import {updatePerms} from './utils';

const TaskBundle = {
    actionReducers: {
        appInit: appInitReducer,
        taskInit: taskInitReducer /* possibly move to algorea-react-task */,
        taskRefresh: taskRefreshReducer /* possibly move to algorea-react-task */,
        taskAnswerLoaded: taskAnswerLoaded,
        taskStateLoaded: taskStateLoaded,
    },
    includes: [
        CipheredTextBundle,
        SelectedTextBundle,
        FrequencyAnalysisBundle,
        SchedulingBundle,
        RotorsBundle,
        DecipheredTextBundle,
        WorkspaceBundle,
    ],
    selectors: {
      getTaskState,
      getTaskAnswer,
    }
};

if (process.env.NODE_ENV === 'development') {
    /* eslint-disable no-console */
    TaskBundle.earlyReducer = function (state, action) {
        console.log('ACTION', action.type, action);
        return state;
    };
}

function appInitReducer (state, _action) {
    const taskMetaData = {
       "id": "http://concours-alkindi.fr/tasks/2018/enigma",
       "language": "fr",
       "version": "fr.01",
       "authors": "Sébastien Carlier",
       "translators": [],
       "license": "",
       "taskPathPrefix": "",
       "modulesPathPrefix": "",
       "browserSupport": [],
       "fullFeedback": true,
       "acceptedAnswers": [],
       "usesRandomSeed": true
    };
    return {...state, taskMetaData};
}

function taskInitReducer (state, _action) {
    return {...state, taskReady: true};
}

function taskRefreshReducer (state, _action) {
    return state; /* XXX figure out what needs to happen here */
}

function getTaskAnswer (state) {
  const {taskData: {alphabet}} = state;
  return {
    rotors: state.rotors.map(rotor => rotor.cells.map(({editable}) => alphabet.indexOf(editable)))
  };
}

function taskAnswerLoaded (state, {payload: {answer: {rotors}}}) {
  const {taskData: {alphabet}} = state;
  const $rotors = {};
  if (rotors) {
    rotors.forEach((cells, rotorIndex) => {
      const $cells = [];
      cells.forEach((rank, cellIndex) => {
        $cells[cellIndex] = {
          editable: {$set: rank === -1 ? null : alphabet[rank]}
        };
      });
      $rotors[rotorIndex] = {cells: $cells};
    });
  }
  return update(state, {rotors: $rotors});
}

function getTaskState (state) {
  const {taskData: {alphabet}} = state;
  const rotors = state.rotors.map(rotor => rotor.cells.map(({editable, locked}) => [alphabet.indexOf(editable), locked ? 1 : 0]));
  return {rotors};
}

function taskStateLoaded (state, {payload: {dump: {rotors}}}) {
  const {taskData: {alphabet}} = state;
  const $rotors = {};
  if (rotors) {
    rotors.forEach((cells, rotorIndex) => {
      const $cells = [];
      cells.forEach(([rank, locked], cellIndex) => {
        $cells[cellIndex] = {
          editable: {$set: rank === -1 ? null : alphabet[rank]},
          locked: {$set: locked !== 0},
        };
      });
      let rotor = state.rotors[rotorIndex];
      rotor = update(rotor, {cells: $cells});
      rotor = updatePerms(rotor);
      $rotors[rotorIndex] = {$set: rotor};
    });
  }
  return update(state, {rotors: $rotors});
}

export function run (container, options) {
    return algoreaReactTask(container, options, TaskBundle);
}
