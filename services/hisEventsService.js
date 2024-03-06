const axios = require('axios');

const getEvents = async (text) => {
    try {
        const apiKey = 'sFqQ8nUjQGOmqCqY1NqUlQ==XycsoRYDFVs8ZIKi';
        const url = `https://api.api-ninjas.com/v1/historicalevents?text=${text}`;
        const response = await axios.get(url,{
           headers : {
                'X-Api-Key': apiKey
           }
        });
        return response.data;
    }
    catch (error) {
        throw error;
    }
}

module.exports = {
    getEvents
}