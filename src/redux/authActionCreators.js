import * as actionTypes from './actionTypes';
import axios from 'axios';
import jwt_decode from 'jwt-decode'

export const authSuccess = (token, userId) => {
    return {
        type: actionTypes.AUTH_SUCCESS,
        payload: {
            token: token,
            userId: userId
        }
    }
}

export const authLoading = isLoading => {
    return {
        type: actionTypes.AUTH_LOADING,
        payload: isLoading
    }
}

export const authFailed = errMsg => {
    return {
        type: actionTypes.AUTH_FAILED,
        payload: errMsg
    }
}

const storeLocally = (token) => {
    const decoded = jwt_decode(token)

    localStorage.setItem('token', token);
    localStorage.setItem('userId', decoded.user_id);
    const expirationTime = new Date(new Date(decoded.exp * 1000));
    localStorage.setItem('expirationTime', expirationTime);
    return decoded.user_id
}

export const auth = (email, password, mode) => dispatch => {
    dispatch(authLoading(true));
    const authData = {
        email: email,
        password: password,
    }

    let authUrl = null;
    if (mode === "Sign Up") {
        authUrl = "http://127.0.0.1:8000/api/user/";
    } else {
        authUrl = "http://127.0.0.1:8000/api/token/";
    }

    const header = {
        headers: {
            "Content-Type": 'application/json',
        }
    }

    axios.post(authUrl, authData, header)
        .then(response => {
            dispatch(authLoading(false));
            if (mode !== 'Sign Up') {
                const token = response.data.access;
                const user_id = storeLocally(token);

                dispatch(authSuccess(token, user_id));
            } else {
                dispatch(authLoading(true));
                return axios.post('http://127.0.0.1:8000/api/token/', authData, header)
                    .then(response => {
                        const token = response.data.access;
                        const user_id = storeLocally(token);

                        dispatch(authSuccess(token, user_id));
                    })
            }

            console.log(jwt_decode(response.data.access));
        })
        .catch(err => {
            dispatch(authLoading(false));
            const key = Object.keys(err.response.data)[0]
            dispatch(authFailed(`${key.toUpperCase()} : ${err.response.data[key]}`));
        })
}

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('expirationTime');
    localStorage.removeItem('userId');
    return {
        type: actionTypes.AUTH_LOGOUT
    }
}

export const authCheck = () => dispatch => {
    const token = localStorage.getItem('token');
    if (!token) {
        //Logout
        dispatch(logout());
    } else {
        const expirationTime = new Date(localStorage.getItem('expirationTime'));
        if (expirationTime <= new Date()) {
            //Logout
            dispatch(logout());
        } else {
            const userId = localStorage.getItem('userId');
            dispatch(authSuccess(token, userId));
        }
    }
}