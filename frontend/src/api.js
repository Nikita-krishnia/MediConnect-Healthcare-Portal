import axios from 'axios';

const API = axios.create({
    baseURL: 'https://mediconnect-api-70jw.onrender.com/api' 
});

export default API;