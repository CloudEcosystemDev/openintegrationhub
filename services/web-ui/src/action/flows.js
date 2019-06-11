import axios from 'axios';

import { getConfig } from '../conf';

const conf = getConfig();
export const GET_FLOWS = 'GET_FLOWS';
export const GET_FLOWS_PAGE = 'GET_FLOWS_PAGE';
export const UPDATE_FLOW = 'UPDATE_FLOW';
export const UPDATE_FLOW_ERROR = 'UPDATE_FLOW_ERROR';
export const CREATE_FLOW = 'CREATE_FLOW';
export const DELETE_FLOW = 'DELETE_FLOW';


export const getFlows = () => async (dispatch) => {
    try {
        const result = await axios({
            method: 'get',
            url: `${conf.endpoints.flow}/flows`,
            withCredentials: true,
        });

        dispatch({
            type: GET_FLOWS,
            flows: result.data.data,
            meta: result.data.meta,
        });
    } catch (err) {
        console.log(err);
    }
};

export const getFlowsPage = page => async (dispatch) => {
    try {
        const result = await axios({
            method: 'get',
            url: `${conf.endpoints.flow}/flows?page[number]=${page}`,
            withCredentials: true,
        });

        dispatch({
            type: GET_FLOWS_PAGE,
            flows: result.data.data,
            meta: result.data.meta,
        });
    } catch (err) {
        console.log(err);
    }
};

export const updateFlow = user => async (dispatch) => {
    try {
        await axios({
            method: 'patch',
            url: `${conf.endpoints.flow}/flows/${user._id}`,
            withCredentials: true,
            json: true,
            data: user,
        });

        dispatch({
            type: UPDATE_FLOW,
        });
        dispatch(getFlows());
    } catch (err) {
        dispatch({
            type: UPDATE_FLOW_ERROR,
            err,
        });
    }
};

export const createFlow = data => async (dispatch) => {
    try {
        await axios({
            method: 'post',
            url: `${conf.endpoints.flow}/flows`,
            withCredentials: true,
            json: true,
            data,
        });

        dispatch({
            type: CREATE_FLOW,
        });
        dispatch(getFlows());
    } catch (err) {
        console.log(err);
    }
};

export const deleteFlow = flowId => async (dispatch) => {
    try {
        await axios({
            method: 'delete',
            url: `${conf.endpoints.flow}/flows/${flowId}`,
            withCredentials: true,
        });

        dispatch({
            type: DELETE_FLOW,
        });
        dispatch(getFlows());
    } catch (err) {
        console.log(err);
    }
};
