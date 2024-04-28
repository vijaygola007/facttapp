import AsyncStorage from '@react-native-community/async-storage';

import { USER_DATA, encrypt, decrypt } from './constants';

const getLocalUserData = () => new Promise((resolve, reject) => {
    AsyncStorage.getItem(USER_DATA)
    .then((data: any) => {
        const dataJson = data ? JSON.parse(decrypt(data)) : null;
        resolve(dataJson);
    })
    .catch((error) => reject(error));
});

const setLocalUserData = (data) => new Promise((resolve, reject) => {
    const dataString = encrypt(JSON.stringify(data));
    AsyncStorage.setItem(USER_DATA, dataString)
        .then(() => resolve(data))
        .catch((error) => reject(error));
});


const deleteUserDataFromLocal = () => {
    AsyncStorage.removeItem(USER_DATA);
};

const getWelcomeScreenData = () => new Promise((resolve, reject) => {
    AsyncStorage.getItem('WelcomeScreen')
    .then((data: any) => {
        const dataJson = data ? JSON.parse(decrypt(data)) : null;
        resolve(dataJson);
    })
    .catch((error) => reject(error));
});

const setWelcomeScreenData = (data) => new Promise((resolve, reject) => {
    const dataString = encrypt(JSON.stringify(data));
    AsyncStorage.setItem('WelcomeScreen', dataString)
    .then(() => resolve(data))
    .catch((error) => reject(error));
});

const getLogoData = () => new Promise((resolve, reject) => {
    // return resolve();
    AsyncStorage.getItem('Logo')
    .then((data: any) => {
        const dataJson = data ? JSON.parse(decrypt(data)) : null;
        resolve(dataJson);
    })
    .catch((error) => reject(error));
});

const setLogoData = (data) => new Promise((resolve, reject) => {
    const dataString = encrypt(JSON.stringify(data));
    AsyncStorage.setItem('Logo', dataString)
    .then(() => resolve(data))
    .catch((error) => reject(error));
});

const getRegistrationData = () => new Promise((resolve, reject) => {
    // return resolve();
    AsyncStorage.getItem('RegistrationNumber')
    .then((data: any) => {
        const dataJson = data ? JSON.parse(decrypt(data)) : null;
        resolve(dataJson);
    })
    .catch((error) => reject(error));
});

const setRegistrationData = (data) => new Promise((resolve, reject) => {
    const dataString = encrypt(JSON.stringify(data));
    AsyncStorage.setItem('RegistrationNumber', dataString)
    .then(() => resolve(data))
    .catch((error) => reject(error));
});

const getRememberPassword = () => new Promise((resolve, reject) => {
    AsyncStorage.getItem('RememberPassword')
    .then((data: any) => {
        const dataJson = data ? JSON.parse(decrypt(data)) : null;
        resolve(dataJson);
    })
    .catch((error) => reject(error));
});

const setRememberPassword = (data) => new Promise((resolve, reject) => {
    const dataString = encrypt(JSON.stringify(data));
    AsyncStorage.setItem('RememberPassword', dataString)
    .then(() => resolve(data))
    .catch((error) => reject(error));
});

const getFaceRegistered = () => new Promise((resolve, reject) => {
    AsyncStorage.getItem('FaceRegistered')
    .then((data: any) => {
        const dataJson = data ? JSON.parse(decrypt(data)) : null;
        resolve(dataJson);
    })
    .catch((error) => reject(error));
});

const setFaceRegistered = (data) => new Promise((resolve, reject) => {
    const dataString = encrypt(JSON.stringify(data));
    AsyncStorage.setItem('FaceRegistered', dataString)
    .then(() => resolve(data))
    .catch((error) => reject(error));
});

const getTotalSyncedSurvey = () => new Promise((resolve, reject) => {
    AsyncStorage.getItem('totalSynced')
    .then((data) => {
        resolve(data);
    })
    .catch((error) => reject(error));
});

const setTotalSyncedSurvey = (data) => new Promise((resolve, reject) => {
    AsyncStorage.setItem('totalSynced', data)
    .then(() => resolve(data))
    .catch((error) => reject(error));
});

const getBasePath = () => new Promise((resolve, reject) => {
    AsyncStorage.getItem('BasePath')
    .then((data) => {
        resolve(data);
    })
    .catch((error) => reject(error));
});

const setBasePath = (data) => new Promise((resolve, reject) => {
    AsyncStorage.setItem('BasePath', data)
    .then(() => resolve(data))
    .catch((error) => reject(error));
});

const getConnectivityModal = () => new Promise((resolve, reject) => {
    AsyncStorage.getItem('ConnectivityModal')
    .then((data) => {
        resolve(data);
    })
    .catch((error) => reject(error));
});

const setConnectivityModal = (data) => new Promise((resolve, reject) => {
    AsyncStorage.setItem('ConnectivityModal', data)
    .then(() => resolve(data))
    .catch((error) => reject(error));
});

const getCertsData = () => new Promise((resolve, reject) => {
    AsyncStorage.getItem('CERTS')
    .then((data: any) => {
        const dataJson = data ? JSON.parse(decrypt(data)) : null;
        resolve(dataJson);
    })
    .catch((error) => reject(error));
});

const setCertsData = (data) => new Promise((resolve, reject) => {
    const dataString = encrypt(JSON.stringify(data));
    AsyncStorage.setItem('CERTS', dataString)
        .then(() => resolve(data))
        .catch((error) => reject(error));
});

export {
    getLocalUserData,
    setLocalUserData,
    deleteUserDataFromLocal,
    getWelcomeScreenData,
    setWelcomeScreenData,
    getRegistrationData,
    setRegistrationData,
    getRememberPassword,
    setRememberPassword,
    getLogoData,
    setLogoData,
    getFaceRegistered,
    setFaceRegistered,
    getTotalSyncedSurvey,
    setTotalSyncedSurvey,
    setBasePath,
    getBasePath,
    getConnectivityModal,
    setConnectivityModal,
    getCertsData,
    setCertsData,
};
